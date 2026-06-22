/* ───────────────────────────────────────────────────────────────────────────
   MPS — Install Prompt
   Turns the PWA into a "real app" people actually install.

   • Android / Chrome / Edge / desktop: captures the browser's native install
     event (beforeinstallprompt) and shows a branded banner whose button fires
     the real OS install dialog.
   • iPhone / iPad (Safari): there is NO native install event, so we show the
     exact manual steps — tap the Share button, then "Add to Home Screen".
   • Already installed (running standalone): never shows.
   • Dismissed: snoozes for a week so it is never naggy.

   Self-contained: injects its own styles, no dependencies. Just include
   <script src="/shared/install-prompt.js" defer></script> on any page.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // ── Don't show if the app is already installed / launched from home screen ──
  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true || // iOS Safari
    document.referrer.indexOf('android-app://') === 0;
  if (isStandalone) return;

  // ── Don't nag: snooze for a week after a dismissal ──
  var DISMISS_KEY = 'mps_install_dismissed_at';
  var SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
  try {
    var last = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
    if (last && Date.now() - last < SNOOZE_MS) return;
  } catch (e) { /* localStorage may be blocked; carry on */ }

  // ── Platform detection ──
  var ua = navigator.userAgent || '';
  var isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (/Macintosh/.test(ua) && typeof document.ontouchend !== 'undefined'); // iPadOS reports as Mac
  // On iOS, only Safari can add to the home screen — don't mislead Chrome/Firefox users there.
  var isIOSSafari = isIOS && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);

  var deferredPrompt = null; // the captured Android/Chrome install event

  // ── Styles (brand: black / gold) ──
  var css =
    '#mps-install{position:fixed;left:50%;bottom:16px;transform:translateX(-50%) translateY(140%);' +
    'width:calc(100% - 24px);max-width:440px;z-index:99990;opacity:0;' +
    'transition:transform .45s cubic-bezier(.16,1,.3,1),opacity .45s ease;' +
    'font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}' +
    '#mps-install.show{transform:translateX(-50%) translateY(0);opacity:1;}' +
    '#mps-install .mi-card{display:flex;align-items:center;gap:13px;padding:13px 14px;' +
    'background:linear-gradient(180deg,#1b1810 0%,#0c0c0c 100%);' +
    'border:1px solid rgba(201,160,32,.45);border-radius:16px;' +
    'box-shadow:0 14px 40px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06);}' +
    '#mps-install .mi-icon{width:46px;height:46px;border-radius:12px;flex:0 0 auto;' +
    'box-shadow:0 2px 8px rgba(0,0,0,.5);}' +
    '#mps-install .mi-txt{flex:1 1 auto;min-width:0;}' +
    '#mps-install .mi-title{font-size:.95rem;font-weight:700;color:#fff;line-height:1.2;}' +
    '#mps-install .mi-sub{font-size:.76rem;color:#b9b09a;line-height:1.35;margin-top:2px;}' +
    '#mps-install .mi-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto;}' +
    '#mps-install .mi-install{font-family:inherit;font-size:.82rem;font-weight:700;color:#1a1505;' +
    'background:linear-gradient(180deg,#e2c04a,#c49a1c);border:1px solid rgba(201,160,32,.7);' +
    'padding:9px 15px;border-radius:10px;cursor:pointer;white-space:nowrap;' +
    'box-shadow:0 2px 10px rgba(201,160,32,.35),inset 0 1px 0 rgba(255,255,255,.35);}' +
    '#mps-install .mi-install:hover{filter:brightness(1.08);}' +
    '#mps-install .mi-close{font-family:inherit;font-size:1.2rem;line-height:1;color:#777;' +
    'background:none;border:none;padding:4px 6px;cursor:pointer;}' +
    '#mps-install .mi-close:hover{color:#bbb;}' +
    /* iOS instruction sheet */
    '#mps-install .mi-ios{margin-top:10px;padding-top:11px;border-top:1px solid rgba(255,255,255,.09);' +
    'font-size:.82rem;color:#d8d2c4;line-height:1.5;display:none;}' +
    '#mps-install.ios-open .mi-ios{display:block;}' +
    '#mps-install .mi-ios b{color:#fff;}' +
    '#mps-install .mi-share{display:inline-block;vertical-align:-3px;margin:0 2px;}';

  var style = document.createElement('style');
  style.textContent = css;

  // ── Banner DOM ──
  var bar = document.createElement('div');
  bar.id = 'mps-install';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Install the MPS app');
  // iOS Share glyph (the square-with-up-arrow) so the steps are unmistakable.
  var shareSvg =
    '<svg class="mi-share" width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
    'stroke="#4ab3f4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 16V4M12 4l-4 4M12 4l4 4"/>' +
    '<path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>';

  bar.innerHTML =
    '<div class="mi-card">' +
    '<img class="mi-icon" src="/assets/icons/icon-192.png" alt="MPS" />' +
    '<div class="mi-txt">' +
    '<div class="mi-title">Install MPS</div>' +
    '<div class="mi-sub">Add the app to your home screen — one tap, works offline.</div>' +
    '</div>' +
    '<div class="mi-actions">' +
    '<button class="mi-install" type="button">Install</button>' +
    '<button class="mi-close" type="button" aria-label="Not now">&times;</button>' +
    '</div>' +
    '</div>' +
    '<div class="mi-ios">On your iPhone: tap the Share button ' + shareSvg +
    ' at the bottom of Safari, then choose <b>"Add to Home Screen"</b>.</div>';

  function mount() {
    if (!document.getElementById('mps-install')) {
      document.head.appendChild(style);
      document.body.appendChild(bar);
    }
  }

  function show() {
    mount();
    // next frame so the CSS transition plays
    requestAnimationFrame(function () { bar.classList.add('show'); });
  }

  function hide() {
    bar.classList.remove('show');
  }

  function dismiss() {
    hide();
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  }

  // ── Wire up buttons ──
  bar.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest && t.closest('.mi-close')) { dismiss(); return; }
    if (t.closest && t.closest('.mi-install')) {
      if (deferredPrompt) {
        // Android / Chrome / desktop: fire the real OS install dialog.
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () {
          deferredPrompt = null;
          hide();
        });
      } else if (isIOSSafari) {
        // iOS: reveal the manual steps (no programmatic install on iOS).
        bar.classList.add('ios-open');
        var btn = bar.querySelector('.mi-install');
        if (btn) btn.textContent = 'Got it';
        if (bar.classList.contains('ios-shown')) dismiss(); // second tap = done
        bar.classList.add('ios-shown');
      }
    }
  });

  // ── Android / Chrome / Edge / desktop: capture the install event ──
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); // stop Chrome's mini-infobar; we show our own banner
    deferredPrompt = e;
    show();
  });

  // ── iOS Safari: no event fires, so offer the manual route after a short beat ──
  if (isIOSSafari) {
    setTimeout(show, 2800);
  }

  // ── If they install (any platform), get out of the way and don't ask again ──
  window.addEventListener('appinstalled', function () {
    hide();
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  });
})();
