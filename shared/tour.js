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
      { sel: '.tab[data-tab="today"]',     text: "Start here — tap <b>Today</b> to open today's session.", click: true },
      { sel: '#add-split-btn',             text: "Tap <b>+ Add Split</b> to add your first lift, then pick the exercise.", click: true },
      { sel: '#end-workout',               text: "When you're done lifting, <b>End Workout &amp; Save</b> logs the whole session at once.", click: false },
      { sel: '.tab[data-tab="prs"]',       text: "Your <b>PRs</b> update here automatically every time you go heavier. Tap to look.", click: true },
      { sel: '.tab[data-tab="dashboard"]', text: "And your <b>Dashboard</b> tracks volume, streak &amp; progress over time. That's it — go log a set.", click: true }
    ],
    habits: [
      { txt: 'Track', sel: '.log-tab',     text: "Tap <b>Track</b> to pull up today's habits.", click: true },
      { center: true,                       text: "Check off each habit as you do it. Miss one and that day restarts — that's the point.", click: false },
      { txt: 'Save Entry',                  text: "Hit <b>Save Entry</b> to lock the day in.", click: true },
      { txt: 'Dashboard', sel: '.dashboard-tab', text: "Your <b>Dashboard</b> shows streaks and how each block is trending.", click: true },
      { txt: 'Compound', sel: '.compound-tab',   text: "And <b>Compound</b> shows your discipline stacking up over time. That's it.", click: true }
    ],
    sleep: [
      { txt: 'Log Entry',                   text: "Tap <b>Log Entry</b> to open today's check-in.", click: true },
      { center: true,                       text: "Set your <b>sleep &amp; wake times</b> and rate your energy, then <b>Save</b>. Your recovery score is figured out for you.", click: false },
      { txt: 'Dashboard',                   text: "Your <b>Dashboard</b> shows recovery, sleep hours and trends at a glance.", click: true },
      { txt: 'Insights',                    text: "And <b>Insights</b> tells you when to push and when rest IS the training. Done.", click: true }
    ],
    expenses: [
      { sel: '.tab[data-tab="log"]',       text: "<b>Log</b> is every expense, all in one place.", click: true },
      { sel: '.tab[data-tab="budget"]',    text: "Set your <b>Budget</b> — your monthly cap and recurring bills.", click: true },
      { sel: '.tab[data-tab="dashboard"]', text: "Your <b>Dashboard</b> shows exactly where every dollar went, by category.", click: true },
      { sel: '.tab[data-tab="insights"]',  text: "And <b>Insights</b> finds the leaks. That's the whole tracker.", click: true }
    ],
    journal: [
      { txt: 'Write',                       text: "<b>Write</b> is your daily entry — faith, wins, lessons.", click: true },
      { center: true,                       text: "Write your reflection, then tap <b>Save Entry</b>. Five minutes is all it takes.", click: false },
      { txt: 'History',                     text: "<b>History</b> keeps every past entry to look back on.", click: true },
      { txt: 'Check-In',                    text: "And <b>Check-In</b> is your weekly &amp; monthly review. Done.", click: true }
    ],
    nutrition: [
      { sel: '.meal-head .add',             text: "Tap <b>+ Add Food</b> to log what you ate — search the built-in food list.", click: true },
      { sel: '.donut-wrap',                 text: "This ring is your <b>daily score</b> — protein, carbs, calories &amp; water. Tap it for the full breakdown.", click: true },
      { sel: '#datePick',                   text: "Use the <b>date picker</b> to log or review any day.", click: false },
      { center: true,                       text: "That's it — hit your numbers each day and the score takes care of itself.", click: false }
    ]
  };

  function appKey() { var m = (location.pathname || '').match(/\/apps\/([^\/]+)/); return m ? m[1] : null; }

  var els = {}, steps = [], idx = 0, target = null, clickHook = null, centerMode = false;

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
    els.ring = mk('position:fixed;z-index:2147483601;border:2px solid #C9A020;border-radius:10px;box-shadow:0 0 0 3px rgba(201,160,32,0.30),0 0 22px rgba(201,160,32,0.55);pointer-events:none;transition:left .25s ease,top .25s ease,width .25s ease,height .25s ease;');
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
    if (!els.top) return;
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

  function show(i) {
    idx = i;
    var step = steps[i];
    if (!step) return end();
    clearHook();
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
    els = {}; target = null;
    try { localStorage.setItem('mps_tour_' + (appKey() || 'app'), '1'); } catch (e) {}
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
