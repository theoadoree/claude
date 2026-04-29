package com.taxtrack.app.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.taxtrack.app.data.models.*
import com.taxtrack.app.services.TaxCalculationService
import java.util.UUID

class AppRepository(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("taxtrack_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    companion object {
        private const val KEY_PROFILE = "taxtrack_profile"
        private const val KEY_JURISDICTIONS = "taxtrack_jurisdictions"
        private const val KEY_ENTRIES = "taxtrack_entries"
        private const val KEY_DOCUMENTS = "taxtrack_documents"

        private val DEFAULT_JURISDICTIONS = listOf(
            Jurisdiction("ny", "New York", "state", "#0A84FF", 183, true, false),
            Jurisdiction("ca", "California", "state", "#30D158", 183, true, false),
            Jurisdiction("fl", "Florida", "state", "#FF9F0A", 366, false, false),
            Jurisdiction("tx", "Texas", "state", "#FF453A", 366, false, false),
            Jurisdiction("nv", "Nevada", "state", "#BF5AF2", 366, false, false),
            Jurisdiction("nj", "New Jersey", "state", "#FF6B6B", 183, false, false),
            Jurisdiction("il", "Illinois", "state", "#4ECDC4", 183, false, false),
            Jurisdiction("ma", "Massachusetts", "state", "#45B7D1", 183, false, false),
            Jurisdiction("pa", "Pennsylvania", "state", "#FFA07A", 183, false, false),
            Jurisdiction("ct", "Connecticut", "state", "#98D8C8", 183, false, false),
            Jurisdiction("wa", "Washington", "state", "#0A84FF", 366, false, false),
            Jurisdiction("us", "United States (Federal)", "country", "#30D158", 183, true, false),
            Jurisdiction("uk", "United Kingdom", "country", "#FF9F0A", 183, false, false),
            Jurisdiction("pr", "Puerto Rico", "territory", "#FF453A", 183, false, false)
        )
    }

    fun getProfile(): UserProfile {
        val json = prefs.getString(KEY_PROFILE, null)
        return if (json != null) {
            gson.fromJson(json, UserProfile::class.java)
        } else {
            UserProfile(
                name = "",
                primaryJurisdictionId = "",
                trackedJurisdictionIds = emptyList(),
                hasCompletedOnboarding = false
            )
        }
    }

    fun saveProfile(profile: UserProfile) {
        prefs.edit().putString(KEY_PROFILE, gson.toJson(profile)).apply()
    }

    fun getJurisdictions(): List<Jurisdiction> {
        val json = prefs.getString(KEY_JURISDICTIONS, null)
        return if (json != null) {
            val type = object : TypeToken<List<Jurisdiction>>() {}.type
            gson.fromJson(json, type)
        } else {
            DEFAULT_JURISDICTIONS.also { saveJurisdictions(it) }
        }
    }

    fun saveJurisdictions(jurisdictions: List<Jurisdiction>) {
        prefs.edit().putString(KEY_JURISDICTIONS, gson.toJson(jurisdictions)).apply()
    }

    fun getEntries(): List<LocationEntry> {
        val json = prefs.getString(KEY_ENTRIES, null)
        return if (json != null) {
            val type = object : TypeToken<List<LocationEntry>>() {}.type
            gson.fromJson(json, type)
        } else {
            emptyList()
        }
    }

    fun saveEntries(entries: List<LocationEntry>) {
        prefs.edit().putString(KEY_ENTRIES, gson.toJson(entries)).apply()
    }

    fun addEntry(entry: LocationEntry) {
        val entries = getEntries().toMutableList()
        entries.removeAll { it.id == entry.id }
        entries.add(entry)
        entries.sortByDescending { it.date }
        saveEntries(entries)
    }

    fun updateEntry(entry: LocationEntry) {
        addEntry(entry)
    }

    fun deleteEntry(entryId: String) {
        val entries = getEntries().filter { it.id != entryId }
        saveEntries(entries)
    }

    fun getDocuments(): List<TaxDocument> {
        val json = prefs.getString(KEY_DOCUMENTS, null)
        return if (json != null) {
            val type = object : TypeToken<List<TaxDocument>>() {}.type
            gson.fromJson(json, type)
        } else {
            emptyList()
        }
    }

    fun saveDocuments(documents: List<TaxDocument>) {
        prefs.edit().putString(KEY_DOCUMENTS, gson.toJson(documents)).apply()
    }

    fun addDocument(document: TaxDocument) {
        val docs = getDocuments().toMutableList()
        docs.removeAll { it.id == document.id }
        docs.add(document)
        saveDocuments(docs)
    }

    fun deleteDocument(documentId: String) {
        val docs = getDocuments().filter { it.id != documentId }
        saveDocuments(docs)
    }

    fun calculateStats(year: Int): Triple<List<JurisdictionStats>, AuditRisk, List<TaxPlanningInsight>> {
        val entries = getEntries().filter { it.date.startsWith(year.toString()) }
        val jurisdictions = getJurisdictions()
        val profile = getProfile()

        val stats = TaxCalculationService.calculateJurisdictionStats(entries, jurisdictions)
        val risk = TaxCalculationService.calculateAuditRisk(entries, stats, year)
        val insights = TaxCalculationService.generateInsights(stats, risk, profile, jurisdictions)

        return Triple(stats, risk, insights)
    }

    fun importFromCsv(csvContent: String): Int {
        val lines = csvContent.lines().filter { it.isNotBlank() }
        if (lines.size < 2) return 0

        val headers = lines[0].split(",").map { it.trim().lowercase() }
        val entries = mutableListOf<LocationEntry>()
        val jurisdictions = getJurisdictions()

        for (i in 1 until lines.size) {
            try {
                val cols = parseCsvLine(lines[i])
                if (cols.isEmpty()) continue

                fun col(name: String): String {
                    val idx = headers.indexOf(name)
                    return if (idx >= 0 && idx < cols.size) cols[idx].trim() else ""
                }

                val date = col("date").ifBlank { col("day") }
                val city = col("city")
                val state = col("state")
                val country = col("country").ifBlank { "US" }

                if (date.isBlank()) continue

                val jurisdictionId = matchJurisdiction(state, country, jurisdictions)

                val entry = LocationEntry(
                    id = UUID.randomUUID().toString(),
                    date = normalizeDate(date),
                    jurisdictionId = jurisdictionId,
                    city = city,
                    state = state,
                    country = country,
                    latitude = col("latitude").toDoubleOrNull() ?: 0.0,
                    longitude = col("longitude").toDoubleOrNull() ?: 0.0,
                    activityType = col("activity").ifBlank { "unknown" },
                    isVerified = false,
                    source = "import",
                    notes = col("notes"),
                    documentIds = emptyList()
                )
                entries.add(entry)
            } catch (_: Exception) {}
        }

        entries.forEach { addEntry(it) }
        return entries.size
    }

    private fun parseCsvLine(line: String): List<String> {
        val result = mutableListOf<String>()
        var current = StringBuilder()
        var inQuotes = false
        for (ch in line) {
            when {
                ch == '"' -> inQuotes = !inQuotes
                ch == ',' && !inQuotes -> {
                    result.add(current.toString())
                    current = StringBuilder()
                }
                else -> current.append(ch)
            }
        }
        result.add(current.toString())
        return result
    }

    private fun matchJurisdiction(state: String, country: String, jurisdictions: List<Jurisdiction>): String {
        val stateCode = state.trim().lowercase()
        val stateMap = mapOf(
            "ny" to "ny", "new york" to "ny",
            "ca" to "ca", "california" to "ca",
            "fl" to "fl", "florida" to "fl",
            "tx" to "tx", "texas" to "tx",
            "nv" to "nv", "nevada" to "nv",
            "nj" to "nj", "new jersey" to "nj",
            "il" to "il", "illinois" to "il",
            "ma" to "ma", "massachusetts" to "ma",
            "pa" to "pa", "pennsylvania" to "pa",
            "ct" to "ct", "connecticut" to "ct",
            "wa" to "wa", "washington" to "wa"
        )
        return stateMap[stateCode] ?: when (country.trim().lowercase()) {
            "uk", "united kingdom", "gb", "great britain" -> "uk"
            "pr", "puerto rico" -> "pr"
            else -> "us"
        }
    }

    private fun normalizeDate(date: String): String {
        // Try YYYY-MM-DD first
        if (date.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))) return date
        // Try MM/DD/YYYY
        val parts = date.split("/", "-")
        if (parts.size == 3) {
            return if (parts[0].length == 4) {
                "${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}"
            } else {
                "${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}"
            }
        }
        return date
    }

    fun exportToJson(): String {
        val backup = mapOf(
            "profile" to getProfile(),
            "jurisdictions" to getJurisdictions(),
            "entries" to getEntries(),
            "documents" to getDocuments()
        )
        return gson.toJson(backup)
    }

    fun importFromJson(json: String): Boolean {
        return try {
            val type = object : TypeToken<Map<String, Any>>() {}.type
            val backup: Map<String, Any> = gson.fromJson(json, type)

            backup["profile"]?.let {
                saveProfile(gson.fromJson(gson.toJson(it), UserProfile::class.java))
            }
            backup["jurisdictions"]?.let {
                val listType = object : TypeToken<List<Jurisdiction>>() {}.type
                saveJurisdictions(gson.fromJson(gson.toJson(it), listType))
            }
            backup["entries"]?.let {
                val listType = object : TypeToken<List<LocationEntry>>() {}.type
                saveEntries(gson.fromJson(gson.toJson(it), listType))
            }
            backup["documents"]?.let {
                val listType = object : TypeToken<List<TaxDocument>>() {}.type
                saveDocuments(gson.fromJson(gson.toJson(it), listType))
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    fun clearAllData() {
        prefs.edit().clear().apply()
    }
}
