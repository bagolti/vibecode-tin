'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../../js/overview-model.js');

const tx = (type, amount, date) => ({ id: Math.random().toString(36), type, amount, category: type === 'income' ? 'luong' : 'an-uong', date, note: '' });

/* Bộ dữ liệu mẫu có đáp án tính tay */
const SAMPLE = [
  tx('income', 15000000, '2026-10-01'),
  tx('income', 1000000, '2026-10-31'),
  tx('expense', 55000, '2026-10-27'),
  tx('expense', 12000, '2026-10-27'),
  tx('expense', 10683000, '2026-10-15'),
  tx('income', 999, '2026-09-30'),    // tháng khác
  tx('expense', 777, '2026-11-01')    // tháng khác
];

test.describe('Tháng (YYYY-MM)', () => {
  test('isYm', () => {
    for (const s of ['2026-10', '2000-01', '2026-12']) assert.ok(M.isYm(s), s);
    for (const s of ['2026-13', '2026-00', '2026-1', '26-10', '2026/10', '', null, undefined, 202610, '2026-10-01']) assert.ok(!M.isYm(s), String(s));
  });
  test('ymOf dùng giờ địa phương (23:59 ngày cuối tháng vẫn thuộc tháng đó)', () => {
    assert.equal(M.ymOf(new Date(2026, 9, 31, 23, 59, 59)), '2026-10');
    assert.equal(M.ymOf(new Date(2026, 10, 1, 0, 0, 1)), '2026-11');
  });
  test('addMonths qua ranh giới năm: 12/2026 → 01/2027 và ngược lại', () => {
    assert.equal(M.addMonths('2026-12', 1), '2027-01');
    assert.equal(M.addMonths('2027-01', -1), '2026-12');
    assert.equal(M.addMonths('2026-10', 0), '2026-10');
    assert.equal(M.addMonths('2026-01', -1), '2025-12');
    assert.equal(M.addMonths('2026-10', 14), '2027-12');
    assert.equal(M.addMonths('2026-10', -10), '2025-12');
    assert.equal(M.addMonths('2026-10', -22), '2024-12');
  });
  test('monthLabel', () => {
    assert.equal(M.monthLabel('2026-10'), 'Tháng 10/2026');
    assert.equal(M.monthLabel('2026-01'), 'Tháng 1/2026');
  });
  test('"›" bị vô hiệu ở tháng hiện tại và sau đó; "‹" bị vô hiệu ở 01/2000', () => {
    assert.equal(M.canNext('2026-10', '2026-10'), false);
    assert.equal(M.canNext('2026-09', '2026-10'), true);
    assert.equal(M.canNext('2026-12', '2027-01'), true);
    assert.equal(M.canNext('2027-01', '2027-01'), false);
    assert.equal(M.canPrev('2000-01'), false);
    assert.equal(M.canPrev('2000-02'), true);
  });
  test('clampYm: không vượt tháng hiện tại, không quá 2000-01, giá trị lạ → tháng hiện tại', () => {
    assert.equal(M.clampYm('2030-01', '2026-10'), '2026-10');
    assert.equal(M.clampYm('1990-05', '2026-10'), '2000-01');
    assert.equal(M.clampYm('2026-05', '2026-10'), '2026-05');
    assert.equal(M.clampYm('abc', '2026-10'), '2026-10');
    assert.equal(M.clampYm(undefined, '2026-10'), '2026-10');
    assert.equal(M.clampYm('2026-10', '2026-10'), '2026-10');
  });
});

