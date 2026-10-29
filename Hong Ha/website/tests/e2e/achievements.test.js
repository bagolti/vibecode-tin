'use strict';
/*
 * Kiểm thử đầu-cuối trang Thành tích trên Chrome/Edge thật (puppeteer-core), mở bằng file:// (không cần server).
 * Bao phủ: cấu trúc, số liệu & đếm số, timeline, huy hiệu, lightbox, cảm nhận phụ huynh, responsive,
 * token thiết kế (màu/chữ/khoảng cách), chuyển động, truy cập (axe-core), an toàn XSS, dữ liệu hỏng.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { launch, openPage, runAxe, findBrowser } = require('../helpers/browser.js');

const HAS_BROWSER = !!findBrowser();
const SKIP = HAS_BROWSER ? false : 'Không có Chrome/Edge – đặt CHROME_PATH để chạy e2e';

const svg = (label, color) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${color}"/><text x="400" y="300" font-size="48" text-anchor="middle" fill="#12365f">${label}</text></svg>`
  );

const FULL = {
  intro: 'Giới thiệu thử nghiệm.',
  stats: [
    { value: 1997, label: 'Năm thành lập', prefix: 'Từ ', animate: false, plain: true },
    { value: 60000, label: 'Diện tích', suffix: '+ m²' },
    { value: 14, label: 'Trường đại học' },
    { value: 4.5, label: 'Điểm trung bình' }
  ],
  timeline: [
    { year: 2020, yearLabel: '2019–2020', title: 'B', description: 'mô tả B' },
    { year: 2025, yearLabel: '2024–2025', title: 'A' },
    { year: 2020, yearLabel: '2019–2020', title: 'C' },
    { year: 1997, title: 'D' }
  ],
  certifications: [
    { name: 'ISO', issuer: 'BSI', icon: 'shield-check', image: svg('ISO', '#e8f1fb') },
    { name: 'VietGAP', icon: 'leaf', image: svg('VietGAP', '#e6f5ec') },
    { name: 'Huân chương', icon: 'medal', image: svg('HC', '#fff4e0') },
    { name: 'Không có ảnh', icon: 'award' }
  ],
  testimonials: [1, 2, 3, 4, 5].map((i) => ({
    quote: 'Cảm nhận số ' + i + ' của phụ huynh về môi trường học tập của con.',
    name: 'Phụ huynh ' + i,
    role: 'Lớp ' + i,
    consent: true
  }))
};

let browser;
test.before(async () => {
  if (HAS_BROWSER) browser = await launch();
});
test.after(async () => {
  if (browser) await browser.close();
});

/** Mở trang, chạy fn, luôn đóng trang. */
async function withPage(opts, fn) {
  const { page, problems } = await openPage(browser, opts);
  try {
    return await fn(page, problems);
  } finally {
    await page.close();
  }
}

/** Dựng lại trang với dữ liệu khác (reducedMotion mặc định để nội dung hiện ngay). */
async function remount(page, data, options) {
  await page.evaluate(
    (d, o) => {
      window.HongHa.achievementsPage.destroy();
      window.HongHa.achievementsPage = window.HongHa.achievementsView.mount(
        document.getElementById('achievements-root'),
        d,
        Object.assign({ reducedMotion: true }, o)
      );
    },
    data,
    options || {}
  );
}

const css = (page, selector, prop) =>
  page.$eval(selector, (n, p) => getComputedStyle(n)[p], prop);

