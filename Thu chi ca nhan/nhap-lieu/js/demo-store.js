/*
 * GIẢ LẬP M1 (Lõi dữ liệu & lưu trữ) – chỉ để M3 chạy và test độc lập.
 * Khi M1 thật hoàn thành, thay file này bằng M1; M3 chỉ cần đối tượng có add/update/remove/restore/get.
 * Giả lập lỗi để test: window.__SOTC_FAIL = 'full' | 'blocked' | 'corrupt' (hoặc để trống).
 */
(function (root) {
  'use strict';
  var KEY = 'sotc.demo.v1';

  function read() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); return d && Array.isArray(d.transactions) ? d.transactions : []; }
    catch (e) { return []; }
  }
  function write(list) {
    if (root.__SOTC_FAIL) return { ok: false, error: root.__SOTC_FAIL };
    try { localStorage.setItem(KEY, JSON.stringify({ schemaVersion: 1, transactions: list })); return { ok: true }; }
    catch (e) { return { ok: false, error: e && e.name === 'QuotaExceededError' ? 'full' : 'blocked' }; }
  }
  function uid() { return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  root.DemoStore = {
    key: KEY,
    all: read,
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ } },
    get: function (id) { return read().filter(function (t) { return t.id === id; })[0] || null; },
    add: function (p) {
      var list = read(), now = Date.now();
      var tx = { id: uid(), type: p.type, amount: p.amount, category: p.category, date: p.date, note: p.note, createdAt: now, updatedAt: now };
      var w = write(list.concat([tx]));
      return w.ok ? { ok: true, tx: tx } : w;
    },
    update: function (id, p) {
      var list = read(), i = list.findIndex(function (t) { return t.id === id; });
      if (i < 0) return { ok: false, error: 'notfound' };
      var tx = Object.assign({}, list[i], { type: p.type, amount: p.amount, category: p.category, date: p.date, note: p.note, updatedAt: Math.max(Date.now(), list[i].createdAt + 1) });
      list[i] = tx;
      var w = write(list);
      return w.ok ? { ok: true, tx: tx } : w;
    },
    remove: function (id) {
      var list = read(), i = list.findIndex(function (t) { return t.id === id; });
      if (i < 0) return { ok: false, error: 'notfound' };
      var tx = list[i];
      list.splice(i, 1);
      var w = write(list);
      return w.ok ? { ok: true, tx: tx } : w;
    },
    restore: function (tx) {
      var list = read();
      if (list.some(function (t) { return t.id === tx.id; })) return { ok: true, tx: tx };
      var w = write(list.concat([tx]));
      return w.ok ? { ok: true, tx: tx } : w;
    }
  };
})(typeof self !== 'undefined' ? self : this);
