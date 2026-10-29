'use strict';
/*
 * Kiểm thử đầu-cuối module Tổng quan tháng (M4) trên trình duyệt thật.
 * Mỗi test mở trang sạch với "hôm nay" cố định (?now=...), nạp dữ liệu mẫu, rồi khẳng định KHÔNG có lỗi console/trang.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { launch, openPage, runAxe, PAGE_URL } = require('../helpers/browser');

let browser;
test.before(async () => { browser = await launch(); });
test.after(async () => { if (browser) await browser.close(); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const inc = (amount, date) => ({ type: 'income', amount, category: 'luong', date });
const exp = (amount, date) => ({ type: 'expense', amount, category: 'an-uong', date });

/* Dữ liệu mẫu có đáp án tính tay (hôm nay = 29/10/2026)
 *  10/2026: thu 16.000.000, chi 10.750.000, dư 5.250.000 → bình thường
 *  09/2026: thu 5.000.000,  chi 6.250.000,  dư −1.250.000 → CẢNH BÁO (chi > thu)
 *  06/2026: thu 2.000.000,  chi 2.000.000,  dư 0           → bằng nhau, không cảnh báo
 *  05/2026: chỉ chi 80.000                                  → cảnh báo "chưa có thu"
 *  04/2026: chỉ thu 3.000.000                               → không cảnh báo
 *  08/2026 và 07/2026: trống
 */
const SAMPLE = [
  inc(15000000, '2026-10-01'), inc(1000000, '2026-10-31'), exp(55000, '2026-10-27'), exp(12000, '2026-10-27'), exp(10683000, '2026-10-15'),
  inc(5000000, '2026-09-30'), exp(6250000, '2026-09-01'),
  inc(2000000, '2026-06-10'), exp(2000000, '2026-06-30'),
  exp(80000, '2026-05-31'),
  inc(3000000, '2026-04-01')
];

async function withPage(opts, fn) {
  if (typeof opts === 'function') { fn = opts; opts = {}; }
  const o = Object.assign({ now: '2026-10-29', data: SAMPLE, width: 1280, height: 900, reducedMotion: true, delay: 0, dark: false }, opts);
  const url = PAGE_URL + '?now=' + o.now;
  const { page, problems } = await openPage(browser, { width: o.width, height: o.height, reducedMotion: o.reducedMotion, touch: o.width < 640, url });
  try {
    await page.evaluate(() => DemoStore.clear());
    if (o.data.length) await page.evaluate((l) => DemoStore.seed(l), o.data);
    if (o.dark) await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-motion', value: o.reducedMotion ? 'reduce' : 'no-preference' }]);
    if (o.delay) await page.evaluateOnNewDocument((d) => { window.__SOTC_DELAY = d; }, o.delay);
    await page.goto(url, { waitUntil: 'load' });
    await ready(page);
    await fn(page);
    assert.deepEqual(problems, [], 'Không được có lỗi console/trang: ' + problems.join(' | '));
  } finally { await page.close(); }
}
const ready = (page) => page.waitForFunction(() => { const s = window.SoThuChiOverview && SoThuChiOverview._state(); return s && s.ready; }, { timeout: 8000 });
async function settled(page) { await sleep(120); await ready(page); }
async function goPrev(page, n = 1) { for (let i = 0; i < n; i++) { await page.click('[data-ov="prev"]'); await settled(page); } }
async function goNext(page, n = 1) { for (let i = 0; i < n; i++) { await page.click('[data-ov="next"]'); await settled(page); } }
const label = (page) => page.$eval('[data-ov="label"]', (e) => e.textContent.trim());
const exists = (page, sel) => page.evaluate((s) => !!document.querySelector(s), sel);
const text = (page, sel) => page.$eval(sel, (e) => e.textContent.trim());
const cards = (page) => page.evaluate(() => {
  const g = (k) => { const c = document.querySelector(`[data-kind="${k}"]`); return { full: c.querySelector('[data-ov="full"]').textContent, vis: c.querySelector('[data-ov="vis"]').textContent, compact: c.dataset.compact, color: getComputedStyle(c.querySelector('.ov-val')).color }; };
  return { income: g('income'), expense: g('expense'), balance: g('balance') };
});
const months = (page) => page.evaluate(() => window.__months);
const dispatchChanged = (page) => page.evaluate(() => document.dispatchEvent(new CustomEvent('sotc:data-changed', { detail: {} })));
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };

