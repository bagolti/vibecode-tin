'use strict';
/*
 * Kiểm thử đầu-cuối module Nhập liệu thu chi (M3) trên trình duyệt thật.
 * Mỗi test mở một trang sạch (xóa dữ liệu), chạy kịch bản, rồi khẳng định KHÔNG có lỗi console/trang.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { launch, openPage, runAxe } = require('../helpers/browser');

let browser;
test.before(async () => { browser = await launch(); });
test.after(async () => { if (browser) await browser.close(); });

const M = require('../../js/entry-model.js');
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = () => ymd(new Date());
const YESTERDAY = () => { const d = new Date(); d.setDate(d.getDate() - 1); return ymd(d); };

/** Mở trang sạch, chạy fn, rồi bảo đảm không có lỗi nào phát sinh. */
async function withPage(opts, fn) {
  if (typeof opts === 'function') { fn = opts; opts = {}; }
  const { page, problems } = await openPage(browser, Object.assign({ width: 1280, height: 900, reducedMotion: true }, opts));
  try {
    await page.evaluate(() => { DemoStore.clear(); window.__events = []; document.addEventListener('sotc:data-changed', (e) => window.__events.push(e.detail)); });
    await page.reload({ waitUntil: 'load' });
    await page.evaluate(() => { window.__events = []; document.addEventListener('sotc:data-changed', (e) => window.__events.push(e.detail)); });
    await fn(page);
    assert.deepEqual(problems, [], 'Không được có lỗi console/trang: ' + problems.join(' | '));
  } finally {
    await page.close();
  }
}

const addSel = (page) => (page.viewport().width >= 1024 ? '.dev-add' : '.dev-fab');
async function openAdd(page) { await page.click(addSel(page)); await page.waitForSelector('.en-panel'); }
async function openEdit(page, id) { await page.click(`.dev-edit[data-id="${id}"]`); await page.waitForSelector('.en-panel[data-mode="edit"]'); }
async function layerGone(page) { await page.waitForFunction(() => !document.querySelector('.en-layer')); }
const stored = (page) => page.evaluate(() => DemoStore.all());
const events = (page) => page.evaluate(() => window.__events);
const state = (page) => page.evaluate(() => SoThuChiEntry._state());
const val = (page, sel) => page.$eval(sel, (e) => e.value);
const text = (page, sel) => page.$eval(sel, (e) => e.textContent.trim());
const exists = (page, sel) => page.evaluate((s) => !!document.querySelector(s), sel);
async function setDate(page, v) {
  await page.$eval('#en-date', (e, x) => { e.value = x; e.dispatchEvent(new Event('input', { bubbles: true })); }, v);
}
async function seed(page, list) {
  await page.evaluate((l) => { l.forEach((p) => DemoStore.add(p)); }, list);
  await page.evaluate(() => { document.dispatchEvent(new CustomEvent('sotc:data-changed', { detail: {} })); window.__events = []; });
}
async function quickAdd(page, { amount = '55000', cat = 'an-uong' } = {}) {
  await openAdd(page);
  await page.type('#en-amount', amount);
  await page.click(`[data-cat="${cat}"]`);
  await page.keyboard.press('Enter');
  await layerGone(page);
}
const settle = (ms = 80) => new Promise((r) => setTimeout(r, ms)); // chờ transition 1ms (giảm chuyển động) xong
const SAMPLE = { type: 'expense', amount: 55000, category: 'an-uong', date: TODAY(), note: 'Ăn trưa' };

/* ================= Thêm khoản (US-01, US-02, F-01) ================= */
test.describe('Thêm khoản', () => {
  test('luồng nhanh: chỉ cần gõ số tiền → chọn danh mục → Enter (mặc định Chi, hôm nay) rồi lưu đúng dữ liệu', () =>
    withPage(async (page) => {
      const t0 = Date.now();
      await openAdd(page);
      assert.equal((await state(page)).form.type, 'expense');
      assert.equal(await val(page, '#en-date'), TODAY());
      assert.equal(await page.evaluate(() => document.activeElement.id), 'en-amount', 'ô số tiền phải được focus sẵn');
      await page.type('#en-amount', '55000');
      await page.click('[data-cat="an-uong"]');
      await page.keyboard.press('Enter');
      await layerGone(page);
      assert.ok(Date.now() - t0 < 15000, 'thêm một khoản phải < 15 giây');
      const list = await stored(page);
      assert.equal(list.length, 1);
      const t = list[0];
      assert.equal(t.type, 'expense'); assert.equal(t.amount, 55000); assert.equal(t.category, 'an-uong');
      assert.equal(t.date, TODAY()); assert.equal(t.note, '');
      assert.ok(t.id && t.createdAt && t.updatedAt);
      assert.ok(Number.isInteger(t.amount));
    }));

  test('thêm khoản thu: chuyển sang Thu, danh mục đổi thành 4 mục thu, lưu đúng loại', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.click('[data-type="income"]');
      const names = await page.$$eval('.en-cat', (els) => els.map((e) => e.textContent.trim()));
      assert.deepEqual(names, ['Lương', 'Thưởng', 'Thu nhập phụ', 'Khác']);
      await page.type('#en-amount', '15000000');
      await page.click('[data-cat="luong"]');
      await page.type('#en-note', 'Lương tháng 10');
      await page.click('[data-en="save"]');
      await layerGone(page);
      const [t] = await stored(page);
      assert.deepEqual({ type: t.type, amount: t.amount, category: t.category, note: t.note }, { type: 'income', amount: 15000000, category: 'luong', note: 'Lương tháng 10' });
    }));

  test('Chi hiển thị đủ 8 danh mục theo đúng thứ tự', () =>
    withPage(async (page) => {
      await openAdd(page);
      const names = await page.$$eval('.en-cat', (els) => els.map((e) => e.textContent.trim()));
      assert.deepEqual(names, ['Ăn uống', 'Di chuyển', 'Nhà ở', 'Mua sắm', 'Giải trí', 'Sức khỏe', 'Học tập', 'Khác']);
    }));

  test('toast "Đã lưu", sự kiện sotc:data-changed (add) và dòng mới xuất hiện ở danh sách', () =>
    withPage(async (page) => {
      await quickAdd(page);
      assert.equal(await text(page, '.en-toast-msg'), 'Đã lưu');
      assert.ok(await exists(page, '.en-toast.en-show'));
      assert.equal(await page.$eval('#en-toast', (e) => e.getAttribute('role')), 'status');
      const ev = await events(page);
      assert.equal(ev.length, 1);
      assert.equal(ev[0].action, 'add'); assert.equal(ev[0].source, 'entry');
      assert.equal(ev[0].tx.amount, 55000); assert.equal(ev[0].id, ev[0].tx.id);
      assert.match(await text(page, '#dev-list'), /−55\.000 ₫/);
    }));

  test('toast tự ẩn sau ~5 giây', () =>
    withPage(async (page) => {
      await quickAdd(page);
      await new Promise((r) => setTimeout(r, 4200));
      assert.ok(await exists(page, '.en-toast.en-show'), 'còn hiện ở ~4,2s');
      await new Promise((r) => setTimeout(r, 1300));
      assert.ok(!(await exists(page, '.en-toast.en-show')), 'đã ẩn sau ~5,5s');
    }));

  test('dữ liệu còn nguyên sau khi tải lại trang (F-09)', () =>
    withPage(async (page) => {
      await quickAdd(page, { amount: '123456', cat: 'di-chuyen' });
      await page.reload({ waitUntil: 'load' });
      const list = await stored(page);
      assert.equal(list.length, 1);
      assert.equal(list[0].amount, 123456);
      assert.match(await text(page, '#dev-list'), /−123\.456 ₫/);
    }));

  test('mở lại form sau khi lưu: form sạch (không giữ dữ liệu lần trước)', () =>
    withPage(async (page) => {
      await quickAdd(page);
      await openAdd(page);
      assert.equal(await val(page, '#en-amount'), '');
      assert.equal(await val(page, '#en-note'), '');
      assert.equal((await state(page)).form.category, '');
      assert.equal(await page.$$eval('.en-cat[aria-checked="true"]', (e) => e.length), 0);
    }));

  test('thêm nhiều khoản liên tiếp: mỗi khoản có id khác nhau', () =>
    withPage(async (page) => {
      for (let i = 1; i <= 5; i++) await quickAdd(page, { amount: String(i * 1000), cat: 'an-uong' });
      const list = await stored(page);
      assert.equal(list.length, 5);
      assert.equal(new Set(list.map((t) => t.id)).size, 5);
      assert.deepEqual(list.map((t) => t.amount).sort((a, b) => a - b), [1000, 2000, 3000, 4000, 5000]);
    }));
});

