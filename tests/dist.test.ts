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