/* ================= Hiển thị tổng quan (US-04, F-04) ================= */
test.describe('Thẻ Tổng thu / Tổng chi / Số dư', () => {
  test('mở trang: tháng hiện tại, 3 thẻ khớp tính tay, số dư = thu − chi', () =>
    withPage(async (page) => {
      assert.equal(await label(page), 'Tháng 10/2026');
      const c = await cards(page);
      assert.equal(c.income.full, '16.000.000 ₫');
      assert.equal(c.expense.full, '10.750.000 ₫');
      assert.equal(c.balance.full, '5.250.000 ₫');
      assert.equal(c.income.vis, '16.000.000 ₫');
      assert.equal(c.balance.vis, '5.250.000 ₫');
      const lbls = await page.$$eval('.ov-card .ov-lab', (e) => e.map((x) => x.textContent.trim()));
      assert.deepEqual(lbls.sort(), ['Số dư', 'Tổng chi', 'Tổng thu']);
    }));

  test('màu theo ngữ nghĩa: thu = --income, chi = --expense, số dư dương = --text', () =>
    withPage(async (page) => {
      const c = await cards(page);
      assert.equal(c.income.color, rgb('#12805C'));
      assert.equal(c.expense.color, rgb('#C8421E'));
      assert.equal(c.balance.color, rgb('#14181F'));
    }));

  test('phát tháng đang chọn: sự kiện sotc:month-changed lúc khởi tạo và getMonth()', () =>
    withPage(async (page) => {
      assert.deepEqual(await months(page), ['2026-10']);
      assert.equal(await page.evaluate(() => SoThuChiOverview.getMonth()), '2026-10');
      assert.equal(await text(page, '#dev-month'), '2026-10');
    }));

  test('tháng có số dư âm: dấu − và màu --expense', () =>
    withPage(async (page) => {
      await goPrev(page); // 09/2026
      const c = await cards(page);
      assert.equal(c.balance.full, '−1.250.000 ₫');
      assert.equal(c.balance.color, rgb('#C8421E'));
    }));

  test('tháng số dư = 0: hiển thị 0 ₫ không dấu, màu --text', () =>
    withPage(async (page) => {
      await goPrev(page, 4); // 06/2026
      assert.equal(await label(page), 'Tháng 6/2026');
      const c = await cards(page);
      assert.equal(c.balance.full, '0 ₫'); assert.equal(c.balance.color, rgb('#14181F'));
      assert.equal(c.income.full, '2.000.000 ₫'); assert.equal(c.expense.full, '2.000.000 ₫');
    }));

  test('giao dịch ngày đầu/cuối tháng thuộc đúng tháng (31/10 tính vào 10; 30/09 và 01/09 tính vào 09)', () =>
    withPage(async (page) => {
      assert.equal((await cards(page)).income.full, '16.000.000 ₫'); // gồm 31/10
      await goPrev(page);
      const c = await cards(page);
      assert.equal(c.income.full, '5.000.000 ₫'); // 30/09
      assert.equal(c.expense.full, '6.250.000 ₫'); // 01/09
    }));

  test('vùng đọc cho trình đọc màn hình (aria-live) nêu tháng và các số', () =>
    withPage(async (page) => {
      const t = await text(page, '[data-ov="live"]');
      assert.match(t, /Tháng 10\/2026: tổng thu 16\.000\.000 ₫, tổng chi 10\.750\.000 ₫, số dư 5\.250\.000 ₫/);
      assert.equal(await page.$eval('[data-ov="live"]', (e) => e.getAttribute('aria-live')), 'polite');
    }));
});

/* ================= LOGIC CHÍNH: chi > thu thì cảnh báo ================= */
test.describe('Cảnh báo khi chi > thu', () => {
  test('tháng bình thường (thu > chi): KHÔNG có cảnh báo', () =>
    withPage(async (page) => {
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
      assert.ok(!(await exists(page, '.ov-tag')));
      assert.equal(await page.$eval('[data-kind="balance"]', (e) => e.dataset.warn), 'false');
    }));

  test('tháng chi > thu: hiện banner cảnh báo đúng nội dung, role=status, kèm thẻ "Chi vượt thu" ở Số dư', () =>
    withPage(async (page) => {
      await goPrev(page); // 09/2026
      assert.ok(await exists(page, '[data-ov="warning"]'));
      assert.equal(await page.$eval('[data-ov="warning"]', (e) => e.getAttribute('role')), 'status');
      assert.equal(await text(page, '[data-ov="warning"] strong'), 'Chi đang vượt thu');
      assert.equal(await text(page, '[data-ov="warning"] .ov-bmsg'), 'Chi nhiều hơn thu 1.250.000 ₫ (chi 6.250.000 ₫, thu 5.000.000 ₫).');
      assert.equal(await text(page, '.ov-tag'), 'Chi vượt thu');
      assert.equal(await page.$eval('[data-kind="balance"]', (e) => e.dataset.warn), 'true');
      assert.match(await text(page, '[data-ov="live"]'), /Cảnh báo: Chi nhiều hơn thu 1\.250\.000 ₫/);
    }));

  test('chi = thu: không cảnh báo (chưa vượt)', () =>
    withPage(async (page) => {
      await goPrev(page, 4); // 06/2026
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
    }));

  test('chỉ có chi, chưa có thu: cảnh báo kiểu "chưa có khoản thu nào"', () =>
    withPage(async (page) => {
      await goPrev(page, 5); // 05/2026
      assert.equal(await text(page, '[data-ov="warning"] .ov-bmsg'), 'Tháng này chưa có khoản thu nào nhưng đã chi 80.000 ₫.');
    }));

  test('chỉ có thu, chưa có chi: không cảnh báo', () =>
    withPage(async (page) => {
      await goPrev(page, 6); // 04/2026
      assert.equal(await label(page), 'Tháng 4/2026');
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
    }));

  test('tháng trống: không cảnh báo', () =>
    withPage(async (page) => {
      await goPrev(page, 2); // 08/2026
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
    }));

  test('cảnh báo tự bật/tắt theo dữ liệu mới (M3 báo data-changed): +1 ₫ chi vượt → bật; +1 ₫ thu → tắt', () =>
    withPage(async (page) => {
      await goPrev(page, 4); // 06/2026: thu = chi = 2.000.000
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
      await page.evaluate(() => DemoStore.seed([{ type: 'expense', amount: 1, category: 'an-uong', date: '2026-06-15' }]));
      await dispatchChanged(page); await settled(page);
      assert.ok(await exists(page, '[data-ov="warning"]'));
      assert.match(await text(page, '[data-ov="warning"] .ov-bmsg'), /^Chi nhiều hơn thu 1 ₫/);
      assert.equal((await cards(page)).balance.full, '−1 ₫');
      await page.evaluate(() => DemoStore.seed([{ type: 'income', amount: 1, category: 'luong', date: '2026-06-16' }]));
      await dispatchChanged(page); await settled(page);
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
      assert.equal((await cards(page)).balance.full, '0 ₫');
    }));

  test('thêm khoản chi lớn vào tháng hiện tại làm xuất hiện cảnh báo, số liệu cập nhật đúng', () =>
    withPage(async (page) => {
      await page.evaluate(() => DemoStore.seed([{ type: 'expense', amount: 5250001, category: 'nha-o', date: '2026-10-29' }]));
      await dispatchChanged(page); await settled(page);
      const c = await cards(page);
      assert.equal(c.expense.full, '16.000.001 ₫'); assert.equal(c.balance.full, '−1 ₫');
      assert.match(await text(page, '[data-ov="warning"] .ov-bmsg'), /^Chi nhiều hơn thu 1 ₫ \(chi 16\.000\.001 ₫, thu 16\.000\.000 ₫\)\.$/);
    }));

  test('cảnh báo không chỉ dựa vào màu: có icon, chữ và thẻ; chữ banner dùng --text; vạch trái 4px --warning', () =>
    withPage(async (page) => {
      await goPrev(page);
      const r = await page.$eval('[data-ov="warning"]', (e) => { const c = getComputedStyle(e); return { bl: c.borderLeftWidth + ' ' + c.borderLeftColor, bg: c.backgroundColor, col: c.color, svg: !!e.querySelector('svg[aria-hidden="true"]'), radius: c.borderRadius }; });
      assert.equal(r.bl, '4px ' + rgb('#8A6100'));
      assert.equal(r.bg, rgb('#EEF0F4')); assert.equal(r.col, rgb('#14181F')); assert.ok(r.svg); assert.equal(r.radius, '12px');
    }));

  test('cảnh báo theo từng tháng, không dính sang tháng khác: 10 ok → 09 cảnh báo → 10 ok', () =>
    withPage(async (page) => {
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
      await goPrev(page);
      assert.ok(await exists(page, '[data-ov="warning"]'));
      await goNext(page);
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
    }));
});

