'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../../js/achievements-model.js');

const NOW = new Date(2026, 9, 27, 12, 0, 0); // 27/10/2026, giờ địa phương

/* ============================== cleanText / truncate ============================== */
test.describe('cleanText & truncate', () => {
  test('gộp khoảng trắng, bỏ ký tự điều khiển, cắt hai đầu', () => {
    assert.equal(m.cleanText('  Xin   chào \n\t thế   giới  '), 'Xin chào thế giới');
    assert.equal(m.cleanText('a\u0000b\u0007c'), 'a b c');
  });
  test('không phải chuỗi -> chuỗi rỗng', () => {
    for (const v of [undefined, null, 5, {}, [], true, NaN]) assert.equal(m.cleanText(v), '');
  });
  test('truncate không cắt khi vừa đủ', () => {
    assert.deepEqual(m.truncate('abc', 3), { text: 'abc', truncated: false });
  });
  test('truncate cắt và thêm …, tổng độ dài đúng bằng max', () => {
    const r = m.truncate('abcdef', 4);
    assert.equal(r.truncated, true);
    assert.equal(r.text, 'abc…');
    assert.equal(Array.from(r.text).length, 4);
  });
  test('truncate không cắt đôi emoji (cặp thay thế)', () => {
    const r = m.truncate('😀😀😀😀😀', 3);
    assert.equal(r.text, '😀😀…');
    assert.ok(!/[\ud800-\udbff](?![\udc00-\udfff])/.test(r.text), 'không có surrogate mồ côi');
  });
  test('truncate giữ nguyên tiếng Việt có dấu', () => {
    assert.equal(m.truncate('Trường Hồng Hà', 100).text, 'Trường Hồng Hà');
  });
});

/* ============================== safeUrl ============================== */
test.describe('safeUrl – chặn URL nguy hiểm', () => {
  const ok = [
    'https://example.com/a.jpg',
    'http://example.com/a.jpg?x=1#y',
    'images/chung-nhan-iso.webp',
    './a.png',
    '../a.png',
    '/img/a.png',
    'data:image/png;base64,iVBORw0KGgo=',
    'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E',
    'data:image/jpeg;base64,/9j/4AAQ',
    '  https://example.com/x.png  '
  ];
  for (const u of ok) {
    test('cho phép: ' + u.slice(0, 40), () => assert.equal(m.safeUrl(u), u.trim()));
  }
  const bad = [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(1)',
    'java\nscript:alert(1)',
    'java\tscript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'data:text/html;base64,PHNjcmlwdD4=',
    'data:application/javascript,alert(1)',
    'data:image/png', // thiếu dấu phẩy
    'file:///c:/secret.png',
    'ftp://example.com/a.png',
    '//evil.com/a.png',
    '\\\\evil.com\\a.png',
    'https://',
    'http:///a.png',
    '&#106;avascript:alert(1)',
    'a b.png',
    'https://exa mple.com/a.png',
    '',
    '   ',
    null,
    undefined,
    42,
    {},
    ['https://a.com/x.png']
  ];
  for (const u of bad) {
    test('chặn: ' + JSON.stringify(u), () => assert.equal(m.safeUrl(u), null));
  }
  test('chặn URL quá dài', () => {
    assert.equal(m.safeUrl('a/' + 'x'.repeat(m.LIMITS.maxUrl)), null);
  });
});

/* ============================== formatNumber ============================== */
test.describe('formatNumber (vi-VN)', () => {
  const cases = [
    [0, '0'],
    [7, '7'],
    [999, '999'],
    [1000, '1.000'],
    [1997, '1.997'],
    [60000, '60.000'],
    [1250000, '1.250.000'],
    [999999999999, '999.999.999.999'],
    [4.5, '4,5'],
    [4.25, '4,25'],
    [4.0, '4'],
    [0.5, '0,5'],
    [1000.1, '1.000,1'],
    [-1500, '-1.500']
  ];
  for (const [n, s] of cases) test(`${n} -> ${s}`, () => assert.equal(m.formatNumber(n), s));
  test('đầu vào không hợp lệ -> chuỗi rỗng', () => {
    for (const v of [NaN, Infinity, -Infinity, '5', null, undefined, {}]) assert.equal(m.formatNumber(v), '');
  });
});

