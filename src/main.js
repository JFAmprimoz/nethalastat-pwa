import './style.css'
import javascriptLogo from './assets/javascript.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { setupCounter } from './counter.js'
import { escapeHTML, buildTrackerHTML } from './utils/dom-functions.js'
import { loadStateFromStorage, saveStateToStorage } from './utils/storage-functions.js'
import { initModal } from './utils/modal.js'
import { initConditions } from './utils/conditions.js'

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

// --- 5. Conditions & Flyout Logic ---
// Initialize conditions flyout and dropdown selector
const conditionsControls = initConditions(appData, saveState, renderUI, SHEET_SCHEMA.conditionPresets);

// --- 6. Modal Logic ---
// Initialize modal with app state and control functions
const modalControls = initModal(appData, saveState, renderUI);

// Initialize the app on load
renderUI();

// Reveal the tracker board after content is rendered (prevents layout shift)
document.getElementById('board').style.visibility = 'visible';

// If it's a completely fresh boot with no saved data, force the setup modal open immediately
if (isFirstBoot) {
    modalControls.openModal(true);
}

