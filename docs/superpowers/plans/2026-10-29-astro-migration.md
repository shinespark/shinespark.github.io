# Astro への移行とヘッダー・フッター共通化 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 素の HTML 9 ページを Astro に移し、ヘッダー・フッター・`<head>` を共通のコンポーネントから生成する。言語は日英の別ページ方式にそろえる。

**Architecture:** ページの種類（トップ・アプリ・プライバシーポリシー）と言語から、URL・ヘッダー・フッター・hreflang・自動移動の要否を純粋関数で決める（`src/lib/`）。`BaseLayout` がそれを使って共通部分を描画し、各ページは本文だけを持つ。各アプリの本文は `lang` を受け取る 1 つのコンポーネントにまとめ、日英のページはその薄い入口にする。

**Tech Stack:** Astro（UI フレームワークなし）、TypeScript、Vitest、GitHub Actions（withastro/action、actions/deploy-pages）

**Spec:** `docs/superpowers/specs/2026-10-29-astro-migration-design.md`

## Global Constraints

- React などの UI フレームワークは入れない。ブラウザの処理は素の TypeScript で書く。
- 既存の URL はすべてそのまま残す：`/`、`/identify-app/`、`/identify-app/privacy-policy/`、`/no-smoking-bank/`、`/no-smoking-bank/privacy-policy/ja/`、`/no-smoking-bank/privacy-policy/en/`、`/picture-this/`、`/picture-this/privacy-policy/ja/`、`/picture-this/privacy-policy/en/`。
- 新しい英語版の URL：`/en/`、`/no-smoking-bank/en/`、`/picture-this/en/`。identify-app の英語版は作らない。
- `app-ads.txt` と画像（`favicon.png`、`herdr-streamdeck/icon.png`、各アプリの `img/`）は今と同じ URL で配信する。
- 全ページに Google アナリティクスのタグ（測定 ID `G-C90LV9QWZD`）を入れる。
- サイトの絶対 URL は `https://shinespark.github.io`。
- 問い合わせフォーム：identify-app は `https://docs.google.com/forms/d/e/1FAIpQLScOjpxN7rwKPgArAJ1ulaLDwoQ6MJKAzvvT1nytPRdNrWqAMw/viewform`、no-smoking-bank は `https://docs.google.com/forms/d/1O_JKH8uG6Xcj0YK0Dyldgm1jr2FIXeTnW4S4r6BVZBk/viewform`、picture-this はなし。
- App Store：identify-app は `https://apps.apple.com/jp/app/id1558625294`、no-smoking-bank は `https://apps.apple.com/app/id6752426099`。
- 言語の保存キーは `preferred-lang`。今の `lang` キーは読まない。
- ページ本文の文言とデザインは変えない。例外は picture-this の問い合わせの削除だけ。
- コメントは原則書かない。
- ドキュメントにツールやライブラリのバージョンを書かない。

## Review Focus

- **英語環境の人が日本語版を選んだあと `/` を開く**：英語版へ戻されない。`shouldRedirectToEn` の単体テスト（Task 2）で保存値 `ja` を優先することを確かめる。
- **ストアに登録した `/privacy-policy/ja/` を英語環境で開く**：移動しない。`autoRedirectTarget` が privacy に対して `null` を返すテスト（Task 2）と、ビルド結果の privacy ページに `data-en-url` がないテスト（Task 5・6）で確かめる。
- **localStorage が使えないブラウザ（プライベートモードなど）**：例外で止まらず、ブラウザの言語だけで判定する。`lang-client.ts` で読み書きを try/catch で包む（Task 3）。単体テストは `shouldRedirectToEn(null, …)` のケースで確かめる。
- **identify-app を英語環境で開く**：移動先がないので移動しない。言語リンクも出ない。Task 4 のビルド結果テストで確かめる。
- **フッターの自分自身へのリンク**：今いるページへのリンクは出さない（トップの「ほかのアプリ」、アプリのページの「アプリ名」、プライバシーポリシーの「プライバシーポリシー」）。`footerLinks` の単体テスト（Task 2）で確かめる。