/* ============================== easing & countUpValue ============================== */
test.describe('countUpValue', () => {
  test('đầu mút: 0 tại t=0, đúng target tại t=duration và sau đó', () => {
    assert.equal(m.countUpValue(60000, 0, 1200), 0);
    assert.equal(m.countUpValue(60000, 1200, 1200), 60000);
    assert.equal(m.countUpValue(60000, 99999, 1200), 60000);
  });
  test('thời gian âm hoặc NaN -> 0 (không đếm ngược, không NaN)', () => {
    assert.equal(m.countUpValue(100, -50, 1200), 0);
    assert.equal(m.countUpValue(100, NaN, 1200), 0);
  });
  test('duration không hợp lệ -> trả luôn target', () => {
    for (const d of [0, -1, NaN, undefined]) assert.equal(m.countUpValue(100, 10, d), 100);
  });
  test('target không hữu hạn -> 0', () => {
    for (const t of [NaN, Infinity]) assert.equal(m.countUpValue(t, 10, 1200), 0);
  });
  test('đơn điệu không giảm, luôn nằm trong [0, target], là số nguyên với target nguyên', () => {
    for (const target of [1, 2, 14, 1997, 60000, 999999999999]) {
      let prev = -1;
      for (let t = 0; t <= 1300; t += 7) {
        const v = m.countUpValue(target, t, 1200);
        assert.ok(v >= prev, `giảm tại t=${t} target=${target}`);
        assert.ok(v >= 0 && v <= target, `ngoài khoảng tại t=${t} target=${target}: ${v}`);
        assert.ok(Number.isInteger(v));
        prev = v;
      }
      assert.equal(prev, target);
    }
  });
  test('target thập phân giữ đúng số chữ số thập phân và không vượt target', () => {
    for (let t = 0; t <= 1200; t += 13) {
      const v = m.countUpValue(4.5, t, 1200);
      assert.ok(v <= 4.5 && v >= 0);
      assert.ok(Math.abs(v * 10 - Math.round(v * 10)) < 1e-9, `quá 1 chữ số thập phân: ${v}`);
    }
  });
  test('target = 0 luôn là 0', () => {
    for (let t = 0; t <= 1300; t += 100) assert.equal(m.countUpValue(0, t, 1200), 0);
  });
  test('easeOutCubic: 0->0, 1->1, kẹp ngoài [0,1], tăng dần', () => {
    assert.equal(m.easeOutCubic(0), 0);
    assert.equal(m.easeOutCubic(1), 1);
    assert.equal(m.easeOutCubic(-5), 0);
    assert.equal(m.easeOutCubic(5), 1);
    assert.ok(m.easeOutCubic(0.5) > 0.5, 'ease-out: nhanh lúc đầu');
  });
});