test.describe('Tổng hợp tháng (US-04, F-04): khớp 100% tính tay', () => {
  test('tháng 10/2026 của bộ mẫu: thu 16.000.000, chi 10.750.000, dư 5.250.000', () => {
    const s = M.summarize(M.monthTx(SAMPLE, '2026-10'));
    assert.deepEqual(s, { income: 16000000, expense: 10750000, balance: 5250000, count: 5, skipped: 0 });
  });
  test('số dư luôn = thu − chi', () => {
    for (const ym of ['2026-09', '2026-10', '2026-11']) {
      const s = M.summarize(M.monthTx(SAMPLE, ym));
      assert.equal(s.balance, s.income - s.expense);
    }
  });
  test('tháng 9 chỉ có thu 999; tháng 11 chỉ có chi 777', () => {
    assert.deepEqual(M.summarize(M.monthTx(SAMPLE, '2026-09')), { income: 999, expense: 0, balance: 999, count: 1, skipped: 0 });
    assert.deepEqual(M.summarize(M.monthTx(SAMPLE, '2026-11')), { income: 0, expense: 777, balance: -777, count: 1, skipped: 0 });
  });
  test('ngày đầu và cuối tháng thuộc đúng tháng (01 và 28/29/30/31)', () => {
    const l = [tx('income', 1, '2026-02-28'), tx('income', 10, '2026-03-01'), tx('income', 100, '2028-02-29'), tx('income', 1000, '2026-12-31'), tx('income', 10000, '2027-01-01')];
    assert.equal(M.summarize(M.monthTx(l, '2026-02')).income, 1);
    assert.equal(M.summarize(M.monthTx(l, '2026-03')).income, 10);
    assert.equal(M.summarize(M.monthTx(l, '2028-02')).income, 100);
    assert.equal(M.summarize(M.monthTx(l, '2026-12')).income, 1000);
    assert.equal(M.summarize(M.monthTx(l, '2027-01')).income, 10000);
  });
  test('tháng trống: 0/0/0, count 0', () => {
    assert.deepEqual(M.summarize([]), { income: 0, expense: 0, balance: 0, count: 0, skipped: 0 });
    assert.deepEqual(M.summarize(M.monthTx(SAMPLE, '2025-01')), { income: 0, expense: 0, balance: 0, count: 0, skipped: 0 });
  });
  test('bản ghi hỏng bị bỏ qua và đếm vào skipped (không làm sai tổng)', () => {
    const bad = [
      tx('income', 100, '2026-10-01'),
      { type: 'income', amount: -5, date: '2026-10-01' },
      { type: 'income', amount: 1.5, date: '2026-10-01' },
      { type: 'income', amount: '100', date: '2026-10-01' },
      { type: 'income', amount: NaN, date: '2026-10-01' },
      { type: 'income', amount: Infinity, date: '2026-10-01' },
      { type: 'income', amount: 0, date: '2026-10-01' },
      { type: 'transfer', amount: 100, date: '2026-10-01' },
      { type: 'expense', amount: 100, date: 20261001 },
      { type: 'expense', amount: 100 },
      null, undefined, 'x'
    ];
    const s = M.summarize(bad);
    assert.equal(s.income, 100); assert.equal(s.expense, 0); assert.equal(s.count, 1); assert.equal(s.skipped, bad.length - 1);
  });
  test('monthTx chỉ lấy bản ghi hợp lệ của đúng tháng', () => {
    const l = [tx('income', 5, '2026-10-05'), { type: 'income', amount: -1, date: '2026-10-05' }, tx('expense', 7, '2026-09-05')];
    assert.equal(M.monthTx(l, '2026-10').length, 1);
  });
  test('5.000 giao dịch: đúng đáp án và nhanh (< 100ms)', () => {
    let seed = 7, inc = 0, exp = 0;
    const rnd = (n) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
    const big = [];
    for (let i = 0; i < 5000; i++) {
      const type = rnd(2) ? 'income' : 'expense', amount = 1 + rnd(5000000), day = 1 + rnd(28), month = 1 + rnd(3);
      big.push(tx(type, amount, `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`));
      if (month === 2) { if (type === 'income') inc += amount; else exp += amount; }
    }
    const t0 = process.hrtime.bigint();
    const s = M.summarize(M.monthTx(big, '2026-02'));
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    assert.equal(s.income, inc); assert.equal(s.expense, exp); assert.equal(s.balance, inc - exp);
    assert.ok(ms < 100, `mất ${ms}ms`);
  });
  test('tổng lớn vẫn là số nguyên chính xác (1.000 khoản × 999.999.999.999)', () => {
    const l = Array.from({ length: 1000 }, () => tx('income', 999999999999, '2026-10-01'));
    const s = M.summarize(l);
    assert.equal(s.income, 999999999999000);
    assert.ok(Number.isSafeInteger(s.income));
  });
  test('không làm thay đổi mảng đầu vào', () => {
    const l = SAMPLE.map((t) => ({ ...t }));
    const snap = JSON.stringify(l);
    M.monthTx(l, '2026-10'); M.summarize(l);
    assert.equal(JSON.stringify(l), snap);
  });
});