const rect = (page, selector) =>
  page.$eval(selector, (n) => {
    const r = n.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* =========================================================================
 * 1. Cấu trúc & tải trang
 * ========================================================================= */
test.describe('Cấu trúc trang', { skip: SKIP }, () => {
  test('tải sạch: không lỗi console/trang, không request cục bộ hỏng', () =>
    withPage({}, async (page, problems) => {
      await sleep(300);
      assert.deepEqual(problems, []);
    }));

  test('tiêu đề, ngôn ngữ, đúng 1 thẻ h1, meta mô tả', () =>
    withPage({}, async (page) => {
      assert.equal(await page.title(), 'Thành tích – Trường THCS & THPT Hồng Hà');
      assert.equal(await page.$eval('html', (n) => n.lang), 'vi');
      assert.equal((await page.$$('h1')).length, 1);
      assert.equal(await page.$eval('h1', (n) => n.textContent), 'Thành tích');
      assert.match(await page.$eval('meta[name=description]', (n) => n.content), /Hồng Hà/);
      assert.match(await page.$eval('meta[name=viewport]', (n) => n.content), /width=device-width/);
    }));

  test('thứ tự khối theo DESIGN 4.4: Tổng quan → Dấu ấn → Chứng nhận → (Cảm nhận) → CTA', () =>
    withPage({}, async (page) => {
      const ids = await page.$$eval('main > div#achievements-root > section, main > section', (ns) => ns.map((n) => n.id || n.className));
      assert.deepEqual(ids, ['tong-quan', 'dau-an', 'chung-nhan', 'cta-block']);
    }));

  test('mục Cảm nhận phụ huynh KHÔNG xuất hiện khi chưa có lời chia sẻ được đồng ý', () =>
    withPage({}, async (page) => {
      assert.equal((await page.$$('#cam-nhan')).length, 0);
    }));

  test('mục menu hiện tại có aria-current="page" (cả menu ngang và thu gọn)', () =>
    withPage({}, async (page) => {
      const cur = await page.$$eval('[aria-current="page"]', (ns) => ns.map((n) => n.textContent.trim()));
      assert.deepEqual(cur, ['Thành tích', 'Thành tích']);
    }));

  test('mỗi section có tiêu đề liên kết bằng aria-labelledby tồn tại', () =>
    withPage({}, async (page) => {
      const bad = await page.$$eval('section[aria-labelledby]', (ns) =>
        ns.filter((n) => !document.getElementById(n.getAttribute('aria-labelledby'))).map((n) => n.id)
      );
      assert.deepEqual(bad, []);
    }));

  test('liên kết điện thoại và email đúng định dạng', () =>
    withPage({}, async (page) => {
      const hrefs = await page.$$eval('a[href^="tel:"], a[href^="mailto:"]', (ns) => [...new Set(ns.map((n) => n.getAttribute('href')))]);
      assert.deepEqual(hrefs.sort(), ['mailto:thpthongha@gmail.com', 'tel:0902793727']);
    }));

  test('trang không phụ thuộc mạng: chạy đúng khi Google Fonts bị chặn', () =>
    withPage({}, async (page, problems) => {
      assert.equal((await page.$$('.stat')).length, 4);
      assert.deepEqual(problems, []);
    }));
});

/* =========================================================================
 * 2. Số liệu (DESIGN 6.6)
 * ========================================================================= */
test.describe('Khối số liệu', { skip: SKIP }, () => {
  test('4 ô, nhãn đúng, năm thành lập hiển thị "Từ 1997" (không phải "1.997")', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const texts = await page.$$eval('.stat__value', (ns) => ns.map((n) => n.textContent));
      assert.deepEqual(texts, ['Từ 1997', '60.000+ m²', '14', '2']);
      const labels = await page.$$eval('.stat__label', (ns) => ns.map((n) => n.textContent));
      assert.equal(labels.length, 4);
      assert.ok(labels.every((l) => l.length > 0));
    }));

  test('trình đọc màn hình nhận giá trị cuối, không nhận số đang đếm', () =>
    withPage({}, async (page) => {
      const sr = await page.$$eval('.stat .sr-only', (ns) => ns.map((n) => n.textContent));
      assert.equal(sr[1], '60.000+ m² – Diện tích Nông trại Hồng Hà');
      const hidden = await page.$$eval('.stat__value', (ns) => ns.every((n) => n.getAttribute('aria-hidden') === 'true'));
      assert.ok(hidden);
    }));

  test('đếm số: bắt đầu từ 0, tăng đơn điệu, có giá trị trung gian, kết thúc chính xác', () =>
    withPage({ width: 1280, height: 900 }, async (page) => {
      const hist = await page.evaluate(async () => {
        const H = window.HongHa;
        H.achievementsPage.destroy();
        const root = document.getElementById('achievements-root');
        H.achievementsPage = H.achievementsView.mount(root, H.achievementsData, { countDuration: 700, reducedMotion: false });
        const el = root.querySelectorAll('.stat__value[data-animate="true"]')[0];
        const out = [];
        await new Promise((res) => {
          const stop = setTimeout(res, 4000);
          (function tick() {
            out.push(el.textContent);
            if (el.dataset.counted) {
              clearTimeout(stop);
              return res();
            }
            requestAnimationFrame(tick);
          })();
        });
        return out;
      });
      // Trước khi khối cuộn vào tầm nhìn, DOM chứa sẵn giá trị cuối (cho SEO/trình đọc); khối còn trong suốt nên
      // việc đặt lại về 0 lúc bắt đầu đếm không nhìn thấy được. Chỉ xét các mẫu từ lúc bắt đầu đếm.
      const startAt = hist.findIndex((t) => t !== '60.000+ m²');
      assert.ok(startAt !== -1, 'phải bắt đầu đếm');
      hist.splice(0, startAt);
      const nums = hist.map((t) => Number(t.replace(/[^\d]/g, '')));
      assert.equal(hist[hist.length - 1], '60.000+ m²');
      assert.ok(nums.some((n) => n > 0 && n < 60000), 'phải có giá trị trung gian: ' + hist.slice(0, 8).join(' | '));
      for (let i = 1; i < nums.length; i++) assert.ok(nums[i] >= nums[i - 1], `giảm ở bước ${i}: ${hist[i - 1]} -> ${hist[i]}`);
      assert.ok(nums[0] <= 60000 * 0.2, 'đầu hiệu ứng phải gần 0');
    }));

  test('ô animate:false (năm) không bao giờ nhảy qua số khác', () =>
    withPage({}, async (page) => {
      const seen = await page.evaluate(async () => {
        const el = document.querySelector('.stat__value[data-final="Từ 1997"]');
        const s = new Set();
        for (let i = 0; i < 30; i++) {
          s.add(el.textContent);
          await new Promise((r) => requestAnimationFrame(r));
        }
        return [...s];
      });
      assert.deepEqual(seen, ['Từ 1997']);
    }));

  test('chỉ đếm MỘT lần: cuộn đi rồi cuộn lại không đếm lại', () =>
    withPage({ width: 1280, height: 900 }, async (page) => {
      await page.waitForSelector('.stat__value[data-counted="true"]', { timeout: 4000 });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(150);
      await page.evaluate(() => window.scrollTo(0, 0));
      const texts = await page.$$eval('.stat__value', (ns) => ns.map((n) => n.textContent));
      assert.deepEqual(texts, ['Từ 1997', '60.000+ m²', '14', '2']);
    }));

  test('prefers-reduced-motion: hiện ngay giá trị cuối, không ẩn khối, không đếm', () =>
    withPage({ reducedMotion: true, height: 500 }, async (page) => {
      const r = await page.evaluate(() => {
        const vals = [...document.querySelectorAll('.stat__value')].map((n) => n.textContent);
        const op = [...document.querySelectorAll('.reveal')].map((n) => getComputedStyle(n).opacity);
        return { vals, op };
      });
      assert.deepEqual(r.vals, ['Từ 1997', '60.000+ m²', '14', '2']);
      assert.ok(r.op.every((o) => o === '1'), 'mọi khối .reveal phải thấy được: ' + r.op);
    }));

  test('giá trị thập phân hiển thị với dấu phẩy (4,5)', () =>
    withPage({}, async (page) => {
      await remount(page, FULL);
      const t = await page.$$eval('.stat__value', (ns) => ns.map((n) => n.textContent));
      assert.deepEqual(t, ['Từ 1997', '60.000+ m²', '14', '4,5']);
    }));

  test('bố cục: 2 cột trên điện thoại, 2 cột tablet, 4 cột từ 1024px', async () => {
    for (const [w, cols] of [[360, 2], [768, 2], [1024, 4], [1280, 4], [1440, 4]]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        const n = await page.$eval('.stats', (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
        assert.equal(n, cols, `rộng ${w}px`);
      });
    }
  });

  test('ô số liệu rất lớn / dài không tràn khỏi thẻ ở 360px', () =>
    withPage({ width: 360, reducedMotion: true }, async (page) => {
      await remount(page, {
        stats: [
          { value: 999999999999, label: 'x'.repeat(60), suffix: '+ m²' },
          { value: 123456789012, label: 'Số rất lớn', prefix: 'Hơn ' }
        ]
      });
      const overflow = await page.$$eval('.stat', (ns) => ns.filter((n) => n.scrollWidth > n.clientWidth + 1).length);
      assert.equal(overflow, 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    }));
});

/* =========================================================================
 * 3. Timeline (DESIGN 6.7)
 * ========================================================================= */
test.describe('Timeline', { skip: SKIP }, () => {
  test('nhóm theo năm, mới nhất trước, đúng nội dung dữ liệu mẫu', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const groups = await page.$$eval('.timeline__group', (ns) =>
        ns.map((g) => [g.querySelector('.timeline__year').textContent, [...g.querySelectorAll('.timeline__title')].map((t) => t.textContent)])
      );
      assert.deepEqual(groups.map((g) => g[0]), ['2024–2025', '2023', '2019–2020', '1997']);
      assert.equal(groups[2][1].length, 2, 'hai mốc cùng nhãn 2019–2020 phải gom một nhóm');
      assert.match(groups[3][1][0], /Thành lập trường/);
    }));

  test('một cột, có đường dọc (::before) và chấm mốc, năm màu Primary đậm', () =>
    withPage({ reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '.timeline__year', 'color'), 'rgb(27, 79, 143)');
      assert.equal(await css(page, '.timeline__year', 'fontWeight'), '700');
      const line = await page.$eval('.timeline', (n) => {
        const s = getComputedStyle(n, '::before');
        return { w: s.width, bg: s.backgroundColor, pos: s.position };
      });
      assert.equal(line.w, '3px');
      assert.equal(line.pos, 'absolute');
      assert.notEqual(line.bg, 'rgba(0, 0, 0, 0)');
      const dot = await page.$eval('.timeline__group', (n) => getComputedStyle(n, '::before').borderRadius);
      assert.ok(parseFloat(dot) >= 999 || dot.includes('999') || dot === '999px');
    }));

  test('mốc không có mô tả không sinh thẻ <p> rỗng', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      const emptyP = await page.$$eval('.timeline__desc', (ns) => ns.filter((n) => !n.textContent.trim()).length);
      assert.equal(emptyP, 0);
      assert.equal((await page.$$('.timeline__desc')).length, 1);
    }));

  test('giữ một cột và vừa màn hình ở 360px, 768px, 1280px', async () => {
    for (const w of [360, 768, 1280]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        const r = await rect(page, '.timeline');
        assert.ok(r.w <= 760 + 1, `rộng ${w}: ${r.w}`);
        assert.ok(r.x >= 0 && r.x + r.w <= w, `tràn khung ở ${w}px`);
      });
    }
  });

  test('100 mốc dữ liệu chỉ hiển thị tối đa 40', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, { timeline: Array.from({ length: 100 }, (_, i) => ({ year: 1990 + (i % 30), title: 'Mốc ' + i })) });
      assert.equal((await page.$$('.timeline__event')).length, 40);
    }));
});

/* =========================================================================
 * 4. Huy hiệu chứng nhận (DESIGN 10.10)
 * ========================================================================= */
test.describe('Huy hiệu chứng nhận', { skip: SKIP }, () => {
  test('4 huy hiệu tĩnh (không có ảnh nên KHÔNG phải nút), mỗi cái có biểu tượng SVG', () =>
    withPage({ reducedMotion: true }, async (page) => {
      assert.equal((await page.$$('.badge')).length, 4);
      assert.equal((await page.$$('button.badge')).length, 0);
      assert.equal((await page.$$('.badge__icon svg.icon')).length, 4);
      const hidden = await page.$$eval('.badge__icon svg', (ns) => ns.every((n) => n.getAttribute('aria-hidden') === 'true'));
      assert.ok(hidden);
    }));

  test('kiểu dáng: bo 16px, viền 1px, nền biểu tượng xanh nhạt, chữ biểu tượng Secondary', () =>
    withPage({ reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '.badge', 'borderRadius'), '16px');
      assert.equal(await css(page, '.badge', 'borderTopWidth'), '1px');
      assert.equal(await css(page, '.badge', 'borderTopColor'), 'rgb(217, 226, 236)');
      assert.equal(await css(page, '.badge__icon', 'backgroundColor'), 'rgb(230, 245, 236)');
      assert.equal(await css(page, '.badge__icon', 'color'), 'rgb(46, 139, 87)');
      assert.equal(await css(page, '.badge__icon', 'borderRadius').then(parseFloat) >= 32, true);
    }));

  test('2 cột trên điện thoại/tablet, 4 cột từ 1024px', async () => {
    for (const [w, cols] of [[360, 2], [768, 2], [1024, 4], [1440, 4]]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        assert.equal(await page.$eval('.badges', (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length), cols, `rộng ${w}px`);
      });
    }
  });

  test('huy hiệu có ảnh là <button> có aria-label và aria-haspopup', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      assert.equal((await page.$$('button.badge')).length, 3);
      const label = await page.$eval('button.badge', (n) => n.getAttribute('aria-label'));
      assert.equal(label, 'ISO, BSI – xem giấy chứng nhận');
      assert.equal(await page.$eval('button.badge', (n) => n.getAttribute('aria-haspopup')), 'dialog');
      assert.equal((await page.$$('div.badge')).length, 1);
    }));

  test('icon không hợp lệ rơi về "award", không ném lỗi', () =>
    withPage({ reducedMotion: true }, async (page, problems) => {
      await remount(page, { certifications: [{ name: 'a', icon: '<script>' }, { name: 'b', icon: 'nope' }] });
      assert.equal((await page.$$('.badge__icon svg')).length, 2);
      assert.deepEqual(problems.filter((p) => !p.includes('console.warn')), []);
    }));
});

