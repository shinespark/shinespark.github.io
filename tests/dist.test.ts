import { describe, it, expect } from 'vitest';
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
    expect(read('index.html')).toContain('data-en-url="/en/"');
  });
  it('英語版は lang="en" で、自動移動の対象ではない', () => {
    const html = read('en/index.html');
    expect(html).toMatch(/<html[^>]*lang="en"/);
    expect(html).not.toContain('data-en-url');
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
