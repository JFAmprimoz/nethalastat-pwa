export function getInAppBrowserName() {
  const ua = navigator.userAgent;
  if (/Reddit/.test(ua))                      return 'Reddit';
  if (/Discord/.test(ua))                     return 'Discord';
  if (/FBAN|FBAV|FB_IAB/.test(ua))            return 'Facebook';
  if (/Instagram/.test(ua))                   return 'Instagram';
  if (/Twitter/.test(ua))                     return 'Twitter';
  if (/Line\//.test(ua))                      return 'Line';
  return null;
}

export function isInAppBrowser() {
  return getInAppBrowserName() !== null;
}

/**
 * Initialize browser banner to warn users in in-app browsers
 * Shows appropriate message and provides "Open in browser" and "Dismiss" options
 */
export function initBrowserBanner() {
  // Check if already dismissed in this session
  if (sessionStorage.getItem('browserBannerDismissed') === 'true') {
    return;
  }

  const inAppBrowserName = getInAppBrowserName();
  if (!inAppBrowserName) {
    // Not in an in-app browser, don't show banner
    return;
  }

  const banner = document.getElementById('browser-banner');
  if (!banner) {
    console.warn('browser-banner element not found in DOM');
    return;
  }

  // Determine which message to show
  let messageHTML = '';
  if (inAppBrowserName === 'Reddit' || inAppBrowserName === 'Discord') {
    messageHTML = `You're viewing this in <strong>${inAppBrowserName}'s browser</strong>. For the full experience, open Nethalastat in Chrome or Safari.`;
  } else {
    messageHTML = 'For the best experience — including offline use — open this app in <strong>Chrome or Safari</strong>.';
  }

  // Build banner HTML
  banner.innerHTML = `
    <div class="browser-banner-content">
      <div class="browser-banner-icon">
        <input type="checkbox" disabled class="browser-banner-checkbox">
      </div>
      <div class="browser-banner-message">
        ${messageHTML}
      </div>
      <div class="browser-banner-actions">
        <button class="browser-banner-btn browser-banner-btn-primary" id="browser-banner-open">Open in browser</button>
        <button class="browser-banner-btn browser-banner-btn-dismiss" id="browser-banner-dismiss">Dismiss</button>
      </div>
    </div>
  `;

  // Make banner visible
  banner.style.display = 'flex';

  // Open in browser button handler
  document.getElementById('browser-banner-open').addEventListener('click', () => {
    window.open(window.location.href, '_blank');
  });

  // Dismiss button handler
  document.getElementById('browser-banner-dismiss').addEventListener('click', () => {
    banner.style.display = 'none';
    sessionStorage.setItem('browserBannerDismissed', 'true');
  });

  // Track with analytics if available
  window.umami?.track('browser-banner-shown', { browser: inAppBrowserName });
}
