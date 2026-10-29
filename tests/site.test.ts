import { describe, it, expect } from 'vitest';
import { pageUrl, alternates, autoRedirectTarget, headerModel, footerLinks } from '../src/lib/site';
import { shouldRedirectToEn } from '../src/lib/lang';

describe('pageUrl', () => {
  it.each([
    [{ kind: 'top' }, 'ja', '/'],
    [{ kind: 'top' }, 'en', '/en/'],
    [{ kind: 'app', app: 'no-smoking-bank' }, 'en', '/no-smoking-bank/en/'],
    [{ kind: 'privacy', app: 'no-smoking-bank' }, 'ja', '/no-smoking-bank/privacy-policy/ja/'],
    [{ kind: 'privacy', app: 'picture-this' }, 'en', '/picture-this/privacy-policy/en/'],
    [{ kind: 'privacy', app: 'identify-app' }, 'ja', '/identify-app/privacy-policy/'],
  ] as const)('%o %s → %s', (page, lang, url) => {
    expect(pageUrl(page, lang)).toBe(url);
  });
});

describe('alternates', () => {
  it('identify-app には英語版がない', () => {
    expect(alternates({ kind: 'app', app: 'identify-app' })).toBeNull();
    expect(alternates({ kind: 'privacy', app: 'identify-app' })).toBeNull();
  });
  it('トップは日英の両方を返す', () => {
    expect(alternates({ kind: 'top' })).toEqual({ ja: '/', en: '/en/' });
  });
});

describe('autoRedirectTarget', () => {
  it('言語が URL にない日本語版だけが英語版へ移動する', () => {
    expect(autoRedirectTarget({ kind: 'top' }, 'ja')).toBe('/en/');
    expect(autoRedirectTarget({ kind: 'app', app: 'picture-this' }, 'ja')).toBe('/picture-this/en/');
  });
  it('プライバシーポリシー・英語版・英語版のないページは移動しない', () => {
    expect(autoRedirectTarget({ kind: 'privacy', app: 'no-smoking-bank' }, 'ja')).toBeNull();
    expect(autoRedirectTarget({ kind: 'top' }, 'en')).toBeNull();
    expect(autoRedirectTarget({ kind: 'app', app: 'identify-app' }, 'ja')).toBeNull();
  });
});

describe('headerModel', () => {
  it('トップはサイト名を出す', () => {
    expect(headerModel({ kind: 'top' }, 'en').home).toEqual({ href: '/en/', label: 'SHINESPARK' });
  });
  it('プライバシーポリシーはアプリのアイコンと名前でアプリのページへ戻る', () => {
    expect(headerModel({ kind: 'privacy', app: 'no-smoking-bank' }, 'en').home).toEqual({
      href: '/no-smoking-bank/en/', label: 'NoSmokingBank', icon: '/no-smoking-bank/img/icon.png',
    });
  });
  it('言語リンクは相手の言語の同じページを指す', () => {
    expect(headerModel({ kind: 'privacy', app: 'picture-this' }, 'ja').switchTo).toEqual({
      lang: 'en', href: '/picture-this/privacy-policy/en/', label: 'English',
    });
  });
  it('英語版がなければ言語リンクを出さない', () => {
    expect(headerModel({ kind: 'app', app: 'identify-app' }, 'ja').switchTo).toBeUndefined();
  });
});

describe('footerLinks', () => {
  const labels = (page: Parameters<typeof footerLinks>[0], lang: 'ja' | 'en') =>
    footerLinks(page, lang).map((l) => l.label);

  it('トップは X だけ', () => {
    expect(labels({ kind: 'top' }, 'ja')).toEqual(['X: @shnsprk']);
  });
  it('no-smoking-bank のアプリのページ（英語）', () => {
    expect(labels({ kind: 'app', app: 'no-smoking-bank' }, 'en'))
      .toEqual(['App Store', 'Privacy Policy', 'Support', 'More apps', 'X: @shnsprk']);
  });
  it('picture-this のプライバシーポリシー（日本語）には問い合わせも App Store もない', () => {
    expect(labels({ kind: 'privacy', app: 'picture-this' }, 'ja'))
      .toEqual(['Picture This', 'ほかのアプリ', 'X: @shnsprk']);
  });
  it('英語版のページの「ほかのアプリ」は英語版のトップへ戻る', () => {
    const more = footerLinks({ kind: 'privacy', app: 'picture-this' }, 'en').find((l) => l.label === 'More apps');
    expect(more?.href).toBe('/en/');
  });
  it('identify-app の問い合わせは identify-app 専用のフォーム', () => {
    const contact = footerLinks({ kind: 'app', app: 'identify-app' }, 'ja').find((l) => l.label === 'お問い合わせ');
    expect(contact?.href).toContain('1FAIpQLScOjpxN7rwKPgArAJ1ulaLDwoQ6MJKAzvvT1nytPRdNrWqAMw');
  });
});

describe('shouldRedirectToEn', () => {
  it.each([
    [null, 'en-US', true],
    [null, 'ja-JP', false],
    [null, 'JA', false],
    ['ja', 'en-US', false],
    ['en', 'ja-JP', true],
    ['garbage', 'en-US', true],
  ] as const)('保存 %s・ブラウザ %s → %s', (saved, browser, expected) => {
    expect(shouldRedirectToEn(saved, browser)).toBe(expected);
  });
});