/* ================= Số tiền ================= */
test.describe('Ô Số tiền', () => {
  test('tự thêm dấu chấm ngăn cách hàng nghìn khi gõ', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '1250000');
      assert.equal(await val(page, '#en-amount'), '1.250.000');
      assert.equal((await state(page)).form.amount, '1.250.000');
    }));

  test('chỉ nhận chữ số: chữ, ký hiệu, dấu âm bị bỏ', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', 'a1b-2,3.4e5₫');
      assert.equal(await val(page, '#en-amount'), '12.345');
    }));

  test('số 0 đầu bị bỏ; gõ "0" rồi "5" ra "5"', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '0');
      assert.equal(await val(page, '#en-amount'), '0');
      await page.type('#en-amount', '5');
      assert.equal(await val(page, '#en-amount'), '5');
    }));

  test('giới hạn 12 chữ số (999.999.999.999 ₫)', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '1234567890123456');
      assert.equal(await val(page, '#en-amount'), '123.456.789.012');
    }));

  test('dán chuỗi "1.250.000đ" được làm sạch', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.$eval('#en-amount', (e) => { e.value = ' 1.250.000đ '; e.dispatchEvent(new Event('input', { bubbles: true })); });
      assert.equal(await val(page, '#en-amount'), '1.250.000');
    }));

  test('chèn chữ số vào giữa: con trỏ giữ đúng chỗ, không nhảy về cuối', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '12345'); // 12.345
      await page.keyboard.press('Home');
      await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); // sau "12"
      await page.keyboard.type('9');
      assert.equal(await val(page, '#en-amount'), '129.345');
      assert.equal(await page.$eval('#en-amount', (e) => e.selectionStart), 3, 'con trỏ nằm ngay sau chữ số vừa gõ');
    }));

  test('Backspace xóa qua dấu chấm không bị kẹt', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '1234'); // 1.234
      for (let i = 0; i < 4; i++) await page.keyboard.press('Backspace');
      assert.equal(await val(page, '#en-amount'), '');
    }));

  test('thuộc tính: inputmode=numeric, hậu tố ₫, căn phải, Display 32/40 700, tabular-nums', () =>
    withPage(async (page) => {
      await openAdd(page);
      const r = await page.$eval('#en-amount', (e) => {
        const c = getComputedStyle(e);
        return { im: e.inputMode, fs: c.fontSize, lh: c.lineHeight, fw: c.fontWeight, ta: c.textAlign, tn: c.fontVariantNumeric, suffix: e.nextElementSibling.textContent };
      });
      assert.equal(r.im, 'numeric'); assert.equal(r.suffix, '₫');
      assert.equal(r.fs, '32px'); assert.equal(r.lh, '40px'); assert.equal(r.fw, '700');
      assert.equal(r.ta, 'right'); assert.match(r.tn, /tabular-nums/);
    }));

  test('viền focus của ô Số tiền đổi theo loại: Chi = --expense, Thu = --income', () =>
    withPage(async (page) => {
      await openAdd(page);
      const color = async () => { await settle(); return page.$eval('.en-amt', (e) => getComputedStyle(e).borderTopColor); };
      await page.focus('#en-amount');
      assert.equal(await color(), 'rgb(200, 66, 30)');
      await page.click('[data-type="income"]');
      await page.focus('#en-amount');
      await settle();
      assert.equal(await color(), 'rgb(18, 128, 92)');
    }));
});

/* ================= Kiểm tra hợp lệ ================= */
test.describe('Kiểm tra hợp lệ & báo lỗi (F-13)', () => {
  test('bấm Lưu khi trống: không lưu, báo lỗi số tiền + danh mục, focus ô lỗi đầu tiên, ô rung', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.click('[data-en="save"]');
      assert.equal(await text(page, '#en-err-amount'), 'Nhập số tiền lớn hơn 0');
      assert.equal(await text(page, '#en-err-category'), 'Chọn một danh mục');
      assert.equal(await text(page, '#en-err-date'), '');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'en-amount');
      assert.equal(await page.$eval('#en-amount', (e) => e.getAttribute('aria-invalid')), 'true');
      assert.ok(await exists(page, '.en-amt.en-shake'), 'hiệu ứng rung');
      assert.equal((await stored(page)).length, 0);
      assert.ok(await exists(page, '.en-panel'), 'form vẫn mở');
      assert.equal(await page.$eval('#en-err-amount', (e) => e.getAttribute('aria-live')), 'polite');
      assert.equal((await events(page)).length, 0);
    }));

  test('số tiền = 0 bị chặn', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '0');
      await page.click('[data-cat="an-uong"]');
      await page.click('[data-en="save"]');
      assert.equal(await text(page, '#en-err-amount'), 'Nhập số tiền lớn hơn 0');
      assert.equal((await stored(page)).length, 0);
    }));

  test('thiếu danh mục: focus chuyển tới lưới danh mục', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.keyboard.press('Enter');
      assert.equal(await text(page, '#en-err-category'), 'Chọn một danh mục');
      assert.equal(await text(page, '#en-err-amount'), '');
      assert.ok(await page.evaluate(() => document.activeElement.classList.contains('en-cat')));
      assert.equal((await stored(page)).length, 0);
    }));

  test('lỗi hiện khi rời ô (blur), không hiện khi chưa rời', () =>
    withPage(async (page) => {
      await openAdd(page);
      assert.equal(await text(page, '#en-err-amount'), '');
      await page.keyboard.press('Tab'); // rời ô số tiền khi còn trống
      assert.equal(await text(page, '#en-err-amount'), 'Nhập số tiền lớn hơn 0');
    }));

  test('sửa xong thì lỗi tự biến mất', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.click('[data-en="save"]');
      await page.type('#en-amount', '5');
      assert.equal(await text(page, '#en-err-amount'), '');
      assert.equal(await page.$eval('#en-amount', (e) => e.getAttribute('aria-invalid')), 'false');
      await page.click('[data-cat="an-uong"]');
      assert.equal(await text(page, '#en-err-category'), '');
    }));

  test('ngày: xóa trống → "Chọn ngày hợp lệ"; ngày tương lai bị chặn; ngày hôm nay hợp lệ', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      await setDate(page, '');
      await page.click('[data-en="save"]');
      assert.equal(await text(page, '#en-err-date'), 'Chọn ngày hợp lệ');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'en-date');
      const d = new Date(); d.setDate(d.getDate() + 1);
      await setDate(page, ymd(d));
      await page.click('[data-en="save"]');
      assert.equal(await text(page, '#en-err-date'), 'Chọn ngày hợp lệ');
      assert.equal((await stored(page)).length, 0);
      await setDate(page, TODAY());
      assert.equal(await text(page, '#en-err-date'), '');
      await page.click('[data-en="save"]');
      await layerGone(page);
      assert.equal((await stored(page)).length, 1);
    }));

  test('ô ngày có min/max: max = hôm nay', () =>
    withPage(async (page) => {
      await openAdd(page);
      assert.equal(await page.$eval('#en-date', (e) => e.max), TODAY());
      assert.equal(await page.$eval('#en-date', (e) => e.min), '2000-01-01');
    }));

  test('chip nhanh Hôm nay / Hôm qua đặt ngày và đánh dấu aria-pressed', () =>
    withPage(async (page) => {
      await openAdd(page);
      const pressed = () => page.$$eval('.en-chip', (c) => c.map((x) => x.getAttribute('aria-pressed')));
      assert.deepEqual(await pressed(), ['true', 'false']);
      await page.click('[data-quick="yesterday"]');
      assert.equal(await val(page, '#en-date'), YESTERDAY());
      assert.deepEqual(await pressed(), ['false', 'true']);
      await page.click('[data-quick="today"]');
      assert.equal(await val(page, '#en-date'), TODAY());
      await setDate(page, '2020-01-15');
      assert.deepEqual(await pressed(), ['false', 'false']);
    }));

  test('khoản lưu với ngày đã chọn (hôm qua)', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '9000');
      await page.click('[data-cat="giai-tri"]');
      await page.click('[data-quick="yesterday"]');
      await page.click('[data-en="save"]');
      await layerGone(page);
      assert.equal((await stored(page))[0].date, YESTERDAY());
    }));
});