/* ============================== stats ============================== */
test.describe('normalizeStats', () => {
  test('hợp lệ: giữ đủ trường, animate mặc định true', () => {
    const [s] = m.normalizeStats([{ value: 14, label: '  Trường ĐH  ' }]);
    assert.deepEqual(s, { value: 14, label: 'Trường ĐH', prefix: '', suffix: '', animate: true, plain: false });
  });
  test('prefix/suffix giữ khoảng trắng ở rìa (một khoảng) để "Từ " + 1997 = "Từ 1997"', () => {
    const [a] = m.normalizeStats([{ value: 1997, label: 'a', prefix: 'Từ ', suffix: ' năm' }]);
    assert.equal(a.prefix, 'Từ ');
    assert.equal(a.suffix, ' năm');
    const [b] = m.normalizeStats([{ value: 1, label: 'a', prefix: '   Hơn    ', suffix: '+ m²' }]);
    assert.equal(b.prefix, ' Hơn ', 'gộp nhiều khoảng trắng thành một');
    assert.equal(b.suffix, '+ m²');
    const [c] = m.normalizeStats([{ value: 1, label: 'a', prefix: '   ', suffix: '\n\t' }]);
    assert.equal(c.prefix, '');
    assert.equal(c.suffix, '', 'chỉ có khoảng trắng -> rỗng');
  });
  test('plain chỉ bật khi đúng true', () => {
    assert.equal(m.normalizeStats([{ value: 1997, label: 'a', plain: true }])[0].plain, true);
    for (const p of ['true', 1, 'yes', undefined, null]) {
      assert.equal(m.normalizeStats([{ value: 1997, label: 'a', plain: p }])[0].plain, false);
    }
  });
  test('animate:false được giữ; chỉ đúng false mới tắt', () => {
    assert.equal(m.normalizeStats([{ value: 1, label: 'a', animate: false }])[0].animate, false);
    assert.equal(m.normalizeStats([{ value: 1, label: 'a', animate: 0 }])[0].animate, true);
    assert.equal(m.normalizeStats([{ value: 1, label: 'a', animate: 'false' }])[0].animate, true);
  });
  test('value không hợp lệ bị loại: chuỗi, âm, NaN, Infinity, quá lớn, null', () => {
    const bad = ['14', -1, NaN, Infinity, 1e13, null, undefined, {}, []];
    for (const v of bad) assert.deepEqual(m.normalizeStats([{ value: v, label: 'x' }]), [], String(v));
  });
  test('chấp nhận biên: 0 và 1e12', () => {
    assert.equal(m.normalizeStats([{ value: 0, label: 'a' }, { value: 1e12, label: 'b' }]).length, 2);
  });
  test('thiếu/rỗng label bị loại', () => {
    assert.deepEqual(m.normalizeStats([{ value: 1 }, { value: 1, label: '   ' }, { value: 1, label: 5 }]), []);
  });
  test('phần tử không phải đối tượng bị loại, không ném lỗi', () => {
    assert.deepEqual(m.normalizeStats([null, 5, 'x', undefined, [], true]), []);
  });
  test('đầu vào không phải mảng -> []', () => {
    for (const v of [undefined, null, {}, 'abc', 5]) assert.deepEqual(m.normalizeStats(v), []);
  });
  test('tối đa 8 ô; ghi nhận issue khi vượt', () => {
    const list = Array.from({ length: 12 }, (_, i) => ({ value: i, label: 'n' + i }));
    assert.equal(m.normalizeStats(list).length, 8);
    const r = m.normalize({ stats: list });
    assert.equal(r.stats.length, 8);
    assert.equal(r.issues.filter((x) => x.section === 'stats').length, 1);
  });
  test('label/prefix/suffix quá dài bị cắt, có ghi issue', () => {
    const r = m.normalize({ stats: [{ value: 1, label: 'x'.repeat(100), prefix: 'p'.repeat(20), suffix: 's'.repeat(20) }] });
    assert.equal(Array.from(r.stats[0].label).length, 60);
    assert.equal(Array.from(r.stats[0].prefix).length, 8);
    assert.equal(r.issues.length, 3);
  });
});