/* ================= Chuyển tháng (F-08, US-09) ================= */
test.describe('Chuyển tháng', () => {
  test('‹ lùi một tháng, › tiến một tháng; số liệu và nhãn đổi theo', () =>
    withPage(async (page) => {
      await goPrev(page);
      assert.equal(await label(page), 'Tháng 9/2026');
      assert.equal((await cards(page)).income.full, '5.000.000 ₫');
      await goNext(page);
      assert.equal(await label(page), 'Tháng 10/2026');
      assert.equal((await cards(page)).income.full, '16.000.000 ₫');
    }));

  test('› bị vô hiệu ở tháng hiện tại (disabled, không chuyển được); ‹ vẫn dùng được', () =>
    withPage(async (page) => {
      assert.equal(await page.$eval('[data-ov="next"]', (e) => e.disabled), true);
      assert.equal(await page.$eval('[data-ov="prev"]', (e) => e.disabled), false);
      await page.evaluate(() => document.querySelector('[data-ov="next"]').click());
      await sleep(100);
      assert.equal(await label(page), 'Tháng 10/2026');
      assert.equal(await page.$eval('[data-ov="next"]', (e) => getComputedStyle(e).opacity), '0.4');
      await goPrev(page);
      assert.equal(await page.$eval('[data-ov="next"]', (e) => e.disabled), false, 'lùi rồi thì › dùng lại được');
    }));

  test('qua ranh giới năm: 01/2027 → 12/2026 → 01/2027, › vô hiệu ở 01/2027', () =>
    withPage({ now: '2027-01-15', data: [exp(100000, '2026-12-31'), inc(900000, '2026-12-01'), inc(50000, '2027-01-01'), exp(20000, '2027-01-15')] }, async (page) => {
      assert.equal(await label(page), 'Tháng 1/2027');
      assert.equal((await cards(page)).balance.full, '30.000 ₫');
      await goPrev(page);
      assert.equal(await label(page), 'Tháng 12/2026');
      const c = await cards(page);
      assert.equal(c.income.full, '900.000 ₫'); assert.equal(c.expense.full, '100.000 ₫'); assert.equal(c.balance.full, '800.000 ₫');
      await goNext(page);
      assert.equal(await label(page), 'Tháng 1/2027');
      assert.equal(await page.$eval('[data-ov="next"]', (e) => e.disabled), true);
      assert.deepEqual(await months(page), ['2027-01', '2026-12', '2027-01']);
    }));

  test('lùi 13 tháng liên tiếp qua năm cũ: nhãn đúng, trống thì 0 ₫', () =>
    withPage(async (page) => {
      await goPrev(page, 13);
      assert.equal(await label(page), 'Tháng 9/2025');
      assert.equal((await cards(page)).balance.full, '0 ₫');
    }));

  test('mỗi lần đổi tháng phát sotc:month-changed đúng thứ tự (M5/M6 chỉ nhận, không tự giữ tháng)', () =>
    withPage(async (page) => {
      await goPrev(page, 2); await goNext(page);
      assert.deepEqual(await months(page), ['2026-10', '2026-09', '2026-08', '2026-09']);
      assert.equal(await text(page, '#dev-month'), '2026-09');
    }));

  test('setMonth(): ép về khoảng hợp lệ (tương lai → tháng hiện tại; sai định dạng → tháng hiện tại); cùng tháng không phát lại', () =>
    withPage(async (page) => {
      assert.equal(await page.evaluate(() => SoThuChiOverview.setMonth('2030-01')), false);
      assert.equal(await page.evaluate(() => SoThuChiOverview.getMonth()), '2026-10');
      assert.equal(await page.evaluate(() => SoThuChiOverview.setMonth('xyz')), false);
      assert.equal(await page.evaluate(() => SoThuChiOverview.setMonth('2026-09')), true);
      await settled(page);
      assert.equal(await label(page), 'Tháng 9/2026');
      assert.equal(await page.evaluate(() => SoThuChiOverview.setMonth('1990-01')), true);
      await settled(page);
      assert.equal(await label(page), 'Tháng 1/2000');
      assert.equal(await page.$eval('[data-ov="prev"]', (e) => e.disabled), true, 'không lùi quá 01/2000');
      assert.deepEqual(await months(page), ['2026-10', '2026-09', '2000-01']);
    }));

  test('đổi tháng nhanh liên tiếp với dữ liệu đọc chậm: kết quả cũ không đè kết quả mới', () =>
    withPage(async (page) => {
      await page.evaluate(() => { window.__SOTC_DELAY = 350; });
      await page.click('[data-ov="prev"]'); // → 09 (đang chờ)
      await page.click('[data-ov="prev"]'); // → 08 (yêu cầu mới hơn)
      await sleep(1200); await ready(page);
      assert.equal(await label(page), 'Tháng 8/2026');
      assert.equal((await cards(page)).income.full, '0 ₫', 'không được hiện số tháng 09');
      assert.ok(!(await exists(page, '[data-ov="warning"]')), 'không được hiện cảnh báo của tháng 09');
      assert.ok(await exists(page, '[data-ov="empty-month"]'));
    }));

  test('có hoạt ảnh (không giảm chuyển động): sau khi đổi tháng số cuối cùng vẫn chính xác', () =>
    withPage({ reducedMotion: false }, async (page) => {
      await page.click('[data-ov="prev"]');
      await sleep(900); await ready(page);
      const c = await cards(page);
      assert.equal(c.income.vis, '5.000.000 ₫'); assert.equal(c.expense.vis, '6.250.000 ₫'); assert.equal(c.balance.vis, '−1.250.000 ₫');
      await page.click('[data-ov="next"]');
      await sleep(900); await ready(page);
      assert.equal((await cards(page)).balance.vis, '5.250.000 ₫');
    }));
});

