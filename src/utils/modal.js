import { escapeHTML } from './dom-functions.js';

/**
 * Initialize modal event listeners and return control functions
 * @param {object} appData - Reference to the application state
 * @param {function} saveState - Function to persist state to storage
 * @param {function} renderUI - Function to re-render the main UI
 * @returns {object} Object containing modal control functions
 */
export function initModal(appData, saveState, renderUI) {
    const modal = document.getElementById('edit-modal');
    const btnEdit = document.getElementById('btn-edit');
    const btnCancel = document.getElementById('modal-cancel');
    const btnContinue = document.getElementById('modal-continue');

    let isFirstBoot = false;

    /**
     * Render modal inputs with current app state
     */
    function renderModal() {
        // Populate Dynamic Maximum Values (Left Stats) using unique IDs for inputs
        const maxContainer = document.getElementById('modal-max-container');
        maxContainer.innerHTML = appData.leftStats.map((stat) => {
            const escapedName = escapeHTML(stat.name);
            return `
                <div class="modal-row">
                    <label class="modal-label">${escapedName} Max:</label>
                    <input type="number" class="modal-input-val" id="edit-left-${stat.id}-max" value="${stat.max}" />
                </div>
            `;
        }).join('');

        // Populate XP
        document.getElementById('edit-xp').value = appData.xp;

        // Populate Dynamic Current Values (Right Stats) using unique IDs for inputs
        const currentContainer = document.getElementById('modal-current-container');
        currentContainer.innerHTML = appData.rightStats.map((stat) => {
            const escapedName = escapeHTML(stat.name);
            if (stat.customizable) {
                return `
                    <div class="modal-row">
                        <input type="text" class="modal-input-name" id="edit-right-${stat.id}-name" value="${escapedName}" />
                        <input type="number" class="modal-input-val" id="edit-right-${stat.id}-val" value="${stat.current}" />
                    </div>
                `;
            } else {
                return `
                    <div class="modal-row">
                        <label class="modal-label">${escapedName}:</label>
                        <input type="number" class="modal-input-val" id="edit-right-${stat.id}-val" value="${stat.current}" />
                    </div>
                `;
            }
        }).join('');
    }

    /**
     * Open the modal, optionally hiding the cancel button for first-time setup
     * @param {boolean} forceFirstLoad - If true, hides the cancel button
     */
    function openModal(forceFirstLoad = false) {
        renderModal();

        if (forceFirstLoad) {
            btnCancel.style.display = 'none';
        } else {
            btnCancel.style.display = 'block';
        }

        modal.classList.remove('hidden');
    }

    /**
     * Close the modal
     */
    function closeModal() {
        modal.classList.add('hidden');
    }

    /**
     * Save modal form data back to appData and persist
     */
    function saveFromModal() {
        // Save XP
        appData.xp = parseInt(document.getElementById('edit-xp').value) || 0;

        // Save Left Stats dynamically using unique IDs
        appData.leftStats.forEach((stat) => {
            const inputElement = document.getElementById(`edit-left-${stat.id}-max`);
            if (inputElement) {
                const parsedVal = parseInt(inputElement.value);
                const oldMax = stat.max;
                stat.max = isNaN(parsedVal) ? 0 : parsedVal;

                // Intuitive initializing logic: If establishing starting stats for the first time
                // or if the stat was previously full, default the current value to equal the new max limit.
                if (stat.current === 0 || stat.current === oldMax) {
                    stat.current = stat.max;
                }
            }
        });

        // Save Right Stats dynamically using unique IDs
        appData.rightStats.forEach((stat) => {
            // Update Name if customizable
            if (stat.customizable) {
                const nameElement = document.getElementById(`edit-right-${stat.id}-name`);
                if (nameElement) stat.name = nameElement.value || `Goal`;
            }

            // Update Value
            const valElement = document.getElementById(`edit-right-${stat.id}-val`);
            if (valElement) {
                const parsedVal = parseInt(valElement.value);
                stat.current = isNaN(parsedVal) ? 0 : parsedVal;
            }
        });

        // Force saves and redraws the UI
        saveState();
        renderUI();
        closeModal();

        // Flag onboarding complete
        isFirstBoot = false;
    }

    // Attach event listeners
    btnEdit.addEventListener('click', () => openModal(false));
    btnCancel.addEventListener('click', closeModal);
    btnContinue.addEventListener('click', saveFromModal);

    // Return public API
    return {
        openModal,
        closeModal,
        setFirstBoot: (value) => { isFirstBoot = value; },
        isFirstBoot: () => isFirstBoot
    };
}