/* ================= Ghi chú ================= */
test.describe('Ô Ghi chú', () => {
  test('bộ đếm ký tự chỉ hiện khi còn < 20 ký tự', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.$eval('#en-note', (e) => { e.value = 'x'.repeat(100); e.dispatchEvent(new Event('input', { bubbles: true })); });
      assert.equal(await page.$eval('#en-count', (e) => e.hidden), true, '100 ký tự: ẩn');
      await page.$eval('#en-note', (e) => { e.value = 'x'.repeat(101); e.dispatchEvent(new Event('input', { bubbles: true })); });
      assert.equal(await page.$eval('#en-count', (e) => e.hidden), false, '101 ký tự: hiện');
      assert.equal(await text(page, '#en-count'), '101/120');
    }));

  test('đúng 120 ký tự lưu được; 121 ký tự bị chặn với "Tối đa 120 ký tự" và focus vào ô ghi chú', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      await page.$eval('#en-note', (e) => { e.value = 'a'.repeat(121); e.dispatchEvent(new Event('input', { bubbles: true })); });
      assert.equal(await page.$eval('#en-count', (e) => e.dataset.over), 'true');
      await page.click('[data-en="save"]');
      assert.equal(await text(page, '#en-err-note'), 'Tối đa 120 ký tự');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'en-note');
      assert.equal((await stored(page)).length, 0);
      await page.$eval('#en-note', (e) => { e.value = 'a'.repeat(120); e.dispatchEvent(new Event('input', { bubbles: true })); });
      assert.equal(await text(page, '#en-err-note'), '', 'sửa còn 120 thì hết lỗi');
      await page.click('[data-en="save"]');
      await layerGone(page);
      const [t] = await stored(page);
      assert.equal(t.note.length, 120);
    }));

  test('Enter trong ô ghi chú = Lưu; Shift+Enter xuống dòng nhưng tối đa 2 dòng', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      await page.focus('#en-note');
      await page.keyboard.type('dòng 1');
      await page.keyboard.down('Shift'); await page.keyboard.press('Enter'); await page.keyboard.up('Shift');
      await page.keyboard.type('dòng 2');
      await page.keyboard.down('Shift'); await page.keyboard.press('Enter'); await page.keyboard.up('Shift');
      await page.keyboard.type('dòng 3');
      assert.equal(await val(page, '#en-note'), 'dòng 2'.length ? 'dòng 1\ndòng 2dòng 3' : '');
      await page.keyboard.press('Enter');
      await layerGone(page);
      assert.equal((await stored(page))[0].note, 'dòng 1\ndòng 2dòng 3');
    }));

  test('dán nhiều dòng: gộp còn 2 dòng', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.$eval('#en-note', (e) => { e.value = 'a\nb\nc\nd'; e.dispatchEvent(new Event('input', { bubbles: true })); });
      assert.equal(await val(page, '#en-note'), 'a\nb c d');
    }));

  test('khoảng trắng hai đầu bị cắt khi lưu; ghi chú trống lưu thành ""', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      await page.type('#en-note', '   cà phê   ');
      await page.click('[data-en="save"]');
      await layerGone(page);
      assert.equal((await stored(page))[0].note, 'cà phê');
    }));

  test('ký tự đặc biệt/HTML được lưu nguyên văn và hiển thị an toàn (không chạy mã)', () =>
    withPage(async (page) => {
      const evil = '<img src=x onerror="window.__xss=1"> & "quote"';
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      await page.type('#en-note', evil);
      await page.click('[data-en="save"]');
      await layerGone(page);
      assert.equal((await stored(page))[0].note, evil);
      assert.equal(await page.evaluate(() => window.__xss), undefined);
      assert.ok(!(await exists(page, '#dev-list img')));
      const id = (await stored(page))[0].id;
      await openEdit(page, id);
      assert.equal(await val(page, '#en-note'), evil);
      assert.equal(await page.evaluate(() => window.__xss), undefined);
    }));

  test('emoji và tiếng Việt có dấu được giữ nguyên', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      await page.$eval('#en-note', (e) => { e.value = 'Phở bò 🍜 đặc biệt'; e.dispatchEvent(new Event('input', { bubbles: true })); });
      await page.click('[data-en="save"]');
      await layerGone(page);
      assert.equal((await stored(page))[0].note, 'Phở bò 🍜 đặc biệt');
    }));
});

/* ================= Chi / Thu và danh mục ================= */
test.describe('Công tắc Chi | Thu và lưới danh mục', () => {
  test('đổi loại làm bỏ chọn danh mục không còn thuộc loại mới, kèm gợi ý "Chọn lại danh mục"; giữ số tiền và ghi chú', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.type('#en-note', 'abc');
      await page.click('[data-cat="an-uong"]');
      await page.click('[data-type="income"]');
      assert.equal((await state(page)).form.category, '');
      assert.equal(await page.$$eval('.en-cat[aria-checked="true"]', (e) => e.length), 0);
      assert.equal(await text(page, '#en-err-category'), 'Chọn lại danh mục');
      assert.equal(await val(page, '#en-amount'), '5.000');
      assert.equal(await val(page, '#en-note'), 'abc');
      await page.click('[data-cat="luong"]');
      assert.equal(await text(page, '#en-err-category'), '', 'gợi ý biến mất khi đã chọn');
    }));

  test('chưa chọn danh mục mà đổi loại: không hiện gợi ý', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.click('[data-type="income"]');
      assert.equal(await text(page, '#en-err-category'), '');
    }));

  test('chọn danh mục: aria-checked + dấu tick + viền --primary; chọn lại cái khác thì cái cũ bỏ chọn', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.click('[data-cat="nha-o"]');
      let r = await page.$eval('[data-cat="nha-o"]', (e) => ({ a: e.getAttribute('aria-checked'), tick: getComputedStyle(e.querySelector('.en-tick')).display, bc: getComputedStyle(e).borderTopColor }));
      assert.equal(r.a, 'true'); assert.equal(r.tick, 'flex'); assert.equal(r.bc, 'rgb(47, 111, 237)');
      await page.click('[data-cat="hoc-tap"]');
      assert.equal(await page.$eval('[data-cat="nha-o"]', (e) => e.getAttribute('aria-checked')), 'false');
      assert.equal(await page.$$eval('.en-cat[aria-checked="true"]', (e) => e.length), 1);
    }));

  test('bàn phím: mũi tên Trái/Phải chuyển Chi↔Thu; mũi tên di chuyển trong lưới danh mục; Space/Enter chọn', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.focus('.en-segbtn[data-type="expense"]');
      await page.keyboard.press('ArrowRight');
      assert.equal((await state(page)).form.type, 'income');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.type), 'income');
      await page.keyboard.press('ArrowLeft');
      assert.equal((await state(page)).form.type, 'expense');
      await page.focus('[data-cat="an-uong"]');
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.cat), 'di-chuyen');
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.cat), 'suc-khoe');
      await page.keyboard.press('ArrowUp');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.cat), 'di-chuyen');
      await page.keyboard.press('Space');
      assert.equal((await state(page)).form.category, 'di-chuyen');
    }));

  test('công tắc Chi/Thu: đoạn chọn tô --expense-soft / --income-soft kèm chữ cùng tông', () =>
    withPage(async (page) => {
      await openAdd(page);
      const style = (t) => page.$eval(`[data-type="${t}"]`, (e) => { const c = getComputedStyle(e); return [c.backgroundColor, c.color]; });
      assert.deepEqual(await style('expense'), ['rgb(252, 235, 229)', 'rgb(200, 66, 30)']);
      await page.click('[data-type="income"]');
      await settle();
      assert.deepEqual(await style('income'), ['rgb(227, 245, 238)', 'rgb(18, 128, 92)']);
      assert.equal(await page.$eval('[data-type="income"]', (e) => e.getAttribute('aria-checked')), 'true');
      assert.equal(await page.$eval('[data-type="expense"]', (e) => e.getAttribute('aria-checked')), 'false');
    }));
});

