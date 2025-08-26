// Global variables
let fareData = { routes: [], stops: [] };
let currentLanguage = localStorage.getItem('language') || 'en';
let currentTheme = localStorage.getItem('theme') || 'light';

// DOM Elements
const fromInput = document.getElementById('fromInput');
const toInput = document.getElementById('toInput');
const fromSuggestions = document.getElementById('fromSuggestions');
const toSuggestions = document.getElementById('toSuggestions');
const fareSearchForm = document.getElementById('fareSearchForm');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const loadingSpinner = document.getElementById('loadingSpinner');
const searchBtn = document.getElementById('searchBtn');
const swapBtn = document.getElementById('swapBtn');
const nearestStopBtn = document.getElementById('nearestStopBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const languageToggle = document.getElementById('languageToggle');
const themeToggle = document.getElementById('themeToggle');
const currentLangSpan = document.getElementById('currentLang');
const themeIcon = document.getElementById('themeIcon');

// Language translations
const translations = {
    en: {
        'Find Your Bus Fare': 'Find Your Bus Fare',
        'Get accurate fare information for Dhaka bus routes': 'Get accurate fare information for Dhaka bus routes',
        'From': 'From',
        'To': 'To',
        'Enter starting point...': 'Enter starting point...',
        'Enter destination...': 'Enter destination...',
        'Search Fare': 'Search Fare',
        'Route Information': 'Route Information',
        'Recent Searches': 'Recent Searches',
        'Favorite Routes': 'Favorite Routes',
        'No recent searches': 'No recent searches',
        'No favorite routes': 'No favorite routes',
        'Admin': 'Admin',
        'Dhaka Bus Fare': 'Dhaka Bus Fare',
        'Find accurate bus fares for Dhaka routes': 'Find accurate bus fares for Dhaka routes',
        'All rights reserved': 'All rights reserved',
        'Dhaka Bus Fare Finder': 'Dhaka Bus Fare Finder'
    },
    bn: {
        'Find Your Bus Fare': 'আপনার বাস ভাড়া খুঁজুন',
        'Get accurate fare information for Dhaka bus routes': 'ঢাকার বাস রুটের জন্য সঠিক ভাড়ার তথ্য পান',
        'From': 'থেকে',
        'To': 'যেখানে',
        'Enter starting point...': 'শুরুর স্থান লিখুন...',
        'Enter destination...': 'গন্তব্য লিখুন...',
        'Search Fare': 'ভাড়া খুঁজুন',
        'Route Information': 'রুট তথ্য',
        'Recent Searches': 'সাম্প্রতিক অনুসন্ধান',
        'Favorite Routes': 'প্রিয় রুট',
        'No recent searches': 'কোনো সাম্প্রতিক অনুসন্ধান নেই',
        'No favorite routes': 'কোনো প্রিয় রুট নেই',
        'Admin': 'অ্যাডমিন',
        'Dhaka Bus Fare': 'ঢাকা বাস ভাড়া',
        'Find accurate bus fares for Dhaka routes': 'ঢাকার রুটের জন্য সঠিক বাস ভাড়া খুঁজুন',
        'All rights reserved': 'সর্বস্বত্ব সংরক্ষিত',
        'Dhaka Bus Fare Finder': 'ঢাকা বাস ভাড়া খোঁজক'
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set initial theme and language
    setTheme(currentTheme);
    setLanguage(currentLanguage);
    
    // Load fare data
    loadFareData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load quick actions
    loadRecentSearches();
    loadFavoriteRoutes();
}

function setupEventListeners() {
    // Form submission
    fareSearchForm.addEventListener('submit', handleSearchSubmit);
    
    // Input events for autocomplete
    fromInput.addEventListener('input', () => handleAutocomplete(fromInput, fromSuggestions));
    toInput.addEventListener('input', () => handleAutocomplete(toInput, toSuggestions));
    
    // Focus events to show suggestions
    fromInput.addEventListener('focus', () => handleAutocomplete(fromInput, fromSuggestions));
    toInput.addEventListener('focus', () => handleAutocomplete(toInput, toSuggestions));
    
    // Click outside to hide suggestions
    document.addEventListener('click', (e) => {
        if (!fromInput.contains(e.target) && !fromSuggestions.contains(e.target)) {
            fromSuggestions.style.display = 'none';
        }
        if (!toInput.contains(e.target) && !toSuggestions.contains(e.target)) {
            toSuggestions.style.display = 'none';
        }
    });
    
    // Swap button
    swapBtn.addEventListener('click', swapInputs);
    
    // Nearest stop button
    nearestStopBtn.addEventListener('click', findNearestStop);
    
    // Current location button
    currentLocationBtn.addEventListener('click', useCurrentLocation);
    
    // Language toggle
    languageToggle.addEventListener('click', toggleLanguage);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Keyboard navigation for suggestions
    fromInput.addEventListener('keydown', (e) => handleKeyNavigation(e, fromSuggestions));
    toInput.addEventListener('keydown', (e) => handleKeyNavigation(e, toSuggestions));
}

async function loadFareData() {
    try {
        showLoading();
        const response = await fetch('/api/fare-data');
        if (response.ok) {
            fareData = await response.json();
            console.log('Fare data loaded:', fareData);
        } else {
            throw new Error('Failed to load fare data');
        }
    } catch (error) {
        console.error('Error loading fare data:', error);
        showNotification('Failed to load fare data. Please refresh the page.', 'error');
    } finally {
        hideLoading();
    }
}

function handleAutocomplete(input, suggestionsContainer) {
    const query = input.value.toLowerCase().trim();
    
    if (query.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    const filteredStops = fareData.stops.filter(stop => 
        stop.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to 10 suggestions
    
    if (filteredStops.length === 0) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    suggestionsContainer.innerHTML = filteredStops.map((stop, index) => 
        `<div class="suggestion-item" data-index="${index}" onclick="selectSuggestion('${stop}', '${input.id}')">${stop}</div>`
    ).join('');
    
    suggestionsContainer.style.display = 'block';
}

function selectSuggestion(stop, inputId) {
    const input = document.getElementById(inputId);
    input.value = stop;
    
    // Hide suggestions
    const suggestionsContainer = inputId === 'fromInput' ? fromSuggestions : toSuggestions;
    suggestionsContainer.style.display = 'none';
    
    // Focus next input if from is selected
    if (inputId === 'fromInput' && toInput.value === '') {
        toInput.focus();
    }
}

function handleKeyNavigation(e, suggestionsContainer) {
    const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
    let activeIndex = Array.from(suggestions).findIndex(item => item.classList.contains('active'));
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            activeIndex = (activeIndex + 1) % suggestions.length;
            updateActiveSuggestion(suggestions, activeIndex);
            break;
        case 'ArrowUp':
            e.preventDefault();
            activeIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
            updateActiveSuggestion(suggestions, activeIndex);
            break;
        case 'Enter':
            if (activeIndex >= 0) {
                e.preventDefault();
                suggestions[activeIndex].click();
            }
            break;
        case 'Escape':
            suggestionsContainer.style.display = 'none';
            break;
    }
}

function updateActiveSuggestion(suggestions, activeIndex) {
    suggestions.forEach(item => item.classList.remove('active'));
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
        suggestions[activeIndex].classList.add('active');
    }
}

async function handleSearchSubmit(e) {
    e.preventDefault();
    
    const from = fromInput.value.trim();
    const to = toInput.value.trim();
    
    if (!from || !to) {
        showNotification('Please enter both starting point and destination.', 'error');
        return;
    }
    
    if (from.toLowerCase() === to.toLowerCase()) {
        showNotification('Starting point and destination cannot be the same.', 'error');
        return;
    }
    
    try {
        showLoading();
        const response = await fetch(`/api/search-fare?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
        const result = await response.json();
        
        if (result.success) {
            displaySearchResult(result.route, from, to);
            addToRecentSearches(from, to);
        } else {
            showNotification(result.error || 'No route found between the selected stops.', 'error');
        }
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Failed to search fare. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function displaySearchResult(route, from, to) {
    const resultHTML = `
        <div class="row g-4">
            <div class="col-12">
                <div class="fare-info fade-in">
                    <div class="row align-items-center">
                        <div class="col-12 col-md-8">
                            <div class="route-details">
                                <h5 class="mb-2 fw-bold">
                                    <i class="fas fa-map-marker-alt text-success me-2"></i>${from}
                                    <i class="fas fa-arrow-right mx-3 text-primary"></i>
                                    <i class="fas fa-map-marker-alt text-danger me-2"></i>${to}
                                </h5>
                                <div class="route-meta d-flex flex-wrap gap-3">
                                    <span class="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill">
                                        <i class="fas fa-route me-1"></i>
                                        ${route.distance} km
                                    </span>
                                    <span class="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                                        <i class="fas fa-clock me-1"></i>
                                        ~${Math.ceil(route.distance * 2)} min
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4 text-center text-md-end">
                            <div class="fare-amount-container">
                                <div class="fare-amount pulse">৳${route.fare}</div>
                                <small class="text-muted fw-500">Total Fare</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <div class="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                    <button class="btn btn-outline-danger" onclick="addToFavorites('${from}', '${to}')">
                        <i class="fas fa-heart me-2"></i>
                        <span data-en="Add to Favorites" data-bn="প্রিয়তে যোগ করুন">Add to Favorites</span>
                    </button>
                    <button class="btn btn-outline-primary" onclick="shareRoute('${from}', '${to}', ${route.fare})">
                        <i class="fas fa-share me-2"></i>
                        <span data-en="Share Route" data-bn="রুট শেয়ার করুন">Share Route</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    resultsContent.innerHTML = resultHTML;
    resultsSection.style.display = 'block';
    updateLanguageElements();
    
    // Smooth scroll with offset for mobile
    setTimeout(() => {
        resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);
}

function swapInputs() {
    const fromValue = fromInput.value;
    const toValue = toInput.value;
    
    fromInput.value = toValue;
    toInput.value = fromValue;
    
    // Hide suggestions
    fromSuggestions.style.display = 'none';
    toSuggestions.style.display = 'none';
}

function findNearestStop() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser.', 'error');
        return;
    }
    
    showLoading();
    navigator.geolocation.getCurrentPosition(
        (position) => {
            hideLoading();
            // In a real implementation, you would calculate distances to stops
            // For now, we'll show a sample nearest stop
            const sampleStops = fareData.stops.slice(0, 5);
            const nearestStop = sampleStops[Math.floor(Math.random() * sampleStops.length)];
            
            if (nearestStop) {
                fromInput.value = nearestStop;
                showNotification(`Nearest stop: ${nearestStop}`, 'success');
            } else {
                showNotification('No nearby stops found.', 'error');
            }
        },
        (error) => {
            hideLoading();
            console.error('Geolocation error:', error);
            showNotification('Failed to get your location. Please allow location access.', 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

function useCurrentLocation() {
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser.', 'error');
        return;
    }
    
    // Show loading animation on button
    const icon = currentLocationBtn.querySelector('i');
    const originalClass = icon.className;
    icon.className = 'fas fa-spinner loading-location';
    currentLocationBtn.disabled = true;
    currentLocationBtn.title = 'Getting location...';
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            // Calculate nearest stop based on coordinates
            const nearestStop = findNearestStopByCoords(latitude, longitude);
            
            if (nearestStop) {
                fromInput.value = nearestStop.name;
                showNotification(`📍 Using current location: ${nearestStop.name} (${nearestStop.distance}m away)`, 'success');
                
                // Trigger autocomplete to show it's been filled
                fromInput.focus();
                fromInput.blur();
            } else {
                showNotification('No nearby stops found within reasonable distance.', 'error');
            }
            
            // Restore button
            icon.className = originalClass;
            currentLocationBtn.disabled = false;
            currentLocationBtn.title = 'Use current location';
        },
        (error) => {
            console.error('Geolocation error:', error);
            
            let errorMessage = 'Failed to get your location.';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please allow location access and try again.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable. Please try again.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out. Please try again.';
                    break;
            }
            
            showNotification(errorMessage, 'error');
            
            // Restore button
            icon.className = originalClass;
            currentLocationBtn.disabled = false;
            currentLocationBtn.title = 'Use current location';
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
        }
    );
}

function findNearestStopByCoords(userLat, userLng) {
    // Sample coordinates for Dhaka bus stops (in a real app, this would come from your database)
    const stopCoordinates = {
        'Farmgate': { lat: 23.7515, lng: 90.3860 },
        'New Market': { lat: 23.7348, lng: 90.3860 },
        'Gulshan': { lat: 23.7806, lng: 90.4142 },
        'Dhanmondi': { lat: 23.7461, lng: 90.3742 },
        'Uttara': { lat: 23.8759, lng: 90.3795 },
        'Motijheel': { lat: 23.7233, lng: 90.4174 },
        'Mirpur': { lat: 23.8103, lng: 90.3654 },
        'Sadarghat': { lat: 23.7055, lng: 90.4077 }
    };
    
    let nearestStop = null;
    let minDistance = Infinity;
    
    Object.entries(stopCoordinates).forEach(([stopName, coords]) => {
        const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearestStop = {
                name: stopName,
                distance: Math.round(distance)
            };
        }
    });
    
    // Only return if within 5km radius
    return minDistance <= 5000 ? nearestStop : null;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
}

function addToRecentSearches(from, to) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    
    const searchItem = { from, to, timestamp: Date.now() };
    
    // Remove if already exists
    recentSearches = recentSearches.filter(item => 
        !(item.from === from && item.to === to)
    );
    
    // Add to beginning
    recentSearches.unshift(searchItem);
    
    // Keep only last 10 searches
    recentSearches = recentSearches.slice(0, 10);
    
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    loadRecentSearches();
}

function loadRecentSearches() {
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const container = document.getElementById('recentSearches');
    
    if (recentSearches.length === 0) {
        container.innerHTML = `<span class="text-muted small" data-en="No recent searches" data-bn="কোনো সাম্প্রতিক অনুসন্ধান নেই">No recent searches</span>`;
    } else {
        container.innerHTML = recentSearches.map(search => 
            `<button class="quick-action-btn" onclick="quickSearch('${search.from}', '${search.to}')">
                <i class="fas fa-history"></i>
                ${search.from} → ${search.to}
            </button>`
        ).join('');
    }
    
    updateLanguageElements();
}

function addToFavorites(from, to) {
    let favorites = JSON.parse(localStorage.getItem('favoriteRoutes') || '[]');
    
    // Check if already exists
    const exists = favorites.some(fav => fav.from === from && fav.to === to);
    if (exists) {
        showNotification('Route is already in favorites!', 'info');
        return;
    }
    
    const favoriteItem = { from, to, timestamp: Date.now() };
    favorites.unshift(favoriteItem);
    
    // Keep only last 15 favorites
    favorites = favorites.slice(0, 15);
    
    localStorage.setItem('favoriteRoutes', JSON.stringify(favorites));
    loadFavoriteRoutes();
    showNotification('Route added to favorites!', 'success');
}

function loadFavoriteRoutes() {
    const favorites = JSON.parse(localStorage.getItem('favoriteRoutes') || '[]');
    const container = document.getElementById('favoriteRoutes');
    
    if (favorites.length === 0) {
        container.innerHTML = `<span class="text-muted small" data-en="No favorite routes" data-bn="কোনো প্রিয় রুট নেই">No favorite routes</span>`;
    } else {
        container.innerHTML = favorites.map(fav => 
            `<button class="quick-action-btn" onclick="quickSearch('${fav.from}', '${fav.to}')">
                <i class="fas fa-heart text-danger"></i>
                ${fav.from} → ${fav.to}
            </button>`
        ).join('');
    }
    
    updateLanguageElements();
}

function quickSearch(from, to) {
    fromInput.value = from;
    toInput.value = to;
    
    // Trigger search
    const event = new Event('submit');
    fareSearchForm.dispatchEvent(event);
}

function shareRoute(from, to, fare) {
    if (navigator.share) {
        navigator.share({
            title: 'Dhaka Bus Fare',
            text: `Bus fare from ${from} to ${to}: ৳${fare}`,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: copy to clipboard
        const shareText = `Bus fare from ${from} to ${to}: ৳${fare}`;
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Route details copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy route details.', 'error');
        });
    }
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'bn' : 'en';
    setLanguage(currentLanguage);
    localStorage.setItem('language', currentLanguage);
}

function setLanguage(lang) {
    currentLanguage = lang;
    currentLangSpan.textContent = lang.toUpperCase();
    updateLanguageElements();
    updatePlaceholders();
}

function updateLanguageElements() {
    document.querySelectorAll('[data-en]').forEach(element => {
        const enText = element.getAttribute('data-en');
        const bnText = element.getAttribute('data-bn');
        
        if (currentLanguage === 'bn' && bnText) {
            element.textContent = bnText;
        } else {
            element.textContent = enText;
        }
    });
}

function updatePlaceholders() {
    const elementsWithPlaceholders = document.querySelectorAll('[data-en-placeholder]');
    elementsWithPlaceholders.forEach(element => {
        const enPlaceholder = element.getAttribute('data-en-placeholder');
        const bnPlaceholder = element.getAttribute('data-bn-placeholder');
        
        if (currentLanguage === 'bn' && bnPlaceholder) {
            element.placeholder = bnPlaceholder;
        } else {
            element.placeholder = enPlaceholder;
        }
    });
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
        themeIcon.className = 'fas fa-sun';
    } else {
        themeIcon.className = 'fas fa-moon';
    }
}

function showLoading() {
    loadingSpinner.style.display = 'block';
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Searching...';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
    searchBtn.disabled = false;
    searchBtn.innerHTML = `<i class="fas fa-search me-2"></i><span data-en="Search Fare" data-bn="ভাড়া খুঁজুন">Search Fare</span>`;
    updateLanguageElements();
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Export functions for global access
window.selectSuggestion = selectSuggestion;
window.addToFavorites = addToFavorites;
window.shareRoute = shareRoute;
window.quickSearch = quickSearch;
