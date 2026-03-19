package com.taxtrack.app.viewmodels

import android.app.Application
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.taxtrack.app.data.models.*
import com.taxtrack.app.data.repository.AppRepository
import com.taxtrack.app.services.LocationTrackingService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.UUID

class AppViewModel(application: Application) : AndroidViewModel(application) {

    private val repository = AppRepository(application.applicationContext)

    private val _state = MutableStateFlow(AppState())
    val state: StateFlow<AppState> = _state.asStateFlow()

    init {
        loadAll()
    }

    private fun loadAll() {
        viewModelScope.launch(Dispatchers.IO) {
            val profile = repository.getProfile()
            val jurisdictions = repository.getJurisdictions()
            val entries = repository.getEntries()
            val documents = repository.getDocuments()
            val year = Calendar.getInstance().get(Calendar.YEAR)

            val yearEntries = entries.filter { it.date.startsWith(year.toString()) }
            val (stats, risk, insights) = repository.calculateStats(year)

            _state.update {
                AppState(
                    profile = profile,
                    jurisdictions = jurisdictions,
                    entries = entries,
                    documents = documents,
                    jurisdictionStats = stats,
                    auditRisk = risk,
                    insights = insights,
                    isTrackingActive = false,
                    selectedYear = year
                )
            }
        }
    }

    fun refreshStats() {
        viewModelScope.launch(Dispatchers.IO) {
            val year = _state.value.selectedYear
            val (stats, risk, insights) = repository.calculateStats(year)
            _state.update { current ->
                current.copy(
                    jurisdictionStats = stats,
                    auditRisk = risk,
                    insights = insights
                )
            }
        }
    }

    fun setSelectedYear(year: Int) {
        _state.update { it.copy(selectedYear = year) }
        viewModelScope.launch(Dispatchers.IO) {
            val (stats, risk, insights) = repository.calculateStats(year)
            _state.update { current ->
                current.copy(
                    jurisdictionStats = stats,
                    auditRisk = risk,
                    insights = insights
                )
            }
        }
    }

    // Profile
    fun completeOnboarding(name: String, primaryJurisdictionId: String, trackedIds: List<String>) {
        viewModelScope.launch(Dispatchers.IO) {
            val profile = UserProfile(
                name = name,
                primaryJurisdictionId = primaryJurisdictionId,
                trackedJurisdictionIds = trackedIds,
                hasCompletedOnboarding = true
            )
            repository.saveProfile(profile)

            // Update tracked jurisdictions
            val jurisdictions = repository.getJurisdictions().map { j ->
                j.copy(
                    isTracked = trackedIds.contains(j.id),
                    isPrimary = j.id == primaryJurisdictionId
                )
            }
            repository.saveJurisdictions(jurisdictions)

            loadAll()
        }
    }