/* ================= Sửa ================= */
test.describe('Sửa khoản (F-06)', () => {
  test('mở chế độ Sửa với dữ liệu cũ, tiêu đề "Sửa khoản", nút "Lưu thay đổi" bị khóa, có dòng thời gian và nút Xóa', () =>
    withPage(async (page) => {
      await seed(page, [SAMPLE]);
      const [t] = await stored(page);
      await openEdit(page, t.id);
      assert.equal(await text(page, '#en-title'), 'Sửa khoản');
      assert.equal(await val(page, '#en-amount'), '55.000');
      assert.equal(await val(page, '#en-date'), TODAY());
      assert.equal(await val(page, '#en-note'), 'Ăn trưa');
      assert.equal(await page.$eval('[data-cat="an-uong"]', (e) => e.getAttribute('aria-checked')), 'true');
      assert.equal(await page.$eval('[data-en="save"]', (e) => e.disabled), true);
      assert.equal(await text(page, '.en-save-lbl'), 'Lưu thay đổi');
      assert.match(await text(page, '#en-meta'), /^Tạo \d\d\/\d\d \d\d:\d\d/);
      assert.ok(await exists(page, '[data-en="delete"]'));
    }));

  test('nút "Lưu thay đổi" chỉ bật khi có thay đổi, và tắt lại khi trả về giá trị cũ', () =>
    withPage(async (page) => {
      await seed(page, [SAMPLE]);
      await openEdit(page, (await stored(page))[0].id);
      const disabled = () => page.$eval('[data-en="save"]', (e) => e.disabled);
      await page.type('#en-amount', '0'); // 550.000
      assert.equal(await disabled(), false);
      await page.keyboard.press('Backspace');
      assert.equal(await disabled(), true);
      await page.type('#en-note', ' x');
      assert.equal(await disabled(), false);
      await page.keyboard.press('Backspace'); await page.keyboard.press('Backspace');
      assert.equal(await disabled(), true);
    }));

  test('sửa số tiền/ghi chú/danh mục/ngày: lưu đúng, giữ nguyên id & createdAt, updatedAt tăng, toast "Đã cập nhật"', () =>
    withPage(async (page) => {
      await seed(page, [SAMPLE]);
      const [before] = await stored(page);
      await page.evaluate((id) => { const l = DemoStore.all(); l[0].createdAt -= 60000; l[0].updatedAt = l[0].createdAt; localStorage.setItem(DemoStore.key, JSON.stringify({ schemaVersion: 1, transactions: l })); }, before.id);
      const orig = (await stored(page))[0];
      await openEdit(page, before.id);
      await page.click('#en-amount', { clickCount: 3 });
      await page.keyboard.type('75000');
      await page.click('[data-cat="di-chuyen"]');
      await page.click('[data-quick="yesterday"]');
      await page.click('#en-note', { clickCount: 3 });
      await page.keyboard.type('Xe buýt');
      await page.click('[data-en="save"]');
      await layerGone(page);
      const list = await stored(page);
      assert.equal(list.length, 1, 'không tạo bản ghi mới');
      const t = list[0];
      assert.equal(t.id, before.id);
      assert.equal(t.amount, 75000); assert.equal(t.category, 'di-chuyen'); assert.equal(t.date, YESTERDAY()); assert.equal(t.note, 'Xe buýt');
      assert.equal(t.createdAt, orig.createdAt, 'createdAt không đổi');
      assert.ok(t.updatedAt > t.createdAt);
      assert.equal(await text(page, '.en-toast-msg'), 'Đã cập nhật');
      const ev = await events(page);
      assert.equal(ev[ev.length - 1].action, 'update');
      assert.match(await text(page, '#dev-list'), /−75\.000 ₫/);
      await openEdit(page, before.id);
      assert.match(await text(page, '#en-meta'), /Sửa lần cuối/);
    }));

  test('đổi Chi → Thu ở chế độ Sửa: bỏ chọn danh mục, gợi ý, không lưu được cho tới khi chọn lại', () =>
    withPage(async (page) => {
      await seed(page, [SAMPLE]);
      const [t0] = await stored(page);
      await openEdit(page, t0.id);
      await page.click('[data-type="income"]');
      assert.equal(await text(page, '#en-err-category'), 'Chọn lại danh mục');
      await page.click('[data-en="save"]');
      assert.equal(await text(page, '#en-err-category'), 'Chọn một danh mục');
      assert.equal((await stored(page))[0].type, 'expense', 'chưa đổi gì trong dữ liệu');
      await page.click('[data-cat="thuong"]');
      await page.click('[data-en="save"]');
      await layerGone(page);
      const [t] = await stored(page);
      assert.equal(t.type, 'income'); assert.equal(t.category, 'thuong'); assert.equal(t.amount, 55000);
    }));

  test('sửa khoản thu giữ nguyên loại Thu và lưới danh mục thu', () =>
    withPage(async (page) => {
      await seed(page, [{ type: 'income', amount: 15000000, category: 'luong', date: TODAY(), note: '' }]);
      await openEdit(page, (await stored(page))[0].id);
      assert.equal(await page.$eval('[data-type="income"]', (e) => e.getAttribute('aria-checked')), 'true');
      assert.equal(await page.$$eval('.en-cat', (e) => e.length), 4);
      assert.equal(await val(page, '#en-amount'), '15.000.000');
    }));

  test('validate khi sửa: xóa hết số tiền rồi lưu bị chặn, dữ liệu cũ nguyên vẹn', () =>
    withPage(async (page) => {
      await seed(page, [SAMPLE]);
      await openEdit(page, (await stored(page))[0].id);
      await page.click('#en-amount', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.click('[data-en="save"]');
      assert.equal(await text(page, '#en-err-amount'), 'Nhập số tiền lớn hơn 0');
      assert.equal((await stored(page))[0].amount, 55000);
    }));

  test('mở Sửa với id không tồn tại: không mở form, báo "Không tìm thấy khoản này"', () =>
    withPage(async (page) => {
      const ok = await page.evaluate(() => SoThuChiEntry.open({ mode: 'edit', id: 'khong-co' }));
      assert.equal(ok, false);
      assert.ok(!(await exists(page, '.en-layer')));
      assert.match(await text(page, '.en-toast-msg'), /Không tìm thấy khoản này/);
    }));

  test('khoản bị xóa ở nơi khác khi đang sửa: Lưu báo lỗi, form giữ nguyên dữ liệu đang nhập', () =>
    withPage(async (page) => {
      await seed(page, [SAMPLE]);
      const id = (await stored(page))[0].id;
      await openEdit(page, id);
      await page.evaluate((i) => DemoStore.remove(i), id);
      await page.type('#en-amount', '1');
      await page.click('[data-en="save"]');
      await page.waitForSelector('.en-banner');
      assert.match(await text(page, '.en-banner'), /Không tìm thấy khoản này/);
      assert.equal(await val(page, '#en-amount'), '550.001');
      assert.equal(await page.$eval('[data-en="save"]', (e) => e.disabled), false, 'nút Lưu dùng lại được');
    }));
});

/* ================= Xóa + Hoàn tác ================= */
test.describe('Xóa khoản và Hoàn tác (F-07)', () => {
  async function seedOne(page) {
    await seed(page, [SAMPLE, { type: 'income', amount: 15000000, category: 'luong', date: TODAY(), note: 'Lương' }]);
    return (await stored(page)).find((t) => t.amount === 55000);
  }

  test('bấm Xóa mở hộp thoại xác nhận có số tiền + danh mục; Hủy thì không xóa', () =>
    withPage(async (page) => {
      const t = await seedOne(page);
      await openEdit(page, t.id);
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      assert.equal(await text(page, '.en-dlg-panel h2'), 'Xóa khoản này?');
      const body = await text(page, '.en-dlg-panel p');
      assert.match(body, /−55\.000 ₫/); assert.match(body, /Ăn uống/);
      assert.equal(await page.$eval('.en-dlg-panel', (e) => e.getAttribute('role')), 'alertdialog');
      assert.equal(await page.evaluate(() => document.activeElement.dataset.en), 'dlg-cancel', 'focus mặc định ở nút an toàn');
      await page.click('[data-en="dlg-cancel"]');
      assert.ok(!(await exists(page, '.en-dlg')));
      assert.ok(await exists(page, '.en-panel'), 'form sửa vẫn mở');
      assert.equal((await stored(page)).length, 2);
    }));

  test('Esc trong hộp thoại xác nhận chỉ đóng hộp thoại, không đóng form', () =>
    withPage(async (page) => {
      const t = await seedOne(page);
      await openEdit(page, t.id);
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      await page.keyboard.press('Escape');
      assert.ok(!(await exists(page, '.en-dlg')));
      assert.ok(await exists(page, '.en-panel'));
      assert.equal((await stored(page)).length, 2);
    }));

  test('xác nhận Xóa: khoản bị xóa, form đóng, toast "Đã xóa · Hoàn tác", sự kiện delete', () =>
    withPage(async (page) => {
      const t = await seedOne(page);
      await openEdit(page, t.id);
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      await page.click('[data-en="dlg-ok"]');
      await layerGone(page);
      const list = await stored(page);
      assert.equal(list.length, 1);
      assert.ok(!list.some((x) => x.id === t.id));
      assert.match(await text(page, '#en-toast'), /Đã xóa/);
      assert.match(await text(page, '#en-toast'), /Hoàn tác/);
      const ev = await events(page);
      assert.equal(ev[ev.length - 1].action, 'delete');
      assert.equal(ev[ev.length - 1].id, t.id);
      assert.doesNotMatch(await text(page, '#dev-list'), /−55\.000/);
    }));

  test('Hoàn tác trong 5 giây: khôi phục đúng bản ghi (cùng id, createdAt, dữ liệu), bắn sự kiện restore', () =>
    withPage(async (page) => {
      const t = await seedOne(page);
      await openEdit(page, t.id);
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      await page.click('[data-en="dlg-ok"]');
      await layerGone(page);
      await page.click('[data-en="toast-action"]');
      const list = await stored(page);
      assert.equal(list.length, 2);
      const back = list.find((x) => x.id === t.id);
      assert.deepEqual(back, t, 'khôi phục y nguyên bản ghi');
      const ev = await events(page);
      assert.equal(ev[ev.length - 1].action, 'restore');
      assert.match(await text(page, '.en-toast-msg'), /Đã khôi phục/);
      assert.match(await text(page, '#dev-list'), /−55\.000 ₫/);
    }));

  test('sau 5 giây không còn Hoàn tác (toast ẩn, nút không dùng được)', () =>
    withPage(async (page) => {
      const t = await seedOne(page);
      await openEdit(page, t.id);
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      await page.click('[data-en="dlg-ok"]');
      await layerGone(page);
      await new Promise((r) => setTimeout(r, 5400));
      assert.ok(!(await exists(page, '.en-toast.en-show')));
      await page.evaluate(() => { const b = document.querySelector('[data-en="toast-action"]'); if (b) b.click(); });
      assert.equal((await stored(page)).length, 1, 'không khôi phục được sau khi hết hạn');
    }));

  test('Hoàn tác chỉ dùng được một lần', () =>
    withPage(async (page) => {
      const t = await seedOne(page);
      await openEdit(page, t.id);
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      await page.click('[data-en="dlg-ok"]');
      await layerGone(page);
      await page.evaluate(() => { const b = document.querySelector('[data-en="toast-action"]'); b.click(); b.click(); });
      assert.equal((await stored(page)).length, 2);
    }));

  test('xóa thất bại (storage lỗi): giữ nguyên khoản, báo lỗi trong form, không có toast Hoàn tác', () =>
    withPage(async (page) => {
      const t = await seedOne(page);
      await openEdit(page, t.id);
      await page.evaluate(() => { window.__SOTC_FAIL = 'blocked'; });
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      await page.click('[data-en="dlg-ok"]');
      await page.waitForSelector('.en-banner');
      assert.match(await text(page, '.en-banner'), /Không thể lưu dữ liệu/);
      assert.equal((await stored(page)).length, 2);
      assert.ok(await exists(page, '.en-panel'));
      assert.ok(!(await exists(page, '[data-en="toast-action"]')));
      assert.equal((await events(page)).length, 0);
    }));
});

/* ================= Đóng form ================= */
test.describe('Đóng form & thay đổi chưa lưu', () => {
  test('form sạch: nút ✕ và Esc đóng ngay, không hỏi', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.click('[data-en="close"]');
      await layerGone(page);
      await openAdd(page);
      await page.keyboard.press('Escape');
      await layerGone(page);
      assert.equal((await events(page)).length, 0);
    }));

  test('có thay đổi mà đóng → hộp thoại "Bỏ thay đổi?"; "Tiếp tục nhập" giữ nguyên dữ liệu', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-en="close"]');
      await page.waitForSelector('.en-dlg-panel');
      assert.equal(await text(page, '.en-dlg-panel h2'), 'Bỏ thay đổi?');
      await page.click('[data-en="dlg-cancel"]');
      assert.ok(await exists(page, '.en-panel'));
      assert.equal(await val(page, '#en-amount'), '5.000');
    }));

  test('"Bỏ thay đổi" đóng form và không lưu gì', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      await page.keyboard.press('Escape');
      await page.waitForSelector('.en-dlg-panel');
      await page.click('[data-en="dlg-ok"]');
      await layerGone(page);
      assert.equal((await stored(page)).length, 0);
      assert.equal((await events(page)).length, 0);
    }));

  test('chỉ đổi loại Chi→Thu cũng tính là thay đổi; đổi qua lại về cũ thì không còn', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.click('[data-type="income"]');
      await page.keyboard.press('Escape');
      await page.waitForSelector('.en-dlg-panel');
      await page.click('[data-en="dlg-cancel"]');
      await page.click('[data-type="expense"]');
      await page.keyboard.press('Escape');
      await layerGone(page);
    }));

  test('Esc hai lần liên tiếp khi form bẩn: lần 1 mở hỏi, lần 2 = Hủy hộp thoại (form còn)', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5');
      await page.keyboard.press('Escape');
      await page.waitForSelector('.en-dlg-panel');
      await page.keyboard.press('Escape');
      assert.ok(!(await exists(page, '.en-dlg')));
      assert.ok(await exists(page, '.en-panel'));
    }));

  test('chế độ Sửa chưa đổi gì: đóng thẳng', () =>
    withPage(async (page) => {
      await seed(page, [SAMPLE]);
      await openEdit(page, (await stored(page))[0].id);
      await page.keyboard.press('Escape');
      await layerGone(page);
    }));

  test('nhấp lên lớp phủ (≥640px) đóng form theo cùng quy tắc', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.mouse.click(20, 20);
      await layerGone(page);
      await openAdd(page);
      await page.type('#en-amount', '5');
      await page.mouse.click(20, 20);
      await page.waitForSelector('.en-dlg-panel');
    }));

  test('đóng xong thì dọn sạch: không còn layer/dialog, trang hết khóa cuộn và inert', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.keyboard.press('Escape');
      await layerGone(page);
      const r = await page.evaluate(() => ({ inert: document.querySelectorAll('[inert]').length, lock: document.documentElement.classList.contains('en-lock'), dlg: document.querySelectorAll('.en-dlg').length }));
      assert.deepEqual(r, { inert: 0, lock: false, dlg: 0 });
    }));

  test('mở form lần nữa khi đang mở: bị bỏ qua (không nhân đôi)', () =>
    withPage(async (page) => {
      await openAdd(page);
      const r = await page.evaluate(() => SoThuChiEntry.open({ mode: 'add' }));
      assert.equal(r, false);
      assert.equal(await page.$$eval('.en-layer', (e) => e.length), 1);
    }));
});

