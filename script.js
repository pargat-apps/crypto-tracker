/**
 * Crypto Tracker JavaScript
 * This file contains all the functionality for the cryptocurrency tracker application.
 * It handles fetching data from the CoinGecko API, displaying cryptocurrencies,
 * implementing the comparison feature, and managing user preferences.
 */

// ========================================
// Global Variables
// ========================================
let cryptocurrencies = [];          // Stores all cryptocurrency data fetched from API
let comparisonCoins = [];           // Stores selected cryptocurrencies for comparison
const MAX_COMPARISON = 5;           // Maximum number of cryptocurrencies that can be compared
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';  // Base URL for CoinGecko API
let lastFetchTime = 0;              // Timestamp of the last API call
const RATE_LIMIT_INTERVAL = 60000;  // Time between API calls (1 minute) to respect rate limits
let isInitialLoad = true;           // Flag to track initial page load

// ========================================
// DOM Element References
// ========================================
const cryptoListElement = document.getElementById('cryptoList');                 // Container for cryptocurrency list
const comparisonContainerElement = document.getElementById('comparisonContainer'); // Container for comparison section
const searchInputElement = document.getElementById('searchInput');               // Search input field
const searchBtnElement = document.getElementById('searchBtn');                   // Search button
const sortOptionElement = document.getElementById('sortOption');                 // Sort dropdown
const show24hChangeElement = document.getElementById('show24hChange');           // Checkbox for showing 24h change
const showMarketCapElement = document.getElementById('showMarketCap');           // Checkbox for showing market cap
const showVolumeElement = document.getElementById('showVolume');                 // Checkbox for showing volume
const enableDarkModeElement = document.getElementById('enableDarkMode');         // Checkbox for dark mode
const notificationContainerElement = document.getElementById('notificationContainer'); // Container for notifications
const loaderOverlayElement = document.getElementById('loaderOverlay');           // Full screen loader overlay

// ========================================
// Application Initialization
// ========================================
/**
 * Initialize the application when the document is ready
 * This function is called when the DOM is fully loaded
 */
$(document).ready(function() {
    // Show loader on initial load
    showLoader();
    
    // Load user preferences from local storage
    loadUserPreferences();
    
    // Load comparison coins from local storage
    loadComparisonCoins();
    
    // Fetch cryptocurrency data
    fetchCryptocurrencyData();
    
    // Set up event listeners
    setUpEventListeners();
});

/**
 * Set up all event listeners for the application
 * This includes search, sort, and preference change events
 */
function setUpEventListeners() {
    // Search functionality event listeners
    searchBtnElement.addEventListener('click', handleSearch);
    searchInputElement.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Sort functionality event listener
    sortOptionElement.addEventListener('change', handleSort);
    
    // Preference change event listeners
    show24hChangeElement.addEventListener('change', saveUserPreferences);
    showMarketCapElement.addEventListener('change', saveUserPreferences);
    showVolumeElement.addEventListener('change', saveUserPreferences);
    enableDarkModeElement.addEventListener('change', function() {
        saveUserPreferences();
        applyDarkMode();
    });
}

// ========================================
// Loader Functions
// ========================================
/**
 * Show the full screen loader overlay
 * @param {string} message - Optional custom message to display
 */
function showLoader(message) {
    // Update loader message if provided
    if (message) {
        const loaderTextElement = loaderOverlayElement.querySelector('.loader-text');
        if (loaderTextElement) {
            loaderTextElement.textContent = message;
        }
    }
    
    // Show the loader
    loaderOverlayElement.classList.remove('hidden');
}

/**
 * Hide the full screen loader overlay
 */
function hideLoader() {
    loaderOverlayElement.classList.add('hidden');
}

/**
 * Show an inline loader in a specific element
 * @param {HTMLElement} element - Element to show the loader in
 * @param {string} message - Optional message to display with the loader
 */
function showInlineLoader(element, message = 'Loading...') {
    element.innerHTML = `
        <div class="loading">
            <span class="loader"></span>
            <div>${message}</div>
        </div>
    `;
}

