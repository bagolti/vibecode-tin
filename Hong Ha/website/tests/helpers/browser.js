'use strict';
/*
 * Trợ giúp chạy trình duyệt thật (Chrome/Edge có sẵn trên máy) qua puppeteer-core.
 *  - Tìm thư viện: require thường -> NODE_PATH -> biến HONGHA_TEST_DEPS (thư mục chứa node_modules).
 *    (Cần khi `npm install` không chạy được trên ổ Google Drive.)
 *  - Tìm trình duyệt: biến CHROME_PATH, rồi các vị trí cài đặt phổ biến.
 */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function resolveDep(name) {
  const extra = process.env.HONGHA_TEST_DEPS ? [path.join(process.env.HONGHA_TEST_DEPS, 'node_modules')] : [];
  try {
    return require(name);
  } catch (e) {
    if (!extra.length) throw e;
    return require(require.resolve(name, { paths: extra }));
  }
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p)) || null;
}

const PAGE_URL = pathToFileURL(path.resolve(__dirname, '../../thanh-tich.html')).href;

async function launch() {
  const puppeteer = resolveDep('puppeteer-core');
  const executablePath = findBrowser();
  if (!executablePath) throw new Error('Không tìm thấy Chrome/Edge. Đặt biến môi trường CHROME_PATH.');
  return puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
}

/**
 * Mở trang với viewport cho trước. Chặn Google Fonts (không cần mạng, trang phải chạy được khi offline)
 * và gom lỗi console / lỗi trang / request cục bộ thất bại.
 */
async function openPage(browser, { width = 1280, height = 900, reducedMotion = false, touch = false, url = PAGE_URL } = {}) {
  const page = await browser.newPage();
  const problems = [];
  await page.setViewport({ width, height, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }]);
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) {
      req.respond({ status: 200, contentType: 'text/css', body: '' });
    } else {
      req.continue();
    }
  });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push('console.error: ' + m.text());
  });
  page.on('requestfailed', (r) => {
    if (r.url().startsWith('file:')) problems.push('requestfailed: ' + r.url());
  });
  await page.goto(url, { waitUntil: 'load' });
  return { page, problems };
}

/** Chạy axe-core trên trang hiện tại; trả mảng vi phạm. */
async function runAxe(page, context) {
  const src = fs.readFileSync(
    (() => {
      try {
        return require.resolve('axe-core/axe.min.js');
      } catch (e) {
        return require.resolve('axe-core/axe.min.js', {
          paths: [path.join(process.env.HONGHA_TEST_DEPS || '', 'node_modules')]
        });
      }
    })(),
    'utf8'
  );
  await page.evaluate(src);
  return page.evaluate(async (ctx) => {
    const r = await window.axe.run(ctx || document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }
    });
    return r.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(0, 3).join(' | '))
    }));
  }, context || null);
}

module.exports = { launch, openPage, runAxe, findBrowser, PAGE_URL };
