// Initialize variables
let map;
let currentPosition;
let currentFilter = "all";
let locations = [];
let placesService;
let markers = [];
let infoWindow;
let currentRadius = 5000;
let currentSort = "distance";
let searchQuery = "";
let isMapView = false;

// DOM Elements
const locationsGrid = document.querySelector(".locations-grid");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeToggle = document.querySelector(".theme-toggle");
const contrastToggle = document.querySelector(".contrast-toggle");
const loader = document.querySelector(".loader");
const searchInput = document.querySelector(".search-bar input");
const radiusSelect = document.getElementById("radius");
const sortSelect = document.getElementById("sort");
const viewToggle = document.querySelector(".view-toggle");
const mapContainer = document.querySelector(".map-container");

// Initialize GSAP timeline for loader with better performance
const loaderTimeline = gsap.timeline({
  defaults: {
    ease: "power2.out",
    duration: 0.5,
  },
});

// Optimize animation performance
gsap.config({
  autoSleep: 60,
  force3D: true,
  nullTargetWarn: false,
});

// Batch DOM operations
const batchCardAnimation = (cards) => {
  gsap.from(cards, {
    duration: 0.5,
    y: 20,
    opacity: 0,
    stagger: 0.05,
    ease: "power2.out",
    force3D: true,
    clearProps: "transform",
  });
};

// Theme handling
const theme = localStorage.getItem("theme") || "light";
const contrast = localStorage.getItem("contrast") || "normal";
document.body.setAttribute("data-theme", theme);
document.body.setAttribute("data-contrast", contrast);

// Update theme toggle button
themeToggle.innerHTML =
  theme === "light"
    ? '<i class="fas fa-moon"></i>'
    : '<i class="fas fa-sun"></i>';
themeToggle.setAttribute("aria-pressed", theme === "dark");

// Update contrast toggle button
contrastToggle.setAttribute("aria-pressed", contrast === "high");

// Theme toggle handler
themeToggle.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeToggle.innerHTML =
    newTheme === "light"
      ? '<i class="fas fa-moon"></i>'
      : '<i class="fas fa-sun"></i>';
  themeToggle.setAttribute("aria-pressed", newTheme === "dark");

  // Animate theme change
  gsap.from("body", {
    duration: 0.5,
    opacity: 0.5,
    ease: "power2.inOut",
  });
});

// Contrast toggle handler
contrastToggle.addEventListener("click", () => {
  const currentContrast = document.body.getAttribute("data-contrast");
  const newContrast = currentContrast === "normal" ? "high" : "normal";
  document.body.setAttribute("data-contrast", newContrast);
  localStorage.setItem("contrast", newContrast);
  contrastToggle.setAttribute("aria-pressed", newContrast === "high");
});

// Filter handling with improved accessibility
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    });
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
    currentFilter = button.dataset.filter;
    displayLocations();

    // Animate filter change
    gsap.from(".location-card", {
      duration: 0.5,
      y: 20,
      opacity: 0,
      stagger: 0.1,
      ease: "power2.out",
    });
  });
});

// Get user's current location
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error)
    );
  });
}

// Initialize map
function initMap() {
  const mapOptions = {
    zoom: 14,
    center: { lat: 0, lng: 0 },
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };

  // Initialize map with the actual map container
  map = new google.maps.Map(document.getElementById("map"), mapOptions);

  // Initialize Places service with the map instance
  placesService = new google.maps.places.PlacesService(map);

  infoWindow = new google.maps.InfoWindow({
    maxWidth: 300,
  });
}

// Add marker creation functions
function createUserMarker() {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#4285F4",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 8,
  };
}

function createATMMarker() {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#34A853",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 8,
  };
}

function createPharmacyMarker() {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#EA4335",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 8,
  };
}

