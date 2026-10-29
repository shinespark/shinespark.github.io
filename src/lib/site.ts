export type Lang = 'ja' | 'en';
export type AppId = 'identify-app' | 'no-smoking-bank' | 'picture-this';

export interface App {
  id: AppId;
  name: { ja: string; en?: string };
  hasEnglish: boolean;
  appStore?: string;
  contact?: string;
}

export const apps: Record<AppId, App> = {
  'identify-app': {
    id: 'identify-app',
    name: { ja: '識別のアプリ' },
    hasEnglish: false,
    appStore: 'https://apps.apple.com/jp/app/id1558625294',
    contact: 'https://docs.google.com/forms/d/e/1FAIpQLScOjpxN7rwKPgArAJ1ulaLDwoQ6MJKAzvvT1nytPRdNrWqAMw/viewform',
  },
  'no-smoking-bank': {
    id: 'no-smoking-bank',
    name: { ja: '禁煙積立バンク', en: 'NoSmokingBank' },
    hasEnglish: true,
    appStore: 'https://apps.apple.com/app/id6752426099',
    contact: 'https://docs.google.com/forms/d/1O_JKH8uG6Xcj0YK0Dyldgm1jr2FIXeTnW4S4r6BVZBk/viewform',
  },
  'picture-this': {
    id: 'picture-this',
    name: { ja: 'Picture This', en: 'Picture This' },
    hasEnglish: true,
  },
};

export type PageRef = { kind: 'top' } | { kind: 'app'; app: AppId } | { kind: 'privacy'; app: AppId };

const SITE = 'https://shinespark.github.io';

export function pageUrl(page: PageRef, lang: Lang): string {
  switch (page.kind) {
    case 'top':
      return lang === 'ja' ? '/' : '/en/';
    case 'app':
      return lang === 'ja' ? `/${page.app}/` : `/${page.app}/en/`;
    case 'privacy':
      return apps[page.app].hasEnglish
        ? `/${page.app}/privacy-policy/${lang}/`
        : `/${page.app}/privacy-policy/`;
  }
}

function hasEnglish(page: PageRef): boolean {
  return page.kind === 'top' || apps[page.app].hasEnglish;
}

export function alternates(page: PageRef): { ja: string; en: string } | null {
  if (!hasEnglish(page)) return null;
  return { ja: pageUrl(page, 'ja'), en: pageUrl(page, 'en') };
}

export function absoluteUrl(path: string): string {
  return SITE + path;
}

export function autoRedirectTarget(page: PageRef, lang: Lang): string | null {
  if (lang !== 'ja' || page.kind === 'privacy' || !hasEnglish(page)) return null;
  return pageUrl(page, 'en');
}

function appName(app: App, lang: Lang): string {
  return (lang === 'en' && app.name.en) || app.name.ja;
}

export interface HeaderModel {
  home: { href: string; label: string; icon?: string };
  switchTo?: { lang: Lang; href: string; label: string };
}

export function headerModel(page: PageRef, lang: Lang): HeaderModel {
  const home =
    page.kind === 'top'
      ? { href: pageUrl(page, lang), label: 'SHINESPARK' }
      : {
          href: pageUrl({ kind: 'app', app: page.app }, lang),
          label: appName(apps[page.app], lang),
          icon: `/${page.app}/img/icon.png`,
        };
  const other: Lang = lang === 'ja' ? 'en' : 'ja';
  const switchTo = hasEnglish(page)
    ? { lang: other, href: pageUrl(page, other), label: other === 'ja' ? '日本語' : 'English' }
    : undefined;
  return switchTo ? { home, switchTo } : { home };
}

export interface FooterLink {
  href: string;
  label: string;
}

const footerLabels = {
  ja: { privacy: 'プライバシーポリシー', contact: 'お問い合わせ', more: 'ほかのアプリ' },
  en: { privacy: 'Privacy Policy', contact: 'Support', more: 'More apps' },
} as const;

export function footerLinks(page: PageRef, lang: Lang): FooterLink[] {
  const t = footerLabels[lang];
  const links: FooterLink[] = [];
  if (page.kind !== 'top') {
    const app = apps[page.app];
    if (app.appStore) links.push({ href: app.appStore, label: 'App Store' });
    if (page.kind !== 'app') links.push({ href: pageUrl({ kind: 'app', app: app.id }, lang), label: appName(app, lang) });
    if (page.kind !== 'privacy') links.push({ href: pageUrl({ kind: 'privacy', app: app.id }, lang), label: t.privacy });
    if (app.contact) links.push({ href: app.contact, label: t.contact });
    links.push({ href: pageUrl({ kind: 'top' }, lang), label: t.more });
  }
  links.push({ href: 'https://x.com/shnsprk', label: 'X: @shnsprk' });
  return links;
}
