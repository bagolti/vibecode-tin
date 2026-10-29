/*
 * Module M3 – Nhập liệu thu chi: giao diện + luồng Thêm / Sửa / Xóa + Hoàn tác.
 *
 * Hợp đồng với module khác (PRD 4.2):
 *  - Dữ liệu: chỉ gọi qua "store" do M1 cung cấp (xem README). M3 không đọc/ghi localStorage.
 *      store.add(payload)      -> { ok:true, tx } | { ok:false, error }
 *      store.update(id,patch)  -> { ok:true, tx } | { ok:false, error }
 *      store.remove(id)        -> { ok:true, tx } | { ok:false, error }   (tx = bản ghi vừa xóa)
 *      store.restore(tx)       -> { ok:true, tx } | { ok:false, error }
 *      store.get(id)           -> tx | null
 *    (mỗi hàm có thể trả về Promise). error: 'full' | 'blocked' | 'corrupt' | 'notfound' | khác.
 *  - Báo thay đổi: bắn sự kiện `sotc:data-changed` trên document, detail = { source:'entry', action, id, tx }.
 *  - Mở form: SoThuChiEntry.open({ mode:'add' }) hoặc open({ mode:'edit', id }) — hoặc bấm phần tử có
 *    [data-action="add"] / [data-action="edit"][data-id].
 */