/* ================= Trạng thái ================= */
test.describe('Trạng thái rỗng, đang tải, lỗi (F-13)', () => {
  test('lần đầu (chưa có dữ liệu nào): thẻ 0 ₫ mờ 60%, minh họa + lời mời + nút Thêm khoản, dòng riêng tư', () =>
    withPage({ data: [] }, async (page) => {
      const c = await cards(page);
      assert.equal(c.income.full, '0 ₫'); assert.equal(c.expense.full, '0 ₫'); assert.equal(c.balance.full, '0 ₫');
      assert.equal(await page.$eval('[data-kind="income"] .ov-val', (e) => getComputedStyle(e).color), rgb('#5B6472'), 'mờ đi: màu --text-muted');
      assert.equal(await page.$eval('[data-kind="expense"] .ov-val', (e) => getComputedStyle(e).color), rgb('#5B6472'));
      assert.equal(await text(page, '[data-ov="first"] h3'), 'Chưa có khoản nào');
      assert.match(await text(page, '[data-ov="first"]'), /Ghi khoản đầu tiên của bạn trong 15 giây/);
      assert.match(await text(page, '[data-ov="first"]'), /Dữ liệu chỉ lưu trên máy này, không cần đăng nhập\./);
      assert.equal(await text(page, '[data-ov="first"] [data-action="add"]'), 'Thêm khoản');
      assert.ok(await exists(page, '[data-ov="first"] svg.ov-art'));
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
      assert.equal(await page.$eval('[data-ov="first"] [data-action="add"]', (e) => getComputedStyle(e).backgroundColor), rgb('#2F6FED'));
    }));

  test('nút "Thêm khoản" gắn [data-action="add"] để M3 bắt (không tự mở form)', () =>
    withPage({ data: [] }, async (page) => {
      await page.click('[data-ov="first"] [data-action="add"]');
      assert.equal(await text(page, '#dev-add'), '1');
    }));

  test('lần đầu: khi M3 lưu khoản đầu tiên (data-changed) thì chuyển sang hiển thị thường', () =>
    withPage({ data: [] }, async (page) => {
      await page.evaluate(() => DemoStore.seed([{ type: 'income', amount: 500000, category: 'luong', date: '2026-10-05' }]));
      await dispatchChanged(page); await settled(page);
      assert.ok(!(await exists(page, '[data-ov="first"]')));
      assert.equal((await cards(page)).income.full, '500.000 ₫');
      assert.equal(await page.$eval('[data-kind="income"] .ov-val', (e) => getComputedStyle(e).color), rgb('#12805C'));
    }));

  test('tháng không có giao dịch (đã có dữ liệu tháng khác): thẻ 0 ₫ rõ nét + khối 120px, nút Thêm khoản và "Về tháng gần nhất có dữ liệu"', () =>
    withPage(async (page) => {
      await goPrev(page, 2); // 08/2026
      const c = await cards(page);
      assert.equal(c.income.full, '0 ₫'); assert.equal(c.balance.full, '0 ₫');
      assert.equal(await page.$eval('[data-kind="income"] .ov-val', (e) => getComputedStyle(e).color), rgb('#12805C'), 'không mờ');
      assert.equal(await text(page, '[data-ov="empty-month"] .ov-et'), 'Chưa có giao dịch trong tháng này');
      assert.ok(await page.$eval('[data-ov="empty-month"]', (e) => e.getBoundingClientRect().height >= 120));
      assert.equal(await text(page, '[data-ov="empty-month"] [data-action="add"]'), 'Thêm khoản');
      assert.equal(await text(page, '[data-ov="nearest"]'), 'Về tháng gần nhất có dữ liệu');
      assert.ok(!(await exists(page, '[data-ov="first"]')));
    }));

  test('"Về tháng gần nhất có dữ liệu" chuyển đúng tháng (08 cách đều 09 và 07 → chọn 09) và phát sự kiện', () =>
    withPage(async (page) => {
      await goPrev(page, 2);
      await page.click('[data-ov="nearest"]'); await settled(page);
      assert.equal(await label(page), 'Tháng 9/2026');
      assert.deepEqual((await months(page)).slice(-1), ['2026-09']);
      assert.ok(!(await exists(page, '[data-ov="empty-month"]')));
    }));

  test('tháng trống mà không còn tháng nào khác có dữ liệu ≤ hiện tại: ẩn nút "Về tháng gần nhất"', () =>
    withPage({ data: [inc(1000, '2026-10-01')] }, async (page) => {
      await goPrev(page);
      assert.ok(await exists(page, '[data-ov="empty-month"]'));
      assert.ok(await exists(page, '[data-ov="nearest"]'), 'có tháng 10 để quay về');
      await page.click('[data-ov="nearest"]'); await settled(page);
      assert.equal(await label(page), 'Tháng 10/2026');
    }));

  test('đang tải chậm (>200ms): hiện skeleton aria-busy; xong thì thay bằng số; skeleton hiện tối thiểu 300ms', () =>
    withPage({ delay: 260 }, async (page) => {
      // trang đã mount xong vì withPage chờ ready; đổi tháng để quan sát skeleton
      const seen = await page.evaluate(() => new Promise((resolve) => {
        const log = []; const t0 = performance.now();
        const sum = document.querySelector('[data-ov="sum"]');
        const tick = () => { log.push([Math.round(performance.now() - t0), !!document.querySelector('.ov-skelcard'), sum.getAttribute('aria-busy')]); };
        document.querySelector('[data-ov="prev"]').click();
        const iv = setInterval(tick, 20);
        setTimeout(() => { clearInterval(iv); resolve(log); }, 1000);
      }));
      const firstSkel = seen.find((r) => r[1]), lastSkel = [...seen].reverse().find((r) => r[1]);
      assert.ok(firstSkel, 'skeleton phải xuất hiện');
      assert.ok(firstSkel[0] >= 150, `skeleton chỉ hiện sau ~200ms (thấy ở ${firstSkel[0]}ms)`);
      assert.equal(firstSkel[2], 'true');
      assert.ok(lastSkel[0] - firstSkel[0] >= 260, `skeleton hiện đủ ~300ms (${lastSkel[0] - firstSkel[0]}ms)`);
      await ready(page);
      assert.ok(!(await exists(page, '.ov-skelcard')));
      assert.equal(await page.$eval('[data-ov="sum"]', (e) => e.getAttribute('aria-busy')), null);
      assert.equal((await cards(page)).income.full, '5.000.000 ₫');
    }));

  test('tải nhanh (<200ms): không nháy skeleton', () =>
    withPage(async (page) => {
      const n = await page.evaluate(() => new Promise((resolve) => {
        let c = 0; const mo = new MutationObserver(() => { if (document.querySelector('.ov-skelcard')) c++; });
        mo.observe(document.querySelector('.ov'), { childList: true, subtree: true });
        document.querySelector('[data-ov="prev"]').click();
        setTimeout(() => { mo.disconnect(); resolve(c); }, 500);
      }));
      assert.equal(n, 0);
    }));

  test('skeleton giữ khung: có 3 khối thẻ và dùng nền --surface-2, bo --radius-md', () =>
    withPage({ delay: 900 }, async (page) => {
      await page.click('[data-ov="prev"]');
      await page.waitForSelector('.ov-skelcard', { timeout: 3000 });
      const r = await page.evaluate(() => ({ n: document.querySelectorAll('.ov-skelcard').length, bg: getComputedStyle(document.querySelector('.ov-skel')).backgroundColor, rad: getComputedStyle(document.querySelector('.ov-skel')).borderRadius }));
      assert.equal(r.n, 3); assert.equal(r.bg, rgb('#EEF0F4')); assert.equal(r.rad, '12px');
      await sleep(1200); await ready(page);
    }));

  test('đọc dữ liệu lỗi: banner lỗi role=alert + "Thử lại"; số liệu hiện "—", không cảnh báo giả; Thử lại thành công thì phục hồi', () =>
    withPage(async (page) => {
      await page.evaluate(() => { window.__SOTC_FAIL = true; });
      await page.click('[data-ov="prev"]');
      await page.waitForSelector('.ov-err');
      assert.equal(await page.$eval('.ov-err', (e) => e.getAttribute('role')), 'alert');
      assert.match(await text(page, '.ov-err'), /Không đọc được dữ liệu/);
      const c = await cards(page);
      assert.equal(c.income.vis, '—'); assert.equal(c.balance.vis, '—');
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
      assert.ok(!(await exists(page, '[data-ov="first"]')) && !(await exists(page, '[data-ov="empty-month"]')));
      await page.evaluate(() => { window.__SOTC_FAIL = false; });
      await page.click('[data-ov="retry"]'); await settled(page);
      assert.ok(!(await exists(page, '.ov-err')));
      assert.equal((await cards(page)).income.vis, '5.000.000 ₫');
      assert.ok(await exists(page, '[data-ov="warning"]'));
    }));

  test('bản ghi hỏng trong dữ liệu bị bỏ qua, tổng không sai, không lỗi', () =>
    withPage({ data: [] }, async (page) => {
      await page.evaluate(() => {
        const good = { id: 'a', type: 'income', amount: 1000, category: 'luong', date: '2026-10-01', note: '', createdAt: 1, updatedAt: 1 };
        const bad = [{ id: 'b', type: 'income', amount: -5, date: '2026-10-02' }, { id: 'c', type: 'x', amount: 5, date: '2026-10-02' }, { id: 'd', type: 'expense', amount: 1.5, date: '2026-10-02' }, null];
        localStorage.setItem(DemoStore.key, JSON.stringify({ schemaVersion: 1, transactions: [good].concat(bad) }));
      });
      await dispatchChanged(page); await settled(page);
      const c = await cards(page);
      assert.equal(c.income.full, '1.000 ₫'); assert.equal(c.expense.full, '0 ₫');
    }));
});

