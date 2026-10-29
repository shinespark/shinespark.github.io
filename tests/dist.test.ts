import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { read, exists } from './helpers';

describe('静的ファイル', () => {
  it.each([
    'app-ads.txt',
    'favicon.png',
    'herdr-streamdeck/icon.png',
    'identify-app/img/icon.png',
    'identify-app/img/ogp.png',
    'no-smoking-bank/img/icon.png',
    'no-smoking-bank/img/ogp.png',
    'no-smoking-bank/img/en-01-home.webp',
    'no-smoking-bank/img/ja-01-home.webp',
    'picture-this/img/icon.png',
  ])('%s が配信される', (p) => {
    expect(exists(p)).toBe(true);
  });
});

describe('トップページ', () => {
  it.each(['index.html', 'en/index.html'])('%s に GA のタグ・header・footer がある', (p) => {
    const html = read(p);
    expect(html).toContain('G-C90LV9QWZD');
    expect(html.match(/<header/g)).toHaveLength(1);
    expect(html.match(/<footer/g)).toHaveLength(1);
  });
  it('日本語版は英語版へ自動で移動する対象', () => {
    expect(read('index.html')).toContain('location.replace("/en/"');
  });
  it('英語版は lang="en" で、自動移動の対象ではない', () => {
    const html = read('en/index.html');
    expect(html).toMatch(/<html[^>]*lang="en"/);
    expect(html).not.toContain('location.replace');
  });
  it('hreflang が日英の絶対 URL を指す', () => {
    const html = read('index.html');
    expect(html).toMatch(/hreflang="ja" href="https:\/\/shinespark\.github\.io\/"/);
    expect(html).toMatch(/hreflang="en" href="https:\/\/shinespark\.github\.io\/en\/"/);
  });
  it('英語版の本文は英語', () => {
    expect(read('en/index.html')).toMatch(/<h1[^>]*>Apps<\/h1>/);
  });
  it('herdr のアイコンを今と同じ URL で参照する', () => {
    expect(read('index.html')).toContain('herdr-streamdeck/icon.png');
  });
});

describe('identify-app', () => {
  const pages = ['identify-app/index.html', 'identify-app/privacy-policy/index.html'];
  it.each(pages)('%s に GA のタグがあり、言語リンク・hreflang・自動移動がない', (p) => {
    const html = read(p);
    expect(html).toContain('G-C90LV9QWZD');
    expect(html).not.toContain('data-lang=');
    expect(html).not.toContain('hreflang=');
    expect(html).not.toContain('location.replace');
  });
  it.each(pages)('%s のフッターにトップへのリンクと identify-app 専用のフォームがある', (p) => {
    const html = read(p);
    expect(html).toMatch(/<footer[\s\S]*href="\/"[\s\S]*<\/footer>/);
    expect(html).toContain('1FAIpQLScOjpxN7rwKPgArAJ1ulaLDwoQ6MJKAzvvT1nytPRdNrWqAMw');
    expect(html).not.toContain('1O_JKH8uG6Xcj0YK0Dyldgm1jr2FIXeTnW4S4r6BVZBk');
  });
  it('OGP 画像を今と同じ値で出す', () => {
    expect(read('identify-app/index.html')).toContain('https://shinespark.github.io/identify-app/img/ogp.png');
  });
  it('フッターに非公式アプリである旨の注記を残す', () => {
    expect(read('identify-app/index.html')).toMatch(/<footer[\s\S]*株式会社スパイク・チュンソフト様とは一切関係がありません[\s\S]*<\/footer>/);
  });
});

describe('no-smoking-bank', () => {
  const pages = [
    'no-smoking-bank/index.html',
    'no-smoking-bank/en/index.html',
    'no-smoking-bank/privacy-policy/ja/index.html',
    'no-smoking-bank/privacy-policy/en/index.html',
  ];
  it.each(pages)('%s に GA のタグ・言語リンク・no-smoking-bank 専用のフォームがある', (p) => {
    const html = read(p);
    expect(html).toContain('G-C90LV9QWZD');
    expect(html).toContain('data-lang=');
    expect(html).toContain('1O_JKH8uG6Xcj0YK0Dyldgm1jr2FIXeTnW4S4r6BVZBk');
  });
  it('日本語のアプリのページだけが自動移動の対象', () => {
    expect(read('no-smoking-bank/index.html')).toContain('location.replace("/no-smoking-bank/en/"');
    expect(read('no-smoking-bank/privacy-policy/ja/index.html')).not.toContain('location.replace');
  });
  it('プライバシーポリシーの hreflang は今と同じ URL', () => {
    const html = read('no-smoking-bank/privacy-policy/en/index.html');
    expect(html).toContain('https://shinespark.github.io/no-smoking-bank/privacy-policy/ja/');
    expect(html).toMatch(/<html[^>]*lang="en"/);
  });
  it('英語版のプライバシーポリシーのフッターから英語版のトップへ戻れる', () => {
    expect(read('no-smoking-bank/privacy-policy/en/index.html')).toMatch(/<footer[\s\S]*href="\/en\/"[\s\S]*<\/footer>/);
  });
  it('英語版のアプリのページは英語のスクリーンショットだけを使う', () => {
    const html = read('no-smoking-bank/en/index.html');
    expect(html).toContain('/no-smoking-bank/img/en-01-home.webp');
    expect(html).not.toContain('ja-01-home.webp');
  });
});

describe('picture-this', () => {
  const pages = [
    'picture-this/index.html',
    'picture-this/en/index.html',
    'picture-this/privacy-policy/ja/index.html',
    'picture-this/privacy-policy/en/index.html',
  ];
  it.each(pages)('%s に GA のタグと言語リンクがあり、問い合わせフォームへのリンクがない', (p) => {
    const html = read(p);
    expect(html).toContain('G-C90LV9QWZD');
    expect(html).toContain('data-lang=');
    expect(html).not.toContain('docs.google.com/forms');
  });
  it('プライバシーポリシーに問い合わせの節がない', () => {
    expect(read('picture-this/privacy-policy/ja/index.html')).not.toMatch(/<h2[^>]*>問い合わせ<\/h2>/);
    expect(read('picture-this/privacy-policy/en/index.html')).not.toMatch(/<h2[^>]*>Contact<\/h2>/);
  });
  it('日本語のアプリのページだけが自動移動の対象', () => {
    expect(read('picture-this/index.html')).toContain('location.replace("/picture-this/en/"');
    expect(read('picture-this/privacy-policy/ja/index.html')).not.toContain('location.replace');
  });
});

describe('サイト全体', () => {
  it('古い言語切り替えのスクリプトを配信しない', () => {
    expect(exists('assets/lang.js')).toBe(false);
  });
});

describe('自動移動とフッターの共通化', () => {
  it('自動移動の判定は <head> の GA のタグより前で行い、クエリとハッシュを引き継ぐ', () => {
    const html = read('picture-this/index.html');
    const redirect = html.indexOf('preferred-lang');
    expect(redirect).toBeGreaterThan(-1);
    expect(redirect).toBeLessThan(html.indexOf('googletagmanager'));
    expect(redirect).toBeLessThan(html.indexOf('</head>'));
    expect(html.slice(redirect, html.indexOf('</script>', redirect))).toContain('location.search');
  });
  it('フッターのリンクの色と余白は共通の CSS で固定する', () => {
    const css = readFileSync('src/styles/base.css', 'utf8');
    expect(css).toMatch(/\.site-footer a \{[^}]*color: var\(--link\)/);
    expect(css).toMatch(/\.site-footer li \{[^}]*margin: 0/);
  });
});