/* ============================== timeline ============================== */
test.describe('normalizeTimeline & groupTimeline', () => {
  const ev = (year, title, extra) => Object.assign({ year, title }, extra);

  test('sắp mới nhất trước; cùng năm giữ nguyên thứ tự nhập', () => {
    const out = m.normalizeTimeline([ev(2020, 'A'), ev(2023, 'B'), ev(2020, 'C'), ev(1997, 'D'), ev(2023, 'E')], NOW);
    assert.deepEqual(out.map((x) => x.title), ['B', 'E', 'A', 'C', 'D']);
  });
  test('không làm thay đổi mảng đầu vào', () => {
    const input = [ev(2020, 'A'), ev(2023, 'B')];
    const copy = JSON.stringify(input);
    m.normalizeTimeline(input, NOW);
    assert.equal(JSON.stringify(input), copy);
  });
  test('year không hợp lệ bị loại: chuỗi, thập phân, <1900, năm xa tương lai, NaN', () => {
    for (const y of ['2020', 2020.5, 1899, 2028, NaN, Infinity, null, undefined]) {
      assert.deepEqual(m.normalizeTimeline([ev(y, 'x')], NOW), [], String(y));
    }
  });
  test('biên năm: 1900 và năm sau (now+1) hợp lệ', () => {
    assert.equal(m.normalizeTimeline([ev(1900, 'a'), ev(2027, 'b')], NOW).length, 2);
  });
  test('thiếu title bị loại', () => {
    assert.deepEqual(m.normalizeTimeline([{ year: 2020 }, ev(2020, '  ')], NOW), []);
  });
  test('yearLabel mặc định là năm; dùng yearLabel khi có', () => {
    const [a, b] = m.normalizeTimeline([ev(2023, 'a'), ev(2020, 'b', { yearLabel: '2019–2020' })], NOW);
    assert.equal(a.yearLabel, '2023');
    assert.equal(b.yearLabel, '2019–2020');
  });
  test('description tùy chọn, bị cắt ở 300 ký tự', () => {
    const [a] = m.normalizeTimeline([ev(2020, 'a', { description: 'd'.repeat(500) })], NOW);
    assert.equal(Array.from(a.description).length, 300);
    const [b] = m.normalizeTimeline([ev(2020, 'a')], NOW);
    assert.equal(b.description, '');
  });
  test('tối đa 40 mốc', () => {
    const list = Array.from({ length: 60 }, (_, i) => ev(2000 + (i % 20), 't' + i));
    assert.equal(m.normalizeTimeline(list, NOW).length, 40);
  });
  test('groupTimeline gom theo nhãn năm, giữ thứ tự', () => {
    const items = m.normalizeTimeline(
      [
        ev(2020, 'A', { yearLabel: '2019–2020' }),
        ev(2023, 'B'),
        ev(2020, 'C', { yearLabel: '2019–2020' }),
        ev(2020, 'D'), // cùng năm nhưng khác nhãn -> nhóm riêng
        ev(1997, 'E')
      ],
      NOW
    );
    const groups = m.groupTimeline(items);
    assert.deepEqual(
      groups.map((g) => [g.label, g.items.map((i) => i.title)]),
      [['2023', ['B']], ['2019–2020', ['A', 'C']], ['2020', ['D']], ['1997', ['E']]]
    );
  });
  test('groupTimeline xử lý rỗng/undefined', () => {
    assert.deepEqual(m.groupTimeline([]), []);
    assert.deepEqual(m.groupTimeline(undefined), []);
  });
  test('nhãn năm kiểu "__proto__" không làm hỏng nhóm', () => {
    const items = [{ year: 2020, yearLabel: '__proto__', title: 'x', description: '' }];
    const g = m.groupTimeline(items);
    assert.equal(g.length, 1);
    assert.equal(g[0].label, '__proto__');
    assert.equal(Object.prototype.polluted, undefined);
  });
});

/* ============================== certifications ============================== */
test.describe('normalizeCertifications', () => {
  test('hợp lệ, icon hợp lệ được giữ', () => {
    const [c] = m.normalizeCertifications([{ name: 'ISO', issuer: 'BSI', icon: 'shield-check' }]);
    assert.deepEqual(c, { name: 'ISO', issuer: 'BSI', icon: 'shield-check', image: null });
  });
  test('icon lạ/thiếu -> mặc định award (không ném lỗi, không đưa chuỗi lạ vào DOM)', () => {
    for (const icon of ['<script>', 'unknown', undefined, 5, '__proto__']) {
      const [c] = m.normalizeCertifications([{ name: 'a', icon }]);
      assert.equal(c.icon, 'award');
    }
    assert.deepEqual(m.ICON_KEYS, ['award', 'shield-check', 'leaf', 'medal', 'graduation-cap']);
  });
  test('ảnh an toàn được giữ; ảnh nguy hiểm bị bỏ nhưng chứng nhận vẫn còn', () => {
    const r = m.normalize({
      certifications: [
        { name: 'a', image: 'img/a.webp' },
        { name: 'b', image: 'javascript:alert(1)' },
        { name: 'c', image: '' },
        { name: 'd' }
      ]
    });
    assert.deepEqual(r.certifications.map((c) => c.image), ['img/a.webp', null, null, null]);
    assert.equal(r.issues.filter((i) => i.section === 'certifications').length, 1);
  });
  test('thiếu name bị loại', () => {
    assert.deepEqual(m.normalizeCertifications([{}, { name: ' ' }, { name: 3 }, null]), []);
  });
  test('tối đa 12', () => {
    const list = Array.from({ length: 20 }, (_, i) => ({ name: 'c' + i }));
    assert.equal(m.normalizeCertifications(list).length, 12);
  });
});

