const assert = require('node:assert/strict');
const { normalizeTheme, normalizeStore, roomKey, resolveTheme, buildThemeCSS } = require('./Crack_Theme_Studio_Draft.user.js');
assert.equal(normalizeTheme({}).preset, 'specsheet');
assert.deepEqual([normalizeTheme({}).padding, normalizeTheme({}).paragraphGap, normalizeTheme({}).radius], [26, 20, 0]);
assert.equal(normalizeTheme({ preset: 'specsheet', radius: 13 }).radius, 13);
assert.equal(normalizeTheme({ preset: 'dark' }).radius, 8);
assert.equal(normalizeTheme({ preset: 'report' }).radius, 0);
const roundedReport = buildThemeCSS(normalizeTheme({ preset: 'report', radius: 16 }));
assert.match(roundedReport, /border-radius:16px/);
assert.doesNotMatch(roundedReport, /border-radius:0!important/);
const legacy = normalizeTheme({ preset: 'dark', body: { color: '#123456' }, card: { color: '#654321' } });
assert.equal(legacy.body.color, '#123456');
assert.equal(legacy.card.color, '#654321');
for (const bad of [{ padding: 11 }, { paragraphGap: 33 }, { radius: 25 }]) assert.throws(() => normalizeTheme(bad), /invalid/i);
const specCSS = buildThemeCSS(normalizeTheme({}));
assert.match(specCSS, /20px 20px/);
assert.match(specCSS, /border:1px solid #a78b58/);
assert.match(specCSS, /border-radius:0px/);
assert.match(specCSS, /box-shadow:inset 0 0 0 5px/);
assert.match(specCSS, /border-bottom:1px solid #a78b58/);
assert.match(specCSS, /border-left:3px solid #a78b58/);
assert.match(specCSS, /padding:9px 12px/);
assert.match(specCSS, /padding:clamp\(/);
assert.match(specCSS, /max-width:100%/);
assert.match(specCSS, /overflow-x:auto/);
assert.doesNotMatch(specCSS, /pre\{white-space:pre!important\}/);
assert.match(specCSS, /\.wrtn-markdown\[data-crack-theme-text\] pre,\.wrtn-markdown\[data-crack-theme-text\] pre code,\.wrtn-markdown\[data-crack-theme-text\] pre code \*\{white-space:pre-wrap!important;overflow-wrap:anywhere!important;min-width:0!important\}/);
assert.match(specCSS, /\.wrtn-markdown\[data-crack-theme-text\] pre,\.wrtn-markdown\[data-crack-theme-text\] table\{max-width:100%!important;overflow-x:auto!important;display:block!important\}/);
assert.match(specCSS, /\.wrtn-markdown\[data-crack-theme-text\] p/);
const variants = ['dark', 'cute', 'elegant', 'simple', 'parchment', 'report', 'wiki', 'steampunk', 'cyberpunk'].map(preset => buildThemeCSS(normalizeTheme({ preset })));
assert.equal(new Set(variants).size, variants.length);

const routes = [
  ['https://crack.wrtn.ai/stories/story-1/episodes/episode-2?x=1#part', 'stories/story-1/episodes/episode-2'],
  ['https://crack.wrtn.ai/characters/c-1/chats/chat-2', 'characters/c-1/chats/chat-2'],
  ['https://crack.wrtn.ai/u/user-1/c/convo-2', 'u/user-1/c/convo-2'],
];
for (const [url, expected] of routes) assert.equal(roomKey(url), expected);
assert.equal(roomKey('https://other.example/u/a/c/b'), null);
assert.equal(roomKey('https://crack.wrtn.ai/u/a/c/b/extra'), null);
assert.equal(roomKey('https://crack.wrtn.ai/u/a/c/b?branchId=z&x=1&forkId=a'), 'u/a/c/b?branchId=z&forkId=a');
assert.equal(roomKey('https://crack.wrtn.ai/u/a/c/b?forkId=a&branchId=z'), 'u/a/c/b?branchId=z&forkId=a');

const global = normalizeTheme({ preset: 'dark', body: { color: '#ffffff' } });
const room = normalizeTheme({ preset: 'simple', body: { color: '#222222' } });
const store = normalizeStore({ version: 1, enabled: true, global, rooms: { 'u/a/c/b': room }, named: {} });
assert.equal(resolveTheme(store, 'u/a/c/b').body.color, '#222222');
assert.equal(resolveTheme(store, 'u/a/c/c').body.color, '#ffffff');
delete store.rooms['u/a/c/b'];
assert.equal(resolveTheme(store, 'u/a/c/b').body.color, '#ffffff');
store.enabled = false;
assert.equal(resolveTheme(store, 'u/a/c/b'), null);

for (const bad of [
  { body: { color: 'red;body{display:none}' } },
  { body: { size: 999 } },
  { body: { font: '";color:red' } },
  { page: { image: 'javascript:alert(1)' } },
  { page: { image: 'http://example.com/a.png' } },
  { page: { image: 'https://x.test/a.png");body{color:red' } },
  { preset: 'unknown' },
]) assert.throws(() => normalizeTheme(bad), /invalid/i);
assert.throws(() => normalizeStore({ version: 2, enabled: true, global, rooms: {}, named: {} }), /invalid/i);
assert.throws(() => normalizeStore({ version: 1, enabled: true, global, rooms: { '<bad>': room }, named: {} }), /invalid/i);
assert.throws(() => normalizeStore({ version: 1, enabled: true, global, rooms: {}, named: {}, extra: true }), /invalid/i);

const css = buildThemeCSS(normalizeTheme({
  body: { color: '#fefefe' },
  emphasis: { color: '#abcdef' },
  page: { image: 'https://images.example.test/a.png?x=1&y=2' },
}));
assert.match(css, /\.wrtn-markdown/);
assert.match(css, /strong/);
assert.match(css, /em/);
assert.match(css, /#abcdef/);
assert.doesNotMatch(css, /body\s*\{/);
assert.doesNotMatch(css, /textarea|contenteditable|#rpcm-fab/);
for (const preset of ['dark', 'cute', 'elegant', 'simple', 'parchment', 'report', 'wiki', 'steampunk', 'cyberpunk']) {
  const output = buildThemeCSS(normalizeTheme({ preset }));
  for (const declaration of output.matchAll(/background-image:([^;]+)/g)) {
    assert.doesNotMatch(declaration[1], /\s\d+\s+\d+\s*\//, `${preset} image declaration must not include position/size`);
  }
}
const imageCSS = buildThemeCSS(normalizeTheme({ preset: 'cute', page: { image: 'https://images.example.test/p.png' } }));
assert.match(imageCSS, /background-size:cover,22px 22px,22px 22px/);
for (const preset of ['specsheet', 'dark', 'cute', 'elegant', 'simple', 'parchment', 'report', 'wiki', 'steampunk', 'cyberpunk']) {
  const plain = buildThemeCSS(normalizeTheme({ preset, page: { patternStrength: 0 }, card: { patternStrength: 0 } }));
  assert.equal((plain.match(/background-image:none!important/g) || []).length, 2, `${preset} zero strength removes texture`);
}
const plainImage = buildThemeCSS(normalizeTheme({ preset: 'dark', page: { patternStrength: 0, image: 'https://images.example.test/p.png' } }));
assert.match(plainImage, /background-image:url\("https:\/\/images\.example\.test\/p\.png"\),none!important;background-position:center,0 0!important;background-size:cover,auto!important/);
for (const preset of ['specsheet', 'dark', 'cute', 'elegant', 'simple', 'parchment', 'report', 'wiki', 'steampunk', 'cyberpunk']) {
  const out = buildThemeCSS(normalizeTheme({ preset, radius: 24 }));
  assert.doesNotMatch(out.replace(/data:image\/png;base64,[^"]+/g, ''), /undefined|NaN/, preset);
  assert.match(out, /position:relative!important/);
  if (preset !== 'parchment') assert.doesNotMatch(out, /::after/, preset + ' corners hidden at large radius');
}
assert.match(buildThemeCSS(normalizeTheme({ preset: 'specsheet' })), /::before|::after/);
assert.match(buildThemeCSS(normalizeTheme({ preset: 'specsheet' })), /::after/);
for (const preset of ['specsheet', 'cute', 'elegant', 'simple', 'parchment', 'report', 'wiki', 'steampunk', 'cyberpunk']) {
  assert.match(buildThemeCSS(normalizeTheme({ preset })), /\.wrtn-codeblock>div:first-child\{background:#[0-9a-f]{6}!important/, preset + ' themes INFO header');
}
assert.doesNotMatch(buildThemeCSS(normalizeTheme({ preset: 'dark' })), /\.wrtn-codeblock/);
assert.equal(normalizeTheme({ preset: 'steampunk' }).radius, 4);
assert.equal(normalizeTheme({ preset: 'cyberpunk' }).radius, 0);
assert.doesNotMatch(buildThemeCSS(normalizeTheme({ preset: 'simple' })), /repeating-linear-gradient\(0deg/);
const fxCSS = (preset, effects) => buildThemeCSS(normalizeTheme({ preset, effects }));
assert.deepEqual(normalizeTheme({}).effects, { seal: true, sealImage: 'lion', blood: true, user: false });
assert.equal((fxCSS('report', {}).match(/::before\{[^}]*\}/)[0].match(/data:image\/png/g) || []).length, 5);
assert.match(fxCSS('report', {}), /:not\(\[data-crack-theme-user\]\)::before\{[^}]*z-index:-1/);
assert.doesNotMatch(fxCSS('report', { user: true }), /:not\(\[data-crack-theme-user\]\)/);
assert.doesNotMatch(fxCSS('report', { blood: false }), /::before/);
assert.doesNotMatch(fxCSS('report', {}).replace(/data:image\/png;base64,[^"]+/g, ''), /::after/);
assert.equal(new Set(['eagle', 'lion', 'stamp'].map(sealImage => fxCSS('parchment', { sealImage }))).size, 3);
assert.match(fxCSS('parchment', { sealImage: 'eagle' }), /::after\{[^}]*z-index:-1[^}]*background-image:url\("data:image\/png;base64,[^"]+"\),linear-gradient/);
assert.match(fxCSS('parchment', {}), /\[data-crack-theme-user\]::after\{background-image:linear-gradient/);
assert.doesNotMatch(fxCSS('parchment', { user: true }), /\[data-crack-theme-user\]::after/);
assert.doesNotMatch(fxCSS('parchment', { seal: false }), /data:image\/png/);
assert.equal(normalizeTheme({ preset: 'parchment', card: { seal: 'eagle', blood: false } }).effects.sealImage, 'eagle');
assert.equal(normalizeTheme({ preset: 'parchment', card: { seal: 'eagle' } }).card.seal, undefined);
assert.throws(() => normalizeTheme({ effects: { sealImage: 'owl' } }), /invalid/i);
assert.throws(() => normalizeTheme({ effects: { blood: 'yes' } }), /invalid/i);
assert.throws(() => normalizeTheme({ effects: { extra: true } }), /invalid/i);
assert.throws(() => normalizeTheme({ page: { seal: 'lion' } }), /invalid/i);
console.log('theme.test.cjs PASS');
