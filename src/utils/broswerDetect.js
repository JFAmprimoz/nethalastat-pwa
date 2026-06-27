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
