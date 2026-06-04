import { escapeHTML } from './dom-functions.js';

const AD_ENDPOINT = 'https://nethalastat-ads.crunchcompanion.com/';


const FALLBACK_ADS = [
    {
        "id": "promo_hex_01",
        "imageUrl": "https://informediteration.com/wp-content/uploads/2026/06/draw-over.png",
        "targetUrl": "https://heyii.kckb.me/9286f82d",
        "altText": "A hand uses a dry-erase marker to draw a tactical route on a Translucent Hex Grid Overlay Mat over a BattleTech wargaming map. Text on a black background reads: 'Translucent Hex Grid Overlay Mat — Draw or write over your map.'"
    },
    {
        "id": "promo_hex_02",
        "imageUrl": "https://informediteration.com/wp-content/uploads/2026/06/lays-flat.png",
        "targetUrl": "https://heyii.kckb.me/9286f82d",
        "altText": "A partially rolled-up translucent hex grid mat on a dark wood table with a circular inset showing the grippy 'Non-slip Bottom'. Text on a black background reads: 'Translucent Hex Grid Overlay Mat — Fold/roll it up tight, still lays flat, no curl.'"
    },
    {
        "id": "promo_hex_03",
        "imageUrl": "https://informediteration.com/wp-content/uploads/2026/06/lays-flat.png",
        "targetUrl": "https://heyii.kckb.me/9286f82d",
        "altText": "A comparison of different marker brands (HEYii, EXPO, PILOT, STAEDTLER, ZEBRA) drawn on a translucent hex grid. Text on a black background reads: 'Translucent Hex Grid Overlay Mat — Won’t smudge but erases cleanly.'"
    }
];

export function initializeAdEngine() {
    try {
        // Query string timestamp bypasses browser disk-cache checks entirely
        const response = await fetch(`${AD_ENDPOINT}?cb=${Date.now()}`);
        if (response.ok) {
            const serverAds = await response.json();
            if (Array.isArray(serverAds) && serverAds.length > 0) {
                // Populate server inventory cleanly
                activeAdsPool = serverAds;
            }
        }
    } catch (error) {
        console.warn('PWA executing offline or ad network unreachable. Activating local fallback campaign pool.');
    }
    
    // Draw initial banner immediately on launch
    rotateAd();
    
    // Initialize standard 60-second interval rotation loop (60,000 milliseconds)
    setInterval(rotateAd, 60000);
}

function rotateAd() {
    const adContainer = document.querySelector('.ad-placeholder');
    if (!adContainer || activeAdsPool.length === 0) return;

    // Pull tracking identifier out of transient session storage
    const lastSeenId = sessionStorage.getItem('nethalastat_last_ad_id');
    let availableChoices = activeAdsPool;
    
    // Prevent back-to-back duplication sequence if pool size allows it
    if (activeAdsPool.length > 1) {
        availableChoices = activeAdsPool.filter(ad => ad.id !== lastSeenId);
    }
    
    // Choose random payload index element
    const chosenAd = availableChoices[Math.floor(Math.random() * availableChoices.length)];
    
    // Lock choice identifier in memory to flag it for the next validation pass
    sessionStorage.setItem('nethalastat_last_ad_id', chosenAd.id);

    // Render interactive DOM update securely using your existing contextual output escaping pipeline
    adContainer.innerHTML = `
        <a href="${escapeHTML(chosenAd.targetUrl)}" target="_blank" rel="noopener noreferrer">
            <img src="${escapeHTML(chosenAd.imageUrl)}" alt="${escapeHTML(chosenAd.altText)}" />
        </a>
    `;
}