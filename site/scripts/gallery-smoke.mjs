import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const require = createRequire(join(resolve(process.env.PLAYWRIGHT_DIR ?? '.'), 'package.json'));
const { chromium } = require('playwright');
const galleryUrl = process.env.GALLERY_URL ?? 'http://127.0.0.1:4173/awesome-image-2-6-gif/';
const screenshots = resolve(process.env.GALLERY_SCREENSHOTS ?? 'gallery-screenshots');
const viewports = [
  { name: 'desktop', width: 1440, height: 960 },
  { name: 'mobile', width: 390, height: 844 },
];

async function assertNoHorizontalOverflow(page, name) {
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(width <= page.viewportSize().width + 1, `${name} overflows at ${width}px`);
}

async function verifyGallery(browser, { name, width, height }) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: 'zh-CN',
    reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  const pageErrors = [];
  const legacyApiRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/\/api\/(?:auth|billing|generation|admin|apimart|me|favorites)(?:\/|\?|$)/.test(request.url())) {
      legacyApiRequests.push(request.url());
    }
  });

  try {
    const response = await page.goto(galleryUrl, { waitUntil: 'domcontentloaded' });
    assert.ok(response?.ok(), `${name} gallery returned ${response?.status()}`);
    const hero = page.locator('main .hero');
    const gallery = page.locator('#gallery');
    const cards = gallery.locator('.caseCard');
    const caseSearch = gallery.locator('#case-search');
    await hero.getByRole('heading', { level: 1 }).waitFor();
    const chineseFonts = await page.evaluate(async () => {
      const faces = await document.fonts.load('700 24px "Noto Sans SC Variable"', '把一张图变成动图');
      await document.fonts.ready;
      return faces.length;
    });
    assert.ok(chineseFonts > 0, `${name} did not load the Chinese font`);
    await cards.first().waitFor();
    const initialCards = await cards.count();
    assert.ok(initialCards >= 6, `${name} shows only ${initialCards} gallery cards`);
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.hero img')).some(
      (image) => image.complete && image.naturalWidth > 0,
    ));
    await assertNoHorizontalOverflow(page, `${name} homepage`);
    await page.screenshot({ path: join(screenshots, `${name}-gallery.png`), animations: 'disabled' });

    await caseSearch.fill('NO_GIF_SHOULD_MATCH_512d1cf4');
    await cards.first().waitFor({ state: 'hidden' });
    assert.equal(await cards.count(), 0, `${name} gallery search did not filter`);
    await gallery.getByRole('button', { name: /清除筛选|clear filters/i }).click();
    await cards.first().waitFor();
    assert.equal(await caseSearch.inputValue(), '', `${name} clear filters did not clear search`);
    assert.equal(await cards.count(), initialCards, `${name} did not restore case results`);

    const playableOnly = gallery.getByRole('button', { name: /只看可播放|playable GIFs only/i });
    await playableOnly.click();
    const playableCards = await cards.count();
    assert.ok(playableCards >= 12 && playableCards < initialCards, `${name} expected at least 12 playable cases and a separate source-only catalog`);
    await playableOnly.click();

    const firstPlayable = cards.filter({ has: page.locator('img') }).first();
    await firstPlayable.locator('.caseImage').click();
    const detail = page.locator('.previewDialog, [role="dialog"]').first();
    await detail.waitFor();
    await page.waitForURL((url) => Boolean(url.searchParams.get('case')));
    const caseUrl = page.url();
    await detail.locator('img').first().waitFor();
    await page.waitForFunction(() => Array.from(document.querySelectorAll('.previewDialog img, [role="dialog"] img'))
      .some((image) => image.complete && image.naturalWidth > 0));
    const animatedImage = detail.locator('.gifDetailMedia img');
    const stillImage = detail.locator('.gifDetailMedia canvas');
    await detail.getByRole('button', { name: /暂停动图|pause gif/i }).click();
    await animatedImage.waitFor({ state: 'hidden' });
    await stillImage.waitFor();
    await detail.getByRole('button', { name: /播放动图|play gif/i }).click();
    await animatedImage.waitFor();
    await stillImage.waitFor({ state: 'hidden' });

    const wechat = detail.getByRole('link', { name: /微信下一步|wechat next step/i });
    assert.match(await wechat.getAttribute('href'), /guides\/wechat\.md(?:#(?:prepare|submit|chat|review))?$/);
    const source = detail.getByRole('link', { name: /作者来源|creator source/i });
    assert.match(await source.getAttribute('href'), /^https:\/\//);
    await assertNoHorizontalOverflow(page, `${name} detail`);
    await page.screenshot({ path: join(screenshots, `${name}-case.png`), animations: 'disabled' });

    const copy = detail.getByRole('button', { name: /复制原词|copy prompt/i });
    if (await copy.count()) {
      const prompt = await detail.locator('.promptBlock').textContent();
      assert.ok(prompt.trim().length > 12, `${name} has no usable original prompt`);
      await copy.click();
      await page.waitForFunction(async (expected) => await navigator.clipboard.readText() === expected, prompt);
    } else {
      const creatorPrompt = detail.getByRole('link', { name: /作者原词|creator prompt/i });
      assert.match(await creatorPrompt.getAttribute('href'), /^https:\/\//);
    }
    await detail.getByRole('button', { name: /分享案例|share case/i }).click();
    await page.waitForFunction(async (expected) => await navigator.clipboard.readText() === expected, caseUrl);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await detail.waitFor();
    assert.equal(page.url(), caseUrl, `${name} reload changed the shared case URL`);
    await page.keyboard.press('Escape');
    await detail.waitFor({ state: 'hidden' });
    assert.equal(new URL(page.url()).searchParams.has('case'), false, `${name} retained a closed case in its URL`);

    const sources = page.locator('#sources');
    const sourceRows = sources.locator('ul li');
    const sourceSearch = sources.getByRole('searchbox');
    await sourceRows.first().waitFor({ state: 'attached' });
    await sourceSearch.fill('NO_X_POST_SHOULD_MATCH_ef6c423a');
    await sourceRows.first().waitFor({ state: 'hidden' });
    assert.equal(await sourceRows.count(), 0, `${name} original-post search did not filter`);
    await sources.getByRole('button', { name: /清除筛选|clear filters/i }).click();
    await sourceRows.first().waitFor({ state: 'attached' });
    assert.match(await sourceRows.first().locator('a').getAttribute('href'), /^https:\/\/x\.com\/[^/]+\/status\/\d+$/);

    const language = page.getByRole('button', { name: 'Language', exact: true });
    await language.click();
    await page.getByRole('menuitemradio', { name: /English/ }).click();
    await hero.getByRole('heading', { name: 'Turn an image into a reaction GIF' }).waitFor();
    await sources.getByRole('heading', { name: 'Browse original X posts' }).waitFor();
    assert.deepEqual(pageErrors, [], `${name} page errors`);
    assert.deepEqual(legacyApiRequests, [], `${name} contacted detached upstream APIs`);
    console.log(`${name} ${width}×${height} passed. ${initialCards} case cards, ${playableCards} playable.`);
  } catch (error) {
    await page.screenshot({ path: join(screenshots, `${name}-failure.png`), animations: 'disabled' }).catch(() => {});
    throw error;
  } finally {
    await context.close();
  }
}

await mkdir(screenshots, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const viewport of viewports) await verifyGallery(browser, viewport);
} finally {
  await browser.close();
}
