// Default server endpoint for fetching exchange rates
// Can be overridden by user in Settings page
const DEFAULT_EXCHANGE_RATE_URL = 'https://cost-manager-frontend-tfco.onrender.com/rates';
const SUPPORTED_CURRENCIES = ['USD', 'ILS', 'GBP', 'EURO'];

// Fetches exchange rates from specified URL with error handling
// Supports multiple response formats and falls back to defaults on failure
export async function fetchExchangeRates(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
        }
        const data = await response.json();
        // Check for direct currency format (USD, GBP, etc. as top-level keys)
        if (data.USD !== undefined && data.GBP !== undefined && 
            data.EURO !== undefined && data.ILS !== undefined) {
            return data;
        }
 
        // Handle alternative API format with nested rates object
        // Converts to expected format with fallback values
        if (data.rates) {
            return {
                USD: 1,
                ILS: data.rates.ILS || 3.4,
                GBP: data.rates.GBP || 0.6,
                EURO: data.rates.EURO || 0.7
            };
        }
        
        throw new Error('Invalid exchange rate format');
    } catch (error) {
        // Return hardcoded fallback rates if fetch fails
        // Ensures app continues working even if server is unavailable
        console.error('Error fetching exchange rates:', error);
        return {
            USD: 1,
            ILS: 3.4,
            GBP: 0.6,
            EURO: 0.7
        };
    }
}

// Converts amount between currencies using exchange rates
// Uses USD as intermediate currency for conversion calculations
export function convertCurrency(amount, fromCurrency, toCurrency, exchangeRates) {
    if (fromCurrency === toCurrency) {
        return amount;
    }
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[toCurrency] || 1;

    // Convert to USD first, then to target currency
    // This ensures accurate conversion regardless of source currency
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;
    
    return Math.round(convertedAmount * 100) / 100;
}

// Retrieves exchange rate URL from localStorage or returns default
// Allows users to customize API endpoint while maintaining fallback
export function getExchangeRateURL() {
    const stored = localStorage.getItem('exchangeRateURL');
    return stored || DEFAULT_EXCHANGE_RATE_URL;
}

// Saves exchange rate URL to localStorage for persistence
// Settings persist across browser sessions
export function setExchangeRateURL(url) {
    localStorage.setItem('exchangeRateURL', url);
}

export { SUPPORTED_CURRENCIES, DEFAULT_EXCHANGE_RATE_URL };

