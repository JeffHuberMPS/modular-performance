/* ============================================================
   MPS CLOSED BETA — tester funnel
   Welcome (day 1) → Survey (day 4) → Congrats + referral → Access pulled (day 7, no survey)
   localStorage drives the tester UX (works instantly, no infra). Firestore records each
   tester for the owner dashboard (activates once firestore.rules are published + beta_meta/counter seeded).
   Preview any popup: add ?betatest=welcome|survey|congrats|pulled to the hub URL.
   ============================================================ */
(function () {
  'use strict';
  var BETA_CODE = 'mps-beta-2026';
  function isBeta() { try { return localStorage.getItem('mps_beta') === BETA_CODE; } catch (e) { return false; } }
  if (!isBeta()) return;

  function g(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function s(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var start = parseInt(g('mps_beta_start') || '0', 10);
  if (!start) { start = Date.now(); s('mps_beta_start', String(start)); }
  function dayNum() { return Math.floor((Date.now() - start) / 86400000); }
  var refcode = g('mps_beta_refcode');
  if (!refcode) { refcode = Math.random().toString(36).slice(2, 8).toUpperCase(); s('mps_beta_refcode', refcode); }
  var refLink = 'modular-performance.com/?beta=' + BETA_CODE + '&ref=referral&from=' + refcode;

  var test = null; try { test = new URLSearchParams(location.search).get('betatest'); } catch (e) {}

  /* ---------- styles ---------- */
  var css = ''
    + '.beta-ov{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(3,3,4,.82);backdrop-filter:blur(3px);overflow:auto;}'
    + '.beta-card{width:100%;max-width:440px;border-radius:20px;padding:30px 26px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.7);font-family:"Inter",system-ui,sans-serif;}'
    + '.beta-dark{background:linear-gradient(170deg,#161616,#0a0a0a);border:1px solid rgba(201,160,32,.32);color:#e8e8e8;}'
    + '.beta-white{background:#f7f6f2;border:1px solid #e3e0d6;color:#1a1a1a;text-align:left;max-width:480px;max-height:88vh;overflow:auto;}'
    + '.beta-ico{width:46px;height:46px;margin:0 auto 14px;display:block;}'
    + '.beta-eyebrow{font-family:"Bebas Neue",sans-serif;letter-spacing:.22em;font-size:.8rem;color:#C9A020;text-transform:uppercase;}'
    + '.beta-h{font-family:"Saira Condensed","Bebas Neue",sans-serif;font-style:italic;font-weight:900;font-size:1.85rem;line-height:1.05;margin:8px 0 12px;color:#fff;}'
    + '.beta-h .gold{color:#C9A020;}'
    + '.beta-p{font-size:.95rem;line-height:1.55;color:#c4c4c4;margin:0 0 12px;}'
    + '.beta-p b{color:#fff;} .beta-p .gold{color:#C9A020;}'
    + '.beta-btn{display:inline-block;width:100%;margin-top:14px;padding:15px;border:none;border-radius:12px;font-family:"Bebas Neue",sans-serif;letter-spacing:.06em;font-size:1.05rem;cursor:pointer;background:linear-gradient(105deg,#5C4000,#C9A020 30%,#F5E060 55%,#C9A020 78%,#5C4000);color:#1a1505;font-weight:700;}'
    + '.beta-link{font-family:monospace;font-size:.82rem;color:#C9A020;background:#0d0d0d;border:1px solid rgba(201,160,32,.3);border-radius:10px;padding:12px;margin:14px 0 0;word-break:break-all;}'
    /* survey (white) */
    + '.beta-white .beta-h{color:#1a1a1a;} .beta-white .beta-h .gold{color:#b07d12;}'
    + '.beta-sub{font-size:.92rem;color:#6a6a6a;margin:2px 0 6px;}'
    + '.beta-sec{font-family:"Bebas Neue",sans-serif;letter-spacing:.14em;font-size:.78rem;text-transform:uppercase;margin:22px 0 10px;}'
    + '.beta-sec.s1{color:#b07d12;} .beta-sec.s2{color:#b07d12;} .beta-sec.s3{color:#a14a2a;} .beta-sec.s4{color:#2e7d32;}'
    + '.beta-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #ece9e0;}'
    + '.beta-row label{font-size:.92rem;font-weight:600;color:#222;}'
    + '.beta-stars{font-size:1.25rem;color:#d9c9a0;letter-spacing:2px;cursor:pointer;user-select:none;}'
    + '.beta-stars b{color:#e0a92a;font-weight:400;}'
    + '.beta-plans{display:flex;gap:8px;}'
    + '.beta-plan{flex:1;padding:11px 0;text-align:center;border:1px solid #d8d4c6;border-radius:10px;background:#fff;cursor:pointer;font-weight:700;font-size:.9rem;color:#333;}'
    + '.beta-plan.sel{border-color:#C9A020;background:#fbf3da;color:#7a5600;}'
    + '.beta-in{width:100%;box-sizing:border-box;margin-top:9px;padding:12px;border:1px solid #ddd9cd;border-radius:10px;font-size:.9rem;background:#fff;color:#222;font-family:inherit;}'
    + '.beta-in::placeholder{color:#a39e8e;}'
    + '.beta-submit{width:100%;margin-top:20px;padding:16px;border:none;border-radius:12px;font-family:"Bebas Neue",sans-serif;letter-spacing:.05em;font-size:1.1rem;cursor:pointer;background:#141414;color:#F5E060;font-weight:700;}'
    + '.beta-close{position:absolute;top:14px;right:16px;color:#888;font-size:1.4rem;cursor:pointer;background:none;border:none;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ICON_SPARK = '<svg class="beta-ico" viewBox="0 0 24 24" fill="none" stroke="#C9A020" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/><circle cx="12" cy="12" r="2.4"/></svg>';
  var ICON_LOCK = '<svg class="beta-ico" viewBox="0 0 24 24" fill="none" stroke="#e0564f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:52px;height:52px;"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

  function overlay(inner, white, allowClose) {
    var ov = document.createElement('div'); ov.className = 'beta-ov';
    ov.innerHTML = '<div class="beta-card ' + (white ? 'beta-white' : 'beta-dark') + '" style="position:relative;">' + (allowClose ? '<button class="beta-close">×</button>' : '') + inner + '</div>';
    document.body.appendChild(ov);
    if (allowClose) ov.querySelector('.beta-close').onclick = function () { ov.remove(); };
    return ov;
  }

  /* ---------- 1. WELCOME ---------- */
  function welcome() {
    var ov = overlay(
      '<div class="beta-eyebrow">You’re in the beta</div>'
      + '<div class="beta-h">Free <span class="gold">MPS Premium</span> — here’s the deal</div>'
      + '<p class="beta-p">Use the whole app free for a few days. No card.</p>'
      + '<p class="beta-p"><b>Day 4, a quick survey pops up. Finish it → <span class="gold">yours for life</span>. Skip it → access ends.</b></p>'
      + '<p class="beta-p" style="font-size:.82rem;color:#9a9a9a;margin-bottom:2px;">Premium in exchange for honest feedback. That’s the trade.</p>'
      + '<button class="beta-btn" id="beta-go">Got it — start exploring</button>', false, false);
    ov.querySelector('#beta-go').onclick = function () { ov.remove(); };
  }

  /* ---------- 2. SURVEY ---------- */
  function survey() {
    var crit = ['Ease of use', 'Look & feel', 'Usefulness', 'Worth the price', 'Overall'];
    var rows = crit.map(function (c, i) {
      return '<div class="beta-row"><label>' + c + '</label><span class="beta-stars" data-crit="' + i + '" data-val="0">☆☆☆☆☆</span></div>';
    }).join('');
    var ov = overlay(
      '<div class="beta-h">Lock in your access</div>'
      + '<div class="beta-sub">A few taps, a few honest words, and Premium is yours forever.</div>'
      + '<div class="beta-sec s1">Rate MPS</div>' + rows
      + '<div class="beta-sec s2">Pricing</div>'
      + '<div style="font-weight:600;font-size:.92rem;margin-bottom:8px;color:#222;">Which plan would you actually pay for?</div>'
      + '<div class="beta-plans"><div class="beta-plan" data-plan="free">Free</div><div class="beta-plan" data-plan="elite">Elite</div><div class="beta-plan" data-plan="premium">Premium</div></div>'
      + '<input class="beta-in" id="b-price" placeholder="What price feels fair?  e.g. $19/mo">'
      + '<div class="beta-sec s3">What we could do better</div>'
      + '<input class="beta-in" id="b-change" placeholder="If you could change ONE thing?">'
      + '<input class="beta-in" id="b-stop" placeholder="What almost made you stop using it?">'
      + '<input class="beta-in" id="b-add" placeholder="One feature you’d love to see added?">'
      + '<div class="beta-sec s4">What you loved · finish strong</div>'
      + '<input class="beta-in" id="b-like" placeholder="What did you like most?">'
      + '<input class="beta-in" id="b-keep" placeholder="What makes you want to keep using it?">'
      + '<button class="beta-submit" id="b-submit">Submit & keep Premium for life</button>', true, false);

    ov.querySelectorAll('.beta-stars').forEach(function (el) {
      el.onclick = function (e) {
        var rect = el.getBoundingClientRect();
        var v = Math.max(1, Math.min(5, Math.ceil((e.clientX - rect.left) / (rect.width / 5))));
        el.dataset.val = v;
        el.innerHTML = '<b>' + '★'.repeat(v) + '</b>' + '☆'.repeat(5 - v);
      };
    });
    var plan = '';
    ov.querySelectorAll('.beta-plan').forEach(function (el) {
      el.onclick = function () { ov.querySelectorAll('.beta-plan').forEach(function (p) { p.classList.remove('sel'); }); el.classList.add('sel'); plan = el.dataset.plan; };
    });
    ov.querySelector('#b-submit').onclick = function () {
      var ratings = {}; ov.querySelectorAll('.beta-stars').forEach(function (el) { ratings[crit[el.dataset.crit]] = parseInt(el.dataset.val, 10) || 0; });
      var data = {
        ratings: ratings, planChoice: plan,
        fairPrice: (ov.querySelector('#b-price').value || '').trim(),
        changeOne: (ov.querySelector('#b-change').value || '').trim(),
        almostStop: (ov.querySelector('#b-stop').value || '').trim(),
        featureAdd: (ov.querySelector('#b-add').value || '').trim(),
        likedMost: (ov.querySelector('#b-like').value || '').trim(),
        keepUsing: (ov.querySelector('#b-keep').value || '').trim()
      };
      s('mps_beta_survey_done', '1'); s('mps_beta_lifetime', '1');
      saveSurvey(data);
      ov.remove(); congrats();
    };
  }

  /* ---------- 3. CONGRATS ---------- */
  function congrats() {
    var ov = overlay(
      '<div class="beta-eyebrow">Congratulations</div>'
      + '<div class="beta-h">Premium is <span class="gold">yours for life</span></div>'
      + '<div class="beta-h" style="font-size:1.4rem;margin-top:14px;">Now send it to <span class="gold">one person.</span></div>'
      + '<p class="beta-p">You earned 1 invite. Make it count.</p>'
      + '<div class="beta-link" id="beta-reflink">' + refLink + '</div>'
      + '<button class="beta-btn" id="beta-copy">Copy & send</button>', false, true);
    ov.querySelector('#beta-copy').onclick = function () {
      try { navigator.clipboard.writeText('https://' + refLink); } catch (e) {}
      this.textContent = 'Copied ✓';
    };
  }

  /* ---------- 4. ACCESS PULLED ---------- */
  function accessPulled() {
    var ov = overlay(
      ICON_LOCK
      + '<div class="beta-h">Your beta has ended</div>'
      + '<p class="beta-p">The survey wasn’t finished by day 7, so free Premium has turned off. No hard feelings — you can grab it any time.</p>'
      + '<button class="beta-btn" id="beta-price">See pricing</button>', false, false);
    ov.querySelector('#beta-price').onclick = function () { location.href = '/landing.html#pricing'; };
  }

  /* ---------- Firestore (dormant-safe) ---------- */
  function db() { try { return firebase.firestore(); } catch (e) { return null; } }
  function user() { try { return firebase.auth().currentUser; } catch (e) { return null; } }
  function key() { var u = user(); var id = (u && (u.email || u.uid)) || ''; return id.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 80); }

  // Test accounts: never written to the live dashboard, so Jeff can run the funnel over and
  // over without polluting real metrics. Matches: the owner email, any Gmail "+test" alias of
  // it (e.g. jeffreyhuber86+test3@gmail.com), and anything @mps.test.
  function isTestUser() {
    var u = user(); var e = (u && u.email || '').toLowerCase();
    return e === 'jeffreyhuber86@gmail.com'
      || /^jeffreyhuber86\+.*@gmail\.com$/.test(e)
      || /@mps\.test$/.test(e);
  }

  function record() {
    if (g('mps_beta_recorded') === '1') return;
    if (isTestUser()) return;   // test runs don't touch the metrics dashboard
    var d = db(), u = user(); if (!d || !u) return;
    var ref = d.collection('beta_signups').doc(key());
    ref.get().then(function (snap) {
      if (snap.exists) { s('mps_beta_recorded', '1'); return; }
      var counter = d.collection('beta_meta').doc('counter');
      return d.runTransaction(function (tx) {
        return tx.get(counter).then(function (c) {
          if (c.exists) tx.update(counter, { count: (c.data().count || 0) + 1 });
          tx.set(ref, {
            name: u.displayName || (u.email || '').split('@')[0],
            email: u.email || '',
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
            betaStart: start, betaExpiry: start + 7 * 86400000,
            invitedBy: g('mps_beta_from') || g('mps_beta_ref') || 'direct',
            surveyCompleted: false, lifetime: false
          });
        });
      }).then(function () { s('mps_beta_recorded', '1'); });
    }).catch(function () { /* rules not published yet — harmless */ });
  }

  function saveSurvey(data) {
    var d = db(); if (!d) return;
    d.collection('beta_signups').doc(key()).set({
      surveyCompleted: true,
      surveyDate: firebase.firestore.FieldValue.serverTimestamp(),
      lifetime: true,
      survey: data,
      rating: (data.ratings && data.ratings['Overall']) || 0
    }, { merge: true }).catch(function () {});
  }

  /* ---------- flow ---------- */
  function run() {
    record();
    if (test === 'welcome') return welcome();
    if (test === 'survey') return survey();
    if (test === 'congrats') return congrats();
    if (test === 'pulled') return accessPulled();

    var lifetime = g('mps_beta_lifetime') === '1';
    var surveyDone = g('mps_beta_survey_done') === '1';
    if (!lifetime && dayNum() >= 7) return accessPulled();
    if (g('mps_beta_welcomed') !== '1') { s('mps_beta_welcomed', '1'); return welcome(); }
    if (!surveyDone && dayNum() >= 4) return survey();
  }

  if (window.firebase && firebase.auth) {
    firebase.auth().onAuthStateChanged(function (u) { if (u) setTimeout(run, 700); });
  } else { setTimeout(run, 1200); }
})();