/* ============================== testimonials ============================== */
test.describe('normalizeTestimonials (chỉ hiện khi có đồng ý)', () => {
  const base = { quote: 'Con rất thích đến trường mỗi ngày.', name: 'Chị Lan', consent: true };

  test('hợp lệ', () => {
    const [t] = m.normalizeTestimonials([Object.assign({ role: 'Phụ huynh em An, lớp 6A' }, base)]);
    assert.deepEqual(t, { quote: base.quote, name: 'Chị Lan', role: 'Phụ huynh em An, lớp 6A', avatar: null });
  });
  test('consent phải đúng boolean true', () => {
    for (const consent of [false, undefined, null, 'true', 1, 'yes', {}, []]) {
      assert.deepEqual(m.normalizeTestimonials([Object.assign({}, base, { consent })]), [], String(consent));
    }
  });
  test('quote quá ngắn (<10) hoặc quá dài (>300) bị loại; biên 10 và 300 hợp lệ', () => {
    assert.equal(m.normalizeTestimonials([Object.assign({}, base, { quote: 'a'.repeat(9) })]).length, 0);
    assert.equal(m.normalizeTestimonials([Object.assign({}, base, { quote: 'a'.repeat(10) })]).length, 1);
    assert.equal(m.normalizeTestimonials([Object.assign({}, base, { quote: 'a'.repeat(300) })]).length, 1);
    assert.equal(m.normalizeTestimonials([Object.assign({}, base, { quote: 'a'.repeat(301) })]).length, 0);
  });
  test('thiếu name bị loại', () => {
    assert.deepEqual(m.normalizeTestimonials([Object.assign({}, base, { name: '' })]), []);
  });
  test('avatar nguy hiểm bị bỏ, vẫn hiển thị cảm nhận', () => {
    const [t] = m.normalizeTestimonials([Object.assign({}, base, { avatar: 'javascript:alert(1)' })]);
    assert.equal(t.avatar, null);
  });
  test('tối đa 6 (6 chấm), phần dư bị bỏ và ghi issue', () => {
    const list = Array.from({ length: 9 }, (_, i) => Object.assign({}, base, { name: 'P' + i }));
    const r = m.normalize({ testimonials: list });
    assert.equal(r.testimonials.length, 6);
    assert.ok(r.issues.some((i) => /vượt giới hạn/.test(i.message)));
  });
  test('mục không có consent không chiếm chỗ trong giới hạn 6', () => {
    const list = [];
    for (let i = 0; i < 5; i++) list.push(Object.assign({}, base, { consent: false }));
    for (let i = 0; i < 6; i++) list.push(Object.assign({}, base, { name: 'P' + i }));
    assert.equal(m.normalizeTestimonials(list).length, 6);
  });
  test('initialOf: chữ cái đầu, hỗ trợ tiếng Việt, bỏ ký tự không phải chữ', () => {
    assert.equal(m.initialOf('Nguyễn Văn A'), 'N');
    assert.equal(m.initialOf('ân'), 'Â');
    assert.equal(m.initialOf('  "đức"'), 'Đ');
    assert.equal(m.initialOf('123 !!'), '?');
    assert.equal(m.initialOf(''), '?');
    assert.equal(m.initialOf(undefined), '?');
  });
});

