/*
 * Module M3 – Nhập liệu thu chi: logic thuần (không đụng DOM, không đụng storage).
 * Chạy được cả trong trình duyệt (window.EntryModel) lẫn Node (require) để test từng quy tắc.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EntryModel = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var NOTE_MAX = 120;
  var NOTE_WARN_LEFT = 20; // đếm ký tự khi còn < 20
  var AMOUNT_MAX_DIGITS = 12; // tối đa 999.999.999.999 ₫, nằm gọn trong số nguyên an toàn
  var AMOUNT_MAX = 999999999999;
  var MIN_DATE = '2000-01-01';
  var UNDO_MS = 5000;

  /* Danh mục cố định (PRD F-02). c = chỉ số màu --cat-N (DESIGN 2.3). */
  var CATEGORIES = {
    expense: [
      { id: 'an-uong', name: 'Ăn uống', icon: 'utensils', c: 1 },
      { id: 'di-chuyen', name: 'Di chuyển', icon: 'bus', c: 2 },
      { id: 'nha-o', name: 'Nhà ở', icon: 'home', c: 3 },
      { id: 'mua-sam', name: 'Mua sắm', icon: 'bag', c: 4 },
      { id: 'giai-tri', name: 'Giải trí', icon: 'film', c: 5 },
      { id: 'suc-khoe', name: 'Sức khỏe', icon: 'heart', c: 6 },
      { id: 'hoc-tap', name: 'Học tập', icon: 'book', c: 7 },
      { id: 'khac-chi', name: 'Khác', icon: 'ellipsis', c: 8 }
    ],
    income: [
      { id: 'luong', name: 'Lương', icon: 'wallet', c: 6 },
      { id: 'thuong', name: 'Thưởng', icon: 'gift', c: 5 },
      { id: 'thu-nhap-phu', name: 'Thu nhập phụ', icon: 'trend', c: 7 },
      { id: 'khac-thu', name: 'Khác', icon: 'pcircle', c: 8 }
    ]
  };

  var CAT_BY_ID = {};
  ['expense', 'income'].forEach(function (t) {
    CATEGORIES[t].forEach(function (c) {
      c.type = t;
      CAT_BY_ID[c.id] = c;
    });
  });

  var MESSAGES = {
    amount: 'Nhập số tiền lớn hơn 0',
    amountMax: 'Số tiền tối đa 999.999.999.999 ₫',
    category: 'Chọn một danh mục',
    date: 'Chọn ngày hợp lệ',
    note: 'Tối đa ' + NOTE_MAX + ' ký tự'
  };

  /* ---------- Ngày theo giờ địa phương (không dùng UTC) ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayStr(now) { return ymd(now instanceof Date ? now : new Date()); }
  function shiftDay(s, k) {
    var p = s.split('-');
    return ymd(new Date(+p[0], +p[1] - 1, +p[2] + k));
  }
  function yesterdayStr(now) { return shiftDay(todayStr(now), -1); }

  /** Chuỗi YYYY-MM-DD phải là một ngày có thật trong lịch (loại 2026-02-30, 2025-02-29...). */
  function isRealDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var y = +s.slice(0, 4), m = +s.slice(5, 7), d = +s.slice(8, 10);
    var dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  /* ---------- Số tiền ---------- */
  /** Giữ lại chữ số, bỏ số 0 đầu, cắt tối đa 12 chữ số. Trả về chuỗi chữ số ('' nếu không có). */
  function cleanDigits(raw) {
    var d = String(raw == null ? '' : raw).replace(/\D/g, '');
    d = d.replace(/^0+(?=\d)/, '');
    if (d.length > AMOUNT_MAX_DIGITS) d = d.slice(0, AMOUNT_MAX_DIGITS);
    return d;
  }
  /** '1250000' -> '1.250.000' */
  function groupDigits(d) { return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  /** Chuỗi người dùng gõ -> chuỗi hiển thị trong ô (có dấu chấm ngăn cách). */
  function formatAmountInput(raw) { return groupDigits(cleanDigits(raw)); }
  /** Chuỗi hiển thị -> số nguyên VND; 0 nếu rỗng. */
  function parseAmount(raw) {
    var d = cleanDigits(raw);
    return d === '' ? 0 : parseInt(d, 10);
  }
  /** Số nguyên -> '1.250.000 ₫' (định dạng vi-VN, luôn dùng dấu chấm, không phụ thuộc ICU của máy). */
  function formatVnd(n) { return groupDigits(String(Math.abs(Math.round(n)))) + ' ₫'; }
  function formatSigned(n, type) { return (type === 'income' ? '+' : '−') + formatVnd(n); }
  /**
   * Đặt lại vị trí con trỏ sau khi định dạng: giữ nguyên số chữ số nằm trước con trỏ.
   * before = chuỗi trước khi định dạng, caret = vị trí con trỏ trong `before`; after = chuỗi đã định dạng.
   */
  function caretAfterFormat(before, caret, after) {
    var raw = String(before).replace(/\D/g, '');
    var stripped = raw.length - raw.replace(/^0+(?=\d)/, '').length; // số 0 đầu bị loại
    var digitsBefore = String(before).slice(0, caret).replace(/\D/g, '').length;
    var afterDigits = String(after).replace(/\D/g, '').length;
    var target = Math.max(0, Math.min(afterDigits, digitsBefore - Math.min(stripped, digitsBefore)));
    var seen = 0;
    for (var i = 0; i < after.length; i++) {
      if (seen === target) return i;
      if (/\d/.test(after[i])) seen++;
    }
    return after.length;
  }

  /* ---------- Ghi chú ---------- */
  function charLen(s) { return Array.from(String(s || '')).length; } // đếm theo ký tự, không theo UTF-16
  /** Chuẩn hóa: bỏ \r, cắt khoảng trắng hai đầu, tối đa 2 dòng (phần dòng thừa được nối vào dòng 2). */
  function normalizeNote(s) {
    var t = String(s == null ? '' : s).replace(/\r\n?/g, '\n').trim();
    if (!t) return '';
    var lines = t.split('\n').map(function (l) { return l.trim(); }).filter(Boolean); // bỏ dòng trống
    if (lines.length > 2) lines = [lines[0], lines.slice(1).join(' ')];
    return lines.join('\n');
  }
  function noteCounter(note) {
    var len = charLen(normalizeNote(note));
    var left = NOTE_MAX - len;
    return { len: len, left: left, visible: left < NOTE_WARN_LEFT, over: left < 0 };
  }

  /* ---------- Danh mục ---------- */
  function categoriesFor(type) { return CATEGORIES[type === 'income' ? 'income' : 'expense']; }
  function categoryBelongsTo(id, type) { return !!CAT_BY_ID[id] && CAT_BY_ID[id].type === type; }
  function getCategory(id) { return CAT_BY_ID[id] || null; }

  /* ---------- Trạng thái form ---------- */
  /** Giá trị khởi tạo của form: chế độ Thêm (mặc định Chi, hôm nay) hoặc Sửa (từ giao dịch có sẵn). */
  function initialForm(tx, now) {
    if (tx) {
      return {
        type: tx.type === 'income' ? 'income' : 'expense',
        amount: formatAmountInput(String(tx.amount)),
        category: tx.category || '',
        date: tx.date || todayStr(now),
        note: tx.note || ''
      };
    }
    return { type: 'expense', amount: '', category: '', date: todayStr(now), note: '' };
  }

  /** Đổi loại Chi ↔ Thu. Trả về form mới; danh mục không thuộc loại mới bị bỏ chọn (và báo `categoryReset`). */
  function switchType(form, type) {
    if (type !== 'income' && type !== 'expense') return { form: form, categoryReset: false };
    if (form.type === type) return { form: form, categoryReset: false };
    var keep = form.category && categoryBelongsTo(form.category, type);
    var reset = !!form.category && !keep;
    return {
      form: { type: type, amount: form.amount, category: keep ? form.category : '', date: form.date, note: form.note },
      categoryReset: reset
    };
  }

  /** Hợp lệ hay không – trả về { ok, errors:{amount?,category?,date?,note?}, firstError, value }. */
  function validate(form, now) {
    var errors = {};
    var amount = parseAmount(form.amount);
    if (!(amount > 0)) errors.amount = MESSAGES.amount;
    else if (amount > AMOUNT_MAX || !Number.isSafeInteger(amount)) errors.amount = MESSAGES.amountMax;

    if (!form.category || !categoryBelongsTo(form.category, form.type)) errors.category = MESSAGES.category;

    var today = todayStr(now);
    if (!isRealDate(form.date) || form.date > today || form.date < MIN_DATE) errors.date = MESSAGES.date;

    var note = normalizeNote(form.note);
    if (charLen(note) > NOTE_MAX) errors.note = MESSAGES.note;

    var order = ['amount', 'category', 'date', 'note'];
    var first = null;
    for (var i = 0; i < order.length; i++) if (errors[order[i]]) { first = order[i]; break; }
    return {
      ok: first === null,
      errors: errors,
      firstError: first,
      value: first === null ? { type: form.type, amount: amount, category: form.category, date: form.date, note: note } : null
    };
  }
  /** Kiểm tra từng ô (dùng khi blur). */
  function validateField(form, field, now) { return validate(form, now).errors[field] || ''; }

  /** So sánh với giá trị ban đầu (chuẩn hóa) để biết có thay đổi chưa lưu. */
  function isDirty(form, initial) {
    return form.type !== initial.type ||
      parseAmount(form.amount) !== parseAmount(initial.amount) ||
      form.category !== initial.category ||
      form.date !== initial.date ||
      normalizeNote(form.note) !== normalizeNote(initial.note);
  }

  /* ---------- Dấu thời gian hiển thị ở chế độ Sửa ---------- */
  function formatStamp(ms) {
    if (!Number.isFinite(ms)) return '';
    var d = new Date(ms);
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function timeline(tx) {
    if (!tx || !Number.isFinite(tx.createdAt)) return '';
    var s = 'Tạo ' + formatStamp(tx.createdAt);
    if (Number.isFinite(tx.updatedAt) && tx.updatedAt !== tx.createdAt) s += ' · Sửa lần cuối ' + formatStamp(tx.updatedAt);
    return s;
  }
  function dmy(s) { var p = String(s).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }

  return {
    NOTE_MAX: NOTE_MAX, NOTE_WARN_LEFT: NOTE_WARN_LEFT, AMOUNT_MAX: AMOUNT_MAX, AMOUNT_MAX_DIGITS: AMOUNT_MAX_DIGITS,
    MIN_DATE: MIN_DATE, UNDO_MS: UNDO_MS, MESSAGES: MESSAGES, CATEGORIES: CATEGORIES,
    todayStr: todayStr, yesterdayStr: yesterdayStr, shiftDay: shiftDay, isRealDate: isRealDate,
    cleanDigits: cleanDigits, groupDigits: groupDigits, formatAmountInput: formatAmountInput, parseAmount: parseAmount,
    formatVnd: formatVnd, formatSigned: formatSigned, caretAfterFormat: caretAfterFormat,
    charLen: charLen, normalizeNote: normalizeNote, noteCounter: noteCounter,
    categoriesFor: categoriesFor, categoryBelongsTo: categoryBelongsTo, getCategory: getCategory,
    initialForm: initialForm, switchType: switchType, validate: validate, validateField: validateField, isDirty: isDirty,
    formatStamp: formatStamp, timeline: timeline, dmy: dmy
  };
});