// ========================================
// API Data Fetching
// ========================================
/**
 * Fetch cryptocurrency data from CoinGecko API
 * This function respects rate limits and implements error handling
 */
async function fetchCryptocurrencyData() {
    try {
        // Check if we're respecting the rate limit by comparing current time with last fetch time
        const currentTime = Date.now();
        if (currentTime - lastFetchTime < RATE_LIMIT_INTERVAL && lastFetchTime !== 0) {
            // Calculate wait time before next API call
            const waitTime = RATE_LIMIT_INTERVAL - (currentTime - lastFetchTime);
            showNotification(`Respecting API rate limit. Waiting ${Math.ceil(waitTime / 1000)} seconds...`, 'info');
            
            // Set a timeout to fetch data after the rate limit interval
            setTimeout(fetchCryptocurrencyData, waitTime);
            return;
        }
        
        // Show loading state while fetching data
        if (isInitialLoad) {
            // For initial load, the full-screen loader is already shown
            showLoader('Fetching cryptocurrency data...');
        } else {
            // For subsequent loads, show inline loader
            showInlineLoader(cryptoListElement, 'Refreshing cryptocurrency data...');
        }
        
        // Fetch data from CoinGecko API
        // Parameters:
        // - vs_currency=usd: Show prices in USD
        // - order=market_cap_desc: Order by market cap (highest first)
        // - per_page=100: Get 100 cryptocurrencies
        // - sparkline=false: Don't include sparkline data
        // - price_change_percentage=24h: Include 24h price change data
        const response = await fetch(`${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`);
        
        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse JSON response
        const data = await response.json();
        
        // Update global cryptocurrencies array
        cryptocurrencies = data;
        
        // Update last fetch time to current time
        lastFetchTime = Date.now();
        
        // Display cryptocurrencies in the list
        displayCryptocurrencies(cryptocurrencies);
        
        // Update comparison section if there are coins to compare
        if (comparisonCoins.length > 0) {
            updateComparisonSection();
        }
        
        // Hide the loader after initial load
        if (isInitialLoad) {
            hideLoader();
            isInitialLoad = false;
        }
        
        // Schedule the next data fetch after the rate limit interval
        setTimeout(fetchCryptocurrencyData, RATE_LIMIT_INTERVAL);
        
    } catch (error) {
        // Handle and log errors
        console.error('Error fetching cryptocurrency data:', error);
        
        if (isInitialLoad) {
            // Show error in full-screen loader
            showLoader(`Error: ${error.message}. Retrying soon...`);
        } else {
            // Show error in inline loader
            cryptoListElement.innerHTML = `
                <div class="loading error">
                    <div>Error loading data: ${error.message}</div>
                    <div>Retrying soon...</div>
                </div>
            `;
        }
        
        showNotification('Failed to load cryptocurrency data. Please try again later.', 'error');
        
        // Try again after a delay
        setTimeout(fetchCryptocurrencyData, RATE_LIMIT_INTERVAL);
    }
}

// ========================================
// UI Rendering Functions
// ========================================
/**
 * Display cryptocurrencies in the list
 * @param {Array} coins - Array of cryptocurrency objects to display
 */