// Update addMarkersToMap function
function addMarkersToMap(locations) {
  // Clear existing markers
  markers.forEach((marker) => marker.setMap(null));
  markers = [];

  // Add user location marker
  const userMarker = new google.maps.Marker({
    position: {
      lat: currentPosition.coords.latitude,
      lng: currentPosition.coords.longitude,
    },
    map: map,
    title: "Your Location",
    icon: createUserMarker(),
    zIndex: 1000, // Ensure user marker is always on top
  });

  // Add location markers
  locations.forEach((location) => {
    const marker = new google.maps.Marker({
      position: { lat: location.latitude, lng: location.longitude },
      map: map,
      title: location.name,
      icon:
        location.type === "atm" ? createATMMarker() : createPharmacyMarker(),
    });

    marker.addListener("click", () => {
      infoWindow.setContent(createMarkerContent(location));
      infoWindow.open(map, marker);
    });

    markers.push(marker);
  });

  // Fit bounds to show all markers
  if (markers.length > 0) {
    const bounds = new google.maps.LatLngBounds();
    markers.forEach((marker) => bounds.extend(marker.getPosition()));
    bounds.extend(userMarker.getPosition());
    map.fitBounds(bounds);
  }
}

// Create marker info window content
function createMarkerContent(location) {
  const distance = calculateDistance(
    currentPosition.coords.latitude,
    currentPosition.coords.longitude,
    location.latitude,
    location.longitude
  );

  return `
    <div class="marker-content">
      <h3>${location.name}</h3>
      <p>${location.address}</p>
      <p>${distance.toFixed(2)} km away</p>
      ${
        location.rating
          ? `
        <div class="rating">
          <i class="fas fa-star"></i> ${location.rating.toFixed(1)}
          <span>(${location.userRatingsTotal} reviews)</span>
        </div>
      `
          : ""
      }
      <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${
        location.latitude
      },${location.longitude}&destination_place_id=${location.id}', '_blank')">
        Get Directions
      </button>
    </div>
  `;
}

// Toggle between list and map view
viewToggle.addEventListener("click", () => {
  isMapView = !isMapView;
  locationsGrid.style.display = isMapView ? "none" : "grid";
  mapContainer.style.display = isMapView ? "block" : "none";
  viewToggle.innerHTML = isMapView
    ? '<i class="fas fa-list"></i><span>List View</span>'
    : '<i class="fas fa-map"></i><span>Map View</span>';

  if (isMapView) {
    // Center map on user's location
    map.setCenter({
      lat: currentPosition.coords.latitude,
      lng: currentPosition.coords.longitude,
    });
    addMarkersToMap(filterLocations());
  }
});

// Handle search input
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.toLowerCase();
  displayLocations();
});

// Handle radius change
radiusSelect.addEventListener("change", async (e) => {
  currentRadius = parseInt(e.target.value);
  await refreshLocations();
});

// Handle sort change
sortSelect.addEventListener("change", (e) => {
  currentSort = e.target.value;
  displayLocations();
});

// Filter locations based on current criteria
function filterLocations() {
  return locations.filter((location) => {
    const matchesFilter =
      currentFilter === "all" || location.type === currentFilter;
    const matchesSearch =
      searchQuery === "" ||
      location.name.toLowerCase().includes(searchQuery) ||
      location.address.toLowerCase().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });
}