/* ================= Số tiền lớn ================= */
test.describe('Số tiền rất lớn', () => {
  const BIG = [inc(999999999999, '2026-10-01'), inc(999999999999, '2026-10-02'), exp(123456789012, '2026-10-03')];
  test('360px: thẻ rút gọn (tỷ) khi không đủ chỗ, nhưng giá trị đầy đủ vẫn có cho trình đọc màn hình; không tràn', () =>
    withPage({ width: 360, height: 740, data: BIG }, async (page) => {
      const c = await cards(page);
      assert.equal(c.income.compact, 'true'); assert.match(c.income.vis, /tỷ$/);
      assert.equal(c.income.full, '1.999.999.999.998 ₫');
      assert.equal(c.expense.full, '123.456.789.012 ₫');
      const r = await page.evaluate(() => [...document.querySelectorAll('.ov-vis')].map((v) => v.scrollWidth <= v.clientWidth + 1).concat(document.documentElement.scrollWidth <= innerWidth));
      assert.ok(r.every(Boolean), 'không tràn: ' + r);
    }));
  test('1280px đủ chỗ: hiển thị đầy đủ, không rút gọn', () =>
    withPage({ data: [inc(15200000, '2026-10-01')] }, async (page) => {
      const c = await cards(page);
      assert.equal(c.income.compact, 'false'); assert.equal(c.income.vis, '15.200.000 ₫');
    }));
  test('đổi kích thước cửa sổ: rút gọn/hiện đầy đủ tự cập nhật', () =>
    withPage({ width: 1280, data: BIG }, async (page) => {
      assert.equal((await cards(page)).income.compact, 'false');
      await page.setViewport({ width: 360, height: 740, hasTouch: true, isMobile: true });
      await sleep(300);
      assert.equal((await cards(page)).income.compact, 'true');
      await page.setViewport({ width: 1280, height: 900 });
      await sleep(300);
      assert.equal((await cards(page)).income.compact, 'false');
    }));
});

