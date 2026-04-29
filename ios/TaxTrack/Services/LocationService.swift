import Foundation
import CoreLocation
import Combine

// MARK: - LocationService
final class LocationService: NSObject, ObservableObject {
    // MARK: - Published
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isTracking: Bool = false
    @Published var lastLocation: CLLocation?
    @Published var lastError: String?

    // MARK: - Private
    private let locationManager = CLLocationManager()
    private let geocoder = CLGeocoder()
    private weak var store: DataStore?
    private var lastUpdateTime: Date = .distantPast
    private let updateInterval: TimeInterval = 300 // 5 minutes
    private var lastTrackedDate: String = ""

    // MARK: - Init
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        locationManager.distanceFilter = 500  // meters
        locationManager.pausesLocationUpdatesAutomatically = false
        if #available(iOS 14.0, *) {
            locationManager.activityType = .other
        }
    }

    // MARK: - Configure
    func configure(store: DataStore) {
        self.store = store
        authorizationStatus = locationManager.authorizationStatus
    }

    // MARK: - Request Permission
    func requestAlwaysPermission() {
        locationManager.requestAlwaysAuthorization()
    }

    func requestWhenInUsePermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    // MARK: - Start / Stop Tracking
    func startTracking() {
        guard authorizationStatus == .authorizedAlways || authorizationStatus == .authorizedWhenInUse else {
            requestAlwaysPermission()
            return
        }
        locationManager.allowsBackgroundLocationUpdates = (authorizationStatus == .authorizedAlways)
        locationManager.startUpdatingLocation()
        isTracking = true
    }

    func stopTracking() {
        locationManager.stopUpdatingLocation()
        locationManager.allowsBackgroundLocationUpdates = false
        isTracking = false
    }

    // MARK: - Manual location check
    func requestCurrentLocation() {
        locationManager.requestLocation()
    }

    // MARK: - Process Location
    private func processLocation(_ location: CLLocation) {
        let now = Date()
        guard now.timeIntervalSince(lastUpdateTime) >= updateInterval else { return }
        lastUpdateTime = now
        lastLocation = location

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let todayStr = dateFormatter.string(from: now)

        reverseGeocode(location: location, date: todayStr)
    }

    // MARK: - Reverse Geocode
    private func reverseGeocode(location: CLLocation, date: String) {
        geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, error in
            guard let self = self, let placemark = placemarks?.first else { return }

            let city = placemark.locality ?? ""
            let state = placemark.administrativeArea ?? ""
            let country = placemark.country ?? ""
            let countryCode = placemark.isoCountryCode ?? ""

            Task { @MainActor in
                self.createOrUpdateEntry(
                    date: date,
                    city: city,
                    state: state,
                    country: country,
                    countryCode: countryCode,
                    location: location
                )
            }
        }
    }

    // MARK: - Create/Update Entry
    @MainActor
    private func createOrUpdateEntry(
        date: String,
        city: String,
        state: String,
        country: String,
        countryCode: String,
        location: CLLocation
    ) {
        guard let store = store else { return }

        let jurisdictionId = determineJurisdiction(
            state: state,
            country: country,
            countryCode: countryCode,
            jurisdictions: store.jurisdictions
        )

        let entry = LocationEntry(
            date: date,
            jurisdictionId: jurisdictionId,
            city: city,
            state: state,
            country: country,
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            activityType: .unknown,
            isVerified: false,
            source: .auto,
            notes: "Auto-tracked",
            documentIds: []
        )

        store.addLocationEntry(entry)
    }

    // MARK: - Determine Jurisdiction
    private func determineJurisdiction(
        state: String,
        country: String,
        countryCode: String,
        jurisdictions: [Jurisdiction]
    ) -> String {
        // Map US state names to jurisdiction IDs
        let stateMap: [String: String] = [
            "New York": "new_york",
            "California": "california",
            "Florida": "florida",
            "Texas": "texas",
            "New Jersey": "new_jersey",
            "Illinois": "illinois",
            "Massachusetts": "massachusetts",
            "Pennsylvania": "pennsylvania",
            "Connecticut": "connecticut",
            "Nevada": "nevada",
            "Washington": "washington_state",
            "Puerto Rico": "puerto_rico"
        ]

        // Check if in the US
        if countryCode == "US" || country == "United States" {
            // Check state first
            if let id = stateMap[state], jurisdictions.contains(where: { $0.id == id }) {
                return id
            }
            // Default to federal if US
            if jurisdictions.contains(where: { $0.id == "us_federal" }) {
                return "us_federal"
            }
        }

        // Check country mapping
        let countryMap: [String: String] = [
            "United Kingdom": "united_kingdom",
            "GB": "united_kingdom"
        ]
        if let id = countryMap[country] ?? countryMap[countryCode],
           jurisdictions.contains(where: { $0.id == id }) {
            return id
        }

        // Try to match by jurisdiction name
        let searchTerms = [state.lowercased(), country.lowercased()]
        for term in searchTerms {
            if let match = jurisdictions.first(where: {
                $0.name.lowercased().contains(term) || term.contains($0.name.lowercased())
            }) {
                return match.id
            }
        }

        // Return primary jurisdiction or first tracked
        return jurisdictions.first { $0.isPrimary }?.id
            ?? jurisdictions.first { $0.isTracked }?.id
            ?? jurisdictions.first?.id
            ?? "unknown"
    }
}

// MARK: - CLLocationManagerDelegate
extension LocationService: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        // Filter out old or inaccurate readings
        let age = abs(location.timestamp.timeIntervalSinceNow)
        guard age < 30, location.horizontalAccuracy < 500, location.horizontalAccuracy >= 0 else { return }
        processLocation(location)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        DispatchQueue.main.async { [weak self] in
            self?.lastError = error.localizedDescription
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.authorizationStatus = manager.authorizationStatus
            switch manager.authorizationStatus {
            case .authorizedAlways:
                self.locationManager.allowsBackgroundLocationUpdates = true
                if self.isTracking {
                    self.locationManager.startUpdatingLocation()
                }
            case .authorizedWhenInUse:
                self.locationManager.allowsBackgroundLocationUpdates = false
            case .denied, .restricted:
                self.isTracking = false
                self.locationManager.stopUpdatingLocation()
            default:
                break
            }
        }
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        DispatchQueue.main.async { [weak self] in
            self?.authorizationStatus = status
        }
    }
}