/* =========================================================================
 * 5. Lightbox (DESIGN 10.4)
 * ========================================================================= */
test.describe('Lightbox giấy chứng nhận', { skip: SKIP }, () => {
  const open = async (page, i = 0) => {
    const badges = await page.$$('button.badge');
    await badges[i].click();
    await page.waitForSelector('.lightbox:not([hidden])');
  };

  test('mở: hiện hộp thoại modal, focus vào nút Đóng, khóa cuộn nền, hiện ảnh và chú thích', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await open(page);
      const s = await page.evaluate(() => {
        const lb = document.querySelector('.lightbox');
        return {
          role: lb.getAttribute('role'),
          modal: lb.getAttribute('aria-modal'),
          focus: document.activeElement.getAttribute('aria-label'),
          overflow: document.body.style.overflow,
          alt: lb.querySelector('img').alt,
          caption: lb.querySelector('.lightbox__caption').textContent,
          bg: getComputedStyle(lb).backgroundColor,
          z: getComputedStyle(lb).zIndex
        };
      });
      assert.equal(s.role, 'dialog');
      assert.equal(s.modal, 'true');
      assert.equal(s.focus, 'Đóng');
      assert.equal(s.overflow, 'hidden');
      assert.equal(s.alt, 'ISO');
      assert.equal(s.caption, 'ISO · 1 / 3');
      assert.equal(s.bg, 'rgba(18, 54, 95, 0.92)');
      assert.equal(s.z, '400');
    }));

  test('phím ← → chuyển ảnh và quay vòng; bộ đếm cập nhật', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await open(page);
      const cap = () => page.$eval('.lightbox__caption', (n) => n.textContent);
      await page.keyboard.press('ArrowRight');
      assert.equal(await cap(), 'VietGAP · 2 / 3');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      assert.equal(await cap(), 'ISO · 1 / 3', 'quay vòng về đầu');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await cap(), 'Huân chương · 3 / 3', 'quay vòng về cuối');
    }));

  test('chỉ chuyển giữa các chứng nhận CÓ ảnh (bỏ qua huy hiệu tĩnh)', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await open(page, 2);
      assert.equal(await page.$eval('.lightbox__caption', (n) => n.textContent), 'Huân chương · 3 / 3');
    }));

  test('Escape đóng, trả focus về huy hiệu đã bấm, mở khóa cuộn', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await open(page, 1);
      await page.keyboard.press('Escape');
      const s = await page.evaluate(() => ({
        hidden: document.querySelector('.lightbox').hidden,
        focus: document.activeElement.getAttribute('aria-label'),
        overflow: document.body.style.overflow
      }));
      assert.equal(s.hidden, true);
      assert.match(s.focus, /^VietGAP/);
      assert.equal(s.overflow, '');
    }));

  test('nút Đóng và bấm vùng tối đều đóng được', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await open(page);
      await page.click('.lightbox__bar button');
      assert.equal(await page.$eval('.lightbox', (n) => n.hidden), true);
      await open(page);
      await page.mouse.click(5, 450); // vùng tối bên trái ảnh
      assert.equal(await page.$eval('.lightbox', (n) => n.hidden), true);
    }));

  test('bẫy focus: Tab / Shift+Tab chỉ xoay vòng trong hộp thoại', () =>
    withPage({ reducedMotion: true, width: 1280 }, async (page) => {
      await remount(page, FULL);
      await open(page);
      const inside = () => page.evaluate(() => document.querySelector('.lightbox').contains(document.activeElement));
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
        assert.equal(await inside(), true, `Tab lần ${i + 1} thoát khỏi lightbox`);
      }
      for (let i = 0; i < 8; i++) {
        await page.keyboard.down('Shift');
        await page.keyboard.press('Tab');
        await page.keyboard.up('Shift');
        assert.equal(await inside(), true, `Shift+Tab lần ${i + 1} thoát khỏi lightbox`);
      }
    }));

  test('một ảnh duy nhất: không hiện nút trước/sau và bộ đếm', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, { certifications: [{ name: 'Chỉ một', image: svg('1', '#fff') }] });
      await open(page);
      const s = await page.evaluate(() => ({
        nav: [...document.querySelectorAll('.lightbox__nav')].map((n) => n.hidden),
        cap: document.querySelector('.lightbox__caption').textContent
      }));
      assert.deepEqual(s.nav, [true, true]);
      assert.equal(s.cap, 'Chỉ một');
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.$eval('.lightbox__caption', (n) => n.textContent), 'Chỉ một');
    }));

  test('ảnh lỗi: hiện thông báo thay thế, không để ảnh vỡ', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, { certifications: [{ name: 'Hỏng', image: 'images/khong-ton-tai.webp' }] });
      await open(page);
      await page.waitForFunction(() => !document.querySelector('.lightbox__fallback').hidden);
      assert.equal(await page.$eval('.lightbox__img', (n) => n.hidden), true);
      assert.match(await page.$eval('.lightbox__fallback', (n) => n.textContent), /Không tải được ảnh/);
    }));

  test('điện thoại: ẩn nút mũi tên, vuốt trái/phải chuyển ảnh, nút đóng ≥ 44px', () =>
    withPage({ width: 390, height: 800, touch: true, reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await page.$$eval('button.badge', (b) => b[0].scrollIntoView());
      await open(page);
      assert.equal(await page.$eval('.lightbox__nav--next', (n) => getComputedStyle(n).display), 'none');
      const close = await rect(page, '.lightbox__bar button');
      assert.ok(close.w >= 44 && close.h >= 44);
      const swipe = async (x1, x2) => {
        const t = await page.touchscreen.touchStart(x1, 400);
        await t.move(x2, 400);
        await t.end();
      };
      await swipe(300, 100); // vuốt trái -> ảnh sau
      assert.equal(await page.$eval('.lightbox__caption', (n) => n.textContent), 'VietGAP · 2 / 3');
      await swipe(100, 300); // vuốt phải -> ảnh trước
      assert.equal(await page.$eval('.lightbox__caption', (n) => n.textContent), 'ISO · 1 / 3');
      await swipe(200, 220); // vuốt ngắn -> không chuyển
      assert.equal(await page.$eval('.lightbox__caption', (n) => n.textContent), 'ISO · 1 / 3');
    }));

  test('phím mũi tên không làm gì khi lightbox đang đóng', () =>
    withPage({ reducedMotion: true }, async (page, problems) => {
      await remount(page, FULL);
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Escape');
      assert.equal(await page.$eval('.lightbox', (n) => n.hidden), true);
      assert.deepEqual(problems, []);
    }));

  test('dựng lại / destroy không để lại lightbox thừa hoặc trình nghe phím', () =>
    withPage({ reducedMotion: true }, async (page, problems) => {
      await remount(page, FULL);
      await remount(page, FULL);
      await remount(page, FULL);
      assert.equal((await page.$$('.lightbox')).length, 1);
      await page.evaluate(() => window.HongHa.achievementsPage.destroy());
      assert.equal((await page.$$('.lightbox')).length, 0);
      assert.equal(await page.$eval('body', (n) => n.style.overflow), '');
      await page.keyboard.press('ArrowRight');
      assert.deepEqual(problems, []);
    }));

  test('destroy khi lightbox đang mở: khôi phục cuộn nền', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await open(page);
      await page.evaluate(() => window.HongHa.achievementsPage.destroy());
      assert.equal(await page.$eval('body', (n) => n.style.overflow), '');
    }));
});

/* =========================================================================
 * 6. Cảm nhận phụ huynh (DESIGN 10.5)
 * ========================================================================= */
