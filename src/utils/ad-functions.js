import { escapeHTML } from './dom-functions.js';

const AD_ENDPOINT = 'https://nethalastat-ads.crunchcompanion.com/';
const SERVER_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const FALLBACK_ADS = [
    {
        "id": "kn-ratkin-expand",
        "imageUrl": "https://informediteration.com/wp-content/uploads/2026/06/kn-ratkin-expand.png",
        "targetUrl": "https://www.drivethrurpg.com/en/product/538168/the-warren-of-the-ratkin?affiliate_id=5159784",
        "altText": "An ad banner for a game expansion. On the left is a dramatic fantasy painting of a bearded male warrior in brown leather armor and trousers, fending off a swarm of human-sized rat creatures (Ratkin) in a mossy, greenish dungeon setting. He wields two large daggers and has a determined, grim expression. The right side has a dark brown background with green text that reads: \"EXPAND YOUR Ker Nethalas GAME WITH Warren of the Ratkin\". \"Ker Nethalas\" and \"Warren of the Ratkin\" are in a stylized Gothic-style font."
    },
    {
        "id": "kn-ratkin-persist",
        "imageUrl": "https://informediteration.com/wp-content/uploads/2026/06/kn-ratkin-persist-enemies.png",
        "targetUrl": "https://www.drivethrurpg.com/en/product/538168/the-warren-of-the-ratkin?affiliate_id=5159784",
        "altText": "An ad banner for a game expansion, featuring the same artwork on the left as the previous image, showing the warrior fighting the Ratkin. On the dark brown panel to the right, there is green text that reads: \"A PERSISTENT DOMAIN AND NEW ENEMIES FOR Ker Nethalas Warren of the Ratkin\". \"Ker Nethalas\" and \"Warren of the Ratkin\" are in the same stylized Gothic font."
    },
    {
        "id": "kn-masteries-over",
        "imageUrl": "https://informediteration.com/wp-content/uploads/2026/06/kn-masteries-over100.png",
        "targetUrl": "https://www.drivethrurpg.com/en/product/515550/the-book-of-masteries?affiliate_id=5159784",
        "altText": "An ad banner with a split layout. The left half is a gritty, black and white sketch of chaotic combat, featuring skeletal figures and figures of combatants. The right half is a solid black panel with white text that reads: \"Over 100 New Abilities Ker Nethalas The Book of Masteries\". \"Ker Nethalas\" and \"The Book of Masteries\" use a stylized, ornate font."
    },
    {
        "id": "kn-ce-detailed",
        "imageUrl": "https://informediteration.com/wp-content/uploads/2026/06/kn-ce-detailed-solo-arena.png",
        "targetUrl": "https://www.drivethrurpg.com/en/product/489991/carnage-aether-revenants-of-veldonia?affiliate_id=5159784",
        "altText": "An ad banner for a game module. On the left is a fantasy painting of a large colosseum-like arena. A massive, roaring minotaur creature with a bloody cleaver stands on an upper ramp, while a golden-armored knight and a rogue-like character fight green undead figures on a lower level. The right side has a dark greenish-brown panel with yellow text that reads: \"CARNAGE & AETHER Detailed Solo Tactical Arena Combat in the world of Ker Nethalas\". \"CARNAGE & AETHER\" and \"Ker Nethalas\" are in a stylized Gothic-style font."
    },
    {
        "id": "atdw-core-dark",
        "imageUrl": "https://informediteration.com/wp-content/uploads/2026/06/atdw-core-dark.png",
        "targetUrl": "https://www.drivethrurpg.com/en/product/431730/across-a-thousand-dead-worlds?affiliate_id=5159784",
        "altText": "A text-only ad on a dark, nebulous blue background with red spatter effects, suggesting a cosmic or space horror setting. The text is all in a futuristic, stylized font, written in reddish-pink. It reads: \"DARK SURVIVAL SOLO SCI-FI RPG FROM THE CREATOR OF KER NETHALAS ACROSS A THOUSAND DEAD WORLDS.\" The words \"KER NETHALAS\" are in a glitch-type font. The larger text at the bottom is the main title, \"ACROSS A THOUSAND DEAD WORLDS.\""
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