---

## ファイル構成

```
astro.config.mjs              site・trailingSlash・出力形式
package.json                  scripts: dev / build / test
vitest.config.ts
.gitignore                    node_modules, dist, .astro
.github/workflows/deploy.yml  PR ではビルドとテスト、main への push で公開
public/                       app-ads.txt と画像（既存のパスのまま移す）
src/lib/site.ts               型、アプリの情報、URL、ヘッダー・フッターの中身、自動移動の要否
src/lib/lang.ts               保存キーと自動移動の判定（ブラウザ側からも使う）
src/scripts/lang-client.ts    自動移動と、言語リンクを押したときの保存
src/styles/base.css           色の変数、ヘッダー、フッター
src/layouts/BaseLayout.astro  <head>（GA・OGP・hreflang）、ヘッダー、フッター
src/components/Header.astro
src/components/Footer.astro
src/content/<app>/Body.astro  各ページの本文（lang を受け取る）
src/pages/...                 URL と 1 対 1 の薄い入口
tests/site.test.ts            src/lib の単体テスト
tests/dist.test.ts            ビルド結果（dist/）のテスト
```

## 決めたこと（設計書で実装側に任された部分）

- Astro 標準の i18n ルーティングは使わない。標準は言語を URL の先頭に置く形（`/en/no-smoking-bank/`）で、既存の URL の形と合わないため。ページは `src/pages/` に URL どおりに置く。
- フッターは「今いるページへのリンクは出さない」という 1 つのルールで組み立てる。
- 自動移動の処理は Astro が処理する `<script>`（モジュール）で読み込む。読み込みが本文の表示より少し遅れるため、一瞬日本語版が見えることは許容する。

---

### Task 1: Astro の土台と静的ファイルの移動

**Files:**
- Create: `package.json`、`astro.config.mjs`、`vitest.config.ts`、`.gitignore`、`tests/dist.test.ts`、`src/pages/index.astro`（仮）
- Move: `app-ads.txt`、`favicon.png`、`herdr-streamdeck/icon.png`、`identify-app/img/*`、`no-smoking-bank/img/*`、`picture-this/img/*` を `public/` の同じ相対パスへ `git mv`

**Interfaces:**
- Produces: `npm run build`（`astro build`）、`npm test`（`astro build && vitest run`）。`tests/dist.test.ts` のヘルパー `read(path: string): string`（`dist/` からの相対パスでファイルを読む）と `exists(path: string): boolean`。

- [ ] **Step 1: `npm init -y` のあと、`npm install astro` と `npm install -D vitest` を実行する**

`package.json` の scripts は `dev: astro dev`、`build: astro build`、`test: astro build && vitest run`。`"type": "module"` にする。

- [ ] **Step 2: `astro.config.mjs` を書く**

`site: 'https://shinespark.github.io'`、`trailingSlash: 'always'`、`build: { format: 'directory' }`。

- [ ] **Step 3: 失敗するテストを書く**

```ts
// tests/dist.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(import.meta.dirname, '..', 'dist');
export const read = (p: string) => readFileSync(join(dist, p), 'utf8');
export const exists = (p: string) => existsSync(join(dist, p));

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
```

- [ ] **Step 4: `npm test` で失敗を確かめる**

Expected: `app-ads.txt が配信される` などが FAIL（`dist/` がない、またはファイルがない）。仮の `src/pages/index.astro` がないとビルド自体が失敗するので、中身が `<p>tmp</p>` だけの仮ページを置く。

- [ ] **Step 5: 静的ファイルを `public/` へ `git mv` する**

- [ ] **Step 6: `npm test` で成功を確かめる**