/* ============================== normalize (tổng) ============================== */
test.describe('normalize – dữ liệu gốc', () => {
  test('không bao giờ ném lỗi với đầu vào bất kỳ', () => {
    const inputs = [undefined, null, 0, 1, 'x', true, [], [1, 2], () => {}, Symbol.iterator.toString(), NaN, new Date(), /re/];
    for (const input of inputs) {
      assert.doesNotThrow(() => m.normalize(input, { now: NOW }));
      const r = m.normalize(input, { now: NOW });
      assert.deepEqual([r.stats, r.timeline, r.certifications, r.testimonials], [[], [], [], []]);
    }
  });
  test('các mảng sai kiểu -> rỗng', () => {
    const r = m.normalize({ stats: 'x', timeline: {}, certifications: 5, testimonials: null }, { now: NOW });
    assert.deepEqual([r.stats, r.timeline, r.certifications, r.testimonials], [[], [], [], []]);
  });
  test('đầu vào hợp lệ -> không có issue', () => {
    const r = m.normalize({
      intro: 'Giới thiệu',
      stats: [{ value: 1, label: 'a' }],
      timeline: [{ year: 2020, title: 't' }],
      certifications: [{ name: 'c' }],
      testimonials: []
    }, { now: NOW });
    assert.deepEqual(r.issues, []);
    assert.equal(r.intro, 'Giới thiệu');
  });
  test('một mục hỏng không làm hỏng mục khác (cô lập lỗi)', () => {
    const r = m.normalize({
      stats: [{ value: 'x', label: 'hỏng' }, { value: 5, label: 'tốt' }],
      timeline: [{ year: 'x', title: 'hỏng' }, { year: 2020, title: 'tốt' }]
    }, { now: NOW });
    assert.deepEqual(r.stats.map((s) => s.label), ['tốt']);
    assert.deepEqual(r.timeline.map((s) => s.title), ['tốt']);
    assert.equal(r.issues.length, 2);
  });
  test('không làm thay đổi dữ liệu gốc & không tham chiếu lại đối tượng gốc', () => {
    const raw = { stats: [{ value: 1, label: ' a ' }], timeline: [{ year: 2020, title: 't' }] };
    const before = JSON.stringify(raw);
    const r = m.normalize(raw, { now: NOW });
    assert.equal(JSON.stringify(raw), before);
    assert.notEqual(r.stats[0], raw.stats[0]);
  });
  test('chống prototype pollution qua khóa nguy hiểm', () => {
    const raw = JSON.parse('{"__proto__":{"polluted":1},"stats":[{"value":1,"label":"a","__proto__":{"polluted":2}}]}');
    m.normalize(raw, { now: NOW });
    assert.equal({}.polluted, undefined);
  });
  test('payload XSS đi qua nguyên văn dưới dạng văn bản (view dùng textContent)', () => {
    const xss = '<img src=x onerror=alert(1)>';
    const r = m.normalize({ stats: [{ value: 1, label: xss }] }, { now: NOW });
    assert.equal(r.stats[0].label, xss);
  });
  test('dữ liệu mẫu đi kèm trang đạt chuẩn: không có issue nào', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const code = fs.readFileSync(path.join(__dirname, '../../js/achievements-data.js'), 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    const raw = sandbox.window.HongHa.achievementsData;
    const r = m.normalize(raw, { now: NOW });
    assert.deepEqual(r.issues, [], JSON.stringify(r.issues));
    assert.ok(r.stats.length >= 3 && r.stats.length <= 4, 'dải số liệu 3–4 ô');
    assert.ok(r.timeline.length > 0);
    assert.ok(r.certifications.length > 0);
    assert.equal(r.testimonials.length, 0, 'không có cảm nhận bịa đặt');
    // Mốc timeline phải giảm dần theo năm
    for (let i = 1; i < r.timeline.length; i++) assert.ok(r.timeline[i - 1].year >= r.timeline[i].year);
  });
});
