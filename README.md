# Crypto Tracker

A real-time cryptocurrency tracking application that allows users to view and compare prices of selected cryptocurrencies.

## Overview

This application is a Single Page Application (SPA) built using HTML, CSS, and JavaScript/jQuery. It utilizes the free tier of the CoinGecko API to fetch real-time cryptocurrency data and enables users to select up to 5 cryptocurrencies for side-by-side comparison.

## Features

- **Cryptocurrency Listing**: Displays a list of popular cryptocurrencies, including essential details such as name, symbol, current price, 24-hour change, and market cap.
- **Comparison Section**: Users can add up to 5 cryptocurrencies to compare their real-time prices side-by-side.
- **User Preferences**: Users can customize their experience by:
  - Toggling display of 24-hour price changes
  - Toggling display of market cap
  - Toggling display of 24-hour volume
  - Enabling dark mode
- **Data Persistence**: The application uses local storage to save user preferences and selected comparison cryptocurrencies between sessions.
- **Search Functionality**: Users can search for specific cryptocurrencies by name or symbol.
- **Sorting Options**: Users can sort cryptocurrencies by market cap, price, or 24-hour change (ascending or descending).
- **Responsive Design**: The application is fully responsive and works on all device sizes.

## Technical Implementation

- **HTML**: Single HTML file that serves as the application's entire structure.
- **CSS**: External CSS for styling and responsive layout.
- **JavaScript/jQuery**: Used for fetching data, handling events, and implementing the comparison feature.
- **API Usage**: CoinGecko API within the constraints of the free-tier rate limit (5-15 calls per minute). The application updates the cryptocurrency data every minute.
- **Local Storage**: Persists user preferences and comparison selections across sessions.

## API Rate Limiting

The application respects CoinGecko's free API tier rate limits by:
- Fetching data only once per minute
- Implementing a cooldown period between API calls
- Displaying notifications when respecting rate limits

## How to Use

1. **View Cryptocurrencies**: Browse the list of cryptocurrencies with their current prices and other details.
2. **Search**: Use the search box to find specific cryptocurrencies by name or symbol.
3. **Sort**: Use the dropdown to sort the cryptocurrencies by different criteria.
4. **Compare**: Click on any cryptocurrency card to add it to the comparison section (maximum 5).
5. **Remove from Comparison**: Click the "X" button on any cryptocurrency in the comparison section to remove it.
6. **Adjust Preferences**: Use the checkboxes in the preferences section to customize what information is displayed.

## Running the Application

Simply open the `index.html` file in a web browser to run the application. No server or build process is required.

## Credits

- Data provided by [CoinGecko API](https://www.coingecko.com/en/api)
- Icons from [Font Awesome](https://fontawesome.com/)
- jQuery library 