// Sort locations
function sortLocations(locations) {
  return locations.sort((a, b) => {
    switch (currentSort) {
      case "distance":
        const distA = calculateDistance(
          currentPosition.coords.latitude,
          currentPosition.coords.longitude,
          a.latitude,
          a.longitude
        );
        const distB = calculateDistance(
          currentPosition.coords.latitude,
          currentPosition.coords.longitude,
          b.latitude,
          b.longitude
        );
        return distA - distB;
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

// Update displayLocations function
function displayLocations() {
  const filteredLocations = filterLocations();
  const sortedLocations = sortLocations(filteredLocations);

  if (isMapView) {
    addMarkersToMap(sortedLocations);
    return;
  }

  // Create document fragment for better performance
  const fragment = document.createDocumentFragment();

  if (sortedLocations.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "no-results";
    noResults.textContent = "No locations found";
    fragment.appendChild(noResults);
  } else {
    sortedLocations.forEach((location) => {
      const card = createLocationCard(location);
      fragment.appendChild(card);
    });
  }

  // Single DOM update
  locationsGrid.innerHTML = "";
  locationsGrid.appendChild(fragment);

  // Animate cards with optimized GSAP
  if (sortedLocations.length > 0) {
    batchCardAnimation(".location-card");
  }
}

// Add refreshLocations function
async function refreshLocations() {
  try {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "loading";
    loadingDiv.textContent = "Loading locations...";
    locationsGrid.innerHTML = "";
    locationsGrid.appendChild(loadingDiv);

    // Parallel fetch with Promise.all
    const [atms, pharmacies] = await Promise.all([
      searchNearbyPlaces(currentPosition, "atm"),
      searchNearbyPlaces(currentPosition, "pharmacy"),
    ]);

    locations = [...atms, ...pharmacies];
    displayLocations();
  } catch (error) {
    console.error("Error refreshing locations:", error);
    const errorDiv = document.createElement("div");
    errorDiv.className = "error";
    errorDiv.textContent = "Error loading locations. Please try again.";
    locationsGrid.innerHTML = "";
    locationsGrid.appendChild(errorDiv);
  }
}

// Update searchNearbyPlaces function
function searchNearbyPlaces(position, type) {
  return new Promise((resolve, reject) => {
    const location = new google.maps.LatLng(
      position.coords.latitude,
      position.coords.longitude
    );

    const request = {
      location: location,
      type: type,
      ...(currentSort === "distance"
        ? { rankBy: google.maps.places.RankBy.DISTANCE }
        : { radius: currentRadius }),
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Get detailed place information for each result
        const placePromises = results.map((place) => {
          return new Promise((resolve) => {
            placesService.getDetails(
              {
                placeId: place.place_id,
                fields: ["opening_hours", "business_status"],
              },
              (placeDetails, detailsStatus) => {
                if (
                  detailsStatus === google.maps.places.PlacesServiceStatus.OK
                ) {
                  resolve({
                    id: place.place_id,
                    name: place.name,
                    type: type === "atm" ? "atm" : "pharmacy",
                    address: place.vicinity,
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng(),
                    rating: place.rating,
                    userRatingsTotal: place.user_ratings_total,
                    openingHours: placeDetails.opening_hours || null,
                    businessStatus: placeDetails.business_status || null,
                  });
                } else {
                  resolve({
                    id: place.place_id,
                    name: place.name,
                    type: type === "atm" ? "atm" : "pharmacy",
                    address: place.vicinity,
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng(),
                    rating: place.rating,
                    userRatingsTotal: place.user_ratings_total,
                    openingHours: null,
                    businessStatus: null,
                  });
                }
              }
            );
          });
        });

        Promise.all(placePromises).then(resolve);
      } else {
        reject(new Error(`Places search failed: ${status}`));
      }
    });
  });
}

// Update init function
async function init() {
  try {
    // Initialize map first for parallel loading
    initMap();

    // Show loader with optimized animation
    loaderTimeline
      .set(".loader-circle, .loader h2", { opacity: 0 })
      .to(".loader-circle", { opacity: 1, duration: 0.3 })
      .to(".loader h2", { opacity: 1, duration: 0.3 }, "-=0.2");

    // Get user's location
    try {
      currentPosition = await getCurrentLocation();
    } catch (error) {
      // Hide loader first
      await gsap.to(".loader", {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          loader.style.display = "none";
        },
      });

      if (error.code === 1) {
        // Location permission denied
        const errorDiv = document.createElement("div");
        errorDiv.className = "location-error";
        errorDiv.innerHTML = `
          <div class="error-content">
            <i class="fas fa-location-slash"></i>
            <h2>We Need Your Location</h2>
            <p>To find ATMs and pharmacies near you, please enable location access:</p>
            <ol class="location-steps">
              <li>Click the location icon <i class="fas fa-map-marker-alt"></i> in your browser's address bar</li>
              <li>Select "Allow" to share your location</li>
              <li>Refresh this page to see nearby locations</li>
            </ol>
            <button class="retry-button" onclick="window.location.reload()">
              <i class="fas fa-redo"></i> Try Again
            </button>
          </div>
        `;
        locationsGrid.innerHTML = "";
        locationsGrid.appendChild(errorDiv);
        return;
      }
      throw error;
    }

    // Center map
    map.setCenter({
      lat: currentPosition.coords.latitude,
      lng: currentPosition.coords.longitude,
    });

    // Fetch locations
    const [atms, pharmacies] = await Promise.all([
      searchNearbyPlaces(currentPosition, "atm"),
      searchNearbyPlaces(currentPosition, "pharmacy"),
    ]);

    locations = [...atms, ...pharmacies];

    // Hide loader with optimized animation
    await gsap.to(".loader", {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        loader.style.display = "none";
        displayLocations();
      },
    });
  } catch (error) {
    console.error("Error initializing app:", error);
    const errorDiv = document.createElement("div");
    errorDiv.className = "error";
    errorDiv.innerHTML = `
      <div class="error-content">
        <i class="fas fa-exclamation-circle"></i>
        <h2>Oops! Something went wrong</h2>
        <p>We couldn't load the locations. Please try again later.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    `;
    locationsGrid.innerHTML = "";
    locationsGrid.appendChild(errorDiv);
  }
}

