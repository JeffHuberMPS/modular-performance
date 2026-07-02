/* ============================================================
   MPS Interactive App Tour
   Runs INSIDE a tracker app (same-origin iframe). The hub calls
   window.startMpsTour() right after the intro popup is dismissed.
   It darkens the screen, rings the exact element to tap, shows an
   instruction, and waits for the tap before moving to the next step.
   Steps are picked automatically from the app's URL (/apps/<name>/).

   A step targets an element by:
     sel  → CSS selector (querySelector)            [stable apps]
     txt  → element whose trimmed text === txt      [React apps, no ids]
            (txtTag narrows the tag, default 'button')
     center:true → no element; a centered message    [general note]
   click:true  → advance when the user taps that element
   click:false → show a "Next" button instead
   ============================================================ */
(function () {
  'use strict';

  var TOURS = {
    workout: [
      { pan: true,                          text: "This is your <b>Dashboard</b> — three weeks of training. Watch it roll by." },
      { sel: '.tab[data-tab="today"]',     text: "Now the part you'll use daily. <b>Today</b> is where you log your session — tap it.", click: true },
      { sel: '#add-split-btn',             text: "Tap <b>+ Add Split</b> to add your exercises — Push, Pull, Legs, and so on.", click: false },
      { center: true,                       text: "Pick a split, then each exercise gives you a <b>Weight</b> and <b>Reps</b> box for every set. Fill them in and tap <b>+ Set</b> for another. That's logging a workout.", click: false },
      { sel: '#end-workout',               text: "When you're done, <b>End Workout &amp; Save</b> logs the whole session. That's it — you're set.", click: false }
    ],
    habits: [
      { txt: 'Dashboard',                   text: "First, your <b>Dashboard</b> — every habit's streak and strength. Watch it roll by.", click: true },
      { pan: true,                          text: "Your discipline at a glance: streaks, momentum, how each habit is trending." },
      { sel: 'button:has(path[d="M12 20h9"])', text: "These are <b>starter</b> habits — tap the <b>pencil</b> on any one to rename it, change its icon, or delete it. Make them your own.", click: false },
      { txt: 'Track', sel: '.log-tab',     text: "Now tap <b>Track</b> — your daily check-in.", click: true },
      { center: true,                       text: "Tap each habit to check it off, then hit <b>Save Entry</b> to lock the day in. That's the whole thing.", click: false }
    ],
    sleep: [
      { txt: 'Dashboard',                   text: "First, your <b>Dashboard</b> — recovery score, sleep and trends. Watch it roll by.", click: true },
      { pan: true,                          text: "Your recovery at a glance: how you've slept and how recovered you are." },
      { txt: 'Log',                         text: "Now the daily part. Tap <b>Log</b> to check in.", click: true },
      { txt: 'Log Entry',                   text: "Tap <b>Log Entry</b> to open today's form.", click: true },
      { center: true,                       text: "Set your <b>sleep &amp; wake times</b>, rate your energy, and <b>Save</b>. Your recovery score is figured out for you. That's it.", click: false }
    ],
    expenses: [
      { pan: true,                          text: "First, your <b>Dashboard</b> — weekly pace, what's left to spend, and where your money goes by category. Watch it roll by." },
      { sel: '.tab[data-tab="log"]',       text: "Now the part you'll use daily. Tap <b>Log</b> — every expense lives here.", click: true },
      { sel: '#btn-add-expense',           text: "Tap <b>+ Add Expense</b> to log a purchase in seconds — amount, merchant, and a <b>category</b> so it's tracked correctly.", click: false },
      { sel: '.tab[data-tab="budget"]',    text: "<b>Budget</b> — set your monthly cap and bills so you always know what's left.", click: true },
      { sel: '.tab[data-tab="settings"]',  text: "Last thing — tap <b>Settings</b>.", click: true },
      { sel: '#btn-clear-expenses',        text: "When you're done exploring, <b>Clear All Expenses</b> wipes the sample data so you can start with your own numbers. That's it — you're ready.", click: false }
    ],
    journal: [
      { pan: true,                          text: "This is your <b>Journal</b> — your day auto-filled from your trackers up top. Watch it roll by." },
      { sel: '[data-tour="win"]',           text: "Every entry opens with <b>Today's Biggest Win</b> — the headline of your day." },
      { sel: '[data-tour="win"] button.mps-mic', text: "Hate typing? Tap the <b>mic</b> on any field and just talk. It fills the box for you and stops when you pause — every field has one." },
      { sel: '[data-tour="disc"]',          text: "End with your <b>Daily Discipline Score</b>. This one honest number is what powers your insights." },
      { txt: 'Insights',                    text: "Now the payoff. Tap <b>Insights</b> — where MPS connects the dots.", click: true },
      { sel: '[data-tour="perf"]',          text: "<b>Performance Insights</b> — MPS shows the exact behaviors behind your best days, and coaches you on what to repeat." }
    ],
    nutrition: [
      { sel: '.meal-head .add',             text: "Tap <b>+ Add Food</b> to log what you ate — search the built-in food list.", click: true },
      { sel: '.donut-wrap',                 text: "This ring is your <b>daily score</b> — protein, carbs, calories &amp; water. Tap it for the full breakdown.", click: true },
      { sel: '#datePick',                   text: "Use the <b>date picker</b> to log or review any day.", click: false },
      { center: true,                       text: "That's it — hit your numbers each day and the score takes care of itself.", click: false }
    ]
  };

  function appKey() { var m = (location.pathname || '').match(/\/apps\/([^\/]+)/); return m ? m[1] : null; }

  var els = {}, steps = [], idx = 0, target = null, clickHook = null, centerMode = false, panning = false;

  // Find the element that actually scrolls (apps often scroll an inner container, not the
  // document — scrolling the wrong one just "glitches in place"). Picks the biggest scrollable.
  function findScroller() {
    var doc = document.scrollingElement || document.documentElement;
    var best = doc, bestMax = Math.max(0, (doc.scrollHeight - doc.clientHeight) || 0);
    var nodes = document.querySelectorAll('div,main,section,[class*="scroll"],[class*="content"],[class*="tab"],[id*="tab"]');
    for (var i = 0; i < nodes.length && i < 4000; i++) {
      var el = nodes[i];
      if (el.clientHeight < 200) continue;
      var max = el.scrollHeight - el.clientHeight;
      if (max > bestMax + 30) {
        var oy = getComputedStyle(el).overflowY;
        if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') { best = el; bestMax = max; }
      }
    }
    return best;
  }

  function mk(css) { var e = document.createElement('div'); e.style.cssText = css; document.body.appendChild(e); return e; }
  function setBox(e, x, y, w, h) { e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.width = Math.max(0, w) + 'px'; e.style.height = Math.max(0, h) + 'px'; }

  function resolve(step) {
    if (step.txt) {
      var tag = step.txtTag || 'button', want = step.txt.trim().toLowerCase();
      var nodes = document.querySelectorAll(tag);
      for (var i = 0; i < nodes.length; i++) {
        var t = (nodes[i].textContent || '').trim().toLowerCase();
        if (t === want && nodes[i].offsetParent !== null) return nodes[i];
      }
    }
    if (step.sel) { var e = document.querySelector(step.sel); if (e) return e; }
    return null;
  }

  function build() {
    var panel = 'position:fixed;z-index:2147483600;background:rgba(8,8,8,0.74);';
    els.top = mk(panel); els.bottom = mk(panel); els.left = mk(panel); els.right = mk(panel);
    [els.top, els.bottom, els.left, els.right].forEach(function (p) {
      p.addEventListener('click', function (ev) { ev.stopPropagation(); ev.preventDefault(); }, true);
    });
    els.ring = mk('position:fixed;z-index:2147483601;border:2px solid #ffffff;border-radius:10px;box-shadow:0 0 0 3px rgba(255,255,255,0.30),0 0 22px rgba(255,255,255,0.55);pointer-events:none;transition:left .25s ease,top .25s ease,width .25s ease,height .25s ease;');
    els.tip = mk('position:fixed;z-index:2147483602;width:300px;max-width:calc(100vw - 24px);background:linear-gradient(180deg,#1c1b17,#0e0e0e);border:1px solid rgba(201,160,32,0.45);border-radius:14px;padding:15px 16px 14px;box-shadow:0 16px 44px rgba(0,0,0,0.7);font-family:Inter,system-ui,-apple-system,sans-serif;color:#ededed;');
    els.tip.innerHTML =
        '<div id="mpst-count" style="font-family:\'Bebas Neue\',sans-serif;letter-spacing:.12em;font-size:.66rem;color:#C9A020;margin-bottom:5px;"></div>'
      + '<div id="mpst-text" style="font-size:.92rem;line-height:1.45;margin-bottom:12px;"></div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">'
      +   '<button id="mpst-skip" style="background:none;border:none;color:#8a8a8a;font-size:.78rem;cursor:pointer;padding:4px 2px;">Skip tour</button>'
      +   '<button id="mpst-next" style="background:#C9A020;color:#0a0a0a;border:none;border-radius:9px;padding:8px 18px;font-weight:800;font-size:.82rem;letter-spacing:.04em;cursor:pointer;">Next</button>'
      + '</div>';
    els.tip.querySelector('#mpst-skip').addEventListener('click', end);
    els.tip.querySelector('#mpst-next').addEventListener('click', next);
  }

  function place() {
    if (!els.top || panning) return;
    var W = window.innerWidth, H = window.innerHeight;
    if (centerMode || !target) {
      setBox(els.top, 0, 0, W, H); setBox(els.bottom, 0, 0, 0, 0); setBox(els.left, 0, 0, 0, 0); setBox(els.right, 0, 0, 0, 0);
      els.ring.style.width = '0'; els.ring.style.height = '0';
      var tw = els.tip.offsetWidth || 300, th = els.tip.offsetHeight || 150;
      els.tip.style.left = Math.max(12, (W - tw) / 2) + 'px';
      els.tip.style.top = Math.max(12, (H - th) / 2) + 'px';
      return;
    }
    var r = target.getBoundingClientRect(), pad = 6;
    var x = r.left - pad, y = r.top - pad, w = r.width + pad * 2, h = r.height + pad * 2;
    setBox(els.top, 0, 0, W, y);
    setBox(els.bottom, 0, y + h, W, H - (y + h));
    setBox(els.left, 0, y, x, h);
    setBox(els.right, x + w, y, W - (x + w), h);
    setBox(els.ring, x, y, w, h);
    var tipH = els.tip.offsetHeight || 150;
    var below = (y + h + 12 + tipH) <= H;
    els.tip.style.top = (below ? (y + h + 12) : Math.max(12, y - 12 - tipH)) + 'px';
    els.tip.style.left = Math.min(Math.max(12, r.left), W - (els.tip.offsetWidth || 300) - 12) + 'px';
  }

  function clearHook() { if (clickHook) { document.removeEventListener('click', clickHook, true); clickHook = null; } }

  // A "pan" step: no spotlight — slowly auto-scroll the whole screen top→bottom so the user
  // watches their (sample) data scroll by, then advance. Moderate speed: readable, not slow.
  function panStep(i, step) {
    panning = true; centerMode = true; target = null;
    setBox(els.top, 0, 0, 0, 0); setBox(els.bottom, 0, 0, 0, 0); setBox(els.left, 0, 0, 0, 0); setBox(els.right, 0, 0, 0, 0);
    els.ring.style.width = '0'; els.ring.style.height = '0';
    els.tip.querySelector('#mpst-count').textContent = 'STEP ' + (i + 1) + ' OF ' + steps.length;
    els.tip.querySelector('#mpst-text').innerHTML = step.text;
    els.tip.querySelector('#mpst-next').style.display = 'none';
    var tw = els.tip.offsetWidth || 300, th = els.tip.offsetHeight || 120;
    els.tip.style.left = Math.max(12, (window.innerWidth - tw) / 2) + 'px';
    els.tip.style.top = (window.innerHeight - th - 18) + 'px';
    var se = findScroller();
    try { se.scrollTop = 0; } catch (e) {}
    var max = Math.max(0, se.scrollHeight - se.clientHeight);
    var done = function () { panning = false; if (idx === i) next(); };
    if (max < 30) return setTimeout(done, 1900);
    var dur = Math.min(9000, Math.max(5000, max * 8)), t0 = null;
    function frame(ts) {
      if (idx !== i || !els.top) { panning = false; return; }
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      se.scrollTop = max * p;
      if (p < 1) requestAnimationFrame(frame); else setTimeout(done, 800);
    }
    requestAnimationFrame(frame);
  }

  function show(i) {
    idx = i;
    var step = steps[i];
    if (!step) return end();
    clearHook();
    if (step.pan) return panStep(i, step);
    panning = false;
    centerMode = !!step.center;
    target = centerMode ? null : resolve(step);
    if (!centerMode && !target) {   // element not ready (e.g. a tab just switched) — wait, then skip if still gone
      return setTimeout(function () { target = resolve(step); if (!target) return next(); show(i); }, 500);
    }
    if (target) { try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }
    els.tip.querySelector('#mpst-count').textContent = 'STEP ' + (i + 1) + ' OF ' + steps.length;
    els.tip.querySelector('#mpst-text').innerHTML = step.text;
    var nextBtn = els.tip.querySelector('#mpst-next');
    if (step.click && target) {
      nextBtn.style.display = 'none';
      clickHook = function (ev) {
        if (target && (ev.target === target || target.contains(ev.target))) { clearHook(); setTimeout(next, 380); }
      };
      document.addEventListener('click', clickHook, true);
    } else {
      nextBtn.style.display = '';
      nextBtn.textContent = (i === steps.length - 1) ? 'Done' : 'Next';
    }
    setTimeout(place, 90);
  }

  function next() { if (idx + 1 >= steps.length) return end(); show(idx + 1); }

  function end() {
    clearHook();
    window.removeEventListener('scroll', place, true);
    window.removeEventListener('resize', place);
    ['top', 'bottom', 'left', 'right', 'ring', 'tip'].forEach(function (k) { if (els[k] && els[k].parentNode) els[k].parentNode.removeChild(els[k]); });
    els = {}; target = null; panning = false;
    try { localStorage.setItem('mps_tour_' + (appKey() || 'app'), '1'); } catch (e) {}
    // tell the hub the tour is over so it can wipe the sample data + reset the app to empty
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'mps-tour-done', app: appKey() }, '*'); } catch (e) {}
  }

  window.startMpsTour = function () {
    var key = appKey(), list = key && TOURS[key];
    if (!list || !list.length) return;
    if (els.top) return;   // already running
    steps = list; idx = 0;
    build();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    show(0);
  };
})();