Expected: 全件 PASS。

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "Astro の土台を作り、静的ファイルを public へ移す"
```

---

### Task 2: サイトの構造を決める関数

**Files:**
- Create: `src/lib/site.ts`、`src/lib/lang.ts`
- Test: `tests/site.test.ts`

**Interfaces:**
- Produces（`src/lib/site.ts`）:
  - `type Lang = 'ja' | 'en'`
  - `type AppId = 'identify-app' | 'no-smoking-bank' | 'picture-this'`
  - `interface App { id: AppId; name: { ja: string; en?: string }; hasEnglish: boolean; appStore?: string; contact?: string }`
  - `const apps: Record<AppId, App>`（名前は `識別のアプリ`、`禁煙積立バンク` / `NoSmokingBank`、`Picture This` / `Picture This`。URL は Global Constraints の値）
  - `type PageRef = { kind: 'top' } | { kind: 'app'; app: AppId } | { kind: 'privacy'; app: AppId }`
  - `pageUrl(page: PageRef, lang: Lang): string`（ルートからの絶対パス、末尾 `/` 付き）
  - `alternates(page: PageRef): { ja: string; en: string } | null`（英語版がなければ `null`）
  - `absoluteUrl(path: string): string`
  - `autoRedirectTarget(page: PageRef, lang: Lang): string | null`
  - `interface HeaderModel { home: { href: string; label: string; icon?: string }; switchTo?: { lang: Lang; href: string; label: string } }`
  - `headerModel(page: PageRef, lang: Lang): HeaderModel`
  - `interface FooterLink { href: string; label: string }`
  - `footerLinks(page: PageRef, lang: Lang): FooterLink[]`
- Produces（`src/lib/lang.ts`）:
  - `const PREFERRED_LANG_KEY = 'preferred-lang'`
  - `shouldRedirectToEn(saved: string | null, browserLanguage: string): boolean`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// tests/site.test.ts
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
```

フッターのリンクの順番は App Store → アプリ名 → プライバシーポリシー → お問い合わせ → ほかのアプリ → X。ラベルは日本語が `App Store`・アプリ名・`プライバシーポリシー`・`お問い合わせ`・`ほかのアプリ`・`X: @shnsprk`、英語が `App Store`・アプリ名・`Privacy Policy`・`Support`・`More apps`・`X: @shnsprk`。X の URL は `https://x.com/shnsprk`。

- [ ] **Step 2: `npx vitest run tests/site.test.ts` で失敗を確かめる**

Expected: FAIL（モジュールがない）。

- [ ] **Step 3: `src/lib/site.ts` と `src/lib/lang.ts` を実装する**

`shouldRedirectToEn` は保存値が `ja` か `en` ならそれに従い、それ以外ならブラウザの言語が `ja` で始まらない（大文字小文字は無視）ときに `true`。

- [ ] **Step 4: `npx vitest run tests/site.test.ts` で成功を確かめる**

Expected: 全件 PASS。

- [ ] **Step 5: コミット**

```bash
git add src/lib tests/site.test.ts
git commit -m "ページの種類と言語から URL・ヘッダー・フッターを決める関数を追加する"
```

---

### Task 3: 共通レイアウトとトップページ

**Files:**
- Create: `src/styles/base.css`、`src/layouts/BaseLayout.astro`、`src/components/Header.astro`、`src/components/Footer.astro`、`src/scripts/lang-client.ts`、`src/content/top/Body.astro`、`src/pages/en/index.astro`
- Modify: `src/pages/index.astro`（仮ページを置き換える）
- Delete: `index.html`
- Test: `tests/dist.test.ts`

**Interfaces:**
- Consumes: Task 2 の `PageRef`・`Lang`・`pageUrl`・`alternates`・`absoluteUrl`・`autoRedirectTarget`・`headerModel`・`footerLinks`・`PREFERRED_LANG_KEY`・`shouldRedirectToEn`
- Produces:
  - `BaseLayout` の props：`{ page: PageRef; lang: Lang; title: string; description: string; ogImage?: { url: string; width?: number; height?: number; alt?: string } }`。本文は `<slot />`。
  - `<html>` に `lang`。自動移動の対象ページだけ `data-en-url="<英語版のパス>"` を付ける。
  - ヘッダーの言語リンクは `<a class="lang" data-lang="en" hreflang="en" href="...">`。
  - 英語版があるページには `<link rel="alternate" hreflang="ja|en" href="<絶対 URL>">` を 2 つ。
  - `og:url` は `absoluteUrl(pageUrl(page, lang))`。
  - 各アプリの本文コンポーネントは `src/content/<name>/Body.astro`、props は `{ lang: Lang }`。

