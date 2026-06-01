import './style.css'
import javascriptLogo from './assets/javascript.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { setupCounter } from './counter.js'

document.querySelector('#device-wrapper').innerHTML = `
  <div class="app-container">
      <!-- Header -->
      <header class="app-header">
          <h1>Nethalastat</h1>
          <button class="btn-edit" id="btn-edit">Edit</button>
      </header>

      <!-- Main Board -->
      <main class="tracker-board" id="board">
          <!-- Left Column: Major Stats & XP Tracker -->
          <div id="left-column" class="column">
              <!-- Wrapper for trackers to dynamically stretch -->
              <div id="left-trackers"></div>
          </div>

          <!-- Right Column: Minor Stats & Dynamic Conditions Bottom-Sheet -->
          <div id="right-column" class="column" style="position: relative;">
              <!-- Wrapper for right trackers to dynamically stretch with bottom buffer -->
              <div id="right-trackers"></div>

              <!-- Dynamic Bottom-Sheet Conditions Flyout -->
              <div class="conditions-flyout collapsed" id="conditions-flyout">
                  <div class="flyout-header" id="flyout-toggle">
                      <span class="flyout-title">Conditions</span>
                      <span class="flyout-arrow" id="flyout-arrow">▲</span>
                  </div>
                  <div class="flyout-content">
                      <div class="flyout-scroll-area">
                          <div id="condition-trackers" style="display:contents;">
                              <!-- Active conditions injected here above dropdown -->
                          </div>
                      </div>
                      <div class="condition-select-container">
                          <select id="condition-selector" class="condition-select">
                              <option value="" disabled selected>Choose a condition</option>
                              <!-- Strings list injected via JS -->
                          </select>
                      </div>
                  </div>
              </div>
          </div>
      </main>
  </div>

  <!-- Ad Placeholder -->
  <div class="ad-placeholder">ADVERTISEMENT</div>

  <!-- Edit Modal Overlay -->
  <div id="edit-modal" class="modal-overlay hidden">
      <div class="modal-content">
          <!-- UPDATED: Title Case headliners -->
          <h2 class="modal-section-title">Maximum Values</h2>
          
          <div id="modal-max-container">
              <!-- Max value inputs generated here -->
          </div>

          <!-- UPDATED: Title Case headliners -->
          <h2 class="modal-section-title">Current Values</h2>
          
          <div class="modal-row">
              <label class="modal-label">XP:</label>
              <input type="number" class="modal-input-val" id="edit-xp" />
          </div>
          
          <div id="modal-current-container">
              <!-- Current value and customizable name inputs generated here -->
          </div>

          <div class="modal-buttons">
              <!-- UPDATED: Title Case buttons -->
              <button id="modal-cancel" class="modal-btn">Cancel</button>
              <button id="modal-continue" class="modal-btn">Continue</button>
          </div>
      </div>
  </div>
`

const STORAGE_KEY = 'nethalastat_save_v5'; // Upgraded storage key to migrate saved database keys to Title Case smoothly

// Definition / Blueprint Schema of the Sheet (No active game values here)
// UPDATED: Standard preset labels converted to clean Title Case & Consolidated dynamic list of presets here
const SHEET_SCHEMA = {
    leftStats: [
        { id: 'health', defaultName: 'Health', hasMax: true },
        { id: 'toughness', defaultName: 'Toughness', hasMax: true },
        { id: 'aether', defaultName: 'Aether', hasMax: true },
        { id: 'sanity', defaultName: 'Sanity', hasMax: true }
    ],
    rightStats: [
        { id: 'goal1', defaultName: 'Marauder', customizable: true },
        { id: 'goal2', defaultName: 'Thrill Seeker', customizable: true },
        { id: 'craft', defaultName: 'Craft Supplies' },
        { id: 'cook', defaultName: 'Cook Supplies' },
        { id: 'rations', defaultName: 'Rations' },
        { id: 'bandages', defaultName: 'Bandages' },
        { id: 'lockpicks', defaultName: 'Lockpicks' }
    ],
    conditionPresets: [
        "Poisoned",
        "Bleeding",
        "Cursed",
        "Blessed",
        "Stunned",
        "Wounded",
        "Fatigued",
        "Weakened",
        "Enraged",
        "Slowed",
        "Frozen",
        "Burning",
        "Blind"
    ]
};