/* ================= Hiệu năng ================= */
test.describe('Hiệu năng với 5.000 giao dịch', () => {
  test('tổng khớp đáp án và hiển thị < 1,5 giây; đổi tháng vẫn nhanh', () =>
    withPage({ data: [] }, async (page) => {
      const expected = await page.evaluate(() => {
        let seed = 11, i = 0, e = 0; const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
        const list = [];
        for (let k = 0; k < 5000; k++) {
          const type = rnd(2) ? 'income' : 'expense', amount = 1 + rnd(3000000), day = 1 + rnd(28), m = 8 + rnd(3);
          list.push({ type, amount, category: type === 'income' ? 'luong' : 'an-uong', date: `2026-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}` });
          if (m === 10) { if (type === 'income') i += amount; else e += amount; }
        }
        DemoStore.seed(list);
        return { i, e };
      });
      const t0 = Date.now();
      await page.reload({ waitUntil: 'load' }); await ready(page);
      const ms = Date.now() - t0;
      const c = await cards(page);
      const f = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫';
      assert.equal(c.income.full, f(expected.i)); assert.equal(c.expense.full, f(expected.e));
      assert.ok(ms < 1500, `mất ${ms}ms`);
      const t1 = Date.now(); await goPrev(page); assert.ok(Date.now() - t1 < 1000);
    }));
});

