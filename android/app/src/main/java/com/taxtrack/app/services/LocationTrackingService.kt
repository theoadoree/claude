package com.taxtrack.app.services

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Geocoder
import android.os.IBinder
import android.os.Looper
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import com.taxtrack.app.MainActivity
import com.taxtrack.app.R
import com.taxtrack.app.data.models.LocationEntry
import com.taxtrack.app.data.repository.AppRepository
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*

class LocationTrackingService : Service() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var repository: AppRepository
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    companion object {
        const val CHANNEL_ID = "taxtrack_location_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.taxtrack.app.ACTION_START_TRACKING"
        const val ACTION_STOP = "com.taxtrack.app.ACTION_STOP_TRACKING"

        fun startService(context: Context) {
            val intent = Intent(context, LocationTrackingService::class.java).apply {
                action = ACTION_START
            }
            context.startForegroundService(intent)
        }

        fun stopService(context: Context) {
            val intent = Intent(context, LocationTrackingService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        repository = AppRepository(applicationContext)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()
        setupLocationCallback()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                startForeground(NOTIFICATION_ID, createNotification("Tracking your location..."))
                startLocationUpdates()
            }
            ACTION_STOP -> {
                stopLocationUpdates()
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        serviceScope.cancel()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "TaxTrack Location",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Used to track location for tax residency purposes"
            setShowBadge(false)
        }
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)
    }

    private fun createNotification(contentText: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = PendingIntent.getService(
            this,
            1,
            Intent(this, LocationTrackingService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("TaxTrack")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(
                android.R.drawable.ic_media_pause,
                "Stop Tracking",
                stopIntent
            )
            .build()
    }

    private fun setupLocationCallback() {
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { location ->
                    serviceScope.launch {
                        processLocation(location.latitude, location.longitude)
                    }
                }
            }
        }
    }

    private fun startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) return

        val locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_BALANCED_POWER_ACCURACY,
            300_000L // 5 minutes
        ).apply {
            setMinUpdateIntervalMillis(60_000L) // fastest: 1 minute
            setWaitForAccurateLocation(false)
        }.build()

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
    }

    private fun stopLocationUpdates() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }

    private suspend fun processLocation(lat: Double, lon: Double) {
        try {
            val geocoder = Geocoder(applicationContext, Locale.getDefault())
            val addresses = withContext(Dispatchers.IO) {
                @Suppress("DEPRECATION")
                geocoder.getFromLocation(lat, lon, 1)
            }

            val address = addresses?.firstOrNull()
            val city = address?.locality ?: address?.subAdminArea ?: ""
            val state = address?.adminArea ?: ""
            val country = address?.countryCode ?: "US"
            val countryName = address?.countryName ?: "United States"

            val jurisdictions = repository.getJurisdictions()
            val jurisdictionId = matchJurisdictionFromLocation(state, country, jurisdictions)

            val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

            // Check if we already have an entry for today in this jurisdiction
            val existingEntries = repository.getEntries()
            val todayAutoEntry = existingEntries.find {
                it.date == today && it.source == "auto" && it.jurisdictionId == jurisdictionId
            }

            if (todayAutoEntry == null) {
                val entry = LocationEntry(
                    id = UUID.randomUUID().toString(),
                    date = today,
                    jurisdictionId = jurisdictionId,
                    city = city,
                    state = state,
                    country = countryName,
                    latitude = lat,
                    longitude = lon,
                    activityType = "unknown",
                    isVerified = false,
                    source = "auto",
                    notes = "Auto-detected",
                    documentIds = emptyList()
                )
                repository.addEntry(entry)

                // Update notification
                val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                val locationText = buildString {
                    if (city.isNotBlank()) append(city)
                    if (state.isNotBlank()) {
                        if (isNotEmpty()) append(", ")
                        append(state)
                    }
                    if (isEmpty()) append(countryName)
                }
                notificationManager.notify(NOTIFICATION_ID, createNotification("Currently in: $locationText"))
            }
        } catch (e: Exception) {
            // Silently handle geocoding failures
        }
    }

    private fun matchJurisdictionFromLocation(
        state: String,
        countryCode: String,
        jurisdictions: List<com.taxtrack.app.data.models.Jurisdiction>
    ): String {
        val stateCode = state.trim().lowercase()
        val stateMap = mapOf(
            "new york" to "ny", "california" to "ca", "florida" to "fl",
            "texas" to "tx", "nevada" to "nv", "new jersey" to "nj",
            "illinois" to "il", "massachusetts" to "ma", "pennsylvania" to "pa",
            "connecticut" to "ct", "washington" to "wa"
        )
        return stateMap[stateCode] ?: when (countryCode.uppercase()) {
            "GB" -> "uk"
            "PR" -> "pr"
            "US" -> "us"
            else -> "us"
        }
    }
}

class BootReceiver : android.content.BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // Optionally restart tracking if it was active before
        }
    }
}