test.describe('LOGIC CHÍNH: chi > thu thì cảnh báo', () => {
  const s = (income, expense, count = 1) => ({ income, expense, balance: income - expense, count, skipped: 0 });
  test('chi > thu → warning, kind "over", deficit = chi − thu', () => {
    const a = M.assess(s(9500000, 10750000));
    assert.equal(a.level, 'warning'); assert.equal(a.kind, 'over'); assert.equal(a.deficit, 1250000);
  });
  test('chi < thu → ok, không cảnh báo', () => {
    const a = M.assess(s(10750000, 9500000));
    assert.equal(a.level, 'ok'); assert.equal(a.deficit, 0); assert.equal(a.kind, null);
  });
  test('chi = thu → ok (chưa vượt)', () => {
    const a = M.assess(s(5000000, 5000000));
    assert.equal(a.level, 'ok'); assert.equal(a.deficit, 0);
  });
  test('biên: chi hơn thu đúng 1 ₫ → cảnh báo; thua 1 ₫ → không', () => {
    assert.equal(M.assess(s(1000, 1001)).level, 'warning');
    assert.equal(M.assess(s(1000, 1001)).deficit, 1);
    assert.equal(M.assess(s(1000, 999)).level, 'ok');
    assert.equal(M.assess(s(1, 2)).level, 'warning');
  });
  test('có chi nhưng chưa có thu nào → warning, kind "no-income", ratio null', () => {
    const a = M.assess(s(0, 55000));
    assert.equal(a.level, 'warning'); assert.equal(a.kind, 'no-income'); assert.equal(a.ratio, null); assert.equal(a.deficit, 55000);
  });
  test('chỉ có thu → ok', () => assert.equal(M.assess(s(1000000, 0)).level, 'ok'));
  test('tháng không có giao dịch → empty, không cảnh báo', () => {
    assert.equal(M.assess(s(0, 0, 0)).level, 'empty');
    assert.equal(M.assess(null).level, 'empty');
    assert.equal(M.assess(undefined).level, 'empty');
    assert.equal(M.assess(M.summarize([])).level, 'empty');
  });
  test('ratio = chi/thu theo %, làm tròn', () => {
    assert.equal(M.assess(s(10000000, 12500000)).ratio, 125);
    assert.equal(M.assess(s(3, 4)).ratio, 133);
    assert.equal(M.assess(s(10000000, 5000000)).ratio, 50);
  });
  test('tính trên bộ mẫu: 10/2026 ok; 11/2026 (chỉ chi) cảnh báo; 09/2026 (chỉ thu) ok', () => {
    assert.equal(M.assess(M.summarize(M.monthTx(SAMPLE, '2026-10'))).level, 'ok');
    assert.equal(M.assess(M.summarize(M.monthTx(SAMPLE, '2026-11'))).level, 'warning');
    assert.equal(M.assess(M.summarize(M.monthTx(SAMPLE, '2026-09'))).level, 'ok');
  });
  test('thêm một khoản chi lớn làm tháng chuyển từ ok sang warning, thêm thu thì quay lại ok', () => {
    const l = M.monthTx(SAMPLE, '2026-10');
    assert.equal(M.assess(M.summarize(l)).level, 'ok');
    const l2 = l.concat([tx('expense', 5250001, '2026-10-20')]);
    assert.equal(M.assess(M.summarize(l2)).level, 'warning');
    assert.equal(M.assess(M.summarize(l2)).deficit, 1);
    assert.equal(M.assess(M.summarize(l2.concat([tx('income', 1, '2026-10-21')]))).level, 'ok');
  });
  test('cảnh báo nhất quán với dấu số dư: warning ⇔ balance < 0 (khi có giao dịch)', () => {
    for (const [i, e] of [[0, 1], [1, 0], [5, 5], [5, 6], [6, 5], [100, 99], [99, 100]]) {
      const x = s(i, e);
      assert.equal(M.assess(x).level === 'warning', x.balance < 0, `${i}/${e}`);
    }
  });
  test('warningText: câu chữ có số tiền đúng', () => {
    const x = s(9500000, 10750000);
    assert.equal(M.warningText(x, M.assess(x)), 'Chi nhiều hơn thu 1.250.000 ₫ (chi 10.750.000 ₫, thu 9.500.000 ₫).');
    const y = s(0, 55000);
    assert.equal(M.warningText(y, M.assess(y)), 'Tháng này chưa có khoản thu nào nhưng đã chi 55.000 ₫.');
    assert.equal(M.warningText(s(5, 1), M.assess(s(5, 1))), '');
  });
});

