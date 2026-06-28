/* ============================================================
   MPS Interactive App Tour
   Runs INSIDE a tracker app (same-origin iframe). The hub calls
   window.startMpsTour() right after the intro popup is dismissed.
   It darkens the screen, rings the exact element to tap, shows an
   instruction, and waits for the tap before moving to the next step.
   Steps are picked automatically from the app's URL (/apps/<name>/).
   ============================================================ */
(function () {
  'use strict';

  /* Per-app steps. sel = element to spotlight; text = instruction (HTML ok);
     click:true  → advance when the user actually taps that element;
     click:false → show a "Next" button instead. */
  var TOURS = {
    workout: [
      { sel: '.tab[data-tab="today"]',     text: "Start here — tap <b>Today</b> to open today's session.", click: true },
      { sel: '#add-split-btn',             text: "Tap <b>+ Add Split</b> to add your first lift, then pick the exercise.", click: true },
      { sel: '#end-workout',               text: "When you're done lifting, <b>End Workout &amp; Save</b> logs the whole session at once.", click: false },
      { sel: '.tab[data-tab="prs"]',       text: "Your <b>PRs</b> update here automatically every time you go heavier. Tap to look.", click: true },
      { sel: '.tab[data-tab="dashboard"]', text: "And your <b>Dashboard</b> tracks volume, streak &amp; progress over time. That's it — go log a set.", click: true }
    ]
  };

  function appKey() {
    var m = (location.pathname || '').match(/\/apps\/([^\/]+)/);
    return m ? m[1] : null;
  }

  var els = {}, steps = [], idx = 0, target = null, clickHook = null;

  function mk(css) { var e = document.createElement('div'); e.style.cssText = css; document.body.appendChild(e); return e; }
  function setBox(e, x, y, w, h) { e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.width = Math.max(0, w) + 'px'; e.style.height = Math.max(0, h) + 'px'; }

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
    if (!target || !els.top) return;
    var r = target.getBoundingClientRect(), pad = 6;
    var x = r.left - pad, y = r.top - pad, w = r.width + pad * 2, h = r.height + pad * 2;
    var W = window.innerWidth, H = window.innerHeight;
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
    target = document.querySelector(step.sel);
    if (!target) {   // element not ready yet (e.g. a tab just switched) — wait, then skip if still gone
      return setTimeout(function () { target = document.querySelector(step.sel); if (!target) return next(); show(i); }, 450);
    }
    try { target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    els.tip.querySelector('#mpst-count').textContent = 'STEP ' + (i + 1) + ' OF ' + steps.length;
    els.tip.querySelector('#mpst-text').innerHTML = step.text;
    var nextBtn = els.tip.querySelector('#mpst-next');
    clearHook();
    if (step.click) {
      nextBtn.style.display = 'none';
      clickHook = function (ev) {
        if (target && (ev.target === target || target.contains(ev.target))) {
          clearHook();
          setTimeout(next, 380);   // let the app react (switch tab / open picker) first
        }
      };
      document.addEventListener('click', clickHook, true);
    } else {
      nextBtn.style.display = '';
      nextBtn.textContent = (i === steps.length - 1) ? 'Done' : 'Next';
    }
    setTimeout(place, 80);
  }

  function next() { if (idx + 1 >= steps.length) return end(); show(idx + 1); }

  function end() {
    clearHook();
    window.removeEventListener('scroll', place, true);
    window.removeEventListener('resize', place);
    ['top', 'bottom', 'left', 'right', 'ring', 'tip'].forEach(function (k) {
      if (els[k] && els[k].parentNode) els[k].parentNode.removeChild(els[k]);
    });
    els = {};
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
