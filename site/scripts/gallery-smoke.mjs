import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const require = createRequire(join(resolve(process.env.PLAYWRIGHT_DIR ?? '.'), 'package.json'));
const { chromium } = require('playwright');
const galleryUrl = process.env.GALLERY_URL ?? 'http://127.0.0.1:4173/awesome-image-2-6-gif/';
const screenshots = resolve(process.env.GALLERY_SCREENSHOTS ?? 'gallery-screenshots');
const media = JSON.parse(await readFile(new URL('../data/gallery-media.json', import.meta.url), 'utf8'));
const { records: catalog } = JSON.parse(await readFile(new URL('../../data/cases.json', import.meta.url), 'utf8'));
const featured = media.filter((item) => item.featured);
const repoRoot = new URL('../../', import.meta.url);
for (const item of [...catalog, ...media]) {
  if (item.page) await readFile(new URL(item.page, repoRoot));
  const [file, fragment] = item.next_step.split('#');
  const guide = await readFile(new URL(file, repoRoot), 'utf8');
  if (fragment) assert.ok(guide.includes('id="' + fragment + '"'), item.id + ' has a missing next-step anchor');
}
const viewports = [
  { name: 'desktop', width: 1440, height: 960 },
  { name: 'mobile', width: 390, height: 844 },
];

async function assertNoHorizontalOverflow(page, name) {
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(width <= page.viewportSize().width + 1, name + ' overflows at ' + width + 'px');
}

async function openCase(page, id) {
  await page.goto(new URL('?case=' + id + '&lang=zh', galleryUrl).href, { waitUntil: 'domcontentloaded' });
  const detail = page.locator('.previewDialog, [role="dialog"]').first();
  await detail.waitFor();
  return detail;
}

async function verifyPlayableCase(page, item, checkClipboard) {
  const detail = await openCase(page, item.id);
  await detail.getByRole('heading', { name: item.title_zh, exact: true }).waitFor();
  await detail.getByRole('button', { name: '播放动图', exact: true }).click();
  await page.waitForFunction((url) => Array.from(document.querySelectorAll('.previewDialog img'))
    .some((image) => image.src === url && image.complete && image.naturalWidth > 0), item.preview_url);
  const wechat = detail.getByRole('link', { name: /微信下一步/ });
  assert.ok((await wechat.getAttribute('href')).endsWith((catalog.find((record) => record.id === item.id) ?? item).next_step));
  const origins = await detail.locator('a').evaluateAll((links) => links.map((link) => link.href));
  assert.ok(origins.includes(item.source_url), item.id + ' lost original source');
  assert.ok(origins.includes(item.preview_url), item.id + ' lost original file');
  assert.equal(await detail.locator('.promptBlock').textContent(), item.prompt);
  if (checkClipboard) {
    await detail.getByRole('button', { name: /复制原词/ }).click();
    await page.waitForFunction(async (prompt) => await navigator.clipboard.readText() === prompt, item.prompt);
  }
  return detail;
}

