/**
 * Converts unsafe characters to safe HTML entities to prevent malicious scripts from parsing
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, (match) => {
        const escapeMap = {
            '&': '&' + 'amp;',
            '<': '&' + 'lt;',
            '>': '&' + 'gt;',
            '"': '&' + 'quot;',
            "'": '&' + '#x27;'
        };
        return escapeMap[match];
    });
}

/**
 * Helper function to build identical DOM structures for tracker types
 * @param {object} stat 
 * @param {string} targetArray 
 * @param {boolean} isMajor 
 * @returns {string}
 */
export function buildTrackerHTML(stat, targetArray, isMajor) {
    const escapedName = escapeHTML(stat.name);
    return `
        <div class="tracker ${isMajor ? 'tracker--major' : 'tracker--minor'}">
            <h2 class="stat-title">${escapedName}</h2>
            <div class="tracker-controls">
                <button class="btn-minus btn-stat" data-target="${targetArray}" data-id="${stat.id}" data-amount="-1">-</button>
                <div class="tracker-values">
                    ${stat.max !== undefined ? `<span class="max-value">Max: ${stat.max}</span>` : ''}
                    <span class="current-value">${stat.current}</span>
                </div>
                <button class="btn-plus btn-stat" data-target="${targetArray}" data-id="${stat.id}" data-amount="1">+</button>
            </div>
        </div>
    `;
}