/* ================= Bố cục & Responsive ================= */
test.describe('Bố cục theo DESIGN.md', () => {
  const rects = (page) => page.evaluate(() => { const r = (k) => { const b = document.querySelector(`[data-kind="${k}"]`).getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height }; }; return { income: r('income'), expense: r('expense'), balance: r('balance'), iw: innerWidth, sw: document.documentElement.scrollWidth }; });

  test('điện thoại 360px: thẻ Số dư rộng toàn dòng ở trên, Thu/Chi chia đôi bên dưới, không cuộn ngang', () =>
    withPage({ width: 360, height: 740 }, async (page) => {
      const r = await rects(page);
      assert.ok(r.balance.t < r.income.t, 'Số dư ở trên');
      assert.ok(Math.abs(r.balance.w - (r.income.w + r.expense.w + 12)) < 2, 'Số dư rộng bằng cả hàng');
      assert.ok(Math.abs(r.income.w - r.expense.w) < 1.5, 'Thu/Chi bằng nhau');
      assert.ok(r.income.t === r.expense.t && r.income.l < r.expense.l);
      assert.ok(r.sw <= r.iw);
    }));

  for (const w of [768, 1280]) {
    test(`${w}px: 3 thẻ bằng nhau trên một hàng theo thứ tự Tổng thu, Tổng chi, Số dư; không cuộn ngang`, () =>
      withPage({ width: w, height: 800 }, async (page) => {
        const r = await rects(page);
        assert.ok(r.income.l < r.expense.l && r.expense.l < r.balance.l);
        assert.ok(r.income.t === r.expense.t && r.expense.t === r.balance.t);
        assert.ok(Math.abs(r.income.w - r.expense.w) < 1.5 && Math.abs(r.expense.w - r.balance.w) < 1.5);
        assert.ok(r.sw <= r.iw);
      }));
  }

  test('laptop 1440px: khung nội dung tối đa 1120px, căn giữa', () =>
    withPage({ width: 1440, height: 900 }, async (page) => {
      const r = await page.$eval('.ov', (e) => { const b = e.getBoundingClientRect(); return { w: b.width, l: b.left, r: innerWidth - b.right }; });
      assert.equal(Math.round(r.w), 1120); assert.ok(Math.abs(r.l - r.r) < 2);
    }));

  test('kích thước chữ: nhãn tháng H2 18/26 600; số dư điện thoại 32/40; thẻ nhỏ 20/28; tablet+ 24/32; nhãn thẻ 13/18; tabular-nums; font Inter', () =>
    withPage({ width: 360, height: 740 }, async (page) => {
      const s = await page.evaluate(() => { const cs = (q) => getComputedStyle(document.querySelector(q)); return {
        m: [cs('.ov-mlabel').fontSize, cs('.ov-mlabel').lineHeight, cs('.ov-mlabel').fontWeight],
        bal: [cs('[data-kind="balance"] .ov-val').fontSize, cs('[data-kind="balance"] .ov-val').lineHeight, cs('[data-kind="balance"] .ov-val').fontWeight],
        inc: [cs('[data-kind="income"] .ov-val').fontSize, cs('[data-kind="income"] .ov-val').lineHeight],
        lab: [cs('.ov-lab').fontSize, cs('.ov-lab').lineHeight, cs('.ov-lab').fontWeight, cs('.ov-lab').color],
        tn: cs('[data-kind="income"] .ov-val').fontVariantNumeric, font: cs('.ov').fontFamily }; });
      assert.deepEqual(s.m, ['18px', '26px', '600']); assert.deepEqual(s.bal, ['32px', '40px', '700']); assert.deepEqual(s.inc, ['20px', '28px']);
      assert.deepEqual(s.lab.slice(0, 3), ['13px', '18px', '500']); assert.equal(s.lab[3], rgb('#5B6472'));
      assert.match(s.tn, /tabular-nums/); assert.match(s.font, /^Inter, system-ui/);
    }));

  test('tablet/laptop: số trong thẻ 24/32', () =>
    withPage({ width: 1280 }, async (page) => {
      const s = await page.$$eval('.ov-val', (e) => e.map((x) => [getComputedStyle(x).fontSize, getComputedStyle(x).lineHeight]));
      for (const v of s) assert.deepEqual(v, ['24px', '32px']);
    }));

  test('thẻ: nền --surface, bo 16px, đổ bóng --shadow-1, padding 16×20, khoảng cách giữa thẻ 12px', () =>
    withPage(async (page) => {
      const r = await page.$eval('[data-kind="income"]', (e) => { const c = getComputedStyle(e); return [c.backgroundColor, c.borderRadius, c.boxShadow, c.padding]; });
      assert.equal(r[0], rgb('#FFFFFF')); assert.equal(r[1], '16px'); assert.match(r[2], /rgba\(16, 24, 40, 0\.06\) 0px 1px 2px 0px/); assert.equal(r[3], '16px 20px');
      assert.equal(await page.$eval('.ov-sum', (e) => getComputedStyle(e).columnGap), '12px');
    }));

  test('chế độ tối đúng token: thẻ, thu/chi, banner cảnh báo', () =>
    withPage({ dark: true }, async (page) => {
      const c = await cards(page);
      assert.equal(c.income.color, rgb('#3DD598')); assert.equal(c.expense.color, rgb('#FF8A65')); assert.equal(c.balance.color, rgb('#ECEFF4'));
      assert.equal(await page.$eval('[data-kind="income"]', (e) => getComputedStyle(e).backgroundColor), rgb('#181B21'));
      await goPrev(page);
      assert.equal(await page.$eval('[data-ov="warning"]', (e) => getComputedStyle(e).borderLeftColor), rgb('#F2C14E'));
      assert.equal((await cards(page)).balance.color, rgb('#FF8A65'));
    }));

  test('vùng chạm ≥ 44×44: nút ‹ ›, nút trong khối trạng thái', () =>
    withPage(async (page) => {
      const small = async () => page.evaluate(() => [...document.querySelectorAll('.ov button')].filter((b) => b.getClientRects().length).map((b) => { const r = b.getBoundingClientRect(); return { s: b.dataset.ov || b.dataset.action, w: r.width, h: r.height }; }).filter((x) => x.w < 44 || x.h < 44));
      assert.deepEqual(await small(), []);
      await goPrev(page, 2);
      assert.deepEqual(await small(), []);
    }));

  test('bàn phím: Tab tới ‹ rồi Enter lùi tháng; › bị vô hiệu không nhận focus; vòng focus 2px --primary', () =>
    withPage(async (page) => {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.ov), 'prev');
      const o = await page.evaluate(() => { const c = getComputedStyle(document.activeElement); return [c.outlineWidth, c.outlineColor, c.outlineOffset]; });
      assert.deepEqual(o, ['2px', rgb('#2F6FED'), '2px']);
      await page.keyboard.press('Enter'); await settled(page);
      assert.equal(await label(page), 'Tháng 9/2026');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.ov), 'next');
      await page.keyboard.press('Space'); await settled(page);
      assert.equal(await label(page), 'Tháng 10/2026');
      await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(() => !document.activeElement.closest('.ov-mp')), 'sau › bị vô hiệu thì focus rời bộ chọn');
    }));

  test('cấu trúc truy cập: tiêu đề tháng là h2, các thẻ gắn nhãn theo tháng, icon trang trí aria-hidden', () =>
    withPage(async (page) => {
      assert.equal(await page.$eval('[data-ov="label"]', (e) => e.tagName), 'H2');
      assert.equal(await page.$eval('[data-ov="sum"]', (e) => e.getAttribute('aria-labelledby')), 'ov-mlabel');
      assert.equal(await page.$eval('[data-ov="prev"]', (e) => e.getAttribute('aria-label')), 'Tháng trước');
      assert.equal(await page.$eval('[data-ov="next"]', (e) => e.getAttribute('aria-label')), 'Tháng sau');
      assert.ok(await page.$$eval('.ov svg', (s) => s.every((x) => x.getAttribute('aria-hidden') === 'true')));
    }));
});

