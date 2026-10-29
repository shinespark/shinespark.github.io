export const PREFERRED_LANG_KEY = 'preferred-lang';

export function redirectScript(enUrl: string): string {
  return `(function () {
  if (/bot|crawler|spider|crawling/i.test(navigator.userAgent || '')) return;
  var saved = null;
  try { saved = localStorage.getItem(${JSON.stringify(PREFERRED_LANG_KEY)}); } catch (e) {}
  var toEn = saved === 'en' || (saved !== 'ja' && !(navigator.language || '').toLowerCase().startsWith('ja'));
  if (toEn) location.replace(${JSON.stringify(enUrl)} + location.search + location.hash);
})();`;
}