- [ ] **Step 1: 失敗するテストを `tests/dist.test.ts` に足す**

```ts
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
    expect(read('en/index.html')).toContain('<h1>Apps</h1>');
  });
  it('herdr のアイコンを今と同じ URL で参照する', () => {
    expect(read('index.html')).toContain('herdr-streamdeck/icon.png');
  });
});
```

`<h1>` の比較は Astro が付ける属性で崩れる場合、`/<h1[^>]*>Apps<\/h1>/` に置き換えてよい。

- [ ] **Step 2: `npm test` で失敗を確かめる**

Expected: トップページの各テストが FAIL。

- [ ] **Step 3: `base.css`・`Header.astro`・`Footer.astro`・`BaseLayout.astro` を実装する**

- `base.css` には今の各ページで共通の部分（`:root` の色の変数とダークモード、`body`、`.wrap`、ヘッダー、フッター）だけを入れる。ヘッダーの見た目は今のアプリのページの `.bar` と、プライバシーポリシーの `.lang`（丸いリンク）を基にする。
- GA のタグは今の `index.html` の 6〜12 行目と同じ内容を `is:inline` で入れる。
- `BaseLayout` で `lang-client.ts` を `<script>` で読み込む。

- [ ] **Step 4: `lang-client.ts` を実装する**

- `document.documentElement.dataset.enUrl` があり、`shouldRedirectToEn(保存値, navigator.language)` が `true` なら `location.replace(enUrl)`。
- `a[data-lang]` のクリックで `localStorage.setItem(PREFERRED_LANG_KEY, リンクの data-lang)`。
- localStorage の読み書きは try/catch で包み、失敗したら保存値 `null` として扱う。

- [ ] **Step 5: トップページを移す**

- 今の `index.html` の `<main>` を `src/content/top/Body.astro` へ移す。`<span class="ja">…</span><span class="en">…</span>` は `lang` に応じてどちらか一方の文言だけを出す形にする。ページ固有の CSS（ヘッダー・フッター以外）は Body の `<style>` へ移す。
- `src/pages/index.astro` と `src/pages/en/index.astro` は `BaseLayout` に `page={{ kind: 'top' }}`・`lang`・title・description を渡し、`<Body lang=… />` を入れるだけにする。英語版の title・description は今の英語の文言から作る。
- アプリ紹介のリンクは英語版のトップでは英語版のアプリのページ（identify-app は英語版がないので `/identify-app/`）へ向ける。
- `index.html` を削除する。

- [ ] **Step 6: `npm test` で成功を確かめる**

Expected: 全件 PASS。

- [ ] **Step 7: 見た目を確かめる**

`npm run dev` で `/` と `/en/` を開き、移す前の `index.html`（`git show HEAD~:index.html` などで取り出す）と見比べて、本文の見た目が変わっていないことを確かめる。ブラウザの言語が英語で localStorage が空のとき `/` が `/en/` へ移動し、ヘッダーの「日本語」を押したあとは移動しないことを確かめる。

- [ ] **Step 8: コミット**

```bash
git add -A
git commit -m "共通レイアウトを作り、トップページを日英の別ページで移す"
```

---

### Task 4: identify-app

**Files:**
- Create: `src/content/identify-app/Body.astro`、`src/content/identify-app/PrivacyBody.astro`、`src/pages/identify-app/index.astro`、`src/pages/identify-app/privacy-policy/index.astro`
- Delete: `identify-app/index.html`、`identify-app/privacy-policy/index.html`
- Test: `tests/dist.test.ts`

**Interfaces:**
- Consumes: Task 3 の `BaseLayout`。ページは `page={{ kind: 'app', app: 'identify-app' }}` と `page={{ kind: 'privacy', app: 'identify-app' }}`、`lang="ja"`。

- [ ] **Step 1: 失敗するテストを足す**

