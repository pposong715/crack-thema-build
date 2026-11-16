const assert = require('node:assert/strict');
const { pickReader } = require('./Crack_Theme_Studio_Draft.user.js');

class Node {
  constructor(tag, role = '') { this.tag = tag; this.role = role; this.children = []; this.parentElement = null; }
  add(child) { child.parentElement = this; this.children.push(child); return child; }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  querySelector(selector) {
    const forbidden = node => ['input', 'textarea', 'nav', 'aside', 'form'].includes(node.tag) || node.tag === 'wish';
    return this.children.find(child => forbidden(child) || child.querySelector(selector));
  }
  closest(selector) {
    for (let node = this; node; node = node.parentElement) if (node.role === 'log' || node.role === 'feed') return node;
    return null;
  }
}
const body = new Node('body');
const main = body.add(new Node('main'));
const reader = main.add(new Node('section'));
const first = reader.add(new Node('article')).add(new Node('div'));
const second = reader.add(new Node('article')).add(new Node('div'));
main.add(new Node('input'));
assert.equal(pickReader(first, [first, second]), reader, 'shared reading region includes gap between message wrappers');
assert.equal(pickReader(second, [first, second]), reader);
assert.notEqual(pickReader(first, [first, second]), main, 'composer ancestor remains untouched');

const isolated = body.add(new Node('section'));
const log = isolated.add(new Node('div', 'log'));
const message = log.add(new Node('article')).add(new Node('div'));
assert.equal(pickReader(message, [message]), log, 'explicit log region preferred');
log.add(new Node('wish'));
assert.notEqual(pickReader(message, [message]), log, 'region containing WISH UI excluded');
const deep = body.add(new Node('section'));
const list = deep.add(new Node('div'));
const wrapper = list;
const branch = () => wrapper.add(new Node('div')).add(new Node('div')).add(new Node('div')).add(new Node('div')).add(new Node('div'));
const deepA = branch();
const deepB = branch();
deep.add(new Node('input'));
assert.equal(pickReader(deepA, [deepA, deepB]), wrapper, 'deep chat list can be styled without the composer');
console.log('reader.test.cjs PASS');