/* ================= Truy cập (axe) ================= */
test.describe('axe-core: WCAG 2.1 AA', () => {
  const scenarios = [
    ['bình thường', {}, async () => {}],
    ['cảnh báo chi > thu', {}, async (p) => { await goPrev(p); }],
    ['chỉ có chi (chưa có thu)', {}, async (p) => { await goPrev(p, 5); }],
    ['tháng trống', {}, async (p) => { await goPrev(p, 2); }],
    ['lần đầu mở', { data: [] }, async () => {}],
    ['lỗi đọc dữ liệu', {}, async (p) => { await p.evaluate(() => { window.__SOTC_FAIL = true; }); await p.click('[data-ov="prev"]'); await p.waitForSelector('.ov-err'); }]
  ];
  for (const dark of [false, true]) {
    for (const [name, o, act] of scenarios) {
      test(`${dark ? 'tối' : 'sáng'}: ${name}`, () =>
        withPage(Object.assign({ dark }, o), async (page) => {
          await act(page);
          assert.deepEqual(await runAxe(page), []);
        }));
    }
  }
  test('axe ở điện thoại 360px có cảnh báo', () =>
    withPage({ width: 360, height: 740 }, async (page) => { await goPrev(page); assert.deepEqual(await runAxe(page), []); }));
});

/* ================= Hợp đồng ================= */
test.describe('Hợp đồng với module khác', () => {
  test('data-changed ở tháng khác không đổi tháng đang chọn và không lỗi', () =>
    withPage(async (page) => {
      await page.evaluate(() => DemoStore.seed([{ type: 'expense', amount: 5, category: 'an-uong', date: '2025-01-01' }]));
      await dispatchChanged(page); await settled(page);
      assert.equal(await label(page), 'Tháng 10/2026');
      assert.equal((await cards(page)).balance.full, '5.250.000 ₫');
      assert.deepEqual(await months(page), ['2026-10']);
    }));

  test('mount thiếu store/hàm bắt buộc thì ném lỗi rõ ràng', () =>
    withPage(async (page) => {
      const r = await page.evaluate(() => { const out = []; for (const s of [undefined, {}, { listByMonth() {} }]) { try { SoThuChiOverview.mount(document.createElement('div'), { store: s }); out.push('ok'); } catch (e) { out.push(e.message); } } return out; });
      for (const m of r) assert.match(m, /listByMonth\(ym\) và months\(\)/);
    }));

  test('unmount dọn sạch: gỡ giao diện và không còn phản ứng với data-changed', () =>
    withPage(async (page) => {
      await page.evaluate(() => SoThuChiOverview.unmount());
      assert.equal(await page.$eval('#overview', (e) => e.innerHTML), '');
      await dispatchChanged(page); await sleep(150);
      assert.equal(await page.$eval('#overview', (e) => e.innerHTML), '');
      assert.equal(await page.evaluate(() => SoThuChiOverview.getMonth()), null);
    }));

  test('mount lại sau unmount hoạt động bình thường', () =>
    withPage(async (page) => {
      await page.evaluate(() => { SoThuChiOverview.unmount(); return SoThuChiOverview.mount(document.getElementById('overview'), { store: DemoStore, now: () => new Date(2026, 9, 29) }); });
      await ready(page);
      assert.equal((await cards(page)).income.full, '16.000.000 ₫');
    }));

  test('khởi tạo với tháng chỉ định (option month) và ép về khoảng hợp lệ', () =>
    withPage(async (page) => {
      await page.evaluate(() => { SoThuChiOverview.unmount(); return SoThuChiOverview.mount(document.getElementById('overview'), { store: DemoStore, now: () => new Date(2026, 9, 29), month: '2026-09' }); });
      await ready(page);
      assert.equal(await label(page), 'Tháng 9/2026');
      await page.evaluate(() => { SoThuChiOverview.unmount(); return SoThuChiOverview.mount(document.getElementById('overview'), { store: DemoStore, now: () => new Date(2026, 9, 29), month: '2099-01' }); });
      await ready(page);
      assert.equal(await label(page), 'Tháng 10/2026');
    }));

  test('tích hợp: dev M3 giả lập thêm chi/thu → thẻ và cảnh báo cập nhật tức thì', () =>
    withPage({ data: [] }, async (page) => {
      await page.click('[data-dev="exp"]'); await settled(page);
      assert.match(await text(page, '[data-ov="warning"] .ov-bmsg'), /chưa có khoản thu nào nhưng đã chi 500\.000 ₫/);
      await page.click('[data-dev="inc"]'); await settled(page);
      assert.ok(!(await exists(page, '[data-ov="warning"]')));
      const c = await cards(page);
      assert.equal(c.income.full, '1.000.000 ₫'); assert.equal(c.expense.full, '500.000 ₫'); assert.equal(c.balance.full, '500.000 ₫');
    }));
});