(function (root) {
  'use strict';
  var M = root.EntryModel;

  /* ---------- Biểu tượng (line 24px, nét 1.75, đầu bo tròn – DESIGN 7) ---------- */
  var P = {
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01"/>',
    utensils: '<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3Zm0 0v7"/>',
    bus: '<path d="M8 6v6M16 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2s-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3M9 18h5"/><circle cx="7" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0"/>',
    film: '<rect width="20" height="20" x="2" y="2" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    ellipsis: '<circle cx="12" cy="12" r="10"/><path d="M17 12h.01M12 12h.01M7 12h.01"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    pcircle: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>'
  };
  function ic(n, s) {
    s = s || 24;
    return '<svg class="en-ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var STORE_ERR = 'Không thể lưu dữ liệu. Kiểm tra bộ nhớ hoặc chế độ riêng tư của trình duyệt.';
  var ERR_TEXT = {
    full: STORE_ERR, blocked: STORE_ERR,
    corrupt: 'Dữ liệu lưu trên máy bị hỏng nên chưa thể ghi thêm. Hãy xuất dữ liệu hoặc bắt đầu lại.',
    notfound: 'Không tìm thấy khoản này (có thể đã bị xóa).'
  };

  /* ---------- Trạng thái module ---------- */
  var cfg = { store: null, now: function () { return new Date(); } };
  var cur = null;            // phiên nhập liệu đang mở
  var dialogs = [];          // ngăn xếp hộp thoại xác nhận (phần tử .en-dlg)
  var inerted = [];          // phần tử của trang chủ bị đặt inert khi mở
  var toastEl = null, toastTimer = null, undoCtx = null;

  function configure(opts) {
    opts = opts || {};
    if (opts.store) {
      ['add', 'update', 'remove', 'restore', 'get'].forEach(function (m) {
        if (typeof opts.store[m] !== 'function') throw new Error('store thiếu hàm ' + m + '()');
      });
      cfg.store = opts.store;
    }
    if (typeof opts.now === 'function') cfg.now = opts.now;
  }
  function nowDate() { var d = cfg.now(); return d instanceof Date ? d : new Date(d); }
  function call(fn) { // chuẩn hóa kết quả store: Promise | giá trị | lỗi ném ra
    try { return Promise.resolve(fn()).catch(function () { return { ok: false, error: 'unknown' }; }); }
    catch (e) { return Promise.resolve({ ok: false, error: 'unknown' }); }
  }
  function emit(action, tx) {
    document.dispatchEvent(new CustomEvent('sotc:data-changed', { detail: { source: 'entry', action: action, id: tx && tx.id, tx: tx } }));
  }

  /* ---------- Toast ---------- */
  function ensureToast() {
    if (toastEl && document.body.contains(toastEl)) return toastEl;
    toastEl = document.createElement('div');
    toastEl.className = 'en-toast';
    toastEl.id = 'en-toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
    return toastEl;
  }
  function hideToast() {
    clearTimeout(toastTimer);
    if (toastEl) { toastEl.classList.remove('en-show'); }
    undoCtx = null;
  }
  function showToast(msg, action) {
    var el = ensureToast();
    clearTimeout(toastTimer);
    undoCtx = null;
    el.innerHTML = '<span class="en-toast-msg">' + esc(msg) + '</span>' +
      (action ? '<button type="button" class="en-toast-act" data-en="toast-action">' + ic('undo', 18) + esc(action.label) + '</button>' : '');
    // buộc reflow để chuyển động chạy lại khi toast được thay thế
    void el.offsetWidth;
    el.classList.add('en-show');
    if (action) undoCtx = action;
    toastTimer = setTimeout(function () {
      el.classList.remove('en-show');
      undoCtx = null;
    }, M.UNDO_MS);
  }

  /* ---------- inert / khóa cuộn / bẫy focus ---------- */
  function lockPage(layer) {
    inerted = [];
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === layer || el === toastEl || el.tagName === 'SCRIPT' || el.hasAttribute('inert')) return;
      el.setAttribute('inert', '');
      inerted.push(el);
    });
    document.documentElement.classList.add('en-lock');
  }
  function unlockPage() {
    inerted.forEach(function (el) { el.removeAttribute('inert'); });
    inerted = [];
    document.documentElement.classList.remove('en-lock');
  }
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function focusables(scope) {
    return Array.prototype.filter.call(scope.querySelectorAll(FOCUSABLE), function (el) {
      return !el.closest('[inert]') && !el.hidden && el.getClientRects().length > 0;
    });
  }
  function topLayer() { return dialogs.length ? dialogs[dialogs.length - 1] : (cur && cur.layer); }

  document.addEventListener('keydown', function (e) {
    var layer = topLayer();
    if (!layer) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (dialogs.length) { dialogs[dialogs.length - 1]._resolve(false); return; }
      requestClose();
    } else if (e.key === 'Tab') {
      var list = focusables(layer);
      if (!list.length) { e.preventDefault(); return; }
      var first = list[0], last = list[list.length - 1], a = document.activeElement;
      if (!layer.contains(a)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
    }
  }, true);

  /* ---------- Hộp thoại xác nhận ---------- */
  function confirmDialog(o) {
    return new Promise(function (resolve) {
      var host = document.createElement('div');
      host.className = 'en-dlg';
      var id = 'en-dlg-' + (dialogs.length + 1);
      host.innerHTML =
        '<div class="en-scrim"></div>' +
        '<div class="en-dlg-panel" role="alertdialog" aria-modal="true" aria-labelledby="' + id + '-t" aria-describedby="' + id + '-d">' +
        '<h2 id="' + id + '-t">' + esc(o.title) + '</h2><p id="' + id + '-d">' + esc(o.body) + '</p>' +
        '<div class="en-dlg-btns">' +
        '<button type="button" class="en-btn en-btn-secondary" data-en="dlg-cancel">' + esc(o.cancelLabel) + '</button>' +
        '<button type="button" class="en-btn en-btn-danger-solid" data-en="dlg-ok">' + esc(o.confirmLabel) + '</button>' +
        '</div></div>';
      var prevFocus = document.activeElement;
      var done = false;
      host._resolve = function (v) {
        if (done) return;
        done = true;
        dialogs.splice(dialogs.indexOf(host), 1);
        host.remove();
        if (cur && !dialogs.length) cur.layer.querySelector('.en-panel').removeAttribute('inert');
        if (prevFocus && document.contains(prevFocus) && cur) prevFocus.focus();
        resolve(v);
      };
      host.addEventListener('click', function (e) {
        var t = e.target.closest('[data-en]');
        if (t && t.getAttribute('data-en') === 'dlg-ok') host._resolve(true);
        else if (t && t.getAttribute('data-en') === 'dlg-cancel') host._resolve(false);
        else if (e.target.classList.contains('en-scrim')) host._resolve(false);
      });
      document.body.appendChild(host);
      if (cur) cur.layer.querySelector('.en-panel').setAttribute('inert', '');
      dialogs.push(host);
      host.querySelector('[data-en="dlg-cancel"]').focus(); // mặc định rơi vào nút an toàn
    });
  }

  /* ---------- Dựng form ---------- */
  function catGridHtml(type, selected) {
    return M.categoriesFor(type).map(function (c, i) {
      var on = c.id === selected;
      return '<button type="button" class="en-cat" role="radio" aria-checked="' + on + '" data-cat="' + c.id + '" tabindex="' + (on ? 0 : -1) + '" style="--c:var(--cat-' + c.c + ')">' +
        '<span class="en-cico">' + ic(c.icon, 20) + '</span><span>' + esc(c.name) + '</span>' +
        '<span class="en-tick" aria-hidden="true">' + ic('check', 11) + '</span></button>';
    }).join('');
  }
  function panelHtml(edit) {
    return '' +
      '<div class="en-scrim" data-en="scrim"></div>' +
      '<div class="en-panel" role="dialog" aria-modal="true" aria-labelledby="en-title" data-mode="' + (edit ? 'edit' : 'add') + '">' +
      '<div class="en-hd"><h1 class="en-title" id="en-title">' + (edit ? 'Sửa khoản' : 'Thêm khoản') + '</h1>' +
      '<button type="button" class="en-icon-btn" data-en="close" aria-label="Đóng">' + ic('x') + '</button></div>' +
      '<form class="en-bd" id="en-form" novalidate autocomplete="off">' +
      '<div class="en-errslot" id="en-banner" aria-live="assertive"></div>' +
      '<div class="en-seg" role="radiogroup" aria-label="Loại khoản" data-en="type">' +
      '<button type="button" class="en-segbtn en-t-expense" role="radio" data-type="expense">Chi</button>' +
      '<button type="button" class="en-segbtn en-t-income" role="radio" data-type="income">Thu</button></div>' +
      '<div class="en-field"><label class="en-lbl" for="en-amount">Số tiền</label>' +
      '<div class="en-amt" data-en="amt"><input id="en-amount" name="amount" type="text" inputmode="numeric" autocomplete="off" placeholder="0" aria-describedby="en-err-amount" aria-required="true">' +
      '<span aria-hidden="true">₫</span></div><div class="en-errslot" id="en-err-amount" aria-live="polite"></div></div>' +
      '<div class="en-field" role="group" aria-labelledby="en-lbl-cat"><span class="en-lbl" id="en-lbl-cat">Danh mục</span>' +
      '<div class="en-cats" role="radiogroup" aria-labelledby="en-lbl-cat" aria-describedby="en-err-category" data-en="cats"></div>' +
      '<div class="en-errslot" id="en-err-category" aria-live="polite"></div></div>' +
      '<div class="en-field"><label class="en-lbl" for="en-date">Ngày</label>' +
      '<input class="en-input" id="en-date" name="date" type="date" min="' + M.MIN_DATE + '" aria-describedby="en-err-date" aria-required="true">' +
      '<div class="en-quick"><button type="button" class="en-chip" data-quick="today" aria-pressed="false">Hôm nay</button>' +
      '<button type="button" class="en-chip" data-quick="yesterday" aria-pressed="false">Hôm qua</button></div>' +
      '<div class="en-errslot" id="en-err-date" aria-live="polite"></div></div>' +
      '<div class="en-field"><label class="en-lbl" for="en-note">Ghi chú (tùy chọn)</label>' +
      '<textarea class="en-input" id="en-note" name="note" rows="2" aria-describedby="en-err-note en-count"></textarea>' +
      '<div class="en-count" id="en-count" data-over="false" hidden></div>' +
      '<div class="en-errslot" id="en-err-note" aria-live="polite"></div></div>' +
      (edit ? '<p class="en-meta" id="en-meta"></p>' : '') +
      '</form>' +
      '<div class="en-ft">' +
      (edit ? '<button type="button" class="en-btn en-btn-danger en-btn-del" data-en="delete">' + ic('trash', 20) + 'Xóa</button>' : '') +
      '<button type="button" class="en-btn en-btn-secondary en-btn-cancel" data-en="close">Hủy</button>' +
      '<button type="submit" form="en-form" class="en-btn en-btn-primary en-btn-save" data-en="save"><span class="en-save-lbl">' + (edit ? 'Lưu thay đổi' : 'Lưu') + '</span></button>' +
      '</div></div>';
  }

  /* ---------- Cập nhật giao diện theo state ---------- */
  function $(sel) { return cur.layer.querySelector(sel); }
  function setErr(field, msg) {
    var slot = $('#en-err-' + field);
    slot.innerHTML = msg ? '<p class="en-err">' + ic('alert', 16) + '<span>' + esc(msg) + '</span></p>' : '';
    cur.errors[field] = msg || '';
    var invalid = !!msg;
    if (field === 'amount') { $('[data-en="amt"]').dataset.invalid = invalid; $('#en-amount').setAttribute('aria-invalid', invalid); }
    if (field === 'category') $('[data-en="cats"]').dataset.invalid = invalid;
    if (field === 'date') $('#en-date').setAttribute('aria-invalid', invalid);
    if (field === 'note') $('#en-note').setAttribute('aria-invalid', invalid);
  }
  function renderType() {
    var f = cur.form;
    Array.prototype.forEach.call(cur.layer.querySelectorAll('.en-segbtn'), function (b) {
      var on = b.dataset.type === f.type;
      b.setAttribute('aria-checked', on);
      b.tabIndex = on ? 0 : -1;
    });
    $('[data-en="amt"]').style.setProperty('--cl', f.type === 'income' ? 'var(--income)' : 'var(--expense)');
  }
  function renderCats() {
    $('[data-en="cats"]').innerHTML = catGridHtml(cur.form.type, cur.form.category);
    if (!cur.form.category) { var first = $('.en-cat'); if (first) first.tabIndex = 0; }
  }
  function markCategory() {
    var any = false;
    Array.prototype.forEach.call(cur.layer.querySelectorAll('.en-cat'), function (b) {
      var on = b.dataset.cat === cur.form.category;
      any = any || on;
      b.setAttribute('aria-checked', on);
      b.tabIndex = on ? 0 : -1;
    });
    if (!any) { var first = $('.en-cat'); if (first) first.tabIndex = 0; }
  }
  function renderCategoryHint() {
    var slot = $('#en-err-category');
    if (cur.errors.category) return;
    slot.innerHTML = cur.hintReset ? '<p class="en-hint">' + ic('alert', 16) + '<span>Chọn lại danh mục</span></p>' : '';
  }
  function renderQuick() {
    var t = M.todayStr(nowDate()), y = M.yesterdayStr(nowDate());
    $('[data-quick="today"]').setAttribute('aria-pressed', cur.form.date === t);
    $('[data-quick="yesterday"]').setAttribute('aria-pressed', cur.form.date === y);
  }
  function renderCount() {
    var c = M.noteCounter(cur.form.note), el = $('#en-count');
    el.hidden = !c.visible;
    el.dataset.over = c.over;
    el.textContent = c.len + '/' + M.NOTE_MAX;
  }
  function renderSave() {
    var btn = $('[data-en="save"]');
    btn.disabled = cur.busy || (cur.edit && !M.isDirty(cur.form, cur.initial)); // Sửa: chỉ bật khi có thay đổi
    btn.setAttribute('aria-busy', cur.busy ? 'true' : 'false');
  }
  function renderAll() {
    renderType(); renderCats(); renderQuick(); renderCount(); renderSave();
    $('#en-amount').value = cur.form.amount;
    $('#en-date').value = cur.form.date;
    $('#en-note').value = cur.form.note;
  }

  function validateOne(field) {
    var msg = M.validateField(cur.form, field, nowDate());
    if (field === 'category' && cur.hintReset && !msg) cur.hintReset = false;
    setErr(field, msg);
    if (field === 'category') renderCategoryHint();
    return msg;
  }
  function showBanner(msg) {
    $('#en-banner').innerHTML = msg ? '<div class="en-banner" role="alert">' + ic('warn', 20) + '<span>' + esc(msg) + '</span></div>' : '';
  }

  /* ---------- Hành vi form ---------- */
  function onAmountInput(el) {
    var before = el.value, caret = el.selectionStart == null ? before.length : el.selectionStart;
    var after = M.formatAmountInput(before);
    if (after !== before) {
      el.value = after;
      var pos = M.caretAfterFormat(before, caret, after);
      try { el.setSelectionRange(pos, pos); } catch (e) { /* một số trình duyệt chặn */ }
    }
    cur.form.amount = after;
    if (cur.errors.amount) validateOne('amount');
    renderSave();
  }
  function onNoteInput(el) {
    var v = el.value;
    if ((v.match(/\n/g) || []).length > 1) { // tối đa 2 dòng
      var parts = v.replace(/\r/g, '').split('\n');
      v = parts[0] + '\n' + parts.slice(1).join(' ');
      el.value = v;
    }
    cur.form.note = v;
    renderCount();
    if (cur.errors.note) validateOne('note');
    renderSave();
  }
  function setType(type) {
    var r = M.switchType(cur.form, type);
    if (r.form === cur.form) return;
    cur.form = r.form;
    cur.hintReset = r.categoryReset;
    renderType(); renderCats();
    if (cur.errors.category && r.categoryReset) setErr('category', '');
    renderCategoryHint();
    renderSave();
  }
  function setCategory(id) {
    cur.form.category = id;
    cur.hintReset = false;
    setErr('category', '');
    $('#en-err-category').innerHTML = '';
    markCategory(); // chỉ cập nhật thuộc tính để không mất focus của phần tử đang bấm
    renderSave();
  }
  function setDate(v) {
    cur.form.date = v;
    $('#en-date').value = v;
    if (cur.errors.date) validateOne('date');
    renderQuick(); renderSave();
  }

  function focusField(field) {
    var el = { amount: '#en-amount', category: '.en-cat[tabindex="0"], .en-cat', date: '#en-date', note: '#en-note' }[field];
    var t = $(el);
    if (t) t.focus();
  }
  function shake(field) {
    var el = { amount: '[data-en="amt"]', category: '[data-en="cats"]', date: '#en-date', note: '#en-note' }[field];
    var t = $(el);
    t.classList.remove('en-shake'); void t.offsetWidth; t.classList.add('en-shake');
    setTimeout(function () { t.classList.remove('en-shake'); }, 260);
  }

  function setBusy(b) {
    cur.busy = b;
    var btn = $('[data-en="save"]');
    var lbl = btn.querySelector('.en-save-lbl');
    if (b) {
      btn.style.minWidth = btn.offsetWidth + 'px'; // giữ nguyên chiều rộng khi hiện spinner
      lbl.innerHTML = '<span class="en-spin" aria-hidden="true"></span><span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Đang lưu</span>';
    } else {
      btn.style.minWidth = '';
      lbl.textContent = cur.edit ? 'Lưu thay đổi' : 'Lưu';
    }
    renderSave();
  }

  function submit() {
    if (!cur || cur.busy || cur.closing) return Promise.resolve(false);
    var session = cur;
    var res = M.validate(session.form, nowDate());
    ['amount', 'category', 'date', 'note'].forEach(function (f) {
      if (f === 'category') session.hintReset = false;
      setErr(f, res.errors[f] || '');
    });
    if (!res.errors.category) $('#en-err-category').innerHTML = '';
    if (!res.ok) {
      showBanner('');
      shake(res.firstError);
      focusField(res.firstError);
      return Promise.resolve(false);
    }
    if (session.edit && !M.isDirty(session.form, session.initial)) return Promise.resolve(false);
    showBanner('');
    setBusy(true);
    var payload = res.value;
    var p = session.edit
      ? call(function () { return cfg.store.update(session.tx.id, payload); })
      : call(function () { return cfg.store.add(payload); });
    return p.then(function (r) {
      if (cur !== session) return false; // phiên đã bị đóng trong lúc chờ
      setBusy(false);
      if (!r || r.ok === false) {
        showBanner(ERR_TEXT[r && r.error] || STORE_ERR); // giữ nguyên form, không mất dữ liệu người dùng đã nhập
        return false;
      }
      var tx = r.tx || r;
      var edit = session.edit;
      closeNow(true);
      showToast(edit ? 'Đã cập nhật' : 'Đã lưu');
      emit(edit ? 'update' : 'add', tx);
      return true;
    });
  }

  function doDelete() {
    var session = cur;
    if (!session || !session.edit || session.busy) return;
    var tx = session.tx;
    var cat = M.getCategory(tx.category);
    confirmDialog({
      title: 'Xóa khoản này?',
      body: M.formatSigned(tx.amount, tx.type) + ' · ' + (cat ? cat.name : '') + ' · ' + M.dmy(tx.date),
      cancelLabel: 'Hủy', confirmLabel: 'Xóa'
    }).then(function (yes) {
      if (!yes || cur !== session) return;
      setBusy(true);
      return call(function () { return cfg.store.remove(tx.id); }).then(function (r) {
        if (cur !== session) return;
        setBusy(false);
        if (!r || r.ok === false) { showBanner(ERR_TEXT[r && r.error] || STORE_ERR); return; }
        var removed = r.tx || tx;
        closeNow(true);
        showToast('Đã xóa', { label: 'Hoàn tác', run: function () { undo(removed); } });
        emit('delete', removed);
      });
    });
  }
  function undo(tx) {
    return call(function () { return cfg.store.restore(tx); }).then(function (r) {
      if (!r || r.ok === false) { showToast(ERR_TEXT[r && r.error] || STORE_ERR); return false; }
      showToast('Đã khôi phục khoản');
      emit('restore', r.tx || tx);
      return true;
    });
  }

  /* ---------- Đóng / mở ---------- */
  function requestClose() {
    if (!cur || cur.closing || cur.busy) return Promise.resolve(false);
    var session = cur;
    if (!M.isDirty(session.form, session.initial)) { closeNow(false); return Promise.resolve(true); }
    return confirmDialog({
      title: 'Bỏ thay đổi?', body: 'Những gì bạn vừa nhập sẽ không được lưu.',
      cancelLabel: 'Tiếp tục nhập', confirmLabel: 'Bỏ thay đổi'
    }).then(function (yes) {
      if (yes && cur === session) { closeNow(false); return true; }
      return false;
    });
  }
  function closeNow() {
    var session = cur;
    if (!session) return;
    session.closing = true;
    dialogs.slice().forEach(function (d) { d._resolve(false); });
    session.layer.classList.add('en-closing');
    var opener = session.opener;
    cur = null;
    unlockPage();
    if (opener && document.contains(opener) && typeof opener.focus === 'function') opener.focus();
    setTimeout(function () { session.layer.remove(); }, 170);
  }

  function open(o) {
    o = o || {};
    if (!cfg.store) throw new Error('Chưa cấu hình store: gọi SoThuChiEntry.configure({ store })');
    if (cur) return Promise.resolve(false);
    var edit = o.mode === 'edit';
    var tx = null;
    if (edit) {
      tx = o.tx || (o.id != null ? cfg.store.get(o.id) : null);
      if (tx && typeof tx.then === 'function') {
        // get() bất đồng bộ: chờ rồi mở
        return tx.then(function (t) { return open({ mode: 'edit', tx: t, opener: o.opener || document.activeElement }); });
      }
      if (!tx) { showToast(ERR_TEXT.notfound); return Promise.resolve(false); }
    }
    var layer = document.createElement('div');
    layer.className = 'en-layer';
    layer.innerHTML = panelHtml(edit);
    var initial = M.initialForm(tx, nowDate());
    cur = {
      layer: layer, edit: edit, tx: tx, initial: initial,
      form: { type: initial.type, amount: initial.amount, category: initial.category, date: initial.date, note: initial.note },
      errors: {}, busy: false, closing: false, hintReset: false,
      opener: o.opener || document.activeElement
    };
    document.body.appendChild(layer);
    lockPage(layer);
    $('#en-date').max = M.todayStr(nowDate());
    renderAll();
    if (edit) $('#en-meta').textContent = M.timeline(tx);
    layer.addEventListener('click', onClick);
    layer.addEventListener('input', onInput);
    layer.addEventListener('focusout', onBlur);
    layer.addEventListener('keydown', onKey);
    layer.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    var amt = $('#en-amount');
    amt.focus();
    try { amt.setSelectionRange(amt.value.length, amt.value.length); } catch (e) { /* bỏ qua */ }
    return Promise.resolve(true);
  }

  /* ---------- Sự kiện trong form ---------- */
  function onClick(e) {
    var t = e.target.closest('[data-en],[data-type],[data-cat],[data-quick]');
    if (!t) return;
    if (t.dataset.type) return setType(t.dataset.type);
    if (t.dataset.cat) return setCategory(t.dataset.cat);
    if (t.dataset.quick) {
      var d = nowDate();
      return setDate(t.dataset.quick === 'today' ? M.todayStr(d) : M.yesterdayStr(d));
    }
    switch (t.dataset.en) {
      case 'close': case 'scrim': requestClose(); break;
      case 'delete': doDelete(); break;
    }
  }
  function onInput(e) {
    var t = e.target;
    if (t.id === 'en-amount') onAmountInput(t);
    else if (t.id === 'en-note') onNoteInput(t);
    else if (t.id === 'en-date') { cur.form.date = t.value; if (cur.errors.date) validateOne('date'); renderQuick(); renderSave(); }
  }
  function onBlur(e) {
    if (!cur || cur.closing) return;
    var t = e.target;
    // Lỗi hiện khi rời ô (blur) – bỏ qua khi focus chuyển ra ngoài panel (vd. bấm Đóng) để không báo lỗi thừa.
    if (!e.relatedTarget || !cur.layer.contains(e.relatedTarget)) return;
    if (t.id === 'en-amount') validateOne('amount');
    else if (t.id === 'en-date') validateOne('date');
    else if (t.id === 'en-note') validateOne('note');
  }
  function onKey(e) {
    var t = e.target;
    if (e.key === 'Enter' && t.id === 'en-note') {
      if (e.shiftKey) { if ((t.value.match(/\n/g) || []).length >= 1) e.preventDefault(); } // chỉ cho phép 2 dòng
      else { e.preventDefault(); submit(); }
      return;
    }
    // Mũi tên di chuyển giữa các lựa chọn của radiogroup (công tắc Chi/Thu và lưới danh mục)
    var isSeg = t.classList && t.classList.contains('en-segbtn');
    var isCat = t.classList && t.classList.contains('en-cat');
    if (!isSeg && !isCat) return;
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; } // Enter = Lưu (Space mới là chọn)
    var items = Array.prototype.slice.call(t.parentNode.children);
    var i = items.indexOf(t), cols = isCat ? 4 : items.length, n = items.length, j = i;
    if (e.key === 'ArrowRight') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    else if (e.key === 'ArrowDown' && isCat) j = i + cols < n ? i + cols : i;
    else if (e.key === 'ArrowUp' && isCat) j = i - cols >= 0 ? i - cols : i;
    else return;
    e.preventDefault();
    if (isSeg) { setType(items[j].dataset.type); cur.layer.querySelector('.en-segbtn[data-type="' + cur.form.type + '"]').focus(); }
    else { items.forEach(function (b) { b.tabIndex = -1; }); items[j].tabIndex = 0; items[j].focus(); }
  }

  /* Hoàn tác từ toast (ủy quyền để không phụ thuộc vòng đời của form) */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-en="toast-action"]');
    if (b && undoCtx) {
      var run = undoCtx.run;
      hideToast();
      run();
      return;
    }
    // Điểm vào từ module khác: [data-action="add"] / [data-action="edit"][data-id]
    var a = e.target.closest && e.target.closest('[data-action="add"],[data-action="edit"]');
    if (!a || !cfg.store || a.closest('.en-layer')) return;
    if (a.dataset.action === 'add') open({ mode: 'add', opener: a });
    else if (a.dataset.id) open({ mode: 'edit', id: a.dataset.id, opener: a });
  });

  root.SoThuChiEntry = {
    configure: configure,
    open: open,
    close: function () { return requestClose(); },
    isOpen: function () { return !!cur; },
    /* dùng cho test */
    _state: function () { return cur ? { form: Object.assign({}, cur.form), errors: Object.assign({}, cur.errors), edit: cur.edit } : null; }
  };
})(typeof self !== 'undefined' ? self : this);
