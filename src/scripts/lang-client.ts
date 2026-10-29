import { PREFERRED_LANG_KEY, shouldRedirectToEn } from '../lib/lang';

function readSaved(): string | null {
  try {
    return localStorage.getItem(PREFERRED_LANG_KEY);
  } catch {
    return null;
  }
}

const enUrl = document.documentElement.dataset.enUrl;
if (enUrl && shouldRedirectToEn(readSaved(), navigator.language || '')) {
  location.replace(enUrl);
}

document.querySelectorAll<HTMLAnchorElement>('a[data-lang]').forEach((a) => {
  a.addEventListener('click', () => {
    try {
      localStorage.setItem(PREFERRED_LANG_KEY, a.dataset.lang ?? '');
    } catch {}
  });
});
