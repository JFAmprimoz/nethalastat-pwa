/**
 * Returns the recommended browser string if the current browser is inappropriate,
 * or null if no banner should be shown.
 */
function getRecommendedBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;

  // Already installed as PWA — no banner needed
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone;
  if (isStandalone) return null;

  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

  if (isIOS) {
    // On iOS, only Safari can install PWAs.
    // Any other browser (Chrome iOS, Facebook, Instagram, Reddit, etc.) should prompt.
    const isSafari =
      /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
    if (!isSafari) return 'Safari';
    return null;
  }

  // Android: allowlist known-good browsers (mirrors iOS approach).
  // Real Chrome omits "Version/X.X" before "Chrome/" — Android WebView always adds it.
  const isAndroid = /Android/.test(ua);
  if (isAndroid) {
    const isRealChrome = /Chrome\//.test(ua) && !/Version\/\d/.test(ua);
    const isSamsungBrowser = /SamsungBrowser\//.test(ua);
    const isFirefox = /Firefox\//.test(ua);
    const isEdge = /EdgA\//.test(ua);
    if (!isRealChrome && !isSamsungBrowser && !isFirefox && !isEdge) return 'Chrome';
  }

  // Some in-app browsers (e.g. Discord) spoof a desktop Linux UA to avoid detection.
  // A non-mobile Chrome UA with touch support is a strong signal of a spoofed in-app browser.
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Windows/.test(ua);
  const isSpoofedMobile = !isMobileUA && /Chrome\//.test(ua) && navigator.maxTouchPoints > 1;
  if (isSpoofedMobile) return 'Chrome';

  // No service worker support at all
  if (!('serviceWorker' in navigator)) return 'Chrome or Safari';

  return null;
}

/**
 * Initialize the browser compatibility banner.
 * Uses localStorage so the dismissal persists across sessions.
 */
export function initBrowserBanner() {
  if (localStorage.getItem('hideBrowserWarning') === 'true') return;

  const recommended = getRecommendedBrowser();
  if (!recommended) return;

  const banner = document.getElementById('browser-banner');
  if (!banner) return;

  banner.innerHTML = `
    <div class="browser-banner-icon">
      <input type="checkbox" disabled class="browser-banner-checkbox">
    </div>
    <div class="browser-banner-body">
      <p class="browser-banner-message">
        For the best experience &mdash; including offline use &mdash;
        open this app in <strong>${recommended}</strong>.
      </p>
      <div class="browser-banner-actions">
        <button class="browser-banner-btn browser-banner-btn-primary" id="browser-banner-open">Open in browser</button>
        <button class="browser-banner-btn browser-banner-btn-dismiss" id="browser-banner-dismiss">Dismiss</button>
      </div>
    </div>
  `;

  banner.style.display = 'flex';

  document.getElementById('browser-banner-open').addEventListener('click', () => {
    window.open(window.location.href, '_blank');
  });

  document.getElementById('browser-banner-dismiss').addEventListener('click', () => {
    banner.style.display = 'none';
    localStorage.setItem('hideBrowserWarning', 'true');
  });

  window.umami?.track('browser-banner-shown', { recommended });
}
