const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.handlers = {}; this.hidden = false; this.value = ''; this.attributes = {}; this.style = {}; }
  append(...children) { for (const child of children) { child.parentElement = this; this.children.push(child); } }
  replaceChildren(...children) { this.children = []; this.append(...children); }
  attachShadow() { this.shadowRoot = new Element('shadow'); return this.shadowRoot; }
  addEventListener(type, handler) { this.handlers[type] = handler; }
  fire(type, event = {}) { this.handlers[type]?.(event); }
  focus() { this.fire('focus'); }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(c => c !== this); }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  hasAttribute(name) { return Object.hasOwn(this.attributes, name); }
  closest(selector) { for (let el = this; el; el = el.parentElement) if (selector.includes('aside') && el.tagName === 'ASIDE') return el; return null; }
  contains(other) { return this === other || this.descendants().includes(other); }
  querySelector() { return null; }
  querySelectorAll(selector) { return selector === 'option' ? this.descendants().filter(el => el.tagName === 'OPTION') : []; }
  descendants() { return this.children.flatMap(child => [child, ...child.descendants()]); }
  get options() { return this.children.filter(el => el.tagName === 'OPTION'); }
  get offsetWidth() { return this.id === 'panel' ? 390 : this.id === 'launcher' ? 60 : 0; }
  get offsetHeight() { return this.id === 'panel' ? (this.mockHeight ?? 400) : this.id === 'launcher' ? 34 : 0; }
  getBoundingClientRect() {
    const left = parseFloat(this.style.left) || 14;
    const top = parseFloat(this.style.top) || (this.id === 'launcher' ? 750 : 0);
    return { left, top, right: left + this.offsetWidth, bottom: top + this.offsetHeight };
  }
  setPointerCapture() {}
  releasePointerCapture() {}
}
const body = new Element('body');
const reader = new Element('div'), markdown = new Element('div'), sidebar = new Element('aside'), sidebarMarkdown = new Element('div');
markdown.className = sidebarMarkdown.className = 'wrtn-markdown';
reader.append(markdown); sidebar.append(sidebarMarkdown); body.append(reader, sidebar);
const document = { body, head: new Element('head'), createElement: tag => new Element(tag), querySelectorAll: selector => {
  const all = body.descendants();
  if (selector === '.wrtn-markdown') return all.filter(el => el.className === 'wrtn-markdown');
  const attribute = /^\[([^\]]+)\]$/.exec(selector)?.[1];
  return attribute ? all.filter(el => el.hasAttribute(attribute)) : [];
} };
const { normalizeTheme } = require('./Crack_Theme_Studio_Draft.user.js');
const seed = normalizeTheme({});
const values = { 'crack-theme-studio-v1': { version: 1, enabled: true, global: seed, rooms: { 'u/a/c/b': seed }, named: { Existing: seed } } };
let stored = values['crack-theme-studio-v1'];
let routeTick;
const windowHandlers = {};
const context = {
  document, location: { href: 'https://crack.wrtn.ai/u/a/c/b' },
  GM_getValue: key => values[key] ?? null, GM_setValue: (key, value) => { values[key] = value; if (key === 'crack-theme-studio-v1') stored = value; }, GM_registerMenuCommand: () => {},
  MutationObserver: class { observe() {} }, window: { addEventListener(type, handler) { windowHandlers[type] = handler; } }, setInterval(callback) { routeTick = callback; },
  URL, structuredClone, console, setTimeout() {}, Blob, innerWidth: 1000, innerHeight: 800,
};
vm.runInNewContext(fs.readFileSync(require.resolve('./Crack_Theme_Studio_Draft.user.js'), 'utf8'), context);
const shadow = body.descendants().find(el => el.id === 'crack-theme-studio-ui').shadowRoot;
const launcher = shadow.descendants().find(el => el.id === 'launcher');
const panel = shadow.descendants().find(el => el.id === 'panel');
const status = () => panel.descendants().find(el => el.id === 'status').textContent;
const action = name => panel.descendants().find(el => el.tagName === 'BUTTON' && (el.textContent === name || el.descendants().some(child => child.textContent === name)));
const colorInput = () => panel.descendants().find(el => el.tagName === 'INPUT' && el.type === 'color');
assert.ok(markdown.hasAttribute('data-crack-theme-text'), 'seeded saved theme applies on startup');
assert.ok(document.head.children.find(el => el.id === 'crack-theme-studio-style').textContent.includes(seed.body.color));
assert.ok(launcher, 'launcher exists with seeded legacy store');

