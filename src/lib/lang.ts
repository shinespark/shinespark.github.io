export const PREFERRED_LANG_KEY = 'preferred-lang';

export function shouldRedirectToEn(saved: string | null, browserLanguage: string): boolean {
  if (saved === 'ja') return false;
  if (saved === 'en') return true;
  return !browserLanguage.toLowerCase().startsWith('ja');
}