test.describe('Cảm nhận phụ huynh', { skip: SKIP }, () => {
  const ACTIVE = '.carousel__dot[aria-current="true"]';
  const activeIdx = (page) =>
    page.$$eval('.carousel__dot', (ns) => ns.findIndex((n) => n.getAttribute('aria-current') === 'true'));

  test('chỉ hiện thẻ có consent === true; thẻ chưa đồng ý bị loại', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const data = Object.assign({}, FULL, {
        testimonials: FULL.testimonials.concat([{ quote: 'Không được đăng lên.', name: 'X', consent: false }, { quote: 'Cũng không được.', name: 'Y' }])
      });
      await remount(page, data);
      assert.equal((await page.$$('.testimonial')).length, 5);
    }));

  test('điện thoại: 1 thẻ mỗi lần (~88%), có chấm = số thẻ, ẩn mũi tên, chấm đầu đang chọn', () =>
    withPage({ width: 360, reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await page.$eval('#cam-nhan', (n) => n.scrollIntoView());
      await sleep(100);
      const card = await rect(page, '.testimonial');
      const track = await rect(page, '.carousel__track');
      assert.ok(card.w / track.w > 0.8 && card.w / track.w < 0.92, 'tỷ lệ thẻ ' + card.w / track.w);
      assert.equal((await page.$$('.carousel__dot')).length, 5);
      assert.equal(await page.$eval('.carousel__arrow', (n) => getComputedStyle(n).display), 'none');
      assert.equal(await activeIdx(page), 0);
      assert.equal(await page.$eval('.carousel__controls', (n) => n.hidden), false);
    }));

  test('bấm chấm số 3 cuộn tới thẻ 3; chấm cuối cùng sáng khi cuộn hết', () =>
    withPage({ width: 360, reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await page.$eval('#cam-nhan', (n) => n.scrollIntoView());
      const dots = await page.$$('.carousel__dot');
      await dots[2].click();
      await page.waitForFunction(() => document.querySelectorAll('.carousel__dot')[2].getAttribute('aria-current') === 'true', { timeout: 3000 });
      await dots[4].click();
      await page.waitForFunction(() => document.querySelectorAll('.carousel__dot')[4].getAttribute('aria-current') === 'true', { timeout: 3000 });
      assert.equal(await page.$$eval(ACTIVE, (n) => n.length), 1, 'chỉ một chấm được chọn');
      await dots[0].click();
      await page.waitForFunction(() => document.querySelectorAll('.carousel__dot')[0].getAttribute('aria-current') === 'true', { timeout: 3000 });
    }));

  test('phím ← → khi track được focus chuyển thẻ', () =>
    withPage({ width: 360, reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await page.$eval('#cam-nhan', (n) => n.scrollIntoView());
      await page.focus('.carousel__track');
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.querySelectorAll('.carousel__dot')[1].getAttribute('aria-current') === 'true', { timeout: 3000 });
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(() => document.querySelectorAll('.carousel__dot')[0].getAttribute('aria-current') === 'true', { timeout: 3000 });
    }));

  test('laptop: 3 thẻ cùng lúc, mũi tên hiện, "Trước" bị vô hiệu ở đầu, số chấm = số vị trí (5-3+1 = 3)', () =>
    withPage({ width: 1280, height: 900, reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await page.$eval('#cam-nhan', (n) => n.scrollIntoView());
      await sleep(100);
      const cards = await page.$$eval('.testimonial', (ns) => {
        const t = document.querySelector('.carousel__track').getBoundingClientRect();
        return ns.map((n) => {
          const r = n.getBoundingClientRect();
          return r.left >= t.left - 1 && r.right <= t.right + 1;
        });
      });
      assert.deepEqual(cards, [true, true, true, false, false]);
      assert.equal((await page.$$('.carousel__dot')).length, 3);
      const arrows = await page.$$eval('.carousel__arrow', (ns) => ns.map((n) => [getComputedStyle(n).display, n.disabled]));
      assert.deepEqual(arrows, [['grid', true], ['grid', false]]);
      await page.click('.carousel__arrow:last-of-type');
      await page.waitForFunction(() => document.querySelectorAll('.carousel__dot')[1].getAttribute('aria-current') === 'true', { timeout: 3000 });
      await page.click('.carousel__arrow:last-of-type');
      await page.waitForFunction(() => document.querySelectorAll('.carousel__dot')[2].getAttribute('aria-current') === 'true', { timeout: 3000 });
      assert.equal(await page.$eval('.carousel__arrow:last-of-type', (n) => n.disabled), true, '"Sau" vô hiệu ở cuối');
    }));

  test('laptop, ≤ 3 thẻ: không cuộn nên ẩn toàn bộ điều khiển', () =>
    withPage({ width: 1280, reducedMotion: true }, async (page) => {
      await remount(page, Object.assign({}, FULL, { testimonials: FULL.testimonials.slice(0, 3) }));
      await sleep(100);
      assert.equal(await page.$eval('.carousel__controls', (n) => n.hidden), true);
    }));

  test('1 cảm nhận duy nhất hiển thị đúng, không điều khiển', () =>
    withPage({ width: 360, reducedMotion: true }, async (page) => {
      await remount(page, Object.assign({}, FULL, { testimonials: FULL.testimonials.slice(0, 1) }));
      await sleep(100);
      assert.equal((await page.$$('.testimonial')).length, 1);
      assert.equal(await page.$eval('.carousel__controls', (n) => n.hidden), true);
    }));

  test('đổi cỡ cửa sổ làm tính lại số chấm (điện thoại → laptop)', () =>
    withPage({ width: 360, height: 800, reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await sleep(100);
      assert.equal((await page.$$('.carousel__dot')).length, 5);
      await page.setViewport({ width: 1280, height: 800 });
      await page.waitForFunction(() => document.querySelectorAll('.carousel__dot').length === 3, { timeout: 3000 });
    }));

  test('avatar: không có ảnh -> chữ cái đầu; ảnh lỗi -> chữ cái đầu; ảnh tốt -> hiện ảnh', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, {
        testimonials: [
          { quote: 'Không có avatar đâu nhé.', name: 'đức', consent: true },
          { quote: 'Avatar này bị hỏng ảnh.', name: 'Lan', consent: true, avatar: 'images/khong-co.png' },
          { quote: 'Avatar này là ảnh tốt đó.', name: 'Mai', consent: true, avatar: svg('A', '#eee') },
          { quote: 'Avatar nguy hiểm bị chặn.', name: 'Hùng', consent: true, avatar: 'javascript:alert(1)' }
        ]
      });
      await page.waitForFunction(() => document.querySelectorAll('.avatar')[1].textContent === 'L', { timeout: 3000 });
      const a = await page.$$eval('.avatar', (ns) => ns.map((n) => [n.textContent, !!n.querySelector('img') && getComputedStyle(n.querySelector('img')).display !== 'none']));
      assert.equal(a[0][0], 'Đ');
      assert.equal(a[1][0], 'L');
      assert.equal(a[2][0], '');
      assert.equal(a[2][1], true);
      assert.equal(a[3][0], 'H');
    }));

  test('thẻ: nền trắng, bo 16px, dấu trích Secondary; trích dẫn tối đa 5 dòng', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      assert.equal(await css(page, '.testimonial', 'borderRadius'), '16px');
      assert.equal(await css(page, '.testimonial', 'backgroundColor'), 'rgb(255, 255, 255)');
      assert.equal(await css(page, '.testimonial__quote-icon', 'color'), 'rgb(46, 139, 87)');
      assert.equal(await css(page, '#cam-nhan', 'backgroundColor'), 'rgb(243, 247, 251)');
      assert.equal(await css(page, '.avatar', 'width'), '56px');
      assert.equal(await css(page, '.testimonial__text', 'webkitLineClamp'), '5');
    }));

  test('vùng chạm các chấm và mũi tên ≥ 44×44px', () =>
    withPage({ width: 1280, reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      await sleep(100);
      const small = await page.$$eval('.carousel__dot, .carousel__arrow', (ns) =>
        ns.map((n) => n.getBoundingClientRect()).filter((r) => r.width < 44 || r.height < 44).length
      );
      assert.equal(small, 0);
    }));

  test('tối đa 6 thẻ dù dữ liệu có 10', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, { testimonials: Array.from({ length: 10 }, (_, i) => ({ quote: 'Lời chia sẻ số ' + i + ' của phụ huynh.', name: 'P' + i, consent: true })) });
      assert.equal((await page.$$('.testimonial')).length, 6);
    }));
});

/* =========================================================================
 * 7. Token thiết kế: màu, chữ, khoảng cách (DESIGN 2–5)
 * ========================================================================= */
