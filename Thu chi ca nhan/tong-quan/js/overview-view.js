/*
 * Module M4 – Tổng quan tháng (Trang chủ quản lý tổng thu chi): bộ chọn tháng, 3 thẻ Tổng thu / Tổng chi / Số dư,
 * cảnh báo khi chi > thu, các trạng thái rỗng / đang tải / lỗi.
 *
 * Hợp đồng (PRD 4.2):
 *  - Đọc dữ liệu chỉ qua store của M1 (đồng bộ hoặc Promise):
 *      store.listByMonth('YYYY-MM') -> Transaction[]      store.months() -> ['YYYY-MM', ...] (các tháng có dữ liệu)
 *  - M4 là nguồn DUY NHẤT của "tháng đang chọn": phát `sotc:month-changed` trên document, detail = { ym, source:'overview' }.
 *    Đọc bằng SoThuChiOverview.getMonth(); đổi bằng setMonth(ym).
 *  - Tự làm mới khi nhận `sotc:data-changed` (do M3 bắn).
 *  - Nút "Thêm khoản" dùng [data-action="add"] để M3 tự bắt sự kiện.
 */
(function (root) {
  'use strict';
  var M = root.OverviewModel;

  var P = {
    cl: '<path d="m15 18-6-6 6-6"/>', cr: '<path d="m9 18 6-6-6-6"/>',
    down: '<path d="M17 7 7 17M17 17H7V7"/>', up: '<path d="M7 7h10v10M7 17 17 7"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    calx: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M10 14l4 4m0-4-4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    book: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18M12 8h5M12 12h5"/>'
  };
  function ic(n, s, cls) {
    s = s || 24;
    return '<svg class="ov-ic ' + (cls || '') + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var SKEL_DELAY = 200, SKEL_MIN = 300, COUNT_MS = 400;

  var el = null, store = null, nowFn = function () { return new Date(); };
  var st = null, token = 0, onData = null, ro = null, mounted = false;

  function nowYm() { return M.ymOf(nowFn()); }
  function asPromise(fn) { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } }
  function reduced() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function q(s) { return el.querySelector(s); }

  /* ---------- Khung ---------- */
  function shell() {
    el.innerHTML =
      '<section class="ov" aria-label="Tổng quan tháng">' +
      '<div class="ov-mp" role="group" aria-label="Chọn tháng">' +
      '<button type="button" class="ov-ibtn" data-ov="prev" aria-label="Tháng trước">' + ic('cl') + '</button>' +
      '<h2 class="ov-mlabel" id="ov-mlabel" data-ov="label"></h2>' +
      '<button type="button" class="ov-ibtn" data-ov="next" aria-label="Tháng sau">' + ic('cr') + '</button></div>' +
      '<div class="ov-sr" role="status" aria-live="polite" data-ov="live"></div>' +
      '<div class="ov-banners" data-ov="banners"></div>' +
      '<div class="ov-sum" data-ov="sum" aria-labelledby="ov-mlabel"></div>' +
      '<div class="ov-state" data-ov="state"></div></section>';
    el.addEventListener('click', onClick);
  }
  function card(kind, label, icon) {
    return '<div class="ov-card" data-kind="' + kind + '"><div class="ov-lab">' + ic(icon, 16) + '<span>' + label + '</span></div>' +
      '<div class="ov-val"><span class="ov-vis" data-ov="vis"></span><span class="ov-sr" data-ov="full"></span></div>' +
      (kind === 'balance' ? '<div data-ov="tag"></div>' : '') + '</div>';
  }
  function skeleton() {
    var c = function (k) { return '<div class="ov-card ov-skelcard" data-kind="' + k + '"><div class="ov-skel"></div><div class="ov-skel"></div></div>'; };
    q('[data-ov="sum"]').innerHTML = c('income') + c('expense') + c('balance');
    q('[data-ov="sum"]').setAttribute('aria-busy', 'true');
    q('[data-ov="state"]').innerHTML = '';
  }
  function ensureCards() {
    var sum = q('[data-ov="sum"]');
    if (!sum.querySelector('[data-kind="income"][data-ov-ready]')) {
      sum.innerHTML = card('income', 'Tổng thu', 'down') + card('expense', 'Tổng chi', 'up') + card('balance', 'Số dư', 'wallet');
      Array.prototype.forEach.call(sum.children, function (c) { c.setAttribute('data-ov-ready', ''); });
    }
    sum.removeAttribute('aria-busy');
  }

  /* ---------- Vẽ ---------- */
  function renderPicker() {
    var cur = nowYm();
    q('[data-ov="label"]').textContent = M.monthLabel(st.ym);
    q('[data-ov="prev"]').disabled = !M.canPrev(st.ym);
    q('[data-ov="next"]').disabled = !M.canNext(st.ym, cur);
  }
  /** Hiện số tiền; nếu tràn thẻ thì rút gọn (DESIGN 9.2). */
  function fit(kind, n) {
    var c = q('[data-kind="' + kind + '"]');
    if (!c) return;
    var vis = c.querySelector('[data-ov="vis"]');
    if (!vis) return; // đang là skeleton
    var full = kind === 'balance' ? M.formatBalance(n) : M.formatVnd(n);
    vis.textContent = full;
    c.dataset.compact = 'false';
    if (vis.scrollWidth > vis.clientWidth + 1) {
      vis.textContent = M.compactVnd(n);
      c.dataset.compact = 'true';
    }
  }
  function fitAll() {
    if (!st || !st.summary || st.error) return;
    fit('income', st.summary.income); fit('expense', st.summary.expense); fit('balance', st.summary.balance);
  }
  function tween(kind, from, to, done) {
    var c = q('[data-kind="' + kind + '"]'), vis = c && c.querySelector('[data-ov="vis"]');
    if (!vis) return;
    var fmt = kind === 'balance' ? M.formatBalance : M.formatVnd;
    var t0 = null;
    var my = token;
    function step(t) {
      if (my !== token || !el) return;
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / COUNT_MS), e = 1 - Math.pow(1 - k, 3);
      if (k < 1) { vis.textContent = fmt(Math.round(from + (to - from) * e)); requestAnimationFrame(step); }
      else { fit(kind, to); if (done) done(); }
    }
    requestAnimationFrame(step);
  }
  function renderCards(prevSummary, animate) {
    ensureCards();
    var s = st.summary, a = st.assess;
    var map = { income: s.income, expense: s.expense, balance: s.balance };
    Object.keys(map).forEach(function (k) {
      var c = q('[data-kind="' + k + '"]');
      c.querySelector('[data-ov="full"]').textContent = (k === 'balance' ? M.formatBalance(map[k]) : M.formatVnd(map[k]));
      if (animate && prevSummary) tween(k, prevSummary[k], map[k]); else fit(k, map[k]);
    });
    var bal = q('[data-kind="balance"]');
    bal.dataset.neg = s.balance < 0 ? 'true' : 'false';
    bal.dataset.warn = a.level === 'warning' ? 'true' : 'false';
    q('[data-ov="tag"]').innerHTML = a.level === 'warning' ? '<span class="ov-tag">' + ic('warn', 16) + 'Chi vượt thu</span>' : '';
    q('[data-ov="sum"]').dataset.dim = st.firstUse ? 'true' : 'false';
  }
  function renderBanners() {
    var b = q('[data-ov="banners"]'), h = '';
    if (st.error) {
      h += '<div class="ov-banner ov-err" role="alert"><div class="ov-bt">' + ic('alert', 20) +
        '<div><strong>Không đọc được dữ liệu</strong><span class="ov-bmsg">Chưa tải được dữ liệu của ' + esc(M.monthLabel(st.ym).toLowerCase()) + '.</span></div></div>' +
        '<div class="ov-ba"><button type="button" class="ov-btn ov-btn-secondary" data-ov="retry">Thử lại</button></div></div>';
    } else if (st.assess && st.assess.level === 'warning') {
      h += '<div class="ov-banner" role="status" data-ov="warning"><div class="ov-bt">' + ic('warn', 20) +
        '<div><strong>Chi đang vượt thu</strong><span class="ov-bmsg">' + esc(M.warningText(st.summary, st.assess)) + '</span></div></div></div>';
    }
    b.innerHTML = h;
  }
  function renderState() {
    var s = q('[data-ov="state"]');
    if (st.error) { s.innerHTML = ''; return; }
    if (st.firstUse) {
      s.innerHTML = '<div class="ov-block ov-first" data-ov="first">' +
        '<svg class="ov-art" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P.book + '</svg>' +
        '<h3>Chưa có khoản nào</h3><p>Ghi khoản đầu tiên của bạn trong 15 giây</p>' +
        '<button type="button" class="ov-btn ov-btn-primary" data-action="add">' + ic('plus', 20) + 'Thêm khoản</button>' +
        '<p class="ov-priv">Dữ liệu chỉ lưu trên máy này, không cần đăng nhập.</p></div>';
    } else if (st.summary.count === 0) {
      var near = M.nearestMonthWithData(st.months, st.ym, nowYm());
      s.innerHTML = '<div class="ov-block ov-empty" data-ov="empty-month"><div class="ov-et">' + ic('calx', 28) + '<span>Chưa có giao dịch trong tháng này</span></div>' +
        '<div class="ov-ea"><button type="button" class="ov-btn ov-btn-secondary" data-action="add">Thêm khoản</button>' +
        (near ? '<button type="button" class="ov-btn ov-btn-ghost" data-ov="nearest" data-ym="' + near + '">Về tháng gần nhất có dữ liệu</button>' : '') + '</div></div>';
    } else s.innerHTML = '';
  }
  function announce() {
    var live = q('[data-ov="live"]');
    if (st.error) { live.textContent = ''; return; }
    var s = st.summary;
    live.textContent = M.monthLabel(st.ym) + ': tổng thu ' + M.formatVnd(s.income) + ', tổng chi ' + M.formatVnd(s.expense) +
      ', số dư ' + M.formatBalance(s.balance) + (st.assess.level === 'warning' ? '. Cảnh báo: ' + M.warningText(s, st.assess) : '') + '.';
  }

  /* ---------- Nạp dữ liệu ---------- */
  function load(opts) {
    opts = opts || {};
    var my = ++token, ym = st.ym;
    var started = Date.now(), skelShown = 0, skelTimer = null;
    st.loading = true;
    if (!opts.quiet) {
      skelTimer = setTimeout(function () { if (my === token) { skelShown = Date.now(); skeleton(); } }, SKEL_DELAY);
    }
    var prev = st.summary;
    return Promise.all([asPromise(function () { return store.listByMonth(ym); }), asPromise(function () { return store.months(); })])
      .then(function (r) {
        return { list: Array.isArray(r[0]) ? r[0] : [], months: Array.isArray(r[1]) ? r[1] : [] };
      })
      .then(function (r) {
        clearTimeout(skelTimer);
        if (my !== token) return; // đã có yêu cầu mới hơn (đổi tháng nhanh) – bỏ kết quả cũ
        var wait = skelShown ? Math.max(0, SKEL_MIN - (Date.now() - skelShown)) : 0; // skeleton hiện tối thiểu 300ms
        return new Promise(function (res) { setTimeout(res, wait); }).then(function () {
          if (my !== token) return;
          st.summary = M.summarize(r.list); st.assess = M.assess(st.summary); st.months = r.months.filter(M.isYm);
          st.firstUse = st.months.length === 0 && st.summary.count === 0;
          st.error = false; st.loading = false;
          finish(prev, opts);
        });
      })
      .catch(function () {
        clearTimeout(skelTimer);
        if (my !== token) return;
        st.error = true; st.loading = false; st.summary = M.summarize([]); st.assess = M.assess(st.summary); st.months = [];
        ensureCards();
        finish(null, opts);
        ['income', 'expense', 'balance'].forEach(function (k) { q('[data-kind="' + k + '"] [data-ov="vis"]').textContent = '—'; });
      });
  }
  function finish(prev, opts) {
    renderPicker(); renderBanners(); renderState();
    if (!st.error) renderCards(prev, !!opts.animate && !reduced());
    q('[data-ov="sum"]').removeAttribute('aria-busy');
    if (opts.animate && !reduced()) {
      var sum = q('[data-ov="sum"]'); sum.classList.remove('ov-fade'); void sum.offsetWidth; sum.classList.add('ov-fade');
    }
    announce();
    st.ready = true;
    if (typeof opts.cb === 'function') opts.cb();
  }

  /* ---------- Tháng đang chọn ---------- */
  function setMonth(ym, source) {
    var next = M.clampYm(ym, nowYm());
    if (!st || next === st.ym) return Promise.resolve(false);
    st.ym = next;
    renderPicker();
    document.dispatchEvent(new CustomEvent('sotc:month-changed', { detail: { ym: next, source: 'overview' } }));
    return load({ animate: true }).then(function () { return true; });
  }
  function onClick(e) {
    var t = e.target.closest('[data-ov]');
    if (!t || t.disabled) return;
    var a = t.getAttribute('data-ov');
    if (a === 'prev') setMonth(M.addMonths(st.ym, -1));
    else if (a === 'next') setMonth(M.addMonths(st.ym, 1));
    else if (a === 'nearest') setMonth(t.getAttribute('data-ym'));
    else if (a === 'retry') load({});
  }

  function mount(target, opts) {
    if (mounted) unmount();
    opts = opts || {};
    if (!opts.store || typeof opts.store.listByMonth !== 'function' || typeof opts.store.months !== 'function')
      throw new Error('store phải có listByMonth(ym) và months()');
    el = target; store = opts.store;
    if (typeof opts.now === 'function') nowFn = opts.now;
    st = { ym: M.clampYm(opts.month, nowYm()), summary: M.summarize([]), assess: M.assess(null), months: [], firstUse: false, error: false, ready: false };
    mounted = true;
    shell();
    renderPicker();
    document.dispatchEvent(new CustomEvent('sotc:month-changed', { detail: { ym: st.ym, source: 'overview' } }));
    onData = function () { if (st) load({ quiet: true }); };
    document.addEventListener('sotc:data-changed', onData);
    if (root.ResizeObserver) { ro = new ResizeObserver(function () { fitAll(); }); ro.observe(el); }
    return load({});
  }
  function unmount() {
    token++;
    if (onData) document.removeEventListener('sotc:data-changed', onData);
    if (ro) ro.disconnect();
    if (el) { el.removeEventListener('click', onClick); el.innerHTML = ''; }
    el = null; st = null; mounted = false; onData = null; ro = null;
  }

  root.SoThuChiOverview = {
    mount: mount, unmount: unmount,
    getMonth: function () { return st ? st.ym : null; },
    setMonth: function (ym) { return setMonth(ym); },
    refresh: function () { return st ? load({ quiet: true }) : Promise.resolve(); },
    _state: function () { return st ? { ym: st.ym, summary: st.summary, assess: st.assess, firstUse: st.firstUse, error: st.error, ready: st.ready } : null; }
  };
})(typeof self !== 'undefined' ? self : this);
