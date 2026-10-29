/*
 * GIẢ LẬP M1 (Lõi dữ liệu & lưu trữ) – chỉ để M4 chạy và test độc lập. Dùng cùng khóa localStorage với bản giả lập
 * của M3 nên dữ liệu nhập ở M3 (cùng thư mục gốc) hiện ra ở đây. Khi M1 thật xong, thay file này.
 * Công tắc để test: window.__SOTC_DELAY (ms, giả lập đọc chậm), window.__SOTC_FAIL (true = đọc lỗi).
 */
(function (root) {
  'use strict';
  var KEY = 'sotc.demo.v1';
  function read() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); return d && Array.isArray(d.transactions) ? d.transactions.filter(function (t) { return t && typeof t === 'object'; }) : []; }
    catch (e) { return []; }
  }
  function write(list) { localStorage.setItem(KEY, JSON.stringify({ schemaVersion: 1, transactions: list })); }
  function later(fn) {
    return new Promise(function (res, rej) {
      setTimeout(function () { if (root.__SOTC_FAIL) rej(new Error('fail')); else res(fn()); }, root.__SOTC_DELAY || 0);
    });
  }
  root.DemoStore = {
    key: KEY,
    all: read,
    clear: function () { localStorage.removeItem(KEY); },
    seed: function (list) { var now = Date.now(); write(read().concat(list.map(function (p, i) { return Object.assign({ id: 't' + now + '_' + i + '_' + Math.random().toString(36).slice(2, 6), note: '', createdAt: now + i, updatedAt: now + i }, p); }))); },
    listByMonth: function (ym) {
      if (!root.__SOTC_DELAY && !root.__SOTC_FAIL) return read().filter(function (t) { return typeof t.date === 'string' && t.date.slice(0, 7) === ym; });
      return later(function () { return read().filter(function (t) { return typeof t.date === 'string' && t.date.slice(0, 7) === ym; }); });
    },
    months: function () {
      var f = function () { var s = {}; read().forEach(function (t) { if (typeof t.date === 'string') s[t.date.slice(0, 7)] = 1; }); return Object.keys(s).sort(); };
      return (!root.__SOTC_DELAY && !root.__SOTC_FAIL) ? f() : later(f);
    }
  };
})(typeof self !== 'undefined' ? self : this);
