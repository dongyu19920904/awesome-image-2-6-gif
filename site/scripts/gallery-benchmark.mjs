import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const require = createRequire(join(resolve(process.env.PLAYWRIGHT_DIR ?? '.'), 'package.json'));
const { chromium } = require('playwright');
const current = process.env.GALLERY_URL;
const baseline = process.env.GALLERY_BASELINE_URL ?? 'https://dongyu19920904.github.io/awesome-image-2-6-gif/';
const upstream = process.env.GALLERY_UPSTREAM_URL ?? 'https://gpt-image2.canghe.ai/';
const evidence = resolve(process.env.GALLERY_SCREENSHOTS ?? 'gallery-screenshots');
const viewports = [
  { width: 1440, height: 960 },
  { width: 390, height: 844 },
];
const results = [];
const githubReadmes = {
  'upstream-readme': 'https://github.com/freestylefly/awesome-gpt-image-2/blob/53d3927ee3c45f6c54a12d86aabcf5c921670e11/README.zh-CN.md',
  'baseline-readme': 'https://github.com/dongyu19920904/awesome-image-2-6-gif/blob/0b95e99c8b92b467705d869769461572bebac1a6/README.md',
  'candidate-readme': 'https://github.com/dongyu19920904/awesome-image-2-6-gif/blob/c8a48c4ad7fa226dea38fbcd7d374ce492bcafac/README.md',
};

async function capture(browser, viewport, label, url, round) {
  const context = await browser.newContext({ viewport, locale: 'zh-CN', reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  const cdp = await context.newCDPSession(page);
  const gifs = new Set();
  const bytes = new Map();
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 40, downloadThroughput: 1_250_000, uploadThroughput: 750_000,
  });
  cdp.on('Network.responseReceived', ({ requestId, response }) => {
    if (response.mimeType === 'image/gif') gifs.add(requestId);
  });
  cdp.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => {
    if (gifs.has(requestId)) bytes.set(requestId, encodedDataLength);
  });
  try {
    const start = Date.now();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    if (!response?.ok()) throw new Error('HTTP ' + response?.status());
    await page.locator('main .hero h1').waitFor();
    const timeToHeadingMs = Date.now() - start;
    if (label !== 'upstream') {
      await page.waitForFunction(() => {
        const images = [...document.querySelectorAll('.hotStrip img')];
        return images.length === 6 && images.every((image) => image.complete && image.naturalWidth > 0);
      });
    }
    const readyMs = Date.now() - start;
    results.push({ label, url, viewport, round, readyMs, timeToHeadingMs,
      gifResponses: gifs.size, gifBytesReceived: [...bytes.values()].reduce((sum, size) => sum + size, 0) });
    if (round === 1) {
      await page.screenshot({ path: join(evidence, label + '-' + viewport.width + '-hero.png'), animations: 'disabled' });
      const grid = page.locator('#gallery');
      const category = grid.locator('.filterRow').first().getByRole('button').nth(1);
      const categoryName = await category.innerText();
      await category.click();
      await grid.locator('.caseCard').first().waitFor();
      await category.scrollIntoViewIfNeeded();
      await page.screenshot({ path: join(evidence, label + '-' + viewport.width + '-filter.png'), animations: 'disabled' });
      await grid.locator('.caseImage').first().click();
      const detail = page.locator('.previewDialog').first();
      await detail.waitFor();
      const caseTitle = await detail.getByRole('heading').first().innerText();
      await page.screenshot({ path: join(evidence, label + '-' + viewport.width + '-detail.png'), animations: 'disabled' });
      const copy = detail.getByRole('button', { name: /复制原词|复制提示词|copy prompt/i }).first();
      if (await copy.count()) {
        await copy.click();
        const clipboard = await page.evaluate(() => navigator.clipboard.readText());
        results.push({ label, url, viewport, interaction: 'filter/detail/copy', categoryName, caseTitle, copiedCharacters: clipboard.length });
      } else {
        results.push({ label, url, viewport, interaction: 'filter/detail', categoryName, caseTitle, copy: 'button not found' });
      }
    }
  } catch (error) {
    results.push({ label, url, viewport, round, blocked: String(error.message).split('\n')[0] });
  } finally {
    await context.close();
  }
}

async function captureReadme(browser, viewport, label, url) {
  const page = await browser.newPage({ viewport, locale: 'zh-CN' });
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    if (!response?.ok()) throw new Error('HTTP ' + response?.status());
    const readme = page.locator('article.markdown-body').first();
    await readme.waitFor({ timeout: 8_000 });
    await readme.evaluate((element) => element.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: join(evidence, label + '-' + viewport.width + '.png'), animations: 'disabled' });
    results.push({ label, url, viewport, screenshot: true });
  } catch (error) {
    results.push({ label, url, viewport, blocked: String(error.message).split('\n')[0] });
  } finally {
    await page.close();
  }
}

await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const viewport of viewports) {
    for (let round = 1; round <= 3; round++) {
      await capture(browser, viewport, 'baseline-v0.2.1', baseline, round);
      await capture(browser, viewport, 'candidate', current, round);
    }
    await capture(browser, viewport, 'upstream', upstream, 1);
    for (const [label, url] of Object.entries(githubReadmes)) {
      await captureReadme(browser, viewport, label, url);
    }
  }
} finally {
  await browser.close();
  await writeFile(join(evidence, 'comparison.json'), JSON.stringify(results, null, 2) + '\n');
  for (const result of results) console.log('Comparison ' + JSON.stringify(result));
}
