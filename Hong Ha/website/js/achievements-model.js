/*
 * achievements-model.js – Logic thuần (không đụng DOM) của trang Thành tích.
 * Chạy được trong trình duyệt (window.HongHa.achievementsModel) và Node (require) để kiểm thử.
 *
 * Nhiệm vụ: làm sạch dữ liệu do nhà trường nhập, định dạng số, tính giá trị đếm số,
 * gom mốc thời gian theo năm, và chặn URL không an toàn.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.HongHa = root.HongHa || {};
    root.HongHa.achievementsModel = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LIMITS = {
    stats: 8, // tối đa số ô số liệu
    timeline: 40,
    certifications: 12,
    testimonials: 6, // DESIGN 10.5: tối đa 6 chấm
    statLabel: 60,
    affix: 8,
    year: 12,
    title: 120,
    description: 300,
    name: 60,
    issuer: 80,
    quote: 300,
    quoteMin: 10,
    person: 60,
    role: 80,
    maxStatValue: 1e12,
    minYear: 1900,
    maxUrl: 300000
  };

  var ICON_KEYS = ['award', 'shield-check', 'leaf', 'medal', 'graduation-cap'];
  var DEFAULT_ICON = 'award';

  /* ---------- Tiện ích văn bản ---------- */

  function codePoints(str) {
    return Array.from(str);
  }

  /** Gộp khoảng trắng, cắt hai đầu. Không phải chuỗi -> ''. */
  function cleanText(value) {
    if (typeof value !== 'string') return '';
    // eslint-disable-next-line no-control-regex
    return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /** Cắt theo ký tự Unicode (không cắt đôi emoji), thêm … khi bị cắt. */
  function truncate(text, max) {
    var cps = codePoints(text);
    if (cps.length <= max) return { text: text, truncated: false };
    return { text: cps.slice(0, max - 1).join('').trimEnd() + '…', truncated: true };
  }

  /* ---------- URL an toàn ---------- */

  /**
   * Chỉ cho phép: http(s), đường dẫn tương đối, data:image/{png,jpeg,webp,gif,svg+xml}.
   * Chặn javascript:, vbscript:, data:text/html, //host, ký tự điều khiển, khoảng trắng giữa chuỗi.
   * @returns {string|null} URL đã làm sạch hoặc null nếu không an toàn.
   */
  function safeUrl(value) {
    if (typeof value !== 'string') return null;
    var s = value.trim();
    if (!s || s.length > LIMITS.maxUrl) return null;
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f\\]/.test(s)) return null;

    var scheme = /^([a-z][a-z0-9+.-]*):/i.exec(s);
    if (scheme) {
      var name = scheme[1].toLowerCase();
      if (name === 'http' || name === 'https') {
        return /^https?:\/\/[^\s/?#]+/i.test(s) && !/\s/.test(s) ? s : null;
      }
      if (name === 'data') {
        return /^data:image\/(png|jpe?g|webp|gif|svg\+xml)(;[a-z0-9=._-]+)*,/i.test(s) ? s : null;
      }
      return null;
    }
    if (/\s/.test(s)) return null;
    if (s.slice(0, 2) === '//') return null;
    // Chuỗi trông như thực thể HTML (&#106; / &colon;) thường dùng để che giấu scheme
    if (/&#|&[a-z]+;/i.test(s)) return null;
    // ':' trong đoạn đầu của đường dẫn tương đối -> nghi ngờ che giấu scheme
    if (/^[^/?#]*:/.test(s)) return null;
    return s;
  }

  /* ---------- Định dạng số ---------- */

  /** 60000 -> "60.000"; 4.5 -> "4,5" (vi-VN). Không dùng Intl để kết quả giống nhau ở mọi máy. */
  function formatNumber(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '';
    var negative = n < 0;
    var fixed = Math.abs(n).toFixed(2).replace(/\.?0+$/, '');
    var parts = fixed.split('.');
    var int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (negative ? '-' : '') + int + (parts[1] ? ',' + parts[1] : '');
  }

  function decimalsOf(n) {
    var s = Math.abs(n).toFixed(2).replace(/0+$/, '');
    var i = s.indexOf('.');
    return i === -1 ? 0 : s.length - i - 1;
  }

  /* ---------- Đếm số ---------- */

  function easeOutCubic(t) {
    var c = Math.min(1, Math.max(0, t));
    return 1 - Math.pow(1 - c, 3);
  }

  /**
   * Giá trị hiển thị tại thời điểm `elapsed` (ms) của hiệu ứng đếm.
   * Luôn trả đúng `target` khi elapsed >= duration; không bao giờ vượt target.
   */
  function countUpValue(target, elapsed, duration) {
    if (!isFinite(target)) return 0;
    if (!(duration > 0) || elapsed >= duration) return target;
    if (!(elapsed > 0)) return 0;
    var d = decimalsOf(target);
    var factor = Math.pow(10, d);
    var raw = target * easeOutCubic(elapsed / duration);
    var v = Math.round(raw * factor) / factor;
    return Math.min(v, target);
  }

  /* ---------- Chuẩn hóa dữ liệu ---------- */

  function pushIssue(issues, section, index, message) {
    issues.push({ section: section, index: index, message: message });
  }

  function textField(raw, max, issues, section, index, field) {
    var t = truncate(cleanText(raw), max);
    if (t.truncated) pushIssue(issues, section, index, field + ' quá dài, đã cắt bớt');
    return t.text;
  }

  /** Tiền tố/hậu tố ("Từ ", "+ m²"): giữ tối đa MỘT khoảng trắng ở rìa vì nó là một phần của định dạng. */
  function affixField(raw, max, issues, section, index, field) {
    if (typeof raw !== 'string') return '';
    var core = textField(raw, max, issues, section, index, field);
    if (!core) return '';
    return (/^\s/.test(raw) ? ' ' : '') + core + (/\s$/.test(raw) ? ' ' : '');
  }

  function normalizeStats(list, issues) {
    var out = [];
    if (!Array.isArray(list)) return out;
    list.forEach(function (raw, i) {
      if (out.length >= LIMITS.stats) {
        if (out.length === LIMITS.stats) pushIssue(issues, 'stats', i, 'vượt giới hạn ' + LIMITS.stats + ' ô số liệu');
        out.push(null);
        return;
      }
      if (!raw || typeof raw !== 'object') return pushIssue(issues, 'stats', i, 'không phải đối tượng');
      var value = raw.value;
      if (typeof value !== 'number' || !isFinite(value) || value < 0 || value > LIMITS.maxStatValue) {
        return pushIssue(issues, 'stats', i, 'value phải là số hữu hạn từ 0 đến ' + LIMITS.maxStatValue);
      }
      var label = textField(raw.label, LIMITS.statLabel, issues, 'stats', i, 'label');
      if (!label) return pushIssue(issues, 'stats', i, 'thiếu label');
      out.push({
        value: value,
        label: label,
        prefix: affixField(raw.prefix, LIMITS.affix, issues, 'stats', i, 'prefix'),
        suffix: affixField(raw.suffix, LIMITS.affix, issues, 'stats', i, 'suffix'),
        // Số kiểu "năm 1997" không nên đếm từ 0 và không có dấu chấm ngăn cách ("1997", không phải "1.997")
        animate: raw.animate !== false,
        plain: raw.plain === true
      });
    });
    return out.filter(Boolean);
  }

  function normalizeTimeline(list, issues, now) {
    var items = [];
    if (!Array.isArray(list)) return [];
    var maxYear = (now instanceof Date ? now : new Date()).getFullYear() + 1;
    list.forEach(function (raw, i) {
      if (!raw || typeof raw !== 'object') return pushIssue(issues, 'timeline', i, 'không phải đối tượng');
      var year = raw.year;
      if (typeof year !== 'number' || !Number.isInteger(year) || year < LIMITS.minYear || year > maxYear) {
        return pushIssue(issues, 'timeline', i, 'year phải là số nguyên từ ' + LIMITS.minYear + ' đến ' + maxYear);
      }
      var title = textField(raw.title, LIMITS.title, issues, 'timeline', i, 'title');
      if (!title) return pushIssue(issues, 'timeline', i, 'thiếu title');
      var label = textField(raw.yearLabel, LIMITS.year, issues, 'timeline', i, 'yearLabel');
      items.push({
        year: year,
        yearLabel: label || String(year),
        title: title,
        description: textField(raw.description, LIMITS.description, issues, 'timeline', i, 'description'),
        order: items.length
      });
    });
    if (items.length > LIMITS.timeline) {
      pushIssue(issues, 'timeline', LIMITS.timeline, 'vượt giới hạn ' + LIMITS.timeline + ' mốc, đã bỏ phần dư');
    }
    // Mới nhất trước; cùng năm giữ thứ tự nhập (sắp ổn định)
    items.sort(function (a, b) {
      return b.year - a.year || a.order - b.order;
    });
    return items.slice(0, LIMITS.timeline).map(function (it) {
      return { year: it.year, yearLabel: it.yearLabel, title: it.title, description: it.description };
    });
  }

  /** Gom các mốc cùng nhãn năm thành nhóm, giữ thứ tự xuất hiện. */
  function groupTimeline(items) {
    var groups = [];
    var byKey = Object.create(null);
    (items || []).forEach(function (it) {
      var key = it.yearLabel;
      if (!byKey[key]) {
        byKey[key] = { year: it.year, label: key, items: [] };
        groups.push(byKey[key]);
      }
      byKey[key].items.push(it);
    });
    return groups;
  }

  function normalizeCertifications(list, issues) {
    var out = [];
    if (!Array.isArray(list)) return out;
    list.forEach(function (raw, i) {
      if (out.length >= LIMITS.certifications) {
        if (out.length === LIMITS.certifications) {
          pushIssue(issues, 'certifications', i, 'vượt giới hạn ' + LIMITS.certifications + ' chứng nhận');
        }
        out.push(null);
        return;
      }
      if (!raw || typeof raw !== 'object') return pushIssue(issues, 'certifications', i, 'không phải đối tượng');
      var name = textField(raw.name, LIMITS.name, issues, 'certifications', i, 'name');
      if (!name) return pushIssue(issues, 'certifications', i, 'thiếu name');
      var icon = ICON_KEYS.indexOf(raw.icon) === -1 ? DEFAULT_ICON : raw.icon;
      var image = null;
      if (raw.image !== undefined && raw.image !== null && raw.image !== '') {
        image = safeUrl(raw.image);
        if (!image) pushIssue(issues, 'certifications', i, 'image không an toàn hoặc không hợp lệ, đã bỏ ảnh');
      }
      out.push({
        name: name,
        issuer: textField(raw.issuer, LIMITS.issuer, issues, 'certifications', i, 'issuer'),
        icon: icon,
        image: image
      });
    });
    return out.filter(Boolean);
  }

  function normalizeTestimonials(list, issues) {
    var out = [];
    if (!Array.isArray(list)) return out;
    list.forEach(function (raw, i) {
      if (!raw || typeof raw !== 'object') return pushIssue(issues, 'testimonials', i, 'không phải đối tượng');
      // DESIGN 10.5: chỉ hiện khi có đồng ý. Phải đúng `true`, không chấp nhận "true"/1.
      if (raw.consent !== true) return pushIssue(issues, 'testimonials', i, 'chưa có consent === true, không hiển thị');
      var quote = cleanText(raw.quote);
      var quoteLen = codePoints(quote).length;
      if (quoteLen < LIMITS.quoteMin) return pushIssue(issues, 'testimonials', i, 'quote quá ngắn');
      if (quoteLen > LIMITS.quote) return pushIssue(issues, 'testimonials', i, 'quote quá dài (tối đa ' + LIMITS.quote + ')');
      var name = textField(raw.name, LIMITS.person, issues, 'testimonials', i, 'name');
      if (!name) return pushIssue(issues, 'testimonials', i, 'thiếu name');
      var avatar = null;
      if (raw.avatar !== undefined && raw.avatar !== null && raw.avatar !== '') {
        avatar = safeUrl(raw.avatar);
        if (!avatar) pushIssue(issues, 'testimonials', i, 'avatar không an toàn, đã bỏ ảnh');
      }
      if (out.length >= LIMITS.testimonials) {
        if (out.length === LIMITS.testimonials) {
          pushIssue(issues, 'testimonials', i, 'vượt giới hạn ' + LIMITS.testimonials + ' cảm nhận');
        }
        out.push(null);
        return;
      }
      out.push({
        quote: quote,
        name: name,
        role: textField(raw.role, LIMITS.role, issues, 'testimonials', i, 'role'),
        avatar: avatar
      });
    });
    return out.filter(Boolean);
  }

  /**
   * Làm sạch toàn bộ dữ liệu trang. Không bao giờ ném lỗi: dữ liệu hỏng -> phần đó rỗng.
   * @returns {{intro:string, stats:Array, timeline:Array, certifications:Array, testimonials:Array, issues:Array}}
   */
  function normalize(raw, options) {
    var issues = [];
    var src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    if (raw !== undefined && raw !== null && src !== raw) pushIssue(issues, 'root', 0, 'dữ liệu gốc phải là đối tượng');
    var now = options && options.now;
    return {
      intro: textField(src.intro, 400, issues, 'intro', 0, 'intro'),
      stats: normalizeStats(src.stats, issues),
      timeline: normalizeTimeline(src.timeline, issues, now),
      certifications: normalizeCertifications(src.certifications, issues),
      testimonials: normalizeTestimonials(src.testimonials, issues),
      issues: issues
    };
  }

  /** Chữ cái đầu cho avatar chữ (bỏ ký tự không phải chữ). */
  function initialOf(name) {
    var cps = codePoints(cleanText(name));
    for (var i = 0; i < cps.length; i++) {
      if (/\p{L}/u.test(cps[i])) return cps[i].toLocaleUpperCase('vi-VN');
    }
    return '?';
  }

  return {
    LIMITS: LIMITS,
    ICON_KEYS: ICON_KEYS,
    cleanText: cleanText,
    truncate: truncate,
    safeUrl: safeUrl,
    formatNumber: formatNumber,
    easeOutCubic: easeOutCubic,
    countUpValue: countUpValue,
    normalize: normalize,
    normalizeStats: function (l) { return normalizeStats(l, []); },
    normalizeTimeline: function (l, now) { return normalizeTimeline(l, [], now); },
    normalizeCertifications: function (l) { return normalizeCertifications(l, []); },
    normalizeTestimonials: function (l) { return normalizeTestimonials(l, []); },
    groupTimeline: groupTimeline,
    initialOf: initialOf
  };
});
