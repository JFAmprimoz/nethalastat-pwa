/**
 * Initialize conditions flyout and dropdown selector logic
 * @param {object} appData - Reference to the application state
 * @param {function} saveState - Function to persist state to storage
 * @param {function} renderUI - Function to re-render the main UI
 * @param {array} conditionPresets - Array of available condition preset strings
 * @returns {object} Object containing conditions control functions
 */
export function initConditions(appData, saveState, renderUI, conditionPresets) {
    const flyout = document.getElementById('conditions-flyout');
    const flyoutToggle = document.getElementById('flyout-toggle');
    const flyoutArrow = document.getElementById('flyout-arrow');
    const conditionSelector = document.getElementById('condition-selector');
    const conditionTrackers = document.getElementById('condition-trackers');

    /**
     * Populate the condition selector dropdown with available presets
     */
    function populateSelectorOptions() {
        conditionSelector.innerHTML = `
            <option value="" disabled selected>Choose a condition</option>
            ${conditionPresets.map(cond => `<option value="${cond}">${cond}</option>`).join('')}
        `;
    }

    /**
     * Toggle the flyout between expanded and collapsed states
     */
    function toggleFlyout() {
        const isCollapsed = flyout.classList.contains('collapsed');
        if (isCollapsed) {
            flyout.classList.remove('collapsed');
            flyout.classList.add('expanded');
            flyoutArrow.textContent = '▼';
        } else {
            flyout.classList.remove('expanded');
            flyout.classList.add('collapsed');
            flyoutArrow.textContent = '▲';
        }
    }

    /**
     * Handle condition selection from dropdown
     */
    function handleConditionSelect(e) {
        const selectedCondition = e.target.value;
        if (!selectedCondition) return;

        // Check if condition is already active
        const existingCondition = appData.conditionStats.find(s => s.id === selectedCondition);
        
        if (existingCondition) {
            // Stack/increment by 1
            existingCondition.current += 1;
        } else {
            // Add new tracker with initial starting value 1
            appData.conditionStats.push({
                id: selectedCondition,
                name: selectedCondition,
                current: 1
            });
        }

        // Return dropdown selection to the default placeholder option
        conditionSelector.selectedIndex = 0;

        // Commit and Redraw immediately
        saveState();
        renderUI();
    }

    // Attach event listeners
    flyoutToggle.addEventListener('click', toggleFlyout);
    conditionSelector.addEventListener('change', handleConditionSelect);

    // Initialize dropdown options on load
    populateSelectorOptions();

    // Return public API
    return {
        populateSelectorOptions,
        toggleFlyout
    };
}