launcher.fire('click');
assert.ok(action('테마') && action('글자') && action('배경') && action('보관'));
assert.ok(action('스펙시트'));
assert.equal(panel.style.top, '342px', 'panel opens above a launcher near the bottom edge');
action('글자').fire('click');
const labels = {
  body: '본문 (일반 텍스트)', strong: '강조 (**text**)', emphasis: '지문 (*text*)',
  heading: '제목 (# text)', quote: '인용 (> text)', link: '링크 ([text](url))', code: '코드 (`text` / ```text```)',
};
const picker = () => panel.descendants().find(el => el.className === 'group-picker');
const groupButton = group => picker().descendants().find(el => el.tagName === 'BUTTON' && el.textContent === labels[group]);
const selectedGroup = () => picker().children.find(el => el.tagName === 'BUTTON');
const groupOptions = () => picker().children.find(el => el.className === 'group-options');
assert.equal(panel.descendants().filter(el => el.tagName === 'SELECT').length, 2, 'scope and font stay native selects');
selectedGroup().fire('click');
assert.equal(groupOptions().hidden, false);
assert.equal(selectedGroup().attributes['aria-expanded'], 'true');
for (const group of Object.keys(labels)) {
  const item = groupButton(group);
  assert.ok(item, `${group} shows its literal markdown example`);
  item.fire('pointerenter');
  assert.equal(markdown.attributes['data-crack-theme-hover'], group);
  assert.equal(sidebarMarkdown.hasAttribute('data-crack-theme-hover'), false, 'sidebar is untouched');
  item.fire('pointerleave');
  assert.equal(markdown.hasAttribute('data-crack-theme-hover'), false);
  item.fire('focus');
  assert.equal(markdown.attributes['data-crack-theme-hover'], group);
  item.fire('blur');
  assert.equal(markdown.hasAttribute('data-crack-theme-hover'), false);
}
groupButton('code').fire('pointerenter');
picker().fire('keydown', { key: 'Escape' });
assert.equal(groupOptions().hidden, true);
assert.equal(markdown.hasAttribute('data-crack-theme-hover'), false);
selectedGroup().fire('click');
groupButton('strong').fire('pointerenter');
groupButton('strong').fire('click');
assert.equal(markdown.hasAttribute('data-crack-theme-hover'), false);
assert.equal(selectedGroup().textContent, `${labels.strong} ▾`);
assert.equal(colorInput().value, '#27251f');
selectedGroup().fire('click'); groupButton('emphasis').fire('click');
assert.equal(colorInput().value, '#665d4e', 'group click updates the edit fields');
selectedGroup().fire('click'); groupButton('link').fire('pointerenter');
panel.mockHeight = 600;
action('배경').fire('click');
assert.equal(panel.style.top, '142px', 'taller tab repositions panel inside viewport');
panel.mockHeight = 400;
assert.equal(markdown.hasAttribute('data-crack-theme-hover'), false, 'tab change clears hover');
action('글자').fire('click');
selectedGroup().fire('click'); groupButton('heading').fire('pointerenter');
const scopeBefore = panel.descendants().find(el => el.tagName === 'SELECT' && el.parentElement.className === 'scope');
scopeBefore.value = 'global'; scopeBefore.fire('change');
assert.equal(markdown.hasAttribute('data-crack-theme-hover'), false, 'scope change clears hover');
const roomScope = panel.descendants().find(el => el.tagName === 'SELECT' && el.parentElement.className === 'scope');
roomScope.value = 'room'; roomScope.fire('change');
selectedGroup().fire('click'); groupButton('body').fire('click');
const hoverCSS = document.head.children.find(el => el.id === 'crack-theme-studio-hover-style').textContent;
for (const selector of ['strong,b', 'em,i', 'h1,h2,h3,h4,h5,h6', 'blockquote', ' a,', 'code,pre']) assert.ok(hoverCSS.includes(selector));
assert.doesNotMatch(hoverCSS, /(?:^|[;{])\s*color\s*:/, 'highlight must preserve text colors');
assert.equal(markdown.children.length, 0, 'original markdown is not rewritten');
assert.ok(action('저장'));
panel.mockHeight = 700;
action('저장').fire('click');
assert.equal(panel.style.top, '42px', 'status height change repositions panel inside viewport');
panel.mockHeight = 400;
colorInput().value = '#123456';
colorInput().fire('change');
assert.equal(status().startsWith('미리보기 중'), true, 'saving must leave a usable editor');
action('저장').fire('click');
assert.equal(stored.rooms['u/a/c/b'].body.color, '#123456');
action('테마 끄기').fire('click');
assert.equal(stored.enabled, false);
selectedGroup().fire('click'); groupButton('quote').fire('pointerenter');
assert.equal(markdown.attributes['data-crack-theme-hover'], 'quote', 'hover works when theme is disabled');
groupButton('quote').fire('pointerleave');
assert.ok(colorInput(), 'toggle must rerender editor');
assert.doesNotMatch(status(), /실패/);
action('테마 켜기').fire('click');
colorInput().value = '#654321';
colorInput().fire('change');
assert.equal(status().startsWith('미리보기 중'), true, 'editor must work after toggle');
action('닫기 · 취소').fire('click');
assert.equal(markdown.hasAttribute('data-crack-theme-hover'), false, 'close clears hover');
assert.equal(stored.rooms['u/a/c/b'].body.color, '#123456', 'cancel must discard preview');
launcher.fire('click');
assert.equal(colorInput().value, '#123456', 'reopen must show saved room value');
const scope = panel.descendants().find(el => el.tagName === 'SELECT' && el.parentElement.className === 'scope');
scope.value = 'global'; scope.fire('change');
assert.equal(colorInput().value, stored.global.body.color, 'global editor must show global value');
colorInput().value = '#abcdef'; colorInput().fire('change'); action('저장').fire('click');
assert.equal(stored.global.body.color, '#abcdef');
assert.equal(stored.rooms['u/a/c/b'].body.color, '#123456');
action('배경').fire('click');
assert.ok(panel.descendants().some(el => el.textContent === '안쪽 여백 px'));
action('보관').fire('click');
assert.ok(action('JSON 내보내기'));
action('글자').fire('click'); selectedGroup().fire('click'); groupButton('code').fire('pointerenter');
context.location.href = 'https://crack.wrtn.ai/u/a/c/other'; routeTick();
assert.equal(markdown.hasAttribute('data-crack-theme-hover'), false, 'route change clears hover');
assert.equal(panel.hidden, true, 'route change closes panel');
launcher.fire('pointerdown', { button: 0, pointerId: 1, clientX: 20, clientY: 760 });
launcher.fire('pointermove', { pointerId: 1, clientX: 23, clientY: 763 });
launcher.fire('pointerup', { pointerId: 1 });
assert.equal(values['crack-theme-studio-launcher-position-v1'], undefined, 'sub-5px motion is a click');
launcher.fire('pointerdown', { button: 0, pointerId: 2, clientX: 20, clientY: 760 });
launcher.fire('pointermove', { pointerId: 2, clientX: 5000, clientY: -5000 });
launcher.fire('pointerup', { pointerId: 2 });
assert.equal(values['crack-theme-studio-launcher-position-v1'].x, 932, 'drag clamps right edge');
assert.equal(values['crack-theme-studio-launcher-position-v1'].y, 8, 'drag clamps top edge');
context.innerWidth = 500;
windowHandlers.resize();
assert.equal(launcher.style.left, '432px', 'resize keeps launcher within viewport');
action('설정 초기화').fire('click');
const confirmBox = panel.descendants().find(el => el.className === 'confirm');
assert.deepEqual(confirmBox.descendants().filter(el => el.tagName === 'BUTTON').map(el => el.textContent), ['전체 방', '이 방만', '취소']);
assert.equal(confirmBox.descendants().find(el => el.textContent === '취소').className, 'action accent');
confirmBox.descendants().find(el => el.textContent === '취소').fire('click');
assert.ok(!panel.descendants().some(el => el.className === 'confirm'), 'cancel closes dialog');
const before = JSON.stringify(stored);
assert.equal(JSON.stringify(stored), before, 'cancel changes nothing');
action('설정 초기화').fire('click');
panel.descendants().find(el => el.className === 'confirm').descendants().find(el => el.textContent === '이 방만').fire('click');
assert.equal(stored.rooms['u/a/c/other'].body.color, '#27251f', 'room reset stores default text color');
assert.equal(stored.rooms['u/a/c/other'].preset, 'specsheet');
assert.equal(stored.rooms['u/a/c/b'].body.color, '#123456', 'other rooms untouched by room reset');
action('설정 초기화').fire('click');
panel.descendants().find(el => el.className === 'confirm').descendants().find(el => el.textContent === '전체 방').fire('click');
assert.equal(Object.keys(stored.rooms).length, 0, 'reset all clears rooms');
assert.equal(stored.global.preset, 'specsheet', 'reset all restores default global');
context.innerWidth = 1000;
launcher.fire('click');
assert.equal(panel.hidden, true, 'drag does not open panel');
launcher.fire('click');
assert.equal(panel.hidden, false, 'following click opens panel');
assert.equal(panel.style.top, '50px', 'panel opens below a launcher near the top edge');
assert.equal(panel.style.left, '432px', 'panel opens beside the moved launcher');
assert.equal(values['crack-theme-studio-v1'], stored, 'drag does not change the theme key');
context.location.href = 'https://crack.wrtn.ai/u/a/c/b';
vm.runInNewContext(fs.readFileSync(require.resolve('./Crack_Theme_Studio_Draft.user.js'), 'utf8'), context);
const restored = body.descendants().filter(el => el.id === 'crack-theme-studio-ui').at(-1).shadowRoot.descendants().find(el => el.id === 'launcher');
assert.equal(restored.style.left, '932px', 'reload restores saved launcher x');
assert.equal(restored.style.top, '8px', 'reload restores saved launcher y');
assert.ok(markdown.hasAttribute('data-crack-theme-text'), 'reload still applies saved room theme');
console.log('ui.test.cjs PASS');
