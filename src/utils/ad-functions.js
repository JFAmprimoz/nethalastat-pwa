import { escapeHTML } from './dom-functions.js';

const AD_ENDPOINT = 'https://nethalastat-ads.crunchcompanion.com/';
const SERVER_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

// 1. INITIALIZATION: Try to load the last successfully fetched ads from localStorage.
// If it's a brand new install, slide the INITIAL_FALLBACK_ADS in as the base.
const localCachedAds = localStorage.getItem('nethalastat_cached_ads');
let activeAdsPool = localCachedAds ? JSON.parse(localCachedAds) : [...FALLBACK_ADS];

// Try to load the last successful fetch time so the 24-hour clock survives app closures
const localFetchTime = localStorage.getItem('nethalastat_last_fetch_time');
let lastFetchTime = localFetchTime ? parseInt(localFetchTime, 10) : 0;

export async function fetchAdsIfStale() {
    if (Date.now() - lastFetchTime > SERVER_REFRESH_INTERVAL) {
        await fetchAdsFromServer();
    }
}

export async function fetchAdsFromServer() {
    try {
        // Cache-Buster defeats aggressive browser disk-cache layers
        const response = await fetch(`${AD_ENDPOINT}?cb=${Date.now()}`);
        if (response.ok) {
            const serverAds = await response.json();
            if (Array.isArray(serverAds) && serverAds.length > 0) {
                activeAdsPool = serverAds;
                lastFetchTime = Date.now();
                
                // 2. PERSISTENCE: Bake the fresh server ads and timestamp into the device memory.
                // These now become your definitive offline fallback ads from this exact second onward.
                localStorage.setItem('nethalastat_cached_ads', JSON.stringify(serverAds));
                localStorage.setItem('nethalastat_last_fetch_time', lastFetchTime.toString());
                
                console.log('Ad inventory synchronized and updated locally.');
            }
        }
    } catch (error) {
        // 3. GRACEFUL DEGRADATION: If offline, we change absolutely nothing!
        // activeAdsPool already contains whatever was loaded out of localStorage at startup.
        console.warn('PWA running offline or edge unreachable. Using rolling local storage fallback.');
    }

}

export async function initializeAdEngine() {
// Fire off a background check immediately on app boot
    await fetchAdsFromServer();
    
    // Render the initial banner graphic
    rotateAd();
    
    // Standard 90-second visual rotation loop
    setInterval(rotateAd, 90000);}

function rotateAd() {
    const adContainer = document.querySelector('.ad-placeholder');
    if (!adContainer || activeAdsPool.length === 0) return;

    // The 24-Hour Gatekeeper Check
    if (Date.now() - lastFetchTime > SERVER_REFRESH_INTERVAL) {
        fetchAdsFromServer(); 
    }

    const lastSeenId = sessionStorage.getItem('nethalastat_last_ad_id');
    let availableChoices = activeAdsPool;
    
    // Anti-Fatigue Filter
    if (activeAdsPool.length > 1) {
        availableChoices = activeAdsPool.filter(ad => ad.id !== lastSeenId);
    }
    
    const chosenAd = availableChoices[Math.floor(Math.random() * availableChoices.length)];
    sessionStorage.setItem('nethalastat_last_ad_id', chosenAd.id);

    adContainer.innerHTML = `
        <a class="ad-link" href="${escapeHTML(chosenAd.targetUrl)}" target="_blank" rel="noopener noreferrer">
            <img src="${escapeHTML(chosenAd.imageUrl)}" alt="${escapeHTML(chosenAd.altText)}" />
        </a>
    `;

    if (window.umami) {
        window.umami.track('ad-impression', { 
            href: chosenAd.targetUrl,
            ad_id: chosenAd.id,
            image_url: chosenAd.imageUrl
        });
    }

    const adLink = adContainer.querySelector('.ad-link');
    adLink?.addEventListener('click', () => {
        // Umami analytics tracking for ad clicks
        if (window.umami) {
            window.umami.track('ad-click', { 
                href: chosenAd.targetUrl,
                ad_id: chosenAd.id,
                image_url: chosenAd.imageUrl
            });
        }
    });
}
