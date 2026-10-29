/*
 * Module M4 – Tổng quan tháng (Trang chủ quản lý tổng thu chi): logic thuần, không đụng DOM/storage.
 * Chạy được trong trình duyệt (window.OverviewModel) lẫn Node (require) để test.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OverviewModel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MIN_YM = '2000-01'; // cùng mốc ngày sớm nhất của M3 (01/01/2000)

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---------- Tháng (YYYY-MM, giờ địa phương) ---------- */
  function isYm(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}$/.test(s)) return false;
    var m = +s.slice(5);
    return m >= 1 && m <= 12;
  }
  function ymOf(d) { d = d instanceof Date ? d : new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function addMonths(ym, k) {
    var y = +ym.slice(0, 4), m = +ym.slice(5) - 1 + k;
    var d = new Date(y, m, 1);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1);
  }
  /** Ép tháng về khoảng cho phép [2000-01, tháng hiện tại]; giá trị lạ → tháng hiện tại. */
  function clampYm(ym, nowYm) {
    if (!isYm(ym)) return nowYm;
    if (ym > nowYm) return nowYm;
    if (ym < MIN_YM) return MIN_YM;
    return ym;
  }
  function canNext(ym, nowYm) { return ym < nowYm; }
  function canPrev(ym) { return ym > MIN_YM; }
  function monthLabel(ym) { return 'Tháng ' + (+ym.slice(5)) + '/' + ym.slice(0, 4); }
  function monthIndex(ym) { return +ym.slice(0, 4) * 12 + (+ym.slice(5) - 1); }

  /* ---------- Giao dịch hợp lệ & tổng hợp ---------- */
  /** Giao dịch đủ điều kiện để cộng: loại hợp lệ, số tiền nguyên dương an toàn, ngày YYYY-MM-DD. */
  function usable(t) {
    return !!t && (t.type === 'income' || t.type === 'expense') &&
      Number.isSafeInteger(t.amount) && t.amount > 0 &&
      typeof t.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.date);
  }
  function monthTx(list, ym) {
    var out = [];
    for (var i = 0; i < list.length; i++) if (usable(list[i]) && list[i].date.slice(0, 7) === ym) out.push(list[i]);
    return out;
  }
  /** Tổng thu, tổng chi, số dư = thu − chi. Bản ghi hỏng bị bỏ qua và đếm vào `skipped`. */
  function summarize(list) {
    var income = 0, expense = 0, count = 0, skipped = 0;
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (!usable(t)) { skipped++; continue; }
      if (t.type === 'income') income += t.amount; else expense += t.amount;
      count++;
    }
    return { income: income, expense: expense, balance: income - expense, count: count, skipped: skipped };
  }

  /* ---------- Cảnh báo: chi > thu ---------- */
  /**
   * Quy tắc chính của module: chi > thu thì cảnh báo.
   *  - level 'empty'  : tháng chưa có giao dịch → không cảnh báo
   *  - level 'ok'     : chi ≤ thu (chi = thu vẫn chưa vượt)
   *  - level 'warning': chi > thu. kind 'no-income' nếu tháng chưa có khoản thu nào, ngược lại 'over'.
   * deficit = chi − thu (> 0 khi cảnh báo); ratio = chi / thu tính theo % làm tròn (null khi chưa có thu).
   */
  function assess(s) {
    if (!s || s.count === 0) return { level: 'empty', kind: null, deficit: 0, ratio: null };
    if (s.expense > s.income) {
      return {
        level: 'warning',
        kind: s.income === 0 ? 'no-income' : 'over',
        deficit: s.expense - s.income,
        ratio: s.income === 0 ? null : Math.round((s.expense / s.income) * 100)
      };
    }
    return { level: 'ok', kind: null, deficit: 0, ratio: s.income === 0 ? null : Math.round((s.expense / s.income) * 100) };
  }

  /* ---------- Định dạng tiền (vi-VN, không phụ thuộc ICU) ---------- */
  function group(d) { return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function formatVnd(n) { return group(String(Math.abs(Math.round(n)))) + ' ₫'; }
  /** Số dư có dấu: âm → "−" (U+2212). */
  function formatBalance(n) { return (n < 0 ? '−' : '') + formatVnd(n); }
  function oneDec(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  /** Rút gọn khi không đủ chỗ (DESIGN 9.2): 15.200.000 → "15,2 tr"; 2.300.000.000 → "2,3 tỷ". */
  function compactVnd(n) {
    var a = Math.abs(n), sign = n < 0 ? '−' : '';
    if (a >= 1e9) return sign + oneDec(a / 1e9) + ' tỷ';
    if (a >= 1e6) return sign + oneDec(a / 1e6) + ' tr';
    return sign + formatVnd(a);
  }

  /* ---------- Tháng gần nhất có dữ liệu ---------- */
  /** Trong các tháng có dữ liệu ≤ tháng hiện tại, chọn tháng gần `ym` nhất (cách đều → chọn tháng mới hơn). */
  function nearestMonthWithData(months, ym, nowYm) {
    var best = null, bestD = Infinity, base = monthIndex(ym);
    for (var i = 0; i < months.length; i++) {
      var m = months[i];
      if (!isYm(m) || m > nowYm || m === ym) continue;
      var d = Math.abs(monthIndex(m) - base);
      if (d < bestD || (d === bestD && m > best)) { best = m; bestD = d; }
    }
    return best;
  }

  /* ---------- Câu chữ cảnh báo ---------- */
  function warningText(s, a) {
    if (a.level !== 'warning') return '';
    if (a.kind === 'no-income') return 'Tháng này chưa có khoản thu nào nhưng đã chi ' + formatVnd(s.expense) + '.';
    return 'Chi nhiều hơn thu ' + formatVnd(a.deficit) + ' (chi ' + formatVnd(s.expense) + ', thu ' + formatVnd(s.income) + ').';
  }

  return {
    MIN_YM: MIN_YM, isYm: isYm, ymOf: ymOf, addMonths: addMonths, clampYm: clampYm, canNext: canNext, canPrev: canPrev,
    monthLabel: monthLabel, monthIndex: monthIndex, usable: usable, monthTx: monthTx, summarize: summarize, assess: assess,
    formatVnd: formatVnd, formatBalance: formatBalance, compactVnd: compactVnd, nearestMonthWithData: nearestMonthWithData,
    warningText: warningText
  };
});