function displayCryptocurrencies(coins) {
    // Clear the current list
    cryptoListElement.innerHTML = '';
    
    // Check if there are no coins to display
    if (coins.length === 0) {
        cryptoListElement.innerHTML = '<div class="loading">No cryptocurrencies found</div>';
        return;
    }
    
    // Create elements for each coin
    coins.forEach(coin => {
        // Check if this coin is in the comparison list
        const isSelected = comparisonCoins.some(compCoin => compCoin.id === coin.id);
        
        // Create crypto card element
        const cryptoCard = document.createElement('div');
        cryptoCard.className = `crypto-card${isSelected ? ' selected' : ''}`;
        cryptoCard.dataset.id = coin.id;
        
        // Format the price with appropriate decimal places
        const formattedPrice = formatPrice(coin.current_price);
        
        // Format the 24h change with plus/minus sign and color class
        const changeClass = coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        const changePrefix = coin.price_change_percentage_24h >= 0 ? '+' : '';
        const changeValue = coin.price_change_percentage_24h ? `${changePrefix}${coin.price_change_percentage_24h.toFixed(2)}%` : 'N/A';
        
        // Format market cap and volume with K, M, B suffixes
        const formattedMarketCap = formatLargeNumber(coin.market_cap);
        const formattedVolume = formatLargeNumber(coin.total_volume);
        
        // Create HTML structure for the card
        cryptoCard.innerHTML = `
            <div class="crypto-info">
                <img src="${coin.image}" alt="${coin.name}" class="crypto-icon">
                <div class="crypto-name">
                    <h3>${coin.name}</h3>
                    <span class="crypto-symbol">${coin.symbol}</span>
                </div>
            </div>
            <div class="crypto-data">
                <div class="crypto-price">$${formattedPrice}</div>
                ${show24hChangeElement.checked ? `<div class="crypto-change ${changeClass}">${changeValue}</div>` : ''}
                ${showMarketCapElement.checked ? `<div class="crypto-market-cap">Market Cap: $${formattedMarketCap}</div>` : ''}
                ${showVolumeElement.checked ? `<div class="crypto-volume">Volume: $${formattedVolume}</div>` : ''}
            </div>
        `;
        
        // Add click event to toggle selection for comparison
        cryptoCard.addEventListener('click', function() {
            toggleCryptoSelection(coin);
        });
        
        // Add to the list
        cryptoListElement.appendChild(cryptoCard);
    });
}

/**
 * Toggle cryptocurrency selection for comparison
 * @param {Object} coin - Cryptocurrency object to toggle selection for
 */
function toggleCryptoSelection(coin) {
    // Check if the coin is already in the comparison list
    const coinIndex = comparisonCoins.findIndex(c => c.id === coin.id);
    
    if (coinIndex !== -1) {
        // If already in list, remove from comparison
        comparisonCoins.splice(coinIndex, 1);
        showNotification(`Removed ${coin.name} from comparison`, 'info');
    } else {
        // If not in list, check if we've reached the maximum number of coins for comparison
        if (comparisonCoins.length >= MAX_COMPARISON) {
            showNotification(`You can compare a maximum of ${MAX_COMPARISON} cryptocurrencies at once`, 'error');
            return;
        }
        
        // Add to comparison with minimal required data
        comparisonCoins.push({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            image: coin.image
        });
        
        showNotification(`Added ${coin.name} to comparison`, 'success');
    }
    
    // Update the comparison section UI
    updateComparisonSection();
    
    // Update selection visual in the main list
    const cryptoCards = document.querySelectorAll('.crypto-card');
    cryptoCards.forEach(card => {
        if (card.dataset.id === coin.id) {
            card.classList.toggle('selected');
        }
    });
    
    // Save updated comparison coins to local storage
    saveComparisonCoins();
}

/**
 * Update the comparison section with selected cryptocurrencies
 * This function retrieves current data for each selected coin
 */
