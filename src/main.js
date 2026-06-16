import './style.css'
import { registerSW } from 'virtual:pwa-register';
import { escapeHTML, buildTrackerHTML } from './utils/dom-functions.js'
import { loadStateFromStorage, saveStateToStorage } from './utils/storage-functions.js'
import { initModal } from './utils/modal.js'
import { initConditions } from './utils/conditions.js'
import { initLegal } from './utils/legal.js'
import { initBackupModal } from './utils/backup-modal.js'
import { initializeAdEngine, fetchAdsFromServer, fetchAdsIfStale } from './utils/ad-functions.js'

const updateSW = registerSW({
  onNeedRefresh() {
    const banner = document.getElementById('update-banner');
    const refreshBtn = document.getElementById('update-refresh-btn');
    if (banner && refreshBtn) {
      banner.style.display = 'flex';
      refreshBtn.addEventListener('click', () => updateSW(true));
    }
  },
  onOfflineReady() {
    console.log('Nethalastat is ready to run offline!');
  }
});

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
        "Bleeding",
        "Blinded",
        "Burning",
        "Charmed",
        "Cursed",
        "Dazed",
        "Entangled",
        "Frightened",
        "Freezing",
        "Paralyzed",
        "Poisoned",
        "Prone",
        "Sleeping",
        "Stunned",
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
let isSaveEmpty = !localStorage.getItem(STORAGE_KEY);

// Load active state from Storage or instantiate a brand new empty schema definition
let appData = loadStateFromStorage(STORAGE_KEY, createNewSheet);

// Safe Fallback in case transitioning from older data files safely
appData.conditionStats = appData.conditionStats || [];

// Save helper
function saveState() {
    saveStateToStorage(STORAGE_KEY, appData);
}

// --- 3. Rendering Logic ---
const leftTrackers = document.getElementById('left-trackers');
const rightTrackers = document.getElementById('right-trackers');
const conditionTrackers = document.getElementById('condition-trackers');
const conditionSelector = document.getElementById('condition-selector');

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


// --- 4. Event Delegations ---
// --- 4a. Click-tap delegation for buttons ---
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

// --- 4b. Long-press delegation for values ---
let longPressTimer = null;
let longPressStartX = 0;
let longPressStartY = 0;
const LONG_PRESS_DURATION = 400; // Reduced to fire before Android OS context menu at ~500ms
const LONG_PRESS_MOVE_THRESHOLD = 10; // pixels

document.getElementById('board').addEventListener('pointerdown', (e) => {
    const valueEl = e.target.closest('.current-value, .xp-current');
    if (!valueEl) return;

    longPressStartX = e.clientX;
    longPressStartY = e.clientY;

    longPressTimer = setTimeout(() => {
        modalControls.openModal(false);

        // Determine which input to focus
        requestAnimationFrame(() => {
            let inputId;
            if (valueEl.classList.contains('xp-current')) {
                inputId = 'edit-xp';
            } else {
                const tracker = valueEl.closest('.tracker');
                const btn = tracker?.querySelector('[data-id]');
                const statId = btn?.dataset.id;
                const targetArray = btn?.dataset.target;

                if (statId && targetArray === 'leftStats') {
                    inputId = `edit-left-${statId}-max`;
                } else if (statId) {
                    inputId = `edit-right-${statId}-val`;
                }
            }
            if (inputId) {
                document.getElementById(inputId)?.focus();
            }
        });
    }, LONG_PRESS_DURATION);
});

document.getElementById('board').addEventListener('pointerup', () => {
    clearTimeout(longPressTimer);
});

document.getElementById('board').addEventListener('pointercancel', () => {
    clearTimeout(longPressTimer);
});

document.getElementById('board').addEventListener('pointermove', (e) => {
    // Only cancel long press if pointer has moved more than threshold
    const dx = e.clientX - longPressStartX;
    const dy = e.clientY - longPressStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > LONG_PRESS_MOVE_THRESHOLD) {
        clearTimeout(longPressTimer);
    }
});

// --- 5. Conditions & Flyout Logic ---
// Initialize conditions flyout and dropdown selector
const conditionsControls = initConditions(appData, saveState, renderUI, SHEET_SCHEMA.conditionPresets);

// --- 6. Modal Logic ---
// Initialize modal with app state and control functions
const modalControls = initModal(appData, saveState, renderUI);

// --- 7. Legal Modal Logic ---
// Initialize legal popup
const aboutControls = initLegal();

// --- 8. Backup Modal Logic ---
// Initialize backup modal
const backupControls = initBackupModal(STORAGE_KEY);

// Check if user has accepted the About modal
const hasAcceptedAbout = localStorage.getItem('aboutAccepted') === 'true';

// Initialize the app on load
renderUI();

// Set wrapper height from window.innerHeight to work around Android PWA viewport unit bug
// location.reload() in PWA WebView doesn't reset dvh/vh calculations
const wrapper = document.getElementById('device-wrapper');
const body = document.body;

function setCorrectHeights() {
    const correctHeight = window.innerHeight + 'px';
    wrapper.style.height = correctHeight;
    body.style.height = correctHeight;
    wrapper.getBoundingClientRect(); // Force reflow so container query units recompute
}

setCorrectHeights();
wrapper.style.visibility = 'visible';

// Update on resize
window.addEventListener('resize', setCorrectHeights);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        fetchAdsIfStale(); // Re-render to ensure data is up-to-date when returning to the app
        // Check for SW updates when app is foregrounded using native API
        navigator.serviceWorker.getRegistration().then(reg => {
            reg?.update();
        });
    }
});

// If user hasn't accepted About modal, show it first
if (!hasAcceptedAbout) {
    aboutControls.openAbout();
    window.umami?.track('first-load')
    document.getElementById('about-accept')
    .addEventListener('click', () => modalControls.openModal(true));
} else if (isSaveEmpty) {
    modalControls.openModal(true);
}

initializeAdEngine();