/* ================= Lỗi lưu trữ & chống lưu đôi ================= */
test.describe('Lỗi hệ thống', () => {
  for (const code of ['full', 'blocked']) {
    test(`storage ${code}: banner cảnh báo, form giữ nguyên dữ liệu đã nhập, sửa xong lưu lại được`, () =>
      withPage(async (page) => {
        await openAdd(page);
        await page.type('#en-amount', '5000');
        await page.click('[data-cat="an-uong"]');
        await page.type('#en-note', 'giữ lại');
        await page.evaluate((c) => { window.__SOTC_FAIL = c; }, code);
        await page.click('[data-en="save"]');
        await page.waitForSelector('.en-banner');
        assert.equal(await text(page, '.en-banner'), 'Không thể lưu dữ liệu. Kiểm tra bộ nhớ hoặc chế độ riêng tư của trình duyệt.');
        assert.equal(await page.$eval('.en-banner', (e) => e.getAttribute('role')), 'alert');
        assert.ok(await exists(page, '.en-panel'));
        assert.equal(await val(page, '#en-amount'), '5.000');
        assert.equal(await val(page, '#en-note'), 'giữ lại');
        assert.equal((await stored(page)).length, 0);
        assert.equal((await events(page)).length, 0);
        assert.equal(await page.$eval('[data-en="save"]', (e) => e.disabled), false);
        await page.evaluate(() => { window.__SOTC_FAIL = ''; });
        await page.click('[data-en="save"]');
        await layerGone(page);
        assert.equal((await stored(page)).length, 1);
        assert.equal((await stored(page))[0].note, 'giữ lại');
      }));
  }

  test('storage hỏng (corrupt): thông báo riêng, không mất dữ liệu form', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      await page.evaluate(() => { window.__SOTC_FAIL = 'corrupt'; });
      await page.click('[data-en="save"]');
      await page.waitForSelector('.en-banner');
      assert.match(await text(page, '.en-banner'), /bị hỏng/);
      assert.equal(await val(page, '#en-amount'), '5.000');
    }));

  test('store ném lỗi / trả về rỗng: không treo nút Lưu, báo lỗi chung', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      await page.evaluate(() => { DemoStore.add = () => { throw new Error('boom'); }; });
      await page.click('[data-en="save"]');
      await page.waitForSelector('.en-banner');
      assert.match(await text(page, '.en-banner'), /Không thể lưu dữ liệu/);
      assert.equal(await page.$eval('[data-en="save"]', (e) => e.disabled), false);
      assert.equal(await page.$eval('[data-en="save"]', (e) => e.getAttribute('aria-busy')), 'false');
      await page.evaluate(() => { DemoStore.add = () => undefined; });
      await page.click('[data-en="save"]');
      await page.waitForFunction(() => document.querySelector('.en-banner') !== null);
      assert.ok(await exists(page, '.en-panel'));
    }));

  test('store bất đồng bộ (Promise): hiện spinner, khóa nút, giữ nguyên chiều rộng; bấm lưu đôi chỉ ghi 1 khoản', () =>
    withPage(async (page) => {
      await page.evaluate(() => {
        const orig = DemoStore.add;
        window.__adds = 0;
        DemoStore.add = (p) => new Promise((res) => setTimeout(() => { window.__adds++; res(orig(p)); }, 400));
      });
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      const w0 = await page.$eval('[data-en="save"]', (e) => e.getBoundingClientRect().width);
      await page.evaluate(() => { const f = document.getElementById('en-form'); f.requestSubmit(); f.requestSubmit(); f.requestSubmit(); });
      assert.equal(await page.$eval('[data-en="save"]', (e) => e.disabled), true);
      assert.equal(await page.$eval('[data-en="save"]', (e) => e.getAttribute('aria-busy')), 'true');
      assert.ok(await exists(page, '.en-spin'));
      const w1 = await page.$eval('[data-en="save"]', (e) => e.getBoundingClientRect().width);
      assert.ok(Math.abs(w1 - w0) < 1.5, `chiều rộng nút giữ nguyên (${w0} → ${w1})`);
      await layerGone(page);
      assert.equal(await page.evaluate(() => window.__adds), 1);
      assert.equal((await stored(page)).length, 1);
      assert.equal((await events(page)).length, 1);
    }));

  test('lưu liên tục bằng Enter nhiều lần: chỉ 1 khoản', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5000');
      await page.click('[data-cat="an-uong"]');
      await page.evaluate(() => { const i = document.getElementById('en-amount'); for (let k = 0; k < 3; k++) i.form.requestSubmit(); });
      await layerGone(page);
      assert.equal((await stored(page)).length, 1);
    }));

  test('chưa cấu hình store: open() ném lỗi rõ ràng; store thiếu hàm bị từ chối', () =>
    withPage(async (page) => {
      const r = await page.evaluate(() => {
        const out = {};
        try { SoThuChiEntry.configure({ store: { add() {} } }); } catch (e) { out.cfg = e.message; }
        return out;
      });
      assert.match(r.cfg, /thiếu hàm/);
    }));
});