test.describe('Tuân thủ DESIGN.md (màu, chữ, khoảng cách, hình khối)', { skip: SKIP }, () => {
  test('biến CSS gốc khớp bảng màu 2.1 / 2.2', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const tokens = await page.evaluate(() => {
        const s = getComputedStyle(document.documentElement);
        const names = ['primary', 'primary-dark', 'secondary', 'accent', 'accent-dark', 'bg', 'bg-alt', 'text', 'text-muted', 'border', 'success', 'error', 'warning'];
        return Object.fromEntries(names.map((n) => [n, s.getPropertyValue('--' + n).trim().toLowerCase()]));
      });
      assert.deepEqual(tokens, {
        primary: '#1b4f8f',
        'primary-dark': '#12365f',
        secondary: '#2e8b57',
        accent: '#f28c28',
        'accent-dark': '#d9730d',
        bg: '#ffffff',
        'bg-alt': '#f3f7fb',
        text: '#1f2933',
        'text-muted': '#52606d',
        border: '#d9e2ec',
        success: '#1e8e4e',
        error: '#c62828',
        warning: '#b26a00'
      });
    }));

  test('phông Be Vietnam Pro (có dự phòng system-ui), nội dung 16px / dòng cao 1.6 / màu chữ chính', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const ff = await css(page, 'body', 'fontFamily');
      assert.match(ff, /^"?Be Vietnam Pro"?, system-ui/);
      assert.equal(await css(page, 'body', 'fontSize'), '16px');
      assert.equal(await css(page, 'body', 'color'), 'rgb(31, 41, 51)');
      assert.equal(await css(page, 'body', 'lineHeight'), '25.6px');
      assert.equal(await css(page, 'body', 'backgroundColor'), 'rgb(255, 255, 255)');
    }));

  test('số liệu: 40px từ 381px trở lên, co nhẹ (10,5vw; 9,4vw dưới 340px) trên màn hình hẹp để vừa ô 2 cột', async () => {
    for (const [w, px] of [[414, '40px'], [390, '40px'], [360, '37.8px'], [320, '30.08px']]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        assert.equal(await css(page, '.stat__value', 'fontSize'), px, `rộng ${w}`);
      });
    }
  });

  test('số liệu laptop: 56px từ ~1220px, co theo 4,6vw ở 1024–1219px (không dưới 40px)', async () => {
    for (const [w, px] of [[1024, '47.104px'], [1100, '50.6px'], [1280, '56px'], [1440, '56px']]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        assert.equal(await css(page, '.stat__value', 'fontSize'), px, `rộng ${w}`);
      });
    }
  });

  test('thang cỡ chữ điện thoại (360px): h1 32, h2 24, h3 timeline 18/20, số liệu ≈ 40', () =>
    withPage({ width: 360, reducedMotion: true }, async (page) => {
      assert.equal(await css(page, 'h1', 'fontSize'), '32px');
      assert.equal(await css(page, '#tong-quan h2', 'fontSize'), '24px');
      assert.equal(await css(page, '.stat__value', 'fontSize'), '37.8px');
      assert.equal(await css(page, '.stat__value', 'fontWeight'), '700');
      assert.equal(await css(page, '.stat__label', 'fontSize'), '14px');
      assert.equal(await css(page, '.timeline__year', 'fontSize'), '20px');
    }));

  test('thang cỡ chữ máy tính (1280px): h1 52, h2 32, số liệu 56', () =>
    withPage({ width: 1280, reducedMotion: true }, async (page) => {
      assert.equal(await css(page, 'h1', 'fontSize'), '52px');
      assert.equal(await css(page, '#tong-quan h2', 'fontSize'), '32px');
      assert.equal(await css(page, '.stat__value', 'fontSize'), '56px');
      assert.equal(await css(page, '.timeline__year', 'fontSize'), '24px');
    }));

  test('số liệu: màu Primary, tabular-nums; thẻ bo 16px, viền 1px, bóng mức 1', () =>
    withPage({ reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '.stat__value', 'color'), 'rgb(27, 79, 143)');
      assert.match(await css(page, '.stat__value', 'fontVariantNumeric'), /tabular-nums/);
      assert.equal(await css(page, '.stat', 'borderRadius'), '16px');
      assert.equal(await css(page, '.stat', 'borderTopColor'), 'rgb(217, 226, 236)');
      assert.equal(await css(page, '.stat', 'boxShadow'), 'rgba(18, 54, 95, 0.12) 0px 1px 3px 0px');
    }));

  test('nút CTA: nền cam, chữ navy đậm, cao ≥ 48px, bo 8px', () =>
    withPage({ reducedMotion: true }, async (page) => {
      for (const sel of ['.header-cta', '.cta-block .btn']) {
        assert.equal(await css(page, sel, 'backgroundColor'), 'rgb(242, 140, 40)', sel);
        assert.equal(await css(page, sel, 'color'), 'rgb(18, 54, 95)', sel);
        assert.equal(await css(page, sel, 'fontWeight'), '700', sel);
        assert.equal(await css(page, sel, 'borderRadius'), '8px', sel);
      }
      assert.ok((await rect(page, '.cta-block .btn')).h >= 48);
    }));

  test('chỉ MỘT nút cam trong màn hình đầu tiên (quy tắc 2.3) ở điện thoại và máy tính', async () => {
    for (const w of [360, 1280]) {
      await withPage({ width: w, height: 700, reducedMotion: true }, async (page) => {
        const n = await page.$$eval('.btn--cta', (ns) =>
          ns.filter((b) => {
            const r = b.getBoundingClientRect();
            return r.width > 0 && r.top >= 0 && r.bottom <= window.innerHeight;
          }).length
        );
        assert.equal(n, 1, `rộng ${w}`);
      });
    }
  });

  test('hover nút CTA đổi sang cam đậm', () =>
    withPage({ width: 1280, reducedMotion: true }, async (page) => {
      await page.hover('.header-cta');
      await sleep(250);
      assert.equal(await css(page, '.header-cta', 'backgroundColor'), 'rgb(217, 115, 13)');
    }));

  test('hero: gradient navy→primary, chữ trắng; footer nền navy', () =>
    withPage({ reducedMotion: true }, async (page) => {
      assert.match(await css(page, '.page-hero', 'backgroundImage'), /linear-gradient\(135deg, rgb\(18, 54, 95\), rgb\(27, 79, 143\)\)/);
      assert.equal(await css(page, '.page-hero', 'color'), 'rgb(255, 255, 255)');
      assert.equal(await css(page, '.site-footer', 'backgroundColor'), 'rgb(18, 54, 95)');
    }));

  test('khối CTA cuối trang: gradient, bo 16px (điện thoại) / 24px (laptop), căn giữa', async () => {
    await withPage({ width: 360, reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '.cta-block__box', 'borderRadius'), '16px');
      assert.equal(await css(page, '.cta-block__box', 'textAlign'), 'center');
    });
    await withPage({ width: 1280, reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '.cta-block__box', 'borderRadius'), '24px');
    });
  });

  test('khoảng cách: lề 16/24px, khoảng giữa các khối 48 (mobile) / 96 (laptop)', async () => {
    await withPage({ width: 360, reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '#tong-quan .container', 'paddingLeft'), '16px');
      assert.equal(await css(page, '#tong-quan', 'paddingTop'), '48px');
      assert.equal(await css(page, '.stats', 'columnGap'), '16px');
    });
    await withPage({ width: 768, reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '#tong-quan .container', 'paddingLeft'), '24px');
    });
    await withPage({ width: 1280, reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '#tong-quan', 'paddingTop'), '96px');
      assert.equal(await css(page, '.stats', 'columnGap'), '24px');
    });
  });

  test('khung nội dung tối đa 1200px, căn giữa ở 1440px', () =>
    withPage({ width: 1440, reducedMotion: true }, async (page) => {
      const r = await page.$eval('#tong-quan .container', (n) => {
        const cs = getComputedStyle(n);
        const b = n.getBoundingClientRect();
        return { content: b.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), left: b.left };
      });
      assert.equal(Math.round(r.content), 1200);
      assert.equal(Math.round(r.left), Math.round((1440 - 1248) / 2));
    }));

  test('nền xen kẽ: Tổng quan trắng, Dấu ấn xám xanh, Chứng nhận trắng', () =>
    withPage({ reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '#tong-quan', 'backgroundColor'), 'rgba(0, 0, 0, 0)');
      assert.equal(await css(page, '#dau-an', 'backgroundColor'), 'rgb(243, 247, 251)');
      assert.equal(await css(page, '#chung-nhan', 'backgroundColor'), 'rgba(0, 0, 0, 0)');
    }));

  test('header: cao 64px, sticky, đổ bóng khi cuộn', () =>
    withPage({ width: 1280, height: 600, reducedMotion: true }, async (page) => {
      assert.equal((await rect(page, '.site-header')).h, 64); // box-sizing: border-box, đã gồm viền dưới
      assert.equal(await css(page, '.site-header', 'position'), 'sticky');
      assert.equal(await css(page, '.site-header', 'boxShadow'), 'none');
      await page.evaluate(() => window.scrollTo(0, 400));
      await sleep(350);
      assert.equal(await css(page, '.site-header', 'boxShadow'), 'rgba(18, 54, 95, 0.14) 0px 6px 16px 0px');
      assert.equal((await rect(page, '.site-header')).y, 0, 'header vẫn dính đầu trang');
    }));

  test('biểu tượng: nét 1,75px, đầu nét tròn, không tô nền', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const s = await page.$eval('.badge__icon svg', (n) => {
        const c = getComputedStyle(n);
        return { sw: c.strokeWidth, cap: c.strokeLinecap, join: c.strokeLinejoin, fill: c.fill };
      });
      assert.deepEqual(s, { sw: '1.75px', cap: 'round', join: 'round', fill: 'none' });
    }));
});

