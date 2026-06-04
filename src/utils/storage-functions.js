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

/**
 * Retrieves the raw JSON string from localStorage
 * @param {string} key 
 * @returns {string|null}
 */
export function getRawSave(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error("Error retrieving raw save from localStorage", e);
        return null;
    }
}

/**
 * Downloads the save data as a JSON file
 * @param {string} key 
 * @param {string} filename 
 */
export function downloadSave(key, filename = 'nethalastat_backup.json') {
    try {
        const rawSave = getRawSave(key);
        if (!rawSave) {
            console.error("No save data found to download");
            return false;
        }
        
        const blob = new Blob([rawSave], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } catch (e) {
        console.error("Error downloading save", e);
        return false;
    }
}

/**
 * Copies the save data to the clipboard
 * @param {string} key 
 * @returns {Promise<boolean>}
 */
export async function copySaveToClipboard(key) {
    try {
        const rawSave = getRawSave(key);
        if (!rawSave) {
            console.error("No save data found to copy");
            return false;
        }
        
        await navigator.clipboard.writeText(rawSave);
        return true;
    } catch (e) {
        console.error("Error copying save to clipboard", e);
        return false;
    }
}

/**
 * Loads save data from a text string (pasted or from file)
 * @param {string} key 
 * @param {string} text 
 * @returns {boolean}
 */
export function loadSaveFromText(key, text) {
    try {
        if (!text || text.trim() === '') {
            console.error("No text provided to restore");
            return false;
        }
        
        // Try to parse as JSON to validate it
        const parsed = JSON.parse(text);
        
        // Save the raw text to localStorage
        localStorage.setItem(key, text);
        return true;
    } catch (e) {
        console.error("Error loading save from text", e);
        return false;
    }
}

/**
 * Loads save data from a File object
 * @param {string} key 
 * @param {File} file 
 * @returns {Promise<boolean>}
 */
export function loadSaveFromFile(key, file) {
    return new Promise((resolve) => {
        try {
            if (!file) {
                console.error("No file provided");
                resolve(false);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target.result;
                    const success = loadSaveFromText(key, text);
                    resolve(success);
                } catch (e) {
                    console.error("Error reading file", e);
                    resolve(false);
                }
            };
            reader.onerror = () => {
                console.error("FileReader error");
                resolve(false);
            };
            reader.readAsText(file);
        } catch (e) {
            console.error("Error loading save from file", e);
            resolve(false);
        }
    });
}