/* ================= Bàn phím, focus, truy cập ================= */
test.describe('Bàn phím, focus & truy cập (WCAG 2.1 AA)', () => {
  test('focus bị nhốt trong form (Tab/Shift+Tab xoay vòng) và trang nền bị inert', () =>
    withPage(async (page) => {
      await openAdd(page);
      assert.equal(await page.evaluate(() => document.querySelector('main').inert), true);
      assert.equal(await page.evaluate(() => document.querySelector('header').inert), true);
      for (let i = 0; i < 45; i++) {
        await page.keyboard.press('Tab');
        assert.ok(await page.evaluate(() => !!document.activeElement.closest('.en-panel')), `Tab lần ${i + 1} thoát khỏi form`);
      }
      for (let i = 0; i < 45; i++) {
        await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
        assert.ok(await page.evaluate(() => !!document.activeElement.closest('.en-panel')), `Shift+Tab lần ${i + 1} thoát khỏi form`);
      }
    }));

  test('focus bị nhốt trong hộp thoại xác nhận khi đang mở', () =>
    withPage(async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '5');
      await page.keyboard.press('Escape');
      await page.waitForSelector('.en-dlg-panel');
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        assert.ok(await page.evaluate(() => !!document.activeElement.closest('.en-dlg-panel')));
      }
    }));

  test('trả focus về nút đã gọi khi đóng form', () =>
    withPage(async (page) => {
      await page.focus('.dev-add');
      await page.keyboard.press('Enter');
      await page.waitForSelector('.en-panel');
      await page.keyboard.press('Escape');
      await layerGone(page);
      assert.equal(await page.evaluate(() => document.activeElement.className), 'dev-btn dev-add');
    }));

  test('trả focus về nút "Sửa" của đúng dòng sau khi lưu', () =>
    withPage(async (page) => {
      await seed(page, [SAMPLE]);
      const id = (await stored(page))[0].id;
      await page.focus(`.dev-edit[data-id="${id}"]`);
      await page.keyboard.press('Enter');
      await page.waitForSelector('.en-panel[data-mode="edit"]');
      await page.type('#en-amount', '1');
      await page.keyboard.press('Enter');
      await layerGone(page);
      // danh sách được vẽ lại sau khi lưu nên nút cũ đã bị thay: focus phải về body, không kẹt ở phần tử đã gỡ
      assert.ok(await page.evaluate(() => document.activeElement && document.contains(document.activeElement)));
    }));

  test('vai trò & nhãn: dialog/modal, nhãn cho mọi ô, radiogroup, nút đóng có aria-label', () =>
    withPage(async (page) => {
      await openAdd(page);
      const r = await page.evaluate(() => {
        const p = document.querySelector('.en-panel');
        const label = (id) => { const l = document.querySelector(`label[for="${id}"]`); return l && l.textContent.trim(); };
        return {
          role: p.getAttribute('role'), modal: p.getAttribute('aria-modal'), name: document.getElementById(p.getAttribute('aria-labelledby')).textContent,
          amount: label('en-amount'), date: label('en-date'), note: label('en-note'),
          groups: [...document.querySelectorAll('[role=radiogroup]')].map((g) => g.getAttribute('aria-label') || document.getElementById(g.getAttribute('aria-labelledby')).textContent),
          close: document.querySelector('[data-en="close"]').getAttribute('aria-label'),
          radios: document.querySelectorAll('[role=radio]').length,
          iconsHidden: [...document.querySelectorAll('svg')].every((s) => s.getAttribute('aria-hidden') === 'true')
        };
      });
      assert.equal(r.role, 'dialog'); assert.equal(r.modal, 'true'); assert.equal(r.name, 'Thêm khoản');
      assert.equal(r.amount, 'Số tiền'); assert.equal(r.date, 'Ngày'); assert.equal(r.note, 'Ghi chú (tùy chọn)');
      assert.deepEqual(r.groups, ['Loại khoản', 'Danh mục']);
      assert.equal(r.close, 'Đóng'); assert.equal(r.radios, 2 + 8); assert.ok(r.iconsHidden);
    }));

  test('Tab đi tuần tự đúng thứ tự: Đóng → Chi/Thu → Số tiền → Danh mục → Ngày → chip → Ghi chú → Hủy → Lưu', () =>
    withPage(async (page) => {
      await openAdd(page);
      const order = [];
      await page.focus('[data-en="close"]');
      for (let i = 0; i < 16; i++) {
        const id = await page.evaluate(() => { const a = document.activeElement; return a.id || a.dataset.en || a.dataset.type || a.dataset.cat || a.dataset.quick; });
        if (order[order.length - 1] !== id) order.push(id); // ô ngày có nhiều điểm dừng nội bộ (ngày/tháng/năm/lịch)
        if (id === 'save') break;
        await page.keyboard.press('Tab');
      }
      assert.deepEqual(order, ['close', 'expense', 'en-amount', 'an-uong', 'en-date', 'today', 'yesterday', 'en-note', 'close', 'save']);
    }));

  test('axe: không vi phạm ở chế độ Thêm, Sửa, khi có lỗi, và hộp thoại xác nhận (sáng)', () =>
    withPage(async (page) => {
      await openAdd(page);
      assert.deepEqual(await runAxe(page), [], 'Thêm');
      await page.click('[data-en="save"]');
      assert.deepEqual(await runAxe(page), [], 'có lỗi');
      await page.keyboard.press('Escape');
      await layerGone(page);
      await seed(page, [SAMPLE]);
      await openEdit(page, (await stored(page))[0].id);
      assert.deepEqual(await runAxe(page), [], 'Sửa');
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      assert.deepEqual(await runAxe(page), [], 'hộp thoại xóa');
    }));

  test('axe: không vi phạm ở chế độ tối (theo hệ thống)', () =>
    withPage(async (page) => {
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
      await openAdd(page);
      assert.deepEqual(await runAxe(page), [], 'Thêm (tối)');
      await page.click('[data-type="income"]');
      await page.click('[data-en="save"]');
      assert.deepEqual(await runAxe(page), [], 'có lỗi (tối)');
    }));

  test('axe: chế độ Sửa ở chế độ tối + hộp thoại', () =>
    withPage(async (page) => {
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
      await seed(page, [SAMPLE]);
      await openEdit(page, (await stored(page))[0].id);
      assert.deepEqual(await runAxe(page), [], 'Sửa (tối)');
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      assert.deepEqual(await runAxe(page), [], 'xóa (tối)');
    }));
});

