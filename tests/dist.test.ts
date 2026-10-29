import { describe, it, expect } from 'vitest';
import { read, exists } from './helpers';

describe('静的ファイル', () => {
  it.each(['app-ads.txt', 'favicon.png', 'herdr-streamdeck/icon.png', 'no-smoking-bank/img/icon.png'])(
    '%s が今と同じ URL で配信される',
    (p) => {
      expect(exists(p)).toBe(true);
    },
  );
});

describe('全ページ', () => {
  it.each([
    ['index.html', 'ja', '/en/', true],
    ['en/index.html', 'en', null, true],
    ['identify-app/index.html', 'ja', null, false],
    ['identify-app/privacy-policy/index.html', 'ja', null, false],
    ['no-smoking-bank/index.html', 'ja', '/no-smoking-bank/en/', true],
    ['no-smoking-bank/en/index.html', 'en', null, true],
    ['no-smoking-bank/privacy-policy/ja/index.html', 'ja', null, true],
    ['no-smoking-bank/privacy-policy/en/index.html', 'en', null, true],
    ['picture-this/index.html', 'ja', '/picture-this/en/', true],
    ['picture-this/en/index.html', 'en', null, true],
    ['picture-this/privacy-policy/ja/index.html', 'ja', null, true],
    ['picture-this/privacy-policy/en/index.html', 'en', null, true],
  ] as const)('%s: lang=%s・自動移動先 %s・言語リンク %s', (p, lang, redirect, langLink) => {
    const html = read(p);
    expect(html).toContain('G-C90LV9QWZD');
    expect(html).toMatch(new RegExp(`<html[^>]*lang="${lang}"`));
    if (redirect) expect(html).toContain(`location.replace("${redirect}"`);
    else expect(html).not.toContain('location.replace');
    expect(html.includes('data-lang=')).toBe(langLink);
  });

  it('自動移動の判定は <head> の GA のタグより前で行う', () => {
    const html = read('index.html');
    const redirect = html.indexOf('location.replace');
    expect(redirect).toBeGreaterThan(-1);
    expect(redirect).toBeLessThan(html.indexOf('googletagmanager'));
  });

  it('hreflang は日英の絶対 URL を指す', () => {
    const html = read('no-smoking-bank/privacy-policy/en/index.html');
    expect(html).toContain('hreflang="ja" href="https://shinespark.github.io/no-smoking-bank/privacy-policy/ja/"');
    expect(html).toContain('hreflang="en" href="https://shinespark.github.io/no-smoking-bank/privacy-policy/en/"');
  });
});

describe('ページごとの内容', () => {
  it('identify-app のフッターに非公式アプリである旨の注記を残す', () => {
    expect(read('identify-app/index.html')).toMatch(/<footer[\s\S]*株式会社スパイク・チュンソフト様とは一切関係がありません[\s\S]*<\/footer>/);
  });
  it('no-smoking-bank の英語版は英語のスクリーンショットだけを使う', () => {
    const html = read('no-smoking-bank/en/index.html');
    expect(html).toContain('/no-smoking-bank/img/en-01-home.webp');
    expect(html).not.toContain('ja-01-home.webp');
  });
  it.each(['picture-this/index.html', 'picture-this/privacy-policy/ja/index.html', 'picture-this/privacy-policy/en/index.html'])(
    '%s に問い合わせフォームへのリンクも問い合わせの節もない',
    (p) => {
      const html = read(p);
      expect(html).not.toContain('docs.google.com/forms');
      expect(html).not.toMatch(/<h2[^>]*>(問い合わせ|Contact)<\/h2>/);
    },
  );
});