// Helper function to build a clean, empty character sheet from the schema definition
function createNewSheet() {
    return {
        xp: 0,
        leftStats: SHEET_SCHEMA.leftStats.map(stat => ({
            id: stat.id,
            name: stat.defaultName,
            max: 0,
            current: 0
        })),
        rightStats: SHEET_SCHEMA.rightStats.map(stat => {
            const item = {
                id: stat.id,
                name: stat.defaultName,
                current: 0
            };
            if (stat.customizable) {
                item.customizable = true;
            }
            return item;
        }),
        conditionStats: [] // Active condition trackers list
    };
}

// Determine if it's the very first time launching the app
let isFirstBoot = !localStorage.getItem(STORAGE_KEY);

// Load active state from Storage or instantiate a brand new empty schema definition
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || createNewSheet();

// Safe Fallback in case transitioning from older data files safely
appData.conditionStats = appData.conditionStats || [];

// Save helper
function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// --- 2. Security: Contextual Output Encoding (XSS Mitigation) ---
// Converts unsafe characters to safe HTML entities to prevent malicious scripts from parsing
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, (match) => {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
        };
        return escapeMap[match];
    });
}

// --- 3. Rendering Logic ---
const leftTrackers = document.getElementById('left-trackers');
const rightTrackers = document.getElementById('right-trackers');
const conditionTrackers = document.getElementById('condition-trackers');
const conditionSelector = document.getElementById('condition-selector');

// Helper function to build identical DOM structures for tracker types
// UPDATED: Output-encodes the stat.name string to guarantee XSS immunity
function buildTrackerHTML(stat, targetArray, isMajor) {
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

function renderUI() {
    // Render Left Column Trackers (Major Stats)
    let leftHTML = appData.leftStats.map((stat) => 
        buildTrackerHTML(stat, 'leftStats', true)
    ).join('');

    // Append XP Tracker dynamically to the bottom of the Left Column
    leftHTML += `
        <div class="tracker xp-tracker">
            <h2 class="stat-title">XP</h2>
            <span class="xp-current">${appData.xp}</span>
            <div class="xp-controls">
                <button class="btn-plus" data-target="xp" data-amount="10">+10</button>
                <button class="btn-plus" data-target="xp" data-amount="50">+50</button>
                <button class="btn-plus" data-target="xp" data-amount="100">+100</button>
            </div>
        </div>
    `;

    leftTrackers.innerHTML = leftHTML;

    // Render Right Column (XP has been moved left, so we only render Minor Stats here)
    let rightHTML = appData.rightStats.map((stat) => 
        buildTrackerHTML(stat, 'rightStats', false)
    ).join('');

    rightTrackers.innerHTML = rightHTML;

    // Render Condition Trackers inside the bottom sheet
    conditionTrackers.innerHTML = appData.conditionStats.map((stat) =>
        buildTrackerHTML(stat, 'conditionStats', false)
    ).join('');

    // ADDED: Dynamic class toggle based on active conditions existence
    const flyoutElement = document.getElementById('conditions-flyout');
    if (appData.conditionStats.length > 0) {
        flyoutElement.classList.add('has-active-conditions');
    } else {
        flyoutElement.classList.remove('has-active-conditions');
    }
}

// Build Select Options dynamically from list of strings inside unified SHEET_SCHEMA
function populateSelectorOptions() {
    conditionSelector.innerHTML = `
        <option value="" disabled selected>Choose a condition</option>
        ${SHEET_SCHEMA.conditionPresets.map(cond => `<option value="${cond}">${cond}</option>`).join('')}
    `;
}

// --- 4. Event Delegation for Buttons ---
document.getElementById('board').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return; 

    const targetArray = btn.dataset.target; 
    const amount = parseInt(btn.dataset.amount);
    
    if (targetArray === 'xp') {
        appData.xp += amount;
    } else {
        // Find matching tracker dynamically using its unique ID
        const statId = btn.dataset.id;
        
        if (targetArray === 'conditionStats') {
            const statIndex = appData.conditionStats.findIndex(s => s.id === statId);
            if (statIndex !== -1) {
                appData.conditionStats[statIndex].current += amount;
                // RULE: If value is reduced to 0 or less, remove the tracker completely
                if (appData.conditionStats[statIndex].current <= 0) {
                    appData.conditionStats.splice(statIndex, 1);
                }
            }
        } else {
            const stat = appData[targetArray].find(s => s.id === statId);
            if (stat) {
                stat.current += amount;
                // Prevent stats from dropping below 0
                if (stat.current < 0) {
                    stat.current = 0;
                }
                // Prevent stats from exceeding max capacity (if a max limit is set)
                if (stat.max !== undefined && stat.current > stat.max) {
                    stat.current = stat.max;
                }
            }
        }
    }

    // Save and re-render instantly
    saveState();
    renderUI();
});