```ts
describe('identify-app', () => {
  const pages = ['identify-app/index.html', 'identify-app/privacy-policy/index.html'];
  it.each(pages)('%s に GA のタグがあり、言語リンク・hreflang・自動移動がない', (p) => {
    const html = read(p);
    expect(html).toContain('G-C90LV9QWZD');
    expect(html).not.toContain('data-lang=');
    expect(html).not.toContain('hreflang=');
    expect(html).not.toContain('data-en-url');
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
});
```

- [ ] **Step 2: `npm test` で失敗を確かめる**

- [ ] **Step 3: 2 ページを移し、古い HTML を削除する**

本文の移し方は Task 3 の Step 5 と同じ。OGP の画像・サイズ・alt は今の値をそのまま `ogImage` に渡す。本文中の画像パス（`./img/…`、`../img/…`）は `/identify-app/img/…` の絶対パスにする。

- [ ] **Step 4: `npm test` で成功を確かめる**

- [ ] **Step 5: `npm run dev` で 2 ページを開き、移す前と本文の見た目が同じことを確かめる**

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "識別のアプリのページを共通レイアウトへ移す"
```

---

### Task 5: no-smoking-bank

**Files:**
- Create: `src/content/no-smoking-bank/Body.astro`、`src/content/no-smoking-bank/PrivacyBody.astro`、`src/pages/no-smoking-bank/index.astro`、`src/pages/no-smoking-bank/en/index.astro`、`src/pages/no-smoking-bank/privacy-policy/ja/index.astro`、`src/pages/no-smoking-bank/privacy-policy/en/index.astro`
- Delete: `no-smoking-bank/index.html`、`no-smoking-bank/privacy-policy/ja/index.html`、`no-smoking-bank/privacy-policy/en/index.html`
- Test: `tests/dist.test.ts`

**Interfaces:**
- Consumes: Task 3 の `BaseLayout`。プライバシーポリシーの本文は日英で文章が違うので、`PrivacyBody` は `lang` で日英の本文を出し分ける。

- [ ] **Step 1: 失敗するテストを足す**

```ts
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
    expect(read('no-smoking-bank/index.html')).toContain('data-en-url="/no-smoking-bank/en/"');
    expect(read('no-smoking-bank/privacy-policy/ja/index.html')).not.toContain('data-en-url');
  });
  it('プライバシーポリシーの hreflang は今と同じ URL', () => {
    const html = read('no-smoking-bank/privacy-policy/en/index.html');
    expect(html).toContain('https://shinespark.github.io/no-smoking-bank/privacy-policy/ja/');
    expect(html).toMatch(/<html[^>]*lang="en"/);
  });
  it('英語版のプライバシーポリシーのフッターから英語版のトップへ戻れる', () => {
    expect(read('no-smoking-bank/privacy-policy/en/index.html')).toMatch(/<footer[\s\S]*href="\/en\/"[\s\S]*<\/footer>/);
  });
  it('英語版のアプリのページは英語のスクリーンショットを使う', () => {
    expect(read('no-smoking-bank/en/index.html')).toContain('/no-smoking-bank/img/en-01-home.webp');
  });
});
```

- [ ] **Step 2: `npm test` で失敗を確かめる**

- [ ] **Step 3: 4 ページを移し、古い HTML を削除する**

本文の移し方は Task 3 の Step 5 と同じ。今のアプリのページが言語で画像を切り替えている箇所は、`lang` に応じた画像だけを出す。

- [ ] **Step 4: `npm test` で成功を確かめる**

- [ ] **Step 5: `npm run dev` で 4 ページを開き、移す前と本文の見た目が同じことを確かめる**

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "禁煙積立バンクのページを日英の別ページで共通レイアウトへ移す"
```

---

### Task 6: picture-this

**Files:**
- Create: `src/content/picture-this/Body.astro`、`src/content/picture-this/PrivacyBody.astro`、`src/pages/picture-this/index.astro`、`src/pages/picture-this/en/index.astro`、`src/pages/picture-this/privacy-policy/ja/index.astro`、`src/pages/picture-this/privacy-policy/en/index.astro`
- Delete: `picture-this/index.html`、`picture-this/privacy-policy/ja/index.html`、`picture-this/privacy-policy/en/index.html`、`assets/lang.js`
- Test: `tests/dist.test.ts`

