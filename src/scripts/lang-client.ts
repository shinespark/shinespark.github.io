import { PREFERRED_LANG_KEY } from '../lib/lang';

document.querySelectorAll<HTMLAnchorElement>('a[data-lang]').forEach((a) => {
  a.addEventListener('click', () => {
    try {
      localStorage.setItem(PREFERRED_LANG_KEY, a.dataset.lang ?? '');
    } catch {}
  });
});