// --- 5. Bottom-Sheet Flyout Drawer Toggle Logic ---
const flyout = document.getElementById('conditions-flyout');
const flyoutToggle = document.getElementById('flyout-toggle');
const flyoutArrow = document.getElementById('flyout-arrow');

flyoutToggle.addEventListener('click', () => {
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
});

// --- 6. Dropdown Selector Addition Logic ---
conditionSelector.addEventListener('change', (e) => {
    const selectedCondition = e.target.value;
    if (!selectedCondition) return;

    // Check if condition is already active
    const existingCondition = appData.conditionStats.find(s => s.id === selectedCondition);
    
    if (existingCondition) {
        // Stack/increment by 1
        existingCondition.current += 1;
    } else {
        // Add new tracker of minor layout with initial starting value 1
        appData.conditionStats.push({
            id: selectedCondition,
            name: selectedCondition,
            current: 1
        });
    }

    // Return dropdown selection to the default placeholder option ("Choose a condition")
    conditionSelector.selectedIndex = 0;

    // Commit and Redraw immediately
    saveState();
    renderUI();
});

// --- 7. Modal Logic ---
const modal = document.getElementById('edit-modal');
const btnEdit = document.getElementById('btn-edit');
const btnCancel = document.getElementById('modal-cancel');
const btnContinue = document.getElementById('modal-continue');

function renderModal() {
    // Populate Dynamic Maximum Values (Left Stats) using unique IDs for inputs
    // UPDATED: Output-encodes name labels to prevent XSS breakout on drawing
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
    // UPDATED: Output-encodes customizable text inputs to prevent raw HTML attribute breakout
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

// Event listeners for Modal
btnEdit.addEventListener('click', () => openModal(false));
btnCancel.addEventListener('click', () => modal.classList.add('hidden'));
btnContinue.addEventListener('click', saveFromModal);

function openModal(forceFirstLoad = false) {
    // Build the modal inputs with the most up-to-date state
    renderModal();

    // Hide Cancel button if it's the required first-time boot
    if (forceFirstLoad) {
        btnCancel.style.display = 'none';
    } else {
        btnCancel.style.display = 'block';
    }

    modal.classList.remove('hidden');
}

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
            // UPDATED: Title Case placeholder default fallback Name
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
    modal.classList.add('hidden');

    // Flag onboarding complete in-memory
    isFirstBoot = false;
}

// Initialize the app on load
populateSelectorOptions();
renderUI();

// If it's a completely fresh boot with no saved data, force the setup modal open immediately
if (isFirstBoot) {
    openModal(true);
}