function updateComparisonSection() {
    // Clear the current comparison container
    comparisonContainerElement.innerHTML = '';
    
    // Check if there are no coins to compare
    if (comparisonCoins.length === 0) {
        comparisonContainerElement.innerHTML = '<div class="comparison-empty">Select cryptocurrencies to compare</div>';
        return;
    }
    
    // Find the current data for each comparison coin
    comparisonCoins.forEach(compCoin => {
        // Find this coin in the current cryptocurrency data array
        const currentData = cryptocurrencies.find(c => c.id === compCoin.id);
        
        if (!currentData) {
            // If we can't find current data (e.g., on initial load), show basic info
            const comparisonCard = document.createElement('div');
            comparisonCard.className = 'comparison-card';
            comparisonCard.innerHTML = `
                <div class="comparison-info">
                    <img src="${compCoin.image}" alt="${compCoin.name}" class="crypto-icon">
                    <div class="crypto-name">
                        <h3>${compCoin.name}</h3>
                        <span class="crypto-symbol">${compCoin.symbol}</span>
                    </div>
                </div>
                <div class="crypto-data">
                    <div class="crypto-price">Loading...</div>
                </div>
                <button class="remove-btn" data-id="${compCoin.id}"><i class="fas fa-times"></i></button>
            `;
            
            comparisonContainerElement.appendChild(comparisonCard);
            return;
        }
        
        // Format the data for display
        const formattedPrice = formatPrice(currentData.current_price);
        const changeClass = currentData.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        const changePrefix = currentData.price_change_percentage_24h >= 0 ? '+' : '';
        const changeValue = currentData.price_change_percentage_24h ? `${changePrefix}${currentData.price_change_percentage_24h.toFixed(2)}%` : 'N/A';
        const formattedMarketCap = formatLargeNumber(currentData.market_cap);
        const formattedVolume = formatLargeNumber(currentData.total_volume);
        
        // Create comparison card
        const comparisonCard = document.createElement('div');
        comparisonCard.className = 'comparison-card';
        comparisonCard.innerHTML = `
            <div class="comparison-info">
                <img src="${currentData.image}" alt="${currentData.name}" class="crypto-icon">
                <div class="crypto-name">
                    <h3>${currentData.name}</h3>
                    <span class="crypto-symbol">${currentData.symbol}</span>
                </div>
            </div>
            <div class="crypto-data">
                <div class="crypto-price">$${formattedPrice}</div>
                ${show24hChangeElement.checked ? `<div class="crypto-change ${changeClass}">${changeValue}</div>` : ''}
                ${showMarketCapElement.checked ? `<div class="crypto-market-cap">Market Cap: $${formattedMarketCap}</div>` : ''}
                ${showVolumeElement.checked ? `<div class="crypto-volume">Volume: $${formattedVolume}</div>` : ''}
            </div>
            <button class="remove-btn" data-id="${currentData.id}"><i class="fas fa-times"></i></button>
        `;
        
        comparisonContainerElement.appendChild(comparisonCard);
    });
    
    // Add event listeners to remove buttons
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent event bubbling
            const coinId = this.dataset.id;
            removeCoinFromComparison(coinId);
        });
    });
}

/**
 * Remove a coin from the comparison list by ID
 * @param {string} coinId - ID of the coin to remove
 */
function removeCoinFromComparison(coinId) {
    const coinIndex = comparisonCoins.findIndex(c => c.id === coinId);
    
    if (coinIndex !== -1) {
        // Store the removed coin for notification
        const removedCoin = comparisonCoins[coinIndex];
        comparisonCoins.splice(coinIndex, 1);
        
        // Update UI
        updateComparisonSection();
        
        // Update selection in the main list
        const cryptoCards = document.querySelectorAll('.crypto-card');
        cryptoCards.forEach(card => {
            if (card.dataset.id === coinId) {
                card.classList.remove('selected');
            }
        });
        
        // Save to local storage
        saveComparisonCoins();
        
        showNotification(`Removed ${removedCoin.name} from comparison`, 'info');
    }
}

// ========================================
// Search and Sort Functions
// ========================================
/**
 * Handle search functionality to filter cryptocurrencies
 * Filters by name or symbol containing the search term
 */
function handleSearch() {
    const searchTerm = searchInputElement.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        // If search is empty, display all cryptocurrencies
        displayCryptocurrencies(cryptocurrencies);
        return;
    }
    
    // Filter cryptocurrencies by name or symbol
    const filteredCoins = cryptocurrencies.filter(coin => 
        coin.name.toLowerCase().includes(searchTerm) || 
        coin.symbol.toLowerCase().includes(searchTerm)
    );
    
    // Display filtered results
    displayCryptocurrencies(filteredCoins);
    
    // Show notification with search results
    showNotification(`Found ${filteredCoins.length} cryptocurrencies matching "${searchTerm}"`, 'info');
}

/**
 * Handle sorting functionality for cryptocurrencies
 * Sorts by market cap, price, or 24h change (ascending or descending)
 */
