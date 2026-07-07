// MPS Habits — build step.
// The Habits app is written in JSX (app.src.jsx) but shipped PRE-COMPILED so the browser
// never has to download @babel/standalone (~3MB) or compile JSX at runtime — that was the
// "sit and spin" on every open. Edit app.src.jsx, then run:  node apps/habits/build.js
//
// It compiles app.src.jsx (JSX -> plain React.createElement JS) and injects it into the
// <script id="habits-app"> block in index.html. No Babel ships to the browser.
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
const block = /<script id="habits-app">[\s\S]*?<\/script>/;
if (!block.test(html)) { console.error('Could not find <script id="habits-app"> in index.html'); process.exit(1); }
// Use a REPLACEMENT FUNCTION, not a string. Compiled code can contain '$' sequences (e.g. a
// money formatter's '$') and String.replace treats $&, $', $`, $$ in a STRING replacement as
// special patterns — that would silently splice unrelated content into the code. A function
// replacement disables that substitution entirely.
html = html.replace(block, () =>
  '<script id="habits-app">\n/* PRE-COMPILED from app.src.jsx — do NOT hand-edit. Edit app.src.jsx then run build.js. */\n' + out + '\n</script>');
fs.writeFileSync(HTML, html, 'utf8');
console.log('Built: app.src.jsx (' + src.length + ') -> compiled ' + out.length + ' chars into index.html');