/* =========================================================================
 * 8. Responsive & menu
 * ========================================================================= */
test.describe('Responsive', { skip: SKIP }, () => {
  test('không cuộn ngang ở 320, 360, 414, 768, 1024, 1280, 1440px (dữ liệu mẫu và dữ liệu đầy đủ)', async () => {
    for (const w of [320, 360, 414, 768, 1024, 1280, 1440]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        for (const label of ['mẫu', 'đầy đủ']) {
          if (label === 'đầy đủ') await remount(page, FULL);
          const sw = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
          assert.ok(sw.s <= sw.w, `cuộn ngang ở ${w}px (${label}): ${sw.s} > ${sw.w}`);
        }
      });
    }
  });

  test('menu: điện thoại dùng nút ☰ (details), laptop dùng menu ngang', async () => {
    await withPage({ width: 360, reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '.main-nav', 'display'), 'none');
      assert.equal(await css(page, '.menu-toggle', 'display'), 'block');
      assert.equal(await page.$eval('.menu-toggle > summary', (n) => n.getAttribute('aria-label')), 'Mở menu');
      assert.equal(await page.$eval('.menu-toggle', (n) => n.open), false);
      await page.click('.menu-toggle > summary');
      assert.equal(await page.$eval('.menu-toggle', (n) => n.open), true);
      const links = await page.$$eval('.menu-toggle__panel a', (ns) => ns.map((n) => n.getBoundingClientRect().height));
      assert.equal(links.length, 6);
      assert.ok(links.every((h) => h >= 48), 'mục menu thu gọn phải cao ≥ 48px');
    });
    await withPage({ width: 1280, reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '.main-nav', 'display'), 'flex');
      assert.equal(await css(page, '.menu-toggle', 'display'), 'none');
    });
  });

  test('menu thu gọn không tràn khỏi màn hình 320px', () =>
    withPage({ width: 320, reducedMotion: true }, async (page) => {
      await page.click('.menu-toggle > summary');
      const r = await rect(page, '.menu-toggle__panel');
      assert.ok(r.x >= 0 && r.x + r.w <= 320, JSON.stringify(r));
    }));

  test('mục menu hiện tại: chữ Primary đậm có gạch chân 3px (laptop)', () =>
    withPage({ width: 1280, reducedMotion: true }, async (page) => {
      assert.equal(await css(page, '.main-nav a[aria-current]', 'color'), 'rgb(27, 79, 143)');
      assert.equal(await css(page, '.main-nav a[aria-current]', 'fontWeight'), '700');
      assert.equal(await css(page, '.main-nav a[aria-current]', 'borderBottomWidth'), '3px');
    }));

  test('mọi liên kết/nút tương tác cao ≥ 44px (trừ liên kết dẫn trong đoạn văn)', async () => {
    for (const w of [360, 1280]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        await remount(page, FULL);
        await page.evaluate(() => document.querySelector('.menu-toggle') && (document.querySelector('.menu-toggle').open = true));
        const small = await page.$$eval('a, button, summary', (ns) =>
          ns
            .filter((n) => !n.closest('.skip-link') && !n.classList.contains('skip-link') && !n.closest('.lightbox'))
            .map((n) => ({ t: (n.getAttribute('aria-label') || n.textContent).trim().slice(0, 30), r: n.getBoundingClientRect() }))
            .filter((x) => x.r.width > 0 && x.r.height > 0 && (x.r.height < 43.5 || x.r.width < 43.5))
            .map((x) => `${x.t} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`)
        );
        assert.deepEqual(small, [], `rộng ${w}`);
      });
    }
  });

  test('ảnh chụp ba cỡ màn hình được tạo (kiểm tra bằng mắt)', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const dir = process.env.HONGHA_SHOTS;
    if (!dir) return; // chỉ chụp khi được yêu cầu
    fs.mkdirSync(dir, { recursive: true });
    for (const [w, h] of [[360, 780], [768, 1024], [1280, 900]]) {
      await withPage({ width: w, height: h, reducedMotion: true }, async (page) => {
        await remount(page, FULL);
        await sleep(150);
        await page.screenshot({ path: path.join(dir, `thanh-tich-${w}.png`), fullPage: true });
      });
    }
  });
});

/* =========================================================================
 * 9. Chuyển động (DESIGN 8)
 * ========================================================================= */
test.describe('Chuyển động', { skip: SKIP }, () => {
  test('khối dưới màn hình bắt đầu ẩn (opacity 0), hiện dần một lần khi cuộn tới và giữ nguyên', () =>
    withPage({ width: 1280, height: 700 }, async (page) => {
      const before = await page.$eval('#chung-nhan .badges li', (n) => getComputedStyle(n).opacity);
      assert.equal(before, '0');
      await page.$eval('#chung-nhan', (n) => n.scrollIntoView());
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#chung-nhan .badges li')).opacity === '1', { timeout: 2000 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(600);
      assert.equal(await page.$eval('#chung-nhan .badges li', (n) => getComputedStyle(n).opacity), '1', 'không ẩn lại sau khi cuộn đi');
    }));

  test('thời lượng/easing hiện khi cuộn: 400ms, cubic-bezier(.2,.8,.2,1)', () =>
    withPage({ width: 1280, height: 700 }, async (page) => {
      assert.equal(await css(page, '#chung-nhan .badges li', 'transitionDuration'), '0.4s, 0.4s');
      assert.match(await css(page, '#chung-nhan .badges li', 'transitionTimingFunction'), /cubic-bezier\(0\.2, 0\.8, 0\.2, 1\)/);
    }));

  test('prefers-reduced-motion: transition/animation gần như tức thì', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const d = await css(page, '.btn', 'transitionDuration');
      assert.ok(d.split(', ').every((x) => parseFloat(x) < 0.01), d);
    }));

  test('hover huy hiệu có ảnh: nâng 4px; thẻ tĩnh không nâng', () =>
    withPage({ width: 1280, reducedMotion: false }, async (page) => {
      await remount(page, FULL, { reducedMotion: true });
      // html có scroll-behavior: smooth -> dùng 'instant' để vị trí đo được ổn định
      await page.evaluate(() => document.querySelector('#chung-nhan').scrollIntoView({ behavior: 'instant' }));
      await sleep(500);
      const y0 = (await rect(page, 'button.badge')).y;
      await page.hover('button.badge');
      await sleep(350);
      const y1 = (await rect(page, 'button.badge')).y;
      assert.ok(Math.abs(y0 - y1 - 4) < 1, `nâng ${y0 - y1}px`);
    }));
});

/* =========================================================================
 * 10. Truy cập (axe-core, bàn phím)
 * ========================================================================= */