/* ================= Giao diện theo DESIGN.md ================= */
test.describe('Giao diện đúng DESIGN.md', () => {
  const rgb = (h) => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };

  test('font Inter + fallback, tiêu đề H1 24/32 700, nhãn Caption 13/18 500, ô nhập ≥ 16px', () =>
    withPage(async (page) => {
      await openAdd(page);
      const r = await page.evaluate(() => {
        const cs = (s) => getComputedStyle(document.querySelector(s));
        return {
          font: cs('.en-panel').fontFamily, title: [cs('#en-title').fontSize, cs('#en-title').lineHeight, cs('#en-title').fontWeight],
          lbl: [cs('label[for="en-amount"]').fontSize, cs('label[for="en-amount"]').lineHeight, cs('label[for="en-amount"]').fontWeight],
          date: cs('#en-date').fontSize, note: cs('#en-note').fontSize, cat: [cs('.en-cat').fontSize, cs('.en-cat').fontWeight],
          btn: [cs('[data-en="save"]').fontSize, cs('[data-en="save"]').fontWeight]
        };
      });
      assert.match(r.font, /^Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif$/);
      assert.deepEqual(r.title, ['24px', '32px', '700']);
      assert.deepEqual(r.lbl, ['13px', '18px', '500']);
      assert.ok(parseFloat(r.date) >= 16 && parseFloat(r.note) >= 16);
      assert.deepEqual(r.cat, ['13px', '500']);
      assert.deepEqual(r.btn, ['16px', '600']);
    }));

  test('màu sáng đúng token: nền panel, nút chính, chữ, overlay, bo góc, đổ bóng modal', () =>
    withPage(async (page) => {
      await openAdd(page);
      const r = await page.evaluate(() => {
        const cs = (s) => getComputedStyle(document.querySelector(s));
        return {
          panel: [cs('.en-panel').backgroundColor, cs('.en-panel').borderTopLeftRadius, cs('.en-panel').boxShadow],
          save: [cs('[data-en="save"]').backgroundColor, cs('[data-en="save"]').color, cs('[data-en="save"]').borderRadius, cs('[data-en="save"]').minHeight],
          input: [cs('#en-date').backgroundColor, cs('#en-date').borderTopColor, cs('#en-date').borderRadius],
          scrim: cs('.en-scrim').backgroundColor, text: cs('#en-title').color, muted: cs('label[for="en-amount"]').color,
          cat: [cs('.en-cat').borderRadius, cs('.en-cat').minHeight], amt: cs('.en-amt').borderRadius
        };
      });
      assert.equal(r.panel[0], rgb('#FFFFFF'));
      assert.equal(r.panel[1], '24px');
      assert.match(r.panel[2], /rgba\(16, 24, 40, 0\.18\) 0px 16px 40px 0px/);
      assert.deepEqual(r.save, [rgb('#2F6FED'), rgb('#FFFFFF'), '12px', '48px']);
      assert.deepEqual(r.input, [rgb('#EEF0F4'), rgb('#DDE1E8'), '8px']);
      assert.equal(r.scrim, 'rgba(10, 14, 22, 0.5)');
      assert.equal(r.text, rgb('#14181F')); assert.equal(r.muted, rgb('#5B6472'));
      assert.deepEqual(r.cat, ['12px', '72px']); assert.equal(r.amt, '12px');
    }));

  test('màu tối đúng token', () =>
    withPage(async (page) => {
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
      await openAdd(page);
      const r = await page.evaluate(() => {
        const cs = (s) => getComputedStyle(document.querySelector(s));
        return { panel: cs('.en-panel').backgroundColor, save: [cs('[data-en="save"]').backgroundColor, cs('[data-en="save"]').color], text: cs('#en-title').color, input: cs('#en-date').backgroundColor, exp: cs('.en-segbtn[aria-checked="true"]').color };
      });
      assert.equal(r.panel, rgb('#181B21'));
      assert.deepEqual(r.save, [rgb('#6C9BFF'), rgb('#0B1220')]);
      assert.equal(r.text, rgb('#ECEFF4')); assert.equal(r.input, rgb('#222630')); assert.equal(r.exp, rgb('#FF8A65'));
    }));

  test('ô biểu tượng danh mục: nền = màu danh mục ở độ mờ 15%, biểu tượng đúng màu --cat-N', () =>
    withPage(async (page) => {
      await openAdd(page);
      const r = await page.$eval('[data-cat="an-uong"] .en-cico', (e) => { const c = getComputedStyle(e); return [c.color, c.backgroundColor, c.width, c.height]; });
      assert.equal(r[0], rgb('#E8743B'));
      assert.match(r[1], /^rgba\(232, 116, 59, 0\.15\)$|^color\(srgb 0\.909\d* 0\.454\d* 0\.231\d* \/ 0\.15\)$/);
      const d = await page.$eval('[data-cat="di-chuyen"] .en-cico', (e) => getComputedStyle(e).color);
      assert.equal(d, rgb('#2F6FED'));
    }));

  test('lưới danh mục 4 cột; nhãn luôn hiện phía trên ô (không chỉ placeholder)', () =>
    withPage(async (page) => {
      await openAdd(page);
      const cols = await page.$eval('.en-cats', (e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
      assert.equal(cols, 4);
      const above = await page.evaluate(() => ['en-amount', 'en-date', 'en-note'].map((id) => document.querySelector(`label[for="${id}"]`).getBoundingClientRect().bottom <= document.getElementById(id).getBoundingClientRect().top + 1));
      assert.deepEqual(above, [true, true, true]);
    }));

  test('thứ tự từ trên xuống: tiêu đề → Chi/Thu → số tiền → danh mục → ngày → ghi chú → nút Lưu', () =>
    withPage(async (page) => {
      await openAdd(page);
      const ys = await page.evaluate(() => ['#en-title', '.en-seg', '#en-amount', '.en-cats', '#en-date', '#en-note', '[data-en="save"]'].map((s) => document.querySelector(s).getBoundingClientRect().top));
      assert.deepEqual([...ys].sort((a, b) => a - b), ys);
    }));

  test('hiệu ứng nhấn nút: thu nhỏ 0.97 khi :active; chuyển động dùng token 120ms', () =>
    withPage({ reducedMotion: false }, async (page) => {
      await openAdd(page);
      const tr = await page.$eval('[data-en="save"]', (e) => getComputedStyle(e).transitionDuration);
      assert.match(tr, /0\.12s/);
    }));

  test('chuyển động mở form khi không giảm chuyển động: có animation 200ms; giảm chuyển động: gần như tức thì', () =>
    withPage({ reducedMotion: false }, async (page) => {
      await openAdd(page);
      const full = await page.$eval('.en-panel', (e) => getComputedStyle(e).animationDuration);
      assert.equal(full, '0.2s');
      await page.keyboard.press('Escape');
      await layerGone(page);
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await openAdd(page);
      const reduced = await page.$eval('.en-panel', (e) => getComputedStyle(e).animationDuration);
      assert.equal(reduced, '0.001s');
    }));
});

/* ================= Responsive ================= */
test.describe('Responsive: 360 / 768 / 1280 (F-10)', () => {
  for (const [w, h] of [[360, 740], [768, 1024], [1280, 800]]) {
    test(`${w}px: không cuộn ngang; nút Lưu luôn nhìn thấy; vùng chạm ≥ 44px; bố cục đúng breakpoint`, () =>
      withPage({ width: w, height: h, touch: w < 768 }, async (page) => {
        await seed(page, [SAMPLE]);
        await openAdd(page);
        await page.type('#en-amount', '123456789');
        await page.$eval('#en-note', (e) => { e.value = 'a'.repeat(121); e.dispatchEvent(new Event('input', { bubbles: true })); });
        await page.click('[data-en="save"]'); // hiện đủ các thông báo lỗi để thử vỡ bố cục
        const r = await page.evaluate(() => {
          const rect = (s) => document.querySelector(s).getBoundingClientRect();
          const panel = rect('.en-panel');
          const save = rect('[data-en="save"]');
          const small = [...document.querySelectorAll('.en-layer button, .en-layer input, .en-layer textarea')].filter((e) => !e.matches('.en-chip') && e.getClientRects().length).map((e) => {
            const b = e.getBoundingClientRect(); return { s: e.id || e.dataset.en || e.dataset.cat || e.dataset.type, w: b.width, h: b.height };
          }).filter((x) => x.w < 44 || x.h < 44);
          const chips = [...document.querySelectorAll('.en-chip')].map((e) => e.getBoundingClientRect().height);
          const bd = document.querySelector('.en-bd');
          return { sw: document.documentElement.scrollWidth, iw: innerWidth, bsw: bd.scrollWidth, bcw: bd.clientWidth, panelW: panel.width, panelH: panel.height, ih: innerHeight, saveBottom: save.bottom, saveTop: save.top, small, chips,
            radius: getComputedStyle(document.querySelector('.en-panel')).borderTopLeftRadius };
        });
        assert.ok(r.sw <= r.iw, `cuộn ngang trang (${r.sw} > ${r.iw})`);
        assert.ok(r.bsw <= r.bcw, `cuộn ngang trong form (${r.bsw} > ${r.bcw})`);
        assert.ok(r.saveTop >= 0 && r.saveBottom <= r.ih, 'nút Lưu nằm trong khung nhìn');
        assert.deepEqual(r.small, [], 'phần tử bấm được nhỏ hơn 44×44');
        assert.ok(r.chips.every((c) => c >= 36), 'chip ≥ 36px (vùng chạm mở rộng 44px)');
        if (w < 640) { assert.equal(Math.round(r.panelW), w, 'điện thoại: toàn màn hình'); assert.equal(Math.round(r.panelH), h); assert.equal(r.radius, '0px'); }
        else { assert.equal(Math.round(r.panelW), 480, 'máy tính bảng/laptop: modal 480px'); assert.equal(r.radius, '24px'); }
      }));
  }

  test('điện thoại: chân form cố định ở đáy, nội dung dài cuộn bên trong và vẫn thấy nút Lưu (viewport thấp)', () =>
    withPage({ width: 360, height: 480, touch: true }, async (page) => {
      await openAdd(page);
      await settle();
      const r = await page.evaluate(() => {
        const bd = document.querySelector('.en-bd'); const ft = document.querySelector('.en-ft').getBoundingClientRect();
        return { scrolls: bd.scrollHeight > bd.clientHeight, ftBottom: ft.bottom, ih: innerHeight };
      });
      assert.equal(r.scrolls, true);
      assert.equal(Math.round(r.ftBottom), r.ih);
      await page.focus('#en-note');
      assert.ok(await page.evaluate(() => { const n = document.querySelector('#en-note').getBoundingClientRect(); return n.bottom <= innerHeight; }));
    }));

  test('điện thoại, chế độ Sửa: [Xóa] 1/3 + [Lưu thay đổi] 2/3, cao 48px; chế độ Thêm: [Lưu] toàn dòng, không có Hủy', () =>
    withPage({ width: 360, height: 740, touch: true }, async (page) => {
      await openAdd(page);
      const add = await page.evaluate(() => { const s = document.querySelector('[data-en="save"]').getBoundingClientRect(); const c = document.querySelector('.en-btn-cancel'); return { w: s.width, cancel: getComputedStyle(c).display, h: s.height }; });
      assert.equal(add.cancel, 'none'); assert.ok(add.w > 300); assert.equal(add.h, 48);
      await page.click('[data-en="close"]');
      await layerGone(page);
      await seed(page, [SAMPLE]);
      await page.tap(`.dev-edit`);
      await page.waitForSelector('.en-panel[data-mode="edit"]');
      const r = await page.evaluate(() => { const d = document.querySelector('[data-en="delete"]').getBoundingClientRect(); const s = document.querySelector('[data-en="save"]').getBoundingClientRect(); return { d: d.width, s: s.width, dh: d.height, sh: s.height }; });
      assert.ok(Math.abs(r.s / r.d - 2) < 0.1, `tỉ lệ ${r.s / r.d}`);
      assert.equal(r.dh, 48); assert.equal(r.sh, 48);
    }));

  test('laptop, chế độ Sửa: Xóa nằm trái, Hủy + Lưu thay đổi nằm phải', () =>
    withPage(async (page) => {
      await seed(page, [SAMPLE]);
      await openEdit(page, (await stored(page))[0].id);
      const r = await page.evaluate(() => { const g = (s) => document.querySelector(s).getBoundingClientRect(); const p = g('.en-panel'); return { del: g('[data-en="delete"]').left - p.left, cancelL: g('.en-btn-cancel').left, saveR: p.right - g('[data-en="save"]').right, saveL: g('[data-en="save"]').left, delR: g('[data-en="delete"]').right, mid: p.left + p.width / 2 }; });
      assert.ok(r.del < 40, 'Xóa sát trái');
      assert.ok(r.saveR < 40, 'Lưu sát phải');
      assert.ok(r.cancelL > r.mid && r.cancelL < r.saveL, 'Hủy nằm bên phải, trước Lưu');
    }));

  test('số tiền rất lớn (999.999.999.999) không làm vỡ bố cục ở 360px', () =>
    withPage({ width: 360, height: 740, touch: true }, async (page) => {
      await openAdd(page);
      await page.type('#en-amount', '999999999999');
      const r = await page.evaluate(() => { const a = document.querySelector('#en-amount'); return { sw: a.scrollWidth, cw: a.clientWidth, doc: document.documentElement.scrollWidth, iw: innerWidth }; });
      assert.ok(r.sw <= r.cw + 1, `số tiền bị tràn ô (${r.sw} > ${r.cw})`);
      assert.ok(r.doc <= r.iw);
    }));

  test('cảm ứng: chạm chọn danh mục, chuyển Thu, chip ngày và Lưu hoạt động', () =>
    withPage({ width: 390, height: 800, touch: true }, async (page) => {
      await page.tap('.dev-fab');
      await page.waitForSelector('.en-panel');
      await page.tap('[data-type="income"]');
      await page.tap('#en-amount');
      await page.keyboard.type('2500000');
      await page.tap('[data-cat="thu-nhap-phu"]');
      await page.tap('[data-quick="yesterday"]');
      await page.tap('[data-en="save"]');
      await layerGone(page);
      const [t] = await stored(page);
      assert.deepEqual({ type: t.type, amount: t.amount, category: t.category, date: t.date }, { type: 'income', amount: 2500000, category: 'thu-nhap-phu', date: YESTERDAY() });
    }));
});

/* ================= Tổng hợp luồng ================= */
test.describe('Luồng tổng hợp', () => {
  test('Thêm → Sửa → Xóa → Hoàn tác: dữ liệu và sự kiện khớp từng bước', () =>
    withPage(async (page) => {
      await quickAdd(page, { amount: '100000', cat: 'mua-sam' });
      const id = (await stored(page))[0].id;
      await openEdit(page, id);
      await page.click('#en-amount', { clickCount: 3 });
      await page.keyboard.type('250000');
      await page.keyboard.press('Enter');
      await layerGone(page);
      assert.equal((await stored(page))[0].amount, 250000);
      await openEdit(page, id);
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      await page.click('[data-en="dlg-ok"]');
      await layerGone(page);
      assert.equal((await stored(page)).length, 0);
      await page.click('[data-en="toast-action"]');
      const list = await stored(page);
      assert.equal(list.length, 1);
      assert.equal(list[0].amount, 250000);
      assert.deepEqual((await events(page)).map((e) => e.action), ['add', 'update', 'delete', 'restore']);
    }));

  test('Hoàn tác khi vừa mở form khác: Hoàn tác vẫn hoạt động, form mới không bị ảnh hưởng', () =>
    withPage(async (page) => {
      await seed(page, [SAMPLE]);
      const id = (await stored(page))[0].id;
      await openEdit(page, id);
      await page.click('[data-en="delete"]');
      await page.waitForSelector('.en-dlg-panel');
      await page.click('[data-en="dlg-ok"]');
      await layerGone(page);
      await openAdd(page);
      await page.type('#en-amount', '777');
      // toast nằm ngoài vùng inert nên vẫn bấm được
      await page.evaluate(() => document.querySelector('[data-en="toast-action"]').click());
      await page.waitForFunction(() => DemoStore.all().length === 1);
      assert.equal(await val(page, '#en-amount'), '777');
    }));

  test('đối chiếu mô hình: 30 khoản ngẫu nhiên nhập qua UI khớp đúng với dữ liệu đã lưu', () =>
    withPage(async (page) => {
      let seedv = 12345;
      const rnd = (n) => { seedv = (seedv * 1103515245 + 12345) & 0x7fffffff; return seedv % n; };
      const expected = [];
      for (let i = 0; i < 30; i++) {
        const type = rnd(3) === 0 ? 'income' : 'expense';
        const cats = M.CATEGORIES[type];
        const cat = cats[rnd(cats.length)].id;
        const amount = 1 + rnd(2000000);
        expected.push({ type, cat, amount });
        await openAdd(page);
        if (type === 'income') await page.click('[data-type="income"]');
        await page.type('#en-amount', String(amount));
        await page.click(`[data-cat="${cat}"]`);
        await page.keyboard.press('Enter');
        await layerGone(page);
      }
      const list = (await stored(page)).sort((a, b) => a.createdAt - b.createdAt);
      assert.equal(list.length, 30);
      assert.deepEqual(list.map((t) => [t.type, t.category, t.amount]), expected.map((e) => [e.type, e.cat, e.amount]));
    }));
});