// Start the application
init();

// Calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance to be more readable
function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m away`;
  }
  return `${distance.toFixed(1)}km away`;
}

// Create location card with click functionality
function createLocationCard(location) {
  const card = document.createElement("div");
  card.className = "location-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View ${location.name} on map`);

  // Calculate distance
  const distance = calculateDistance(
    currentPosition.coords.latitude,
    currentPosition.coords.longitude,
    location.latitude,
    location.longitude
  );

  // Add click handler to open location in Google Maps
  card.addEventListener("click", () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location.name + " " + location.address
    )}`;
    window.open(url, "_blank");
  });

  // Add keyboard support
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });

  // Determine status based on available data
  let statusHtml = "";
  if (location.type === "atm") {
    statusHtml = `
      <div class="location-status open">
        <i class="fas fa-clock"></i>
        24 Hours
      </div>
    `;
  } else if (location.openingHours && location.openingHours.periods) {
    // Check if it's a pharmacy with opening hours
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const is24Hours = location.openingHours.periods.some(period => {
      return period.open && period.close &&
        period.open.day === period.close.day &&
        period.open.hours === 0 && period.open.minutes === 0 &&
        period.close.hours === 23 && period.close.minutes === 59;
    });

    const isOpen = location.openingHours.periods.some(period => {
      if (!period.open || !period.close) return false;
      
      const openDay = period.open.day;
      const closeDay = period.close.day;
      const openTime = period.open.hours * 60 + period.open.minutes;
      const closeTime = period.close.hours * 60 + period.close.minutes;
      const currentTime = currentHour * 60 + currentMinute;

      if (openDay === closeDay) {
        // Same day period
        return currentDay === openDay && currentTime >= openTime && currentTime <= closeTime;
      } else {
        // Overnight period
        if (currentDay === openDay) {
          return currentTime >= openTime;
        } else if (currentDay === closeDay) {
          return currentTime <= closeTime;
        }
        return false;
      }
    });

    if (is24Hours) {
      statusHtml = `
        <div class="location-status open">
          <i class="fas fa-clock"></i>
          24 Hours
        </div>
      `;
    } else {
      statusHtml = `
        <div class="location-status ${isOpen ? "open" : "closed"}">
          <i class="fas ${isOpen ? "fa-door-open" : "fa-door-closed"}"></i>
          ${isOpen ? "Open Now" : "Closed"}
        </div>
      `;
    }
  } else {
    statusHtml = `
      <div class="location-status unavailable">
        <i class="fas fa-question-circle"></i>
        Not Available
      </div>
    `;
  }

  card.innerHTML = `
    ${statusHtml}
    <div class="location-type">
      <i class="fas ${
        location.type === "atm" ? "fa-credit-card" : "fa-pills"
      }"></i>
      <span>${location.type === "atm" ? "ATM" : "Pharmacy"}</span>
    </div>
    <h3 class="location-name">${location.name}</h3>
    <p class="location-address">${location.address}</p>
    <div class="location-distance">
      <span>${formatDistance(distance)}</span>
    </div>
    <div class="rating">
      <i class="fas fa-star"></i>
      <span>${location.rating || "N/A"}</span>
      <span class="reviews">(${location.userRatingsTotal || 0} reviews)</span>
    </div>
  `;

  return card;
}

// Debounce search input
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Optimize search input handler
searchInput.addEventListener(
  "input",
  debounce((e) => {
    searchQuery = e.target.value.toLowerCase();
    displayLocations();
  }, 300)
);
