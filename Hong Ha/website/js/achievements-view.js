/*
 * achievements-view.js – Dựng giao diện trang Thành tích (DESIGN 4.4, 6.6, 6.7, 10.4, 10.5, 10.10).
 * Chỉ dùng createElement/textContent: nội dung do nhà trường nhập không bao giờ được diễn giải thành HTML.
 *
 *   var page = HongHa.achievementsView.mount(document.getElementById('achievements-root'), rawData);
 *   page.destroy();
 */
(function (root, factory) {
  var api = factory(root.HongHa && root.HongHa.achievementsModel);
  root.HongHa = root.HongHa || {};
  root.HongHa.achievementsView = api;
})(typeof self !== 'undefined' ? self : this, function (model) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* Bộ biểu tượng nét 1,75px, bo tròn đầu nét (DESIGN 7.1) – đường dẫn theo phong cách Lucide */
  var ICONS = {
    award: ['<circle cx="12" cy="8" r="6"/>', '<path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>'],
    'shield-check': [
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
      '<path d="m9 12 2 2 4-4"/>'
    ],
    leaf: [
      '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>',
      '<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>'
    ],
    medal: [
      '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/>',
      '<path d="M11 12 5.12 2.2"/>',
      '<path d="m13 12 5.88-9.8"/>',
      '<path d="M8 7h8"/>',
      '<circle cx="12" cy="17" r="5"/>',
      '<path d="M12 18v-2h-.5"/>'
    ],
    'graduation-cap': [
      '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>',
      '<path d="M22 10v6"/>',
      '<path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>'
    ],
    quote: [
      '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
      '<path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>'
    ],
    'chevron-left': ['<path d="m15 18-6-6 6-6"/>'],
    'chevron-right': ['<path d="m9 18 6-6-6-6"/>'],
    x: ['<path d="M18 6 6 18"/>', '<path d="m6 6 12 12"/>'],
    search: ['<circle cx="11" cy="11" r="8"/>', '<path d="m21 21-4.3-4.3"/>'],
    'zoom-in': [
      '<circle cx="11" cy="11" r="8"/>',
      '<path d="m21 21-4.3-4.3"/>',
      '<path d="M11 8v6"/>',
      '<path d="M8 11h6"/>'
    ],
    inbox: [
      '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>',
      '<path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'
    ]
  };

  function icon(name, extraClass) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'icon' + (extraClass ? ' ' + extraClass : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.innerHTML = (ICONS[name] || ICONS.award).join(''); // chuỗi hằng của chúng tôi, không phải dữ liệu người dùng
    return svg;
  }

  /** Tạo phần tử: el('div', {class:'x', 'data-a':'1'}, [con...]) – con là Node hoặc chuỗi (textContent). */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (attrs[k] === false || attrs[k] === null || attrs[k] === undefined) return;
        node.setAttribute(k, attrs[k] === true ? '' : String(attrs[k]));
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------- Cấu trúc chung ---------- */

  function sectionHead(id, title, lead) {
    return el('div', { class: 'section__head reveal' }, [
      el('h2', { class: 'section__title', id: id + '-title' }, [title]),
      lead ? el('p', null, [lead]) : null
    ]);
  }

  function emptyState(message) {
    return el('div', { class: 'empty-state reveal', role: 'status' }, [
      icon('inbox'),
      el('p', null, [message || 'Nội dung đang được cập nhật.'])
    ]);
  }

  function section(id, alt, titleText, lead, body) {
    return el(
      'section',
      { class: 'section' + (alt ? ' section--alt' : ''), id: id, 'aria-labelledby': id + '-title' },
      [el('div', { class: 'container' }, [sectionHead(id, titleText, lead), body])]
    );
  }

  /* ---------- 6.6 Số liệu ---------- */

  function numText(stat, value) {
    return stat.plain ? String(value) : model.formatNumber(value);
  }

  function statText(stat, value) {
    return stat.prefix + numText(stat, value) + stat.suffix;
  }

  /** Cập nhật chỉ phần SỐ (tiền tố/hậu tố giữ nguyên) – dùng cho đếm số và trạng thái cuối. */
  function paint(valueEl, value) {
    valueEl._num.textContent = numText(valueEl._stat, value);
  }

  function renderStats(stats) {
    if (!stats.length) return emptyState();
    var list = el('ul', { class: 'stats', 'aria-label': 'Số liệu nổi bật' });
    stats.forEach(function (stat) {
      var finalText = statText(stat, stat.value);
      // Tiền tố/hậu tố ("Từ", "+ m²") nhỏ hơn số để không làm ô bị ngắt dòng
      var num = el('span', { class: 'stat__num' }, [numText(stat, stat.value)]);
      var valueEl = el('span', { class: 'stat__value', 'aria-hidden': 'true' }, [
        // Giữ nguyên khoảng trắng trong chữ ("Từ ") để văn bản sao chép/đọc liền mạch; flex gap lo khoảng cách hiển thị
        stat.prefix ? el('span', { class: 'stat__affix' }, [stat.prefix]) : null,
        num,
        stat.suffix ? el('span', { class: 'stat__affix' }, [stat.suffix]) : null
      ]);
      valueEl._num = num;
      valueEl.dataset.final = finalText;
      if (stat.animate) valueEl.dataset.animate = 'true';
      list.appendChild(
        el('li', { class: 'stat reveal' }, [
          valueEl,
          el('span', { class: 'sr-only' }, [finalText + ' – ' + stat.label]),
          el('span', { class: 'stat__label', 'aria-hidden': 'true' }, [stat.label])
        ])
      );
      valueEl._stat = stat;
    });
    return list;
  }

  /* ---------- 6.7 Timeline ---------- */

  function renderTimeline(items) {
    if (!items.length) return emptyState();
    var wrap = el('ol', { class: 'timeline' });
    model.groupTimeline(items).forEach(function (group) {
      var events = el('ul', { class: 'timeline__events' });
      group.items.forEach(function (ev) {
        events.appendChild(
          el('li', { class: 'timeline__event' }, [
            el('h3', { class: 'timeline__title' }, [ev.title]),
            ev.description ? el('p', { class: 'timeline__desc' }, [ev.description]) : null
          ])
        );
      });
      wrap.appendChild(
        el('li', { class: 'timeline__group reveal' }, [el('h3', { class: 'timeline__year' }, [group.label]), events])
      );
    });
    return wrap;
  }

  /* ---------- 10.10 Huy hiệu chứng nhận ---------- */

  function renderBadges(certs, openLightbox) {
    if (!certs.length) return emptyState();
    var list = el('ul', { class: 'badges' });
    var withImage = certs.filter(function (c) {
      return c.image;
    });
    certs.forEach(function (c) {
      var inner = [
        el('span', { class: 'badge__icon' }, [icon(c.icon)]),
        el('span', { class: 'badge__name' }, [c.name]),
        c.issuer ? el('span', { class: 'badge__issuer' }, [c.issuer]) : null
      ];
      var node;
      if (c.image) {
        inner.push(el('span', { class: 'badge__hint' }, [icon('zoom-in'), 'Xem giấy chứng nhận']));
        node = el('button', { type: 'button', class: 'badge', 'aria-haspopup': 'dialog' }, inner);
        node.setAttribute('aria-label', c.name + (c.issuer ? ', ' + c.issuer : '') + ' – xem giấy chứng nhận');
        node.addEventListener('click', function () {
          openLightbox(withImage, withImage.indexOf(c), node);
        });
      } else {
        node = el('div', { class: 'badge' }, inner);
      }
      list.appendChild(el('li', { class: 'reveal' }, [node]));
    });
    return list;
  }

  /* ---------- 10.4 Lightbox ---------- */

  function createLightbox() {
    var state = { items: [], index: 0, opener: null, open: false };
    var img = el('img', { class: 'lightbox__img', alt: '' });
    var fallback = el('p', { class: 'lightbox__fallback', hidden: true, role: 'status' }, [
      'Không tải được ảnh. Vui lòng thử lại sau.'
    ]);
    var caption = el('p', { class: 'lightbox__caption', id: 'lightbox-caption', 'aria-live': 'polite' });
    var closeBtn = el('button', { type: 'button', class: 'lightbox__btn', 'aria-label': 'Đóng' }, [icon('x')]);
    var prevBtn = el('button', { type: 'button', class: 'lightbox__btn lightbox__nav lightbox__nav--prev', 'aria-label': 'Ảnh trước' }, [
      icon('chevron-left')
    ]);
    var nextBtn = el('button', { type: 'button', class: 'lightbox__btn lightbox__nav lightbox__nav--next', 'aria-label': 'Ảnh sau' }, [
      icon('chevron-right')
    ]);
    var box = el(
      'div',
      { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Xem giấy chứng nhận', hidden: true },
      [
        el('div', { class: 'lightbox__bar' }, [closeBtn]),
        el('div', { class: 'lightbox__stage' }, [prevBtn, img, fallback, nextBtn]),
        caption
      ]
    );

    function show() {
      var it = state.items[state.index];
      fallback.hidden = true;
      img.hidden = false;
      img.alt = it.name;
      img.src = it.image;
      caption.textContent = it.name + (state.items.length > 1 ? ' · ' + (state.index + 1) + ' / ' + state.items.length : '');
      var multi = state.items.length > 1;
      prevBtn.hidden = !multi;
      nextBtn.hidden = !multi;
    }

    function step(delta) {
      if (state.items.length < 2) return;
      state.index = (state.index + delta + state.items.length) % state.items.length;
      show();
    }

    function focusables() {
      return Array.prototype.filter.call(box.querySelectorAll('button'), function (b) {
        return !b.hidden && b.offsetParent !== null;
      });
    }

    function onKey(e) {
      if (!state.open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'Tab') {
        var f = focusables();
        if (!f.length) return;
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!box.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function open(items, index, opener) {
      if (!items.length) return;
      state.items = items;
      state.index = Math.max(0, Math.min(index, items.length - 1));
      state.opener = opener || document.activeElement;
      state.open = true;
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      show();
      closeBtn.focus();
    }

    function close() {
      if (!state.open) return;
      state.open = false;
      box.hidden = true;
      document.body.style.overflow = '';
      img.removeAttribute('src');
      if (state.opener && document.contains(state.opener)) state.opener.focus();
      state.opener = null;
    }

    img.addEventListener('error', function () {
      img.hidden = true;
      fallback.hidden = false;
    });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () {
      step(-1);
    });
    nextBtn.addEventListener('click', function () {
      step(1);
    });
    box.addEventListener('click', function (e) {
      // Bấm vùng tối quanh ảnh thì đóng
      if (e.target === box || e.target.classList.contains('lightbox__stage')) close();
    });
    // Vuốt trái/phải để chuyển ảnh (điện thoại)
    var touchX = null;
    box.addEventListener('touchstart', function (e) {
      touchX = e.touches.length === 1 ? e.touches[0].clientX : null;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (touchX === null || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    }, { passive: true });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);

    return {
      open: open,
      close: close,
      destroy: function () {
        close();
        document.removeEventListener('keydown', onKey);
        if (box.parentNode) box.parentNode.removeChild(box);
      }
    };
  }

  /* ---------- 10.5 Cảm nhận phụ huynh ---------- */

  function renderTestimonials(items) {
    var track = el('ul', { class: 'carousel__track', tabindex: '0', 'aria-label': 'Danh sách cảm nhận, cuộn ngang để xem thêm' });
    items.forEach(function (t, i) {
      var avatar = el('span', { class: 'avatar', 'aria-hidden': 'true' });
      if (t.avatar) {
        var im = el('img', { src: t.avatar, alt: '', width: 56, height: 56, loading: 'lazy' });
        im.addEventListener('error', function () {
          // Ảnh lỗi -> avatar chữ cái đầu (DESIGN 10.5)
          avatar.textContent = model.initialOf(t.name);
        });
        avatar.appendChild(im);
      } else {
        avatar.textContent = model.initialOf(t.name);
      }
      track.appendChild(
        el('li', { class: 'testimonial', 'data-index': i }, [
          icon('quote', 'testimonial__quote-icon'),
          el('blockquote', { class: 'testimonial__text' }, [t.quote]),
          el('div', { class: 'testimonial__author' }, [
            avatar,
            el('div', null, [
              el('p', { class: 'testimonial__name' }, [t.name]),
              t.role ? el('p', { class: 'testimonial__role' }, [t.role]) : null
            ])
          ])
        ])
      );
    });

    var prev = el('button', { type: 'button', class: 'carousel__arrow', 'aria-label': 'Cảm nhận trước' }, [icon('chevron-left')]);
    var next = el('button', { type: 'button', class: 'carousel__arrow', 'aria-label': 'Cảm nhận sau' }, [icon('chevron-right')]);
    var dots = el('div', { class: 'carousel__dots' });
    var dotButtons = [];
    var controls = el('div', { class: 'carousel__controls' }, [prev, dots, next]);
    var wrap = el('div', { class: 'carousel reveal', role: 'region', 'aria-roledescription': 'carousel', 'aria-label': 'Cảm nhận phụ huynh' }, [
      track,
      controls
    ]);

    function cards() {
      return track.children;
    }

    function stepWidth() {
      var c = cards();
      if (c.length < 2) return c.length ? c[0].offsetWidth : 0;
      return c[1].offsetLeft - c[0].offsetLeft;
    }

    /** Số vị trí cuộn = số thẻ - số thẻ nhìn thấy cùng lúc + 1 (điện thoại: 1 thẻ -> đủ số thẻ; laptop: 3 thẻ). */
    function positions() {
      var c = cards();
      var w = stepWidth();
      if (c.length < 2 || !w) return 1;
      var gap = w - c[0].offsetWidth;
      var inner = track.clientWidth - 4; // trừ padding ngang 2px mỗi bên
      var visible = Math.max(1, Math.floor((inner + gap) / w + 0.01));
      return Math.max(1, c.length - visible + 1);
    }

    function activeIndex(count) {
      var w = stepWidth();
      if (!w) return 0;
      var idx = Math.round(track.scrollLeft / w);
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      if (atEnd) idx = count - 1;
      return Math.max(0, Math.min(count - 1, idx));
    }

    function goTo(i) {
      var count = positions();
      var card = cards()[Math.max(0, Math.min(count - 1, i))];
      if (!card) return;
      track.scrollTo({ left: Math.max(0, card.offsetLeft - 2), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }

    function buildDots(count) {
      if (dotButtons.length === count) return;
      dots.textContent = '';
      dotButtons = [];
      for (var i = 0; i < count; i++) {
        (function (index) {
          var d = el('button', { type: 'button', class: 'carousel__dot', 'aria-label': 'Xem cảm nhận ' + (index + 1) + ' trên ' + count });
          d.addEventListener('click', function () {
            goTo(index);
          });
          dots.appendChild(d);
          dotButtons.push(d);
        })(i);
      }
    }

    function sync() {
      var count = positions();
      controls.hidden = count <= 1;
      buildDots(count);
      var idx = activeIndex(count);
      dotButtons.forEach(function (d, i) {
        if (i === idx) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      prev.disabled = idx <= 0;
      next.disabled = idx >= count - 1;
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        sync();
      });
    }

    function move(delta) {
      var count = positions();
      goTo(activeIndex(count) + delta);
    }

    prev.addEventListener('click', function () {
      move(-1);
    });
    next.addEventListener('click', function () {
      move(1);
    });
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Cho phép phím mũi tên khi track được focus
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move(-1);
      }
    });

    return {
      node: wrap,
      sync: sync,
      destroy: function () {
        window.removeEventListener('resize', onScroll);
      }
    };
  }

  /* ---------- Hiệu ứng: hiện khi cuộn + đếm số ---------- */

  function runCountUp(valueEl, duration, cancelled) {
    var stat = valueEl._stat;
    var start = null;
    function frame(ts) {
      if (cancelled()) return;
      if (start === null) start = ts;
      var elapsed = ts - start;
      paint(valueEl, model.countUpValue(stat.value, elapsed, duration));
      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        paint(valueEl, stat.value);
        valueEl.dataset.counted = 'true';
      }
    }
    paint(valueEl, 0);
    requestAnimationFrame(frame);
  }

  function setupMotion(rootEl, opts, onDispose) {
    var reduced = opts.reducedMotion !== undefined ? opts.reducedMotion : prefersReducedMotion();
    var revealEls = rootEl.querySelectorAll('.reveal');
    var counters = rootEl.querySelectorAll('.stat__value[data-animate="true"]');
    var dead = false;
    onDispose(function () {
      dead = true;
    });

    function finishAll() {
      Array.prototype.forEach.call(revealEls, function (n) {
        n.classList.add('is-visible');
      });
      Array.prototype.forEach.call(counters, function (n) {
        paint(n, n._stat.value);
        n.dataset.counted = 'true';
      });
    }

    if (reduced || !('IntersectionObserver' in window)) {
      finishAll();
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var node = entry.target;
          node.classList.add('is-visible');
          io.unobserve(node); // Chỉ chạy một lần
          var c = node.querySelector('.stat__value[data-animate="true"]');
          if (c && !c.dataset.counted && !c.dataset.counting) {
            c.dataset.counting = 'true';
            runCountUp(c, opts.countDuration, function () {
              return dead;
            });
          }
        });
      },
      { threshold: 0.15 }
    );
    Array.prototype.forEach.call(revealEls, function (n) {
      io.observe(n);
    });
    onDispose(function () {
      io.disconnect();
    });
  }

  /* ---------- Mount ---------- */

  function mount(rootEl, rawData, options) {
    if (!rootEl) throw new Error('achievementsView.mount: thiếu phần tử gốc');
    var opts = {
      countDuration: options && options.countDuration > 0 ? options.countDuration : 1200,
      reducedMotion: options ? options.reducedMotion : undefined,
      now: options && options.now
    };
    var data = model.normalize(rawData, { now: opts.now });
    var disposers = [];
    var lightbox = createLightbox();
    disposers.push(lightbox.destroy);

    rootEl.textContent = '';
    rootEl.appendChild(
      section('tong-quan', false, 'Hồng Hà qua những con số', data.intro, renderStats(data.stats))
    );
    rootEl.appendChild(
      section('dau-an', true, 'Dấu ấn qua các năm', 'Những mốc son và giải thưởng đáng nhớ của thầy trò Hồng Hà.', renderTimeline(data.timeline))
    );
    rootEl.appendChild(
      section('chung-nhan', false, 'Chứng nhận & Công nhận', 'Những chứng nhận ghi nhận chất lượng giáo dục và môi trường học tập.', renderBadges(data.certifications, lightbox.open))
    );

    var carousel = null;
    // Khối cuối là nền xen kẽ hay không -> quyết định khoảng cách với khối CTA bên dưới
    rootEl.classList.toggle('is-last-alt', data.testimonials.length > 0);
    if (data.testimonials.length) {
      carousel = renderTestimonials(data.testimonials);
      disposers.push(carousel.destroy);
      rootEl.appendChild(section('cam-nhan', true, 'Phụ huynh nói gì về Hồng Hà', null, carousel.node));
    }

    setupMotion(rootEl, opts, function (fn) {
      disposers.push(fn);
    });
    if (carousel) {
      requestAnimationFrame(carousel.sync);
    }
    if (data.issues.length && window.console && console.warn) {
      console.warn('[Thành tích] Dữ liệu có ' + data.issues.length + ' điểm cần xem lại:', data.issues);
    }

    return {
      data: data,
      destroy: function () {
        disposers.splice(0).forEach(function (fn) {
          fn();
        });
        rootEl.textContent = '';
      }
    };
  }

  return { mount: mount, icon: icon };
});