**Interfaces:**
- Consumes: Task 3 の `BaseLayout`。

- [ ] **Step 1: 失敗するテストを足す**

```ts
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
    expect(read('picture-this/index.html')).toContain('data-en-url="/picture-this/en/"');
    expect(read('picture-this/privacy-policy/ja/index.html')).not.toContain('data-en-url');
  });
});

describe('サイト全体', () => {
  it('古い言語切り替えのスクリプトを配信しない', () => {
    expect(exists('assets/lang.js')).toBe(false);
  });
});
```

- [ ] **Step 2: `npm test` で失敗を確かめる**

- [ ] **Step 3: 4 ページを移し、問い合わせの節を削除し、古い HTML と `assets/lang.js` を削除する**

- [ ] **Step 4: `npm test` で成功を確かめる**

- [ ] **Step 5: `npm run dev` で 4 ページを開き、移す前と本文の見た目が同じことを確かめる（問い合わせの節を除く）**

- [ ] **Step 6: リポジトリ直下に HTML が残っていないことを確かめる**

Run: `git ls-files '*.html'`
Expected: 出力なし。

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "Picture This のページを共通レイアウトへ移し、問い合わせフォームを削除する"
```

---

### Task 7: GitHub Actions のワークフロー

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: ワークフローを書く**

- `pull_request` と `push`（`main`）と `workflow_dispatch` で動く。
- build ジョブ：`actions/checkout` → `actions/setup-node`（`cache: npm`）→ `npm ci` → `npm test` → `actions/upload-pages-artifact`（`path: dist`）。
- deploy ジョブ：`push` で `main` のときだけ。`needs: build`、`permissions: { pages: write, id-token: write }`、`environment: github-pages`、`actions/deploy-pages`。
- `concurrency: { group: pages, cancel-in-progress: false }`。

- [ ] **Step 2: コミット**

```bash
git add .github/workflows/deploy.yml
git commit -m "Astro をビルドして GitHub Pages に公開するワークフローを追加する"
```

- [ ] **Step 3: ブランチを push して PR を作り、build ジョブが成功することを確かめる**

Run: `gh pr checks --watch`
Expected: build が pass。deploy は PR では動かない。

---

### Task 8: 公開元の切り替えとマージ（ユーザーの確認が必要）

この Task の各操作は外部に影響するので、実施前に必ずユーザーに確認する。

- [ ] **Step 1: 今の公開設定を表示してユーザーに確認する**

Run: `gh api repos/shinespark/shinespark.github.io/pages | jq '{build_type, source}'`
Expected: `build_type: "legacy"`、`source.branch: "main"`。この内容と、次の Step で `workflow` に変えることをユーザーに伝え、許可を得る。

- [ ] **Step 2: 公開元を GitHub Actions に切り替える**

Run: `gh api -X PUT repos/shinespark/shinespark.github.io/pages -f build_type=workflow`
その後 `curl -sI https://shinespark.github.io/` が 200 のままであることを確かめる。

- [ ] **Step 3: ユーザーの許可を得て PR を merge commit でマージする**

- [ ] **Step 4: デプロイの完了を待つ**

Run: `gh run watch $(gh run list --workflow deploy.yml --branch main --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected: build と deploy が成功。

- [ ] **Step 5: 公開されたサイトで全 URL を確かめる**

```bash
for p in / /en/ /identify-app/ /identify-app/privacy-policy/ /no-smoking-bank/ /no-smoking-bank/en/ \
  /no-smoking-bank/privacy-policy/ja/ /no-smoking-bank/privacy-policy/en/ /picture-this/ /picture-this/en/ \
  /picture-this/privacy-policy/ja/ /picture-this/privacy-policy/en/ /app-ads.txt /herdr-streamdeck/icon.png; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "https://shinespark.github.io$p")" "$p"
done
```

Expected: すべて `200`。