test.describe('Truy cập (WCAG 2.1 AA)', { skip: SKIP }, () => {
  for (const w of [360, 1280]) {
    test(`axe: dữ liệu mẫu, ${w}px – 0 vi phạm`, () =>
      withPage({ width: w, reducedMotion: true }, async (page) => {
        assert.deepEqual(await runAxe(page), []);
      }));

    test(`axe: dữ liệu đầy đủ (cảm nhận, huy hiệu có ảnh), ${w}px – 0 vi phạm`, () =>
      withPage({ width: w, reducedMotion: true }, async (page) => {
        await remount(page, FULL);
        await sleep(100);
        assert.deepEqual(await runAxe(page), []);
      }));

    test(`axe: khi lightbox đang mở, ${w}px – 0 vi phạm`, () =>
      withPage({ width: w, reducedMotion: true }, async (page) => {
        await remount(page, FULL);
        await (await page.$$('button.badge'))[0].click();
        await page.waitForSelector('.lightbox:not([hidden])');
        assert.deepEqual(await runAxe(page, '.lightbox'), []);
      }));

    test(`axe: trạng thái rỗng (không có dữ liệu), ${w}px – 0 vi phạm`, () =>
      withPage({ width: w, reducedMotion: true }, async (page) => {
        await remount(page, {});
        assert.deepEqual(await runAxe(page), []);
      }));
  }

  test('Tab đầu tiên rơi vào liên kết "Bỏ qua điều hướng" và nó hiện ra khi focus', () =>
    withPage({ width: 1280, reducedMotion: true }, async (page) => {
      await page.keyboard.press('Tab');
      const s = await page.evaluate(() => {
        const a = document.activeElement;
        return { text: a.textContent, top: a.getBoundingClientRect().top, href: a.getAttribute('href') };
      });
      assert.equal(s.href, '#main');
      assert.ok(s.top >= 0, 'phải nằm trong màn hình khi focus');
    }));

  test('vòng focus nhìn thấy được: viền 3px Primary cách 2px', () =>
    withPage({ width: 1280, reducedMotion: true }, async (page) => {
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const o = await page.evaluate(() => {
        const c = getComputedStyle(document.activeElement);
        return { w: c.outlineWidth, s: c.outlineStyle, c: c.outlineColor, off: c.outlineOffset };
      });
      assert.equal(o.s, 'solid');
      assert.equal(o.w, '3px');
      assert.equal(o.off, '2px');
    }));

  test('thứ tự tiêu đề không nhảy cấp: h1 → h2 → h3', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      const levels = await page.$$eval('h1, h2, h3', (ns) => ns.map((n) => Number(n.tagName[1])));
      for (let i = 1; i < levels.length; i++) assert.ok(levels[i] - levels[i - 1] <= 1, `nhảy cấp tại ${i}: ${levels.join(',')}`);
      assert.equal(levels[0], 1);
    }));

  test('danh sách số liệu / timeline / huy hiệu dùng thẻ danh sách đúng nghĩa', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const r = await page.evaluate(() => ({
        stats: document.querySelector('.stats').tagName,
        statsLabel: document.querySelector('.stats').getAttribute('aria-label'),
        timeline: document.querySelector('.timeline').tagName,
        badges: document.querySelector('.badges').tagName
      }));
      assert.deepEqual(r, { stats: 'UL', statsLabel: 'Số liệu nổi bật', timeline: 'OL', badges: 'UL' });
    }));

  test('trạng thái rỗng có role="status" để thông báo cho trình đọc màn hình', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, {});
      const roles = await page.$$eval('.empty-state', (ns) => ns.map((n) => n.getAttribute('role')));
      assert.deepEqual(roles, ['status', 'status', 'status']);
    }));
});

/* =========================================================================
 * 11. Dữ liệu bất thường & an toàn (XSS)
 * ========================================================================= */
test.describe('Dữ liệu bất thường & an toàn', { skip: SKIP }, () => {
  const XSS = [
    '<img src=x onerror="window.__xss=1">',
    '<script>window.__xss=2</script>',
    '"><svg onload="window.__xss=3">',
    "'; window.__xss=4; '",
    '<a href="javascript:window.__xss=5">x</a>'
  ];

  test('payload XSS ở MỌI trường chữ chỉ hiện dưới dạng văn bản, không sinh phần tử/không chạy script', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const p = XSS[0];
      const evil = {
        intro: XSS[1],
        stats: [{ value: 1, label: p, prefix: XSS[2], suffix: XSS[3] }],
        timeline: [{ year: 2020, yearLabel: XSS[4], title: p, description: XSS[1] }],
        certifications: [{ name: p, issuer: XSS[2], image: svg('x', '#fff') }],
        testimonials: [{ quote: XSS[1] + ' thêm chữ cho đủ độ dài', name: p, role: XSS[2], consent: true }]
      };
      await remount(page, evil);
      await sleep(200);
      const r = await page.evaluate(() => ({
        xss: window.__xss,
        scriptsInRoot: document.querySelectorAll('#achievements-root script').length,
        imgOnerror: document.querySelectorAll('#achievements-root [onerror], #achievements-root [onload]').length,
        jsLinks: document.querySelectorAll('#achievements-root a[href^="javascript:"]').length,
        text: document.getElementById('achievements-root').textContent
      }));
      assert.equal(r.xss, undefined);
      assert.equal(r.scriptsInRoot, 0);
      assert.equal(r.imgOnerror, 0);
      assert.equal(r.jsLinks, 0);
      assert.ok(r.text.includes('<img src=x onerror="window.__xss=1">'), 'phải hiện nguyên văn');
    }));

  test('URL ảnh nguy hiểm không bao giờ vào DOM; huy hiệu vẫn hiển thị dạng tĩnh', () =>
    withPage({ reducedMotion: true }, async (page) => {
      await remount(page, {
        certifications: [
          { name: 'JS', image: 'javascript:window.__xss=1' },
          { name: 'HTML', image: 'data:text/html,<script>window.__xss=2</script>' }
        ],
        testimonials: [{ quote: 'Avatar này nguy hiểm đó mà.', name: 'A', consent: true, avatar: 'javascript:window.__xss=3' }]
      });
      const r = await page.evaluate(() => ({
        xss: window.__xss,
        buttons: document.querySelectorAll('button.badge').length,
        badges: document.querySelectorAll('.badge').length,
        imgs: [...document.querySelectorAll('#achievements-root img')].map((i) => i.src)
      }));
      assert.equal(r.xss, undefined);
      assert.equal(r.buttons, 0);
      assert.equal(r.badges, 2);
      assert.deepEqual(r.imgs, []);
    }));

  test('dữ liệu hỏng kiểu: null, mảng, số, chuỗi, thiếu mọi trường -> 3 trạng thái rỗng, không lỗi', async () => {
    for (const bad of [null, undefined, [], 5, 'abc', {}, { stats: null, timeline: 5, certifications: 'x', testimonials: {} }]) {
      await withPage({ reducedMotion: true }, async (page, problems) => {
        await remount(page, bad);
        assert.equal((await page.$$('.empty-state')).length, 3, JSON.stringify(bad));
        assert.equal((await page.$$('#cam-nhan')).length, 0);
        assert.deepEqual(problems.filter((x) => x.startsWith('pageerror')), []);
      });
    }
  });

  test('từng mục hỏng bị bỏ, mục tốt vẫn hiển thị; console.warn nêu số điểm cần xem', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const warns = [];
      page.on('console', (m) => ['warn', 'warning'].includes(m.type()) && warns.push(m.text()));
      await remount(page, {
        stats: [{ value: 'x', label: 'hỏng' }, { value: 3, label: 'tốt' }, null],
        timeline: [{ year: 'x', title: 'hỏng' }, { year: 2021, title: 'tốt' }],
        certifications: [{}, { name: 'tốt' }]
      });
      assert.equal((await page.$$('.stat')).length, 1);
      assert.equal((await page.$$('.timeline__event')).length, 1);
      assert.equal((await page.$$('.badge')).length, 1);
      await sleep(100);
      assert.ok(warns.some((w) => w.includes('Thành tích')), 'phải cảnh báo dữ liệu: ' + warns);
    }));

  test('văn bản tiếng Việt có dấu, emoji và ký tự đặc biệt hiển thị nguyên vẹn', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const title = 'Đạt giải Nhất 🏆 "Olympic" & <b>Toán</b> – Ư ơ ă';
      await remount(page, { timeline: [{ year: 2022, title }] });
      assert.equal(await page.$eval('.timeline__title', (n) => n.textContent), title);
      assert.equal((await page.$$('.timeline__title b')).length, 0);
    }));

  test('văn bản rất dài không phá bố cục (cắt đúng giới hạn, không tràn ngang)', () =>
    withPage({ width: 360, reducedMotion: true }, async (page) => {
      const long = 'Siêu'.repeat(500);
      await remount(page, {
        stats: [{ value: 1, label: long }],
        timeline: [{ year: 2020, title: long, description: long }],
        certifications: [{ name: long, issuer: long }]
      });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      assert.ok((await page.$eval('.timeline__title', (n) => Array.from(n.textContent).length)) <= 120);
      assert.ok((await page.$eval('.timeline__desc', (n) => Array.from(n.textContent).length)) <= 300);
    }));

  test('trang gốc không dùng innerHTML với dữ liệu người dùng (rà soát mã nguồn)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '../../js/achievements-view.js'), 'utf8');
    const uses = src.split('\n').filter((l) => /innerHTML|insertAdjacentHTML|document\.write|outerHTML|eval\(|new Function/.test(l));
    // Duy nhất: gán chuỗi path SVG hằng của chương trình trong icon()
    assert.equal(uses.length, 1, uses.join('\n'));
    assert.match(uses[0], /svg\.innerHTML = \(ICONS\[name\]/);
  });
});

