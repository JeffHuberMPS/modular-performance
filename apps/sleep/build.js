// MPS Recovery (Sleep) — build step.
// The Recovery app is written in JSX (app.src.jsx) but shipped PRE-COMPILED so the browser
// never has to download @babel/standalone (~3MB) or compile JSX at runtime — that was the
// first-open "sit and spin". Edit app.src.jsx, then run:  node apps/sleep/build.js
//
// It compiles app.src.jsx (JSX -> plain React.createElement JS) and injects it into the
// <script id="sleep-app"> block in index.html. No Babel ships to the browser.
const fs = require('fs');
const path = require('path');

let Babel;
try { Babel = require('@babel/standalone'); }
catch (e) { Babel = require('C:/Users/Owner/node_modules/@babel/standalone/babel.js'); }

const DIR = __dirname;
const SRC = path.join(DIR, 'app.src.jsx');
const HTML = path.join(DIR, 'index.html');

const src = fs.readFileSync(SRC, 'utf8');
const out = Babel.transform(src, { presets: ['react'], compact: false }).code;

let html = fs.readFileSync(HTML, 'utf8');
const block = /<script id="sleep-app">[\s\S]*?<\/script>/;
if (!block.test(html)) { console.error('Could not find <script id="sleep-app"> in index.html'); process.exit(1); }
// Use a REPLACEMENT FUNCTION, not a string: compiled code contains '$' sequences that
// String.replace would treat as special $-patterns ($&, $', $`, $$) and corrupt the output.
html = html.replace(block, () =>
  '<script id="sleep-app">\n/* PRE-COMPILED from app.src.jsx — do NOT hand-edit. Edit app.src.jsx then run: node apps/sleep/build.js */\n' + out + '\n</script>');
fs.writeFileSync(HTML, html, 'utf8');
console.log('Built: app.src.jsx (' + src.length + ') -> compiled ' + out.length + ' chars into index.html');
