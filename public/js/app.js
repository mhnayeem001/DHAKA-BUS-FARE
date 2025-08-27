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
        'Dhaka Bus Fare Finder': 'Dhaka Bus Fare Finder',
        'Created By': 'Created By',
        'Connect with me': 'Connect with me',
        'Data Source': 'Data Source',
        'BRTC Official Portal': 'BRTC Official Portal'
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
        'Dhaka Bus Fare Finder': 'ঢাকা বাস ভাড়া খোঁজক',
        'Created By': 'তৈরি করেছেন',
        'Connect with me': 'আমার সাথে যুক্ত হোন',
        'Data Source': 'তথ্যের উৎস',
        'BRTC Official Portal': 'বিআরটিসি অফিসিয়াল পোর্টাল'
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
    
    // Add footer content
    addFooterContent();
    
    // Add professional styles
    addProfessionalStyles();
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

function addProfessionalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Professional Color Scheme */
        :root {
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --secondary: #10b981;
            --secondary-dark: #059669;
            --accent: #f59e0b;
            --light: #f8fafc;
            --dark: #1e293b;
            --gray: #64748b;
            --border: #e2e8f0;
        }
        
        .fare-boxes {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .general-fare-box {
            background: white;
            border: 2px solid var(--secondary);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .student-fare-box {
            background: white;
            border: 2px solid var(--primary);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .fare-amount {
            font-size: 2.25rem;
            font-weight: 700;
            color: var(--secondary-dark);
            margin-bottom: 0.5rem;
            font-family: 'Inter', sans-serif;
        }
        
        .student-amount {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary-dark);
            margin-bottom: 0.5rem;
            font-family: 'Inter', sans-serif;
        }
        
        .fare-label {
            font-size: 0.875rem;
            color: var(--gray);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .creator-info {
            background: var(--light);
            padding: 2rem 1.5rem;
            margin-top: 3rem;
            border-top: 1px solid var(--border);
        }
        
        .social-links .btn {
            border-radius: 8px;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
            border: 2px solid;
        }
        
        .social-links .btn-outline-primary {
            border-color: var(--primary);
            color: var(--primary);
        }
        
        .social-links .btn-outline-primary:hover {
            background-color: var(--primary);
            color: white;
            transform: translateY(-1px);
        }
        
        .social-links .btn-outline-dark {
            border-color: var(--dark);
            color: var(--dark);
        }
        
        .social-links .btn-outline-dark:hover {
            background-color: var(--dark);
            color: white;
            transform: translateY(-1px);
        }
        
        /* Data source styling */
        .data-source {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 8px;
            padding: 0.75rem 1rem;
            margin-top: 1rem;
            border: 1px solid var(--border);
        }
        
        .data-source-text {
            font-size: 0.8rem;
            color: var(--gray);
            margin: 0;
        }
        
        .data-source-link {
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
        }
        
        .data-source-link:hover {
            color: var(--primary-dark);
            text-decoration: underline;
        }
        
        /* Route details styling */
        .route-details h5 {
            color: var(--dark);
            font-weight: 600;
        }
        
        .badge {
            background: var(--light);
            border: 1px solid var(--border);
            color: var(--dark);
            font-weight: 500;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .fare-boxes {
                flex-direction: row;
                gap: 0.75rem;
            }
            
            .general-fare-box,
            .student-fare-box {
                flex: 1;
                padding: 1rem;
                min-width: 120px;
            }
            
            .fare-amount {
                font-size: 1.75rem;
            }
            
            .student-amount {
                font-size: 1.5rem;
            }
            
            .fare-label {
                font-size: 0.75rem;
            }
            
            .creator-info {
                padding: 1.5rem 1rem;
                margin: 2rem -1rem -1rem;
                border-radius: 0;
            }
            
            .social-links {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .social-links .btn {
                width: 100%;
                justify-content: center;
            }
            
            .data-source {
                padding: 0.5rem 0.75rem;
                margin-top: 0.75rem;
            }
            
            .data-source-text {
                font-size: 0.75rem;
            }
        }
        
        @media (max-width: 480px) {
            .fare-boxes {
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .fare-amount {
                font-size: 1.5rem;
            }
            
            .student-amount {
                font-size: 1.25rem;
            }
            
            .fare-label {
                font-size: 0.7rem;
            }
        }
        
        /* Animation and hover effects */
        .general-fare-box:hover,
        .student-fare-box:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            transition: all 0.2s ease;
        }
        
        /* Button styles */
        .btn-outline-danger {
            border-color: #ef4444;
            color: #ef4444;
        }
        
        .btn-outline-danger:hover {
            background-color: #ef4444;
            color: white;
        }
        
        .btn-outline-primary {
            border-color: var(--primary);
            color: var(--primary);
        }
        
        .btn-outline-primary:hover {
            background-color: var(--primary);
            color: white;
        }
    `;
    document.head.appendChild(style);
}

function addFooterContent() {
    const footer = document.querySelector('footer');
    if (footer) {
        footer.innerHTML += `
            <div class="container">
                <div class="row">
                    <div class="col-12">
                        <div class="creator-info text-center">
                            <p class="mb-3 text-dark fw-semibold">
                                <span data-en="Created By" data-bn="তৈরি করেছেন">Created By</span>: 
                                <span class="text-primary">MAHADI HASAN NAYEEM</span>
                            </p>
                            <div class="social-links d-flex flex-wrap justify-content-center gap-2 mb-3">
                                <a href="https://www.linkedin.com/in/mahadihasannayeem" target="_blank" class="btn btn-outline-primary btn-sm d-flex align-items-center">
                                    <i class="fab fa-linkedin me-2"></i> LinkedIn
                                </a>
                                <a href="mailto:mhnayem01@gmail.com" class="btn btn-outline-dark btn-sm d-flex align-items-center">
                                    <i class="fas fa-envelope me-2"></i> Gmail
                                </a>
                            </div>
                            <div class="data-source">
                                <p class="data-source-text mb-0">
                                    <span data-en="Data Source" data-bn="তথ্যের উৎস">Data Source</span>: 
                                    <a href="https://www.brtc.gov.bd" target="_blank" class="data-source-link" data-en="BRTC Official Portal" data-bn="বিআরটিসি অফিসিয়াল পোর্টাল">BRTC Official Portal</a>
                                </p>
                            </div>
                            <p class="text-muted small mb-0 mt-2">
                                <span data-en="All rights reserved" data-bn="সর্বস্বত্ব সংরক্ষিত">All rights reserved</span> © ${new Date().getFullYear()} 
                                <span class="fw-semibold" data-en="Dhaka Bus Fare Finder" data-bn="ঢাকা বাস ভাড়া খোঁজক">Dhaka Bus Fare Finder</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        updateLanguageElements();
    }
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
    // Calculate student fare (half of general fare, rounded down)
    const generalFare = parseInt(route.fare);
    const studentFare = Math.floor(generalFare / 2);
    
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
                                    <span class="badge bg-light text-dark border px-3 py-2 rounded-pill">
                                        <i class="fas fa-route text-primary me-1"></i>
                                        ${route.distance} km
                                    </span>
                                    <span class="badge bg-light text-dark border px-3 py-2 rounded-pill">
                                        <i class="fas fa-clock text-success me-1"></i>
                                        ~${Math.ceil(route.distance * 2)} min
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-md-4">
                            <div class="fare-boxes">
                                <div class="general-fare-box">
                                    <div class="fare-amount">৳${generalFare}</div>
                                    <small class="fare-label">General Fare</small>
                                </div>
                                <div class="student-fare-box">
                                    <div class="student-amount">৳${studentFare}</div>
                                    <small class="fare-label">Student Fare (50% off)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <div class="d-flex flex-column flex-sm-row gap-2 justify-content-center">
                    <button class="btn btn-outline-danger btn-sm" onclick="addToFavorites('${from}', '${to}')">
                        <i class="fas fa-heart me-2"></i>
                        <span data-en="Add to Favorites" data-bn="প্রিয়তে যোগ করুন">Add to Favorites</span>
                    </button>
                    <button class="btn btn-outline-primary btn-sm" onclick="shareRoute('${from}', '${to}', ${generalFare}, ${studentFare})">
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
    
    const icon = currentLocationBtn.querySelector('i');
    const originalClass = icon.className;
    icon.className = 'fas fa-spinner fa-spin';
    currentLocationBtn.disabled = true;
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const nearestStop = findNearestStopByCoords(latitude, longitude);
            
            if (nearestStop) {
                fromInput.value = nearestStop.name;
                showNotification(`📍 Nearest stop: ${nearestStop.name}`, 'success');
                setTimeout(() => toInput.focus(), 500);
            } else {
                showNotification('No nearby bus stops found. Please enter your location manually.', 'info');
            }
            
            icon.className = originalClass;
            currentLocationBtn.disabled = false;
        },
        (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Failed to get your location.';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please allow location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out.';
                    break;
            }
            
            showNotification(errorMessage, 'error');
            icon.className = originalClass;
            currentLocationBtn.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}

function findNearestStopByCoords(userLat, userLng) {
    const stopCoordinates = {
        'Farmgate': { lat: 23.7515, lng: 90.3860 },
        'New Market': { lat: 23.7348, lng: 90.3860 },
        'Gulshan 1': { lat: 23.7806, lng: 90.4142 },
        'Gulshan 2': { lat: 23.7941, lng: 90.4153 },
        'Dhanmondi': { lat: 23.7461, lng: 90.3742 },
        'Uttara': { lat: 23.8759, lng: 90.3795 },
        'Motijheel': { lat: 23.7233, lng: 90.4174 },
        'Mirpur': { lat: 23.8103, lng: 90.3654 },
        'Sadarghat': { lat: 23.7055, lng: 90.4077 },
        'Kuril Bishwa Road': { lat: 23.8150, lng: 90.4250 },
        'Badda': { lat: 23.7850, lng: 90.4250 },
        'Banani': { lat: 23.7940, lng: 90.4050 },
        'Mohakhali': { lat: 23.7790, lng: 90.4050 },
        'Tejgaon': { lat: 23.7590, lng: 90.4050 },
        'Shahbagh': { lat: 23.7360, lng: 90.3950 }
    };
    
    let nearestStop = null;
    let minDistance = Infinity;
    
    Object.entries(stopCoordinates).forEach(([stopName, coords]) => {
        const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearestStop = { name: stopName, distance: Math.round(distance) };
        }
    });
    
    return minDistance <= 3000 ? nearestStop : null;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function addToRecentSearches(from, to) {
    let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const searchItem = { from, to, timestamp: Date.now() };
    
    recentSearches = recentSearches.filter(item => 
        !(item.from === from && item.to === to)
    );
    
    recentSearches.unshift(searchItem);
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
    
    const exists = favorites.some(fav => fav.from === from && fav.to === to);
    if (exists) {
        showNotification('Route is already in favorites!', 'info');
        return;
    }
    
    const favoriteItem = { from, to, timestamp: Date.now() };
    favorites.unshift(favoriteItem);
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
    const event = new Event('submit');
    fareSearchForm.dispatchEvent(event);
}

function shareRoute(from, to, generalFare, studentFare) {
    if (navigator.share) {
        navigator.share({
            title: 'Dhaka Bus Fare',
            text: `Bus fare from ${from} to ${to}:\nGeneral: ৳${generalFare}\nStudent: ৳${studentFare}`,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        const shareText = `Bus fare from ${from} to ${to}:\nGeneral: ৳${generalFare}\nStudent: ৳${studentFare}`;
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
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
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