async function verifyGallery(browser, { name, width, height }) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: 'zh-CN',
    reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  const pageErrors = [];
  const legacyApiRequests = [];
  const gifRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/\.gif(?:\?|$)/i.test(request.url())) gifRequests.push(request.url());
    if (/\/api\/(?:auth|billing|generation|admin|apimart|me|favorites)(?:\/|\?|$)/.test(request.url())) {
      legacyApiRequests.push(request.url());
    }
  });

  try {
    const response = await page.goto(galleryUrl, { waitUntil: 'domcontentloaded' });
    assert.ok(response?.ok(), name + ' gallery HTTP ' + response?.status());
    const hero = page.locator('main .hero');
    const gallery = page.locator('#gallery');
    const cards = gallery.locator('.caseCard');
    const search = gallery.locator('#case-search');
    await hero.getByRole('heading', { level: 1 }).waitFor();
    assert.ok(await page.evaluate(async () => {
      const faces = await document.fonts.load('700 24px "Noto Sans SC Variable"', '把一张图做成动态表情');
      await document.fonts.ready;
      return faces.length;
    }), name + ' did not load the Chinese font');
    await cards.first().waitFor();
    const initialCards = await cards.count();
    assert.equal(initialCards, new Set([...catalog, ...media].map((item) => item.id)).size);
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('.hotStrip img'));
      return images.length === 6 && images.every((image) => image.complete && image.naturalWidth > 0 && image.src.includes('/poster/'));
    });
    await assertNoHorizontalOverflow(page, name + ' homepage');
    await page.screenshot({ path: join(screenshots, name + '-gallery.png'), animations: 'disabled' });
    assert.deepEqual(gifRequests, [], name + ' initial load requested an animated GIF');

    await search.fill('NO_GIF_SHOULD_MATCH_512d1cf4');
    await cards.first().waitFor({ state: 'hidden' });
    await gallery.getByRole('button', { name: /清除筛选/ }).click();
    await cards.first().waitFor();
    assert.equal(await search.inputValue(), '');
    assert.equal(await cards.count(), initialCards);
    const playableOnly = gallery.getByRole('button', { name: /只看可播放/ });
    await playableOnly.click();
    assert.equal(await cards.count(), media.length);
    await playableOnly.click();

    for (const item of name === 'desktop' ? media : featured) {
      const detail = await verifyPlayableCase(page, item, item.featured);
      if (item.id === featured[0].id) {
        await assertNoHorizontalOverflow(page, name + ' detail');
        await page.screenshot({ path: join(screenshots, name + '-case.png'), animations: 'disabled' });
        await detail.getByRole('button', { name: /显示静态预览/ }).click();
        await detail.locator('img[data-poster]').waitFor();
        await detail.locator('img[data-gif]').waitFor({ state: 'hidden' });
        await detail.getByRole('button', { name: /分享案例/ }).click();
        const staticPath = '/case/' + item.id + '/';
        await page.waitForFunction(async (path) => {
          const text = await navigator.clipboard.readText();
          return text.includes(path);
        }, staticPath);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await detail.waitFor();
        await page.keyboard.press('Escape');
        await detail.waitFor({ state: 'hidden' });
        assert.equal(new URL(page.url()).searchParams.has('case'), false);
      }
    }
    for (const id of ['ginger-cat-and-capybara', 'wechat-luffy-theme-to-submission']) {
      const record = catalog.find((item) => item.id === id);
      const detail = await openCase(page, id);
      assert.equal(await detail.locator('[data-case-link="output"]').getAttribute('href'), record.preview);
      assert.equal(await detail.locator('[data-case-evidence]').count(), 1);
    }
    for (const id of ['bunny-reaction-set', 'licensed-doodle-monster', 'licensed-pixel-campfire']) {
      const record = catalog.find((item) => item.id === id);
      const detail = await openCase(page, id);
      assert.ok((await detail.locator('[data-case-link="guide"]').getAttribute('href')).endsWith(record.page));
    }

    const shareUrl = new URL('case/' + featured[0].id + '/?lang=en&category=reaction', galleryUrl);
    const share = await context.request.get(shareUrl.href);
    assert.ok(share.ok());
    const html = await share.text();
    assert.match(html, /property="og:title" content="[^"]+Bunny thumbs-up"/);
    assert.match(html, /property="og:image" content="[^"]+bunny-reaction-set\.webp"/);
    await page.goto(shareUrl.href, { waitUntil: 'domcontentloaded' });
    await page.locator('.previewDialog').getByRole('heading', { name: 'Bunny thumbs-up', exact: true }).waitFor();
    assert.equal(new URL(page.url()).searchParams.get('lang'), 'en');
    assert.equal(new URL(page.url()).searchParams.get('category'), 'reaction');

    const brokenGif = featured[0].preview_url;
    await page.route(brokenGif, (request) => request.abort());
    const fallback = await openCase(page, featured[0].id);
    await fallback.getByRole('button', { name: '播放动图', exact: true }).click();
    await fallback.getByRole('button', { name: '重试动图', exact: true }).waitFor();
    assert.equal(await fallback.locator('[data-case-link="output"]').getAttribute('href'), brokenGif);
    await page.unroute(brokenGif);

    await page.goto(new URL('?category=image_to_gif&lang=zh#gallery', galleryUrl).href, { waitUntil: 'domcontentloaded' });
    await cards.first().waitFor();
    assert.equal(await cards.count(), catalog.filter((item) => item.category === 'image_to_gif').length);

    const sources = page.locator('#sources');
    const sourceRows = sources.locator('ul li');
    await sourceRows.first().waitFor({ state: 'attached' });
    await sources.getByRole('searchbox').fill('NO_X_POST_SHOULD_MATCH_ef6c423a');
    await sourceRows.first().waitFor({ state: 'hidden' });
    await sources.getByRole('button', { name: /清除筛选/ }).click();
    await sourceRows.first().waitFor({ state: 'attached' });
    assert.match(await sourceRows.first().locator('a').getAttribute('href'), /^https:\/\/x\.com\/[^/]+\/status\/\d+$/);

    await page.getByRole('button', { name: 'Language', exact: true }).click();
    await page.getByRole('menuitemradio', { name: /English/ }).click();
    await hero.getByRole('heading', { name: 'Turn an image into a reaction GIF' }).waitFor();
    await sources.getByRole('heading', { name: 'Browse original X posts' }).waitFor();
    assert.deepEqual(pageErrors, [], name + ' page errors');
    assert.deepEqual(legacyApiRequests, [], name + ' contacted detached upstream APIs');
    console.log(name + ': ' + (name === 'desktop' ? media.length : featured.length) + ' playable cases, restored links, shares and search passed');
  } catch (error) {
    await page.screenshot({ path: join(screenshots, name + '-failure.png'), animations: 'disabled' }).catch(() => {});
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
