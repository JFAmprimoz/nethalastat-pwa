/**
 * Saves the current state of application data to localStorage under the given key
 * @param {string} key 
 * @param {object} data 
 */
export function saveStateToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Error saving to localStorage", e);
    }
}

/**
 * Loads and parses state from localStorage, returning a fallback if it doesn't exist
 * @param {string} key 
 * @param {function} fallbackFactory 
 * @returns {object}
 */
export function loadStateFromStorage(key, fallbackFactory) {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error reading from localStorage", e);
    }
    return fallbackFactory();
}