test.describe('Định dạng tiền', () => {
  test('formatVnd vi-VN', () => {
    assert.equal(M.formatVnd(0), '0 ₫'); assert.equal(M.formatVnd(999), '999 ₫'); assert.equal(M.formatVnd(1000), '1.000 ₫');
    assert.equal(M.formatVnd(15000000), '15.000.000 ₫'); assert.equal(M.formatVnd(-5000), '5.000 ₫');
  });
  test('formatBalance: âm có dấu − (U+2212), dương không dấu, 0 không dấu', () => {
    assert.equal(M.formatBalance(-1250000), '−1.250.000 ₫');
    assert.equal(M.formatBalance(4250000), '4.250.000 ₫');
    assert.equal(M.formatBalance(0), '0 ₫');
  });
  test('compactVnd: "15,2 tr", "2,3 tỷ", số nhỏ giữ nguyên', () => {
    assert.equal(M.compactVnd(15200000), '15,2 tr'); assert.equal(M.compactVnd(15000000), '15 tr');
    assert.equal(M.compactVnd(2300000000), '2,3 tỷ'); assert.equal(M.compactVnd(999999), '999.999 ₫');
    assert.equal(M.compactVnd(1000000), '1 tr'); assert.equal(M.compactVnd(-15200000), '−15,2 tr');
    assert.equal(M.compactVnd(0), '0 ₫');
  });
});

test.describe('Tháng gần nhất có dữ liệu', () => {
  test('chọn tháng gần nhất; bỏ qua tháng hiện tại của chính nó, tháng tương lai, giá trị lạ', () => {
    const now = '2026-10';
    assert.equal(M.nearestMonthWithData(['2026-03', '2026-08'], '2026-10', now), '2026-08');
    assert.equal(M.nearestMonthWithData(['2026-03', '2026-08'], '2026-05', now), '2026-03');
    assert.equal(M.nearestMonthWithData(['2026-10'], '2026-10', now), null);
    assert.equal(M.nearestMonthWithData(['2027-01'], '2026-10', now), null);
    assert.equal(M.nearestMonthWithData([], '2026-10', now), null);
    assert.equal(M.nearestMonthWithData(['bad', null, '2026-02'], '2026-10', now), '2026-02');
  });
  test('cách đều thì chọn tháng mới hơn; đúng qua ranh giới năm', () => {
    assert.equal(M.nearestMonthWithData(['2026-04', '2026-08'], '2026-06', '2026-10'), '2026-08');
    assert.equal(M.nearestMonthWithData(['2025-12', '2026-02'], '2026-01', '2026-10'), '2026-02');
    assert.equal(M.nearestMonthWithData(['2025-11'], '2026-02', '2026-10'), '2025-11');
  });
});
