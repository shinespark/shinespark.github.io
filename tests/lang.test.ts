import { describe, it, expect } from 'vitest';
import { redirectScript } from '../src/lib/lang';

describe('redirectScript', () => {
  function run(opts: { saved?: string | null; language: string; userAgent?: string; storageThrows?: boolean; search?: string; hash?: string }) {
    let replaced: string | null = null;
    const localStorage = {
      getItem: () => {
        if (opts.storageThrows) throw new Error('blocked');
        return opts.saved ?? null;
      },
    };
    const navigator = { language: opts.language, userAgent: opts.userAgent ?? 'Mozilla/5.0' };
    const location = { search: opts.search ?? '', hash: opts.hash ?? '', replace: (u: string) => { replaced = u; } };
    new Function('localStorage', 'navigator', 'location', redirectScript('/en/'))(localStorage, navigator, location);
    return replaced;
  }

  it.each([
    [null, 'en-US', '/en/'],
    [null, 'ja-JP', null],
    ['ja', 'en-US', null],
    ['en', 'ja-JP', '/en/'],
  ] as const)('保存 %s・ブラウザ %s → %s', (saved, language, expected) => {
    expect(run({ saved, language })).toBe(expected);
  });
  it('localStorage が使えなくても例外を出さず、ブラウザの言語で判定する', () => {
    expect(run({ language: 'en-US', storageThrows: true })).toBe('/en/');
  });
  it('クエリとハッシュを引き継ぐ', () => {
    expect(run({ language: 'en-US', search: '?utm_source=x', hash: '#faq' })).toBe('/en/?utm_source=x#faq');
  });
  it('検索エンジンのクローラーは移動させない', () => {
    expect(run({ language: 'en-US', userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' })).toBeNull();
    expect(run({ saved: 'en', language: 'en-US', userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0)' })).toBeNull();
  });
});