/* =========================================================================
 * 11b. Hồi quy giao diện – các lỗi chỉ lộ ra khi xem ảnh chụp
 * ========================================================================= */
test.describe('Hồi quy giao diện', { skip: SKIP }, () => {
  test('số trong ô số liệu luôn nằm trên MỘT dòng ở 320–1440px (không ngắt "60.000")', async () => {
    for (const w of [320, 360, 390, 768, 1024, 1280, 1440]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        const bad = await page.$$eval('.stat__num', (ns) =>
          ns
            .filter((n) => n.getClientRects().length !== 1 || n.getBoundingClientRect().height > parseFloat(getComputedStyle(n).fontSize) * 1.35)
            .map((n) => n.textContent)
        );
        assert.deepEqual(bad, [], `rộng ${w}px`);
      });
    }
  });

  test('tiền tố/hậu tố nhỏ hơn số (0,5em điện thoại / 0,4em laptop) và vẫn đọc liền "Từ 1997", "60.000+ m²"', async () => {
    await withPage({ width: 360, reducedMotion: true }, async (page) => {
      const r = await page.$eval('.stat__affix', (n) => parseFloat(getComputedStyle(n).fontSize) / parseFloat(getComputedStyle(n.parentElement).fontSize));
      assert.ok(Math.abs(r - 0.5) < 0.001, 'tỷ lệ ' + r);
      assert.deepEqual(await page.$$eval('.stat__value', (ns) => ns.map((n) => n.textContent)), ['Từ 1997', '60.000+ m²', '14', '2']);
    });
    await withPage({ width: 1280, reducedMotion: true }, async (page) => {
      const r = await page.$eval('.stat__affix', (n) => parseFloat(getComputedStyle(n).fontSize) / parseFloat(getComputedStyle(n.parentElement).fontSize));
      assert.ok(Math.abs(r - 0.4) < 0.001, 'tỷ lệ ' + r);
    });
  });

  test('số rất dài (999.999.999.999) chỉ ngắt khi vượt ô, không tràn ngang', () =>
    withPage({ width: 320, reducedMotion: true }, async (page) => {
      await remount(page, { stats: [{ value: 999999999999, label: 'Rất lớn', suffix: '+ m²' }, { value: 1, label: 'b' }] });
      assert.equal(await page.$$eval('.stat', (ns) => ns.filter((n) => n.scrollWidth > n.clientWidth + 1).length), 0);
    }));

  test('header điện thoại: logo một dòng, nút "Đăng ký" một dòng, tên truy cập vẫn là "Đăng ký tư vấn"', async () => {
    for (const w of [320, 360, 414]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        const r = await page.evaluate(() => {
          const brand = document.querySelector('.brand span:last-child').getBoundingClientRect();
          const cta = document.querySelector('.header-cta');
          return {
            brandH: brand.height,
            ctaH: cta.getBoundingClientRect().height,
            ctaText: cta.innerText,
            ctaName: cta.getAttribute('aria-label'),
            overflow: document.querySelector('.site-header__inner').scrollWidth > document.querySelector('.site-header__inner').clientWidth
          };
        });
        assert.ok(r.brandH < 30, `logo xuống dòng ở ${w}px (${r.brandH})`);
        assert.ok(r.ctaH <= 48, `nút xuống dòng ở ${w}px (${r.ctaH})`);
        assert.equal(r.ctaText.trim(), 'Đăng ký', `rộng ${w}`);
        assert.equal(r.ctaName, 'Đăng ký tư vấn');
        assert.equal(r.overflow, false);
      });
    }
    await withPage({ width: 768, reducedMotion: true }, async (page) => {
      assert.equal((await page.$eval('.header-cta', (n) => n.textContent)).trim(), 'Đăng ký tư vấn');
      assert.ok((await rect(page, '.header-cta')).h <= 48, 'một dòng ở 768px');
    });
  });

  test('dòng "Hoặc gọi hotline" nằm giữa khối CTA', async () => {
    for (const w of [360, 1280]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        const d = await page.evaluate(() => {
          const box = document.querySelector('.cta-block__box').getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(document.querySelector('.cta-block__box .t-small'));
          const t = range.getBoundingClientRect();
          return Math.abs(box.left + box.width / 2 - (t.left + t.width / 2));
        });
        assert.ok(d <= 2, `lệch ${d}px ở ${w}px`);
      });
    }
  });

  test('khoảng trắng trước khối CTA không bị cộng đôi: 96px (laptop) / 48px (điện thoại), cả khi khối cuối có nền xen kẽ', async () => {
    const measure = (page) =>
      page.evaluate(() => {
        const last = [...document.querySelectorAll('#achievements-root > section')].pop();
        const lb = last.getBoundingClientRect().bottom;
        const pb = parseFloat(getComputedStyle(last).paddingBottom);
        const alt = last.classList.contains('section--alt');
        const ctaTop = document.querySelector('.cta-block__box').getBoundingClientRect().top;
        // Khoảng trắng nhìn thấy: nếu khối cuối nền trắng thì tính cả padding đáy của nó; nếu có nền xen kẽ thì chỉ phần dưới nền.
        return { alt, visible: alt ? ctaTop - lb : ctaTop - lb + pb };
      });
    for (const [w, expected] of [[1280, 96], [360, 48]]) {
      await withPage({ width: w, reducedMotion: true }, async (page) => {
        const a = await measure(page);
        assert.equal(a.alt, false);
        assert.equal(a.visible, expected, `không có cảm nhận, ${w}px`);
        await remount(page, FULL);
        const b = await measure(page);
        assert.equal(b.alt, true);
        assert.equal(b.visible, expected, `có cảm nhận (nền xen kẽ), ${w}px`);
      });
    }
  });

  test('nền xen kẽ cuối cùng không dính sát khối CTA (khi có cảm nhận)', () =>
    withPage({ width: 1280, reducedMotion: true }, async (page) => {
      await remount(page, FULL);
      assert.equal(await page.$eval('#achievements-root', (n) => n.classList.contains('is-last-alt')), true);
      await remount(page, {});
      assert.equal(await page.$eval('#achievements-root', (n) => n.classList.contains('is-last-alt')), false);
    }));
});

/* =========================================================================
 * 12. Trang hoạt động offline (file://) + không phụ thuộc framework
 * ========================================================================= */
test.describe('Gói nhẹ & không phụ thuộc', { skip: SKIP }, () => {
  test('không tải script/CSS bên ngoài ngoài Google Fonts; không dùng module ES (mở được bằng file://)', () =>
    withPage({}, async (page) => {
      const r = await page.evaluate(() => ({
        external: [...document.querySelectorAll('script[src], link[rel=stylesheet]')]
          .map((n) => n.src || n.href)
          .filter((u) => !u.startsWith('file:') && !/fonts\.googleapis\.com/.test(u)),
        modules: document.querySelectorAll('script[type=module]').length
      }));
      assert.deepEqual(r.external, []);
      assert.equal(r.modules, 0);
    }));

  test('tổng dung lượng mã nguồn module < 500 KB (PRD §8)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.join(__dirname, '../..');
    const files = ['thanh-tich.html', 'css/base.css', 'css/achievements.css', 'js/achievements-model.js', 'js/achievements-data.js', 'js/achievements-view.js', 'js/achievements-page.js', 'js/site-shell.js'];
    const total = files.reduce((s, f) => s + fs.statSync(path.join(root, f)).size, 0);
    assert.ok(total < 500 * 1024, `tổng ${total} byte`);
  });

  test('render lần đầu nhanh: dựng toàn bộ nội dung đầy đủ < 150ms', () =>
    withPage({ reducedMotion: true }, async (page) => {
      const ms = await page.evaluate((d) => {
        const t = performance.now();
        window.HongHa.achievementsPage.destroy();
        window.HongHa.achievementsPage = window.HongHa.achievementsView.mount(document.getElementById('achievements-root'), d, { reducedMotion: true });
        return performance.now() - t;
      }, FULL);
      assert.ok(ms < 150, `mất ${ms}ms`);
    }));
});
