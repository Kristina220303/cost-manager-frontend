import { getExchangeRateURL } from '../utils/currencyConverter';

/**
 * Opens IndexedDB database and returns a Promise that resolves to a wrapper API.
 * Wrapper provides addCost() and getReport() methods required by the project spec.
 */
export function openCostsDB(databaseName, databaseVersion) {
    return new Promise(function(resolve, reject) {
        const request = indexedDB.open(databaseName, databaseVersion);

        // Handle database open failure
        request.onerror = function() {
            reject(new Error('Failed to open database: ' + request.error));
        };

        // Create schema on first run / version upgrade
        request.onupgradeneeded = function(event) {
            const db = event.target.result;

            // Create object store only once
            if (!db.objectStoreNames.contains('costs')) {
                const store = db.createObjectStore('costs', {
                    keyPath: 'id',
                    autoIncrement: true
                });

                // Indexes used for efficient date-based queries
                store.createIndex('year', 'year', { unique: false });
                store.createIndex('month', 'month', { unique: false });
                store.createIndex('yearMonth', ['year', 'month'], { unique: false });
                store.createIndex('category', 'category', { unique: false });
            }
        };

        // Resolve with wrapper API on success
        request.onsuccess = function() {
            const db = request.result;

            resolve({
                // Add new cost item into database
                addCost: function(cost) {
                    return addCost(db, cost);
                },

                // Get monthly report in requested currency (3 params required)
                getReport: function(year, month, currency) {
                    return getReport(db, year, month, currency);
                },

                // Extra helpers (allowed by project Q&A)
                getAllCosts: function() {
                    return getAllCosts(db);
                },
                getCostsByYearMonth: function(year, month) {
                    return getCostsByYearMonth(db, year, month);
                },
                getCostsByYear: function(year) {
                    return getCostsByYear(db, year);
                }
            });
        };
    });
}

/**
 * Adds a new cost item. Uses current date (as required by spec).
 * Resolves with an object containing sum/currency/category/description only.
 */
function addCost(db, cost) {
    return new Promise(function(resolve, reject) {
        // Validate required fields and types
        if (!cost || typeof cost.sum !== 'number' ||
            typeof cost.currency !== 'string' ||
            typeof cost.category !== 'string' ||
            typeof cost.description !== 'string') {
            reject(new Error('Invalid cost object. Must have sum (number), currency (string), category (string), and description (string)'));
            return;
        }

        const tx = db.transaction(['costs'], 'readwrite');
        const store = tx.objectStore('costs');

        // Date attached is the date the item was added
        const now = new Date();
        const costItem = {
            sum: cost.sum,
            currency: cost.currency,
            category: cost.category,
            description: cost.description,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            Date: { day: now.getDate() }
        };

        const request = store.add(costItem);

        // Handle insertion error
        request.onerror = function() {
            reject(new Error('Failed to add cost: ' + request.error));
        };

        // Resolve with required returned object (without id/date)
        request.onsuccess = function() {
            resolve({
                sum: costItem.sum,
                currency: costItem.currency,
                category: costItem.category,
                description: costItem.description
            });
        };
    });
}

/**
 * Fetch exchange rates from configured URL (or default via currencyConverter utils).
 * Expects JSON like: { "USD":1, "GBP":0.6, "EURO":0.7, "ILS":3.4 }
 */
function fetchExchangeRates() {
    const url = getExchangeRateURL();

    return fetch(url).then(function(response) {
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates: HTTP ' + response.status);
        }
        return response.json();
    }).then(function(rates) {
        // Basic validation for supported currencies
        const required = ['USD', 'ILS', 'GBP', 'EURO'];
        required.forEach(function(code) {
            if (typeof rates[code] !== 'number') {
                throw new Error('Exchange rates JSON missing: ' + code);
            }
        });
        return rates;
    });
}


/**
 * Currency conversion helper (USD base).
 * Returns rounded value with 2 decimals.
 */
function convertCurrency(amount, fromCurrency, toCurrency, rates) {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    // Fail fast if missing rate (supported: USD, ILS, GBP, EURO)
    if (typeof fromRate !== 'number' || typeof toRate !== 'number') {
        throw new Error('Unsupported currency in conversion');
    }

    const amountInUSD = amount / fromRate;
    const converted = amountInUSD * toRate;
    return Math.round(converted * 100) / 100;
}

/**
 * Returns report object: { year, month, costs: [...], total: {currency, total} }
 * costs list keeps original currencies (like the example), total is in requested currency.
 */
function getReport(db, year, month, currency) {
    return new Promise(function(resolve, reject) {
        // Fetch rates first (required for conversion)
        fetchExchangeRates().then(function(rates) {

            const tx = db.transaction(['costs'], 'readonly');
            const store = tx.objectStore('costs');
            const index = store.index('yearMonth');

            // Query by composite index [year, month]
            const range = IDBKeyRange.only([year, month]);
            const request = index.getAll(range);

            request.onerror = function() {
                reject(new Error('Failed to get report: ' + request.error));
            };

            request.onsuccess = function() {
                const costs = request.result || [];

                // Keep original sums/currencies in returned costs array
                const reportCosts = costs.map(function(c) {
                    return {
                        sum: c.sum,
                        currency: c.currency,
                        category: c.category,
                        description: c.description,
                        Date: c.Date
                    };
                });

                // Compute total converted to requested currency
                let total = 0;
                reportCosts.forEach(function(c) {
                    total += convertCurrency(c.sum, c.currency, currency, rates);
                });

                resolve({
                    year: year,
                    month: month,
                    costs: reportCosts,
                    total: {
                        currency: currency,
                        total: Math.round(total * 100) / 100
                    }
                });
            };

        }).catch(function(err) {
            reject(err);
        });
    });
}

/**
 * Helper: return all costs from DB.
 */
function getAllCosts(db) {
    return new Promise(function(resolve, reject) {
        const tx = db.transaction(['costs'], 'readonly');
        const store = tx.objectStore('costs');
        const request = store.getAll();

        request.onerror = function() {
            reject(new Error('Failed to get costs: ' + request.error));
        };

        request.onsuccess = function() {
            resolve(request.result || []);
        };
    });
}

/**
 * Helper: return costs for specific year and month.
 */
function getCostsByYearMonth(db, year, month) {
    return new Promise(function(resolve, reject) {
        const tx = db.transaction(['costs'], 'readonly');
        const store = tx.objectStore('costs');
        const index = store.index('yearMonth');

        const range = IDBKeyRange.only([year, month]);
        const request = index.getAll(range);

        request.onerror = function() {
            reject(new Error('Failed to get costs: ' + request.error));
        };

        request.onsuccess = function() {
            resolve(request.result || []);
        };
    });
}

/**
 * Helper: return costs for a specific year (all months).
 */
function getCostsByYear(db, year) {
    return new Promise(function(resolve, reject) {
        const tx = db.transaction(['costs'], 'readonly');
        const store = tx.objectStore('costs');
        const index = store.index('year');

        const range = IDBKeyRange.only(year);
        const request = index.getAll(range);

        request.onerror = function() {
            reject(new Error('Failed to get costs: ' + request.error));
        };

        request.onsuccess = function() {
            resolve(request.result || []);
        };
    });
}