    fun updateProfile(name: String, primaryJurisdictionId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val current = repository.getProfile()
            val updated = current.copy(name = name, primaryJurisdictionId = primaryJurisdictionId)
            repository.saveProfile(updated)
            _state.update { it.copy(profile = updated) }

            val jurisdictions = repository.getJurisdictions().map { j ->
                j.copy(isPrimary = j.id == primaryJurisdictionId)
            }
            repository.saveJurisdictions(jurisdictions)
            _state.update { it.copy(jurisdictions = jurisdictions) }
        }
    }

    // Location Entries
    fun addLocationEntry(
        date: String,
        jurisdictionId: String,
        city: String,
        state: String,
        country: String,
        latitude: Double = 0.0,
        longitude: Double = 0.0,
        activityType: String = "unknown",
        notes: String = ""
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            val entry = LocationEntry(
                id = UUID.randomUUID().toString(),
                date = date,
                jurisdictionId = jurisdictionId,
                city = city,
                state = state,
                country = country,
                latitude = latitude,
                longitude = longitude,
                activityType = activityType,
                isVerified = false,
                source = "manual",
                notes = notes,
                documentIds = emptyList()
            )
            repository.addEntry(entry)
            val entries = repository.getEntries()
            _state.update { it.copy(entries = entries) }
            refreshStats()
        }
    }

    fun updateLocationEntry(entry: LocationEntry) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.updateEntry(entry)
            val entries = repository.getEntries()
            _state.update { it.copy(entries = entries) }
            refreshStats()
        }
    }

    fun deleteLocationEntry(entryId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteEntry(entryId)
            val entries = repository.getEntries()
            _state.update { it.copy(entries = entries) }
            refreshStats()
        }
    }

    fun verifyEntry(entryId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val entries = repository.getEntries()
            val updated = entries.map { e ->
                if (e.id == entryId) e.copy(isVerified = true) else e
            }
            repository.saveEntries(updated)
            _state.update { it.copy(entries = updated) }
            refreshStats()
        }
    }

    // Jurisdictions
    fun toggleJurisdictionTracking(jurisdictionId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val jurisdictions = repository.getJurisdictions().map { j ->
                if (j.id == jurisdictionId) j.copy(isTracked = !j.isTracked) else j
            }
            repository.saveJurisdictions(jurisdictions)
            _state.update { it.copy(jurisdictions = jurisdictions) }
            refreshStats()
        }
    }

    fun setPrimaryJurisdiction(jurisdictionId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val jurisdictions = repository.getJurisdictions().map { j ->
                j.copy(isPrimary = j.id == jurisdictionId, isTracked = if (j.id == jurisdictionId) true else j.isTracked)
            }
            repository.saveJurisdictions(jurisdictions)
            val profile = repository.getProfile().copy(primaryJurisdictionId = jurisdictionId)
            repository.saveProfile(profile)
            _state.update { it.copy(jurisdictions = jurisdictions, profile = profile) }
            refreshStats()
        }
    }

    // Documents
    fun addDocument(
        type: String,
        title: String,
        date: String,
        imagePath: String? = null,
        notes: String = ""
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            val doc = TaxDocument(
                id = UUID.randomUUID().toString(),
                type = type,
                title = title,
                date = date,
                imagePath = imagePath,
                notes = notes,
                extractedData = emptyMap()
            )
            repository.addDocument(doc)
            val docs = repository.getDocuments()
            _state.update { it.copy(documents = docs) }
        }
    }

    fun deleteDocument(documentId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteDocument(documentId)
            val docs = repository.getDocuments()
            _state.update { it.copy(documents = docs) }
        }
    }

    // Location Tracking Service
    fun startLocationTracking() {
        LocationTrackingService.startService(getApplication())
        _state.update { it.copy(isTrackingActive = true) }
    }

    fun stopLocationTracking() {
        LocationTrackingService.stopService(getApplication())
        _state.update { it.copy(isTrackingActive = false) }
    }

    fun requestBatteryOptimizationExemption() {
        val context = getApplication<Application>()
        val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
            data = Uri.parse("package:${context.packageName}")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    // Import/Export
    fun importFromCsv(csvContent: String, onComplete: (Int) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            val count = repository.importFromCsv(csvContent)
            loadAll()
            launch(Dispatchers.Main) { onComplete(count) }
        }
    }

    fun exportToJson(): String {
        return repository.exportToJson()
    }

    fun importFromJson(json: String, onComplete: (Boolean) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            val success = repository.importFromJson(json)
            if (success) loadAll()
            launch(Dispatchers.Main) { onComplete(success) }
        }
    }

    // Clear all data
    fun clearAllData() {
        viewModelScope.launch(Dispatchers.IO) {
            repository.clearAllData()
            loadAll()
        }
    }

    // Helpers
    fun getEntriesForDate(date: String): List<LocationEntry> {
        return _state.value.entries.filter { it.date == date }
    }

    fun getEntriesForMonth(year: Int, month: Int): Map<String, List<LocationEntry>> {
        val prefix = String.format("%04d-%02d", year, month)
        return _state.value.entries
            .filter { it.date.startsWith(prefix) }
            .groupBy { it.date }
    }

    fun getJurisdictionById(id: String): Jurisdiction? {
        return _state.value.jurisdictions.find { it.id == id }
    }
}