function handleSort() {
    const sortOption = sortOptionElement.value;
    let sortedCoins = [...cryptocurrencies]; // Create a copy to avoid modifying original array
    
    // Sort based on selected option
    switch (sortOption) {
        case 'market_cap_desc':
            sortedCoins.sort((a, b) => b.market_cap - a.market_cap);
            break;
        case 'market_cap_asc':
            sortedCoins.sort((a, b) => a.market_cap - b.market_cap);
            break;
        case 'price_desc':
            sortedCoins.sort((a, b) => b.current_price - a.current_price);
            break;
        case 'price_asc':
            sortedCoins.sort((a, b) => a.current_price - b.current_price);
            break;
        case 'change_desc':
            sortedCoins.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
            break;
        case 'change_asc':
            sortedCoins.sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
            break;
        default:
            break;
    }
    
    // Display sorted cryptocurrencies
    displayCryptocurrencies(sortedCoins);
}

// ========================================
// Local Storage Functions
// ========================================
/**
 * Save comparison coins to local storage
 * This allows selections to persist across page refreshes
 */
function saveComparisonCoins() {
    localStorage.setItem('comparisonCoins', JSON.stringify(comparisonCoins));
}

/**
 * Load comparison coins from local storage
 * Retrieves previously selected coins when page loads
 */
function loadComparisonCoins() {
    const savedComparisonCoins = localStorage.getItem('comparisonCoins');
    
    if (savedComparisonCoins) {
        comparisonCoins = JSON.parse(savedComparisonCoins);
    }
}

/**
 * Save user preferences to local storage
 * Stores display preferences for future sessions
 */
function saveUserPreferences() {
    const preferences = {
        show24hChange: show24hChangeElement.checked,
        showMarketCap: showMarketCapElement.checked,
        showVolume: showVolumeElement.checked,
        enableDarkMode: enableDarkModeElement.checked
    };
    
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    // Refresh the display to show/hide elements based on preferences
    displayCryptocurrencies(cryptocurrencies);
    updateComparisonSection();
}

/**
 * Load user preferences from local storage
 * Applies saved preferences when page loads
 */
function loadUserPreferences() {
    const savedPreferences = localStorage.getItem('userPreferences');
    
    if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        
        // Apply saved preferences to checkboxes
        show24hChangeElement.checked = preferences.show24hChange;
        showMarketCapElement.checked = preferences.showMarketCap;
        showVolumeElement.checked = preferences.showVolume;
        enableDarkModeElement.checked = preferences.enableDarkMode;
        
        // Apply dark mode if enabled
        if (preferences.enableDarkMode) {
            applyDarkMode();
        }
    }
}

/**
 * Apply dark mode based on preference
 * Adds or removes the dark-mode class from the body
 */
function applyDarkMode() {
    if (enableDarkModeElement.checked) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// ========================================
// Utility Functions
// ========================================
/**
 * Format price with appropriate decimal places based on value
 * @param {number} price - Price to format
 * @returns {string} Formatted price
 */
function formatPrice(price) {
    if (price === null || price === undefined) return 'N/A';
    
    // For very small prices (less than 0.01), show more decimal places
    if (price < 0.01) {
        return price.toFixed(6);
    } else if (price < 1) {
        return price.toFixed(4);
    } else if (price < 10000) {
        return price.toFixed(2);
    } else {
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

/**
 * Format large numbers with K, M, B suffixes for readability
 * @param {number} num - Number to format
 * @returns {string} Formatted number with suffix
 */
function formatLargeNumber(num) {
    if (num === null || num === undefined) return 'N/A';
    
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B'; // Billions
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M'; // Millions
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K'; // Thousands
    } else {
        return num.toString();
    }
}

// ========================================
// Notification System
// ========================================
/**
 * Show notification message to the user
 * @param {string} message - Message to display
 * @param {string} type - Notification type ('info', 'success', 'error')
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to notification container
    notificationContainerElement.appendChild(notification);
    
    // Add event listener to close button
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', function() {
        closeNotification(notification);
    });
    
    // Auto-close after 5 seconds
    setTimeout(() => {
        closeNotification(notification);
    }, 5000);
}

/**
 * Close notification with animation
 * @param {HTMLElement} notification - Notification element to close
 */
function closeNotification(notification) {
    // Apply slide out animation
    notification.style.animation = 'slideOut 0.3s ease-out forwards';
    
    // Remove element after animation completes
    notification.addEventListener('animationend', function() {
        notification.remove();
    });
} 