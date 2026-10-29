import { describe, it, expect } from 'vitest';
import { exists } from './helpers';

describe('配信 URL', () => {
  it.each([
    'app-ads.txt',
    'favicon.png',
    'herdr-streamdeck/icon.png',
    'no-smoking-bank/img/icon.png',
    'index.html',
    'en/index.html',
    'identify-app/index.html',
    'identify-app/privacy-policy/index.html',
    'no-smoking-bank/index.html',
    'no-smoking-bank/en/index.html',
    'no-smoking-bank/privacy-policy/ja/index.html',
    'no-smoking-bank/privacy-policy/en/index.html',
    'picture-this/index.html',
    'picture-this/en/index.html',
    'picture-this/privacy-policy/ja/index.html',
    'picture-this/privacy-policy/en/index.html',
  ])('%s が今と同じ URL で配信される', (p) => {
    expect(exists(p)).toBe(true);
  });
});
