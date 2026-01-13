/************************************************
 * idb.js – Vanilla JavaScript
 * Implements IndexedDB logic for cost management
 ************************************************/

/**
 * Opens (or creates) the IndexedDB database.
 * Returns a Promise that resolves to an API object
 * with addCost() and getReport() methods.
 */
function openCostsDB(databaseName, databaseVersion) {
    return new Promise(function (resolve, reject) {
        const request = indexedDB.open(databaseName, databaseVersion);

        // Handle DB open error
        request.onerror = function () {
            reject(new Error('Failed to open database'));
        };

        // Create DB schema on first run or version change
        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('costs')) {
                const store = db.createObjectStore('costs', {
                    keyPath: 'id',
                    autoIncrement: true
                });

                store.createIndex('year', 'year', { unique: false });
                store.createIndex('month', 'month', { unique: false });
                store.createIndex('yearMonth', ['year', 'month'], { unique: false });
            }
        };

        // Resolve with API wrapper
        request.onsuccess = function () {
            const db = request.result;

            resolve({
                addCost: function (cost) {
                    return addCost(db, cost);
                },
                getReport: function (year, month, currency) {
                    return getReport(db, year, month, currency);
                }
            });
        };
    });
}

/**
 * Adds a new cost item to the database.
 * Automatically uses the current date.
 */
function addCost(db, cost) {
    return new Promise(function (resolve, reject) {
        // Validate input
        if (
            !cost ||
            typeof cost.sum !== 'number' ||
            typeof cost.currency !== 'string' ||
            typeof cost.category !== 'string' ||
            typeof cost.description !== 'string'
        ) {
            reject(new Error('Invalid cost object'));
            return;
        }

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

        const tx = db.transaction(['costs'], 'readwrite');
        const store = tx.objectStore('costs');
        const request = store.add(costItem);

        request.onerror = function () {
            reject(new Error('Failed to add cost'));
        };

        request.onsuccess = function () {
            // Return only required fields (no id/date)
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
 * Returns a monthly report for given year and month.
 * Total is calculated in the requested currency.
 */
function getReport(db, year, month, currency) {
    return new Promise(function (resolve, reject) {
        const tx = db.transaction(['costs'], 'readonly');
        const store = tx.objectStore('costs');
        const index = store.index('yearMonth');

        const range = IDBKeyRange.only([year, month]);
        const request = index.getAll(range);

        request.onerror = function () {
            reject(new Error('Failed to read report'));
        };

        request.onsuccess = function () {
            const costs = request.result || [];

            let total = 0;

            const reportCosts = costs.map(function (c) {
                if (c.currency === currency) {
                    total += c.sum;
                }
                return {
                    sum: c.sum,
                    currency: c.currency,
                    category: c.category,
                    description: c.description,
                    Date: c.Date
                };
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
    });
}

/**
 * Expose API globally for the tester
 * (This is REQUIRED for Vanilla checking)
 */
window.idb = {
    openCostsDB: openCostsDB
};
