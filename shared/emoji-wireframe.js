/* ============================================================
   MPS Emoji → Wireframe converter
   Drop-in: <script src="/shared/emoji-wireframe.js" defer></script>
   Scans the page and replaces any DISPLAYED emoji with a matching
   Tabler line icon, so user-added emojis stay on-theme (wireframe).
   - Conservative: only converts text nodes that are JUST an emoji
     (won't touch sentences), and never inputs/textareas — so editing
     still shows the real emoji and React isn't disrupted mid-text.
   - A MutationObserver keeps converting content the app re-renders.
   - Emojis with no line-icon match fall back to a clean wireframe dot,
     so nothing ever renders as a cartoon glyph.
   ============================================================ */
(function () {
  'use strict';

  // Tabler icon webfont (the wireframe set MPS already uses).
  if (!document.getElementById('mps-tabler-font')) {
    var link = document.createElement('link');
    link.id = 'mps-tabler-font';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.7.0/dist/tabler-icons.min.css';
    document.head.appendChild(link);
  }
  if (!document.getElementById('mps-emoji-style')) {
    var st = document.createElement('style');
    st.id = 'mps-emoji-style';
    st.textContent = '.mps-emoji-ico{font-family:"tabler-icons"!important;font-style:normal!important;font-weight:400!important;line-height:1;display:inline-block;vertical-align:-0.12em;}';
    document.head.appendChild(st);
  }

  // emoji → Tabler icon name. Only confident matches are listed; everything
  // else uses FALLBACK so an unknown name never renders blank.
  var MAP = {
    '🔥':'flame','📖':'book','📕':'book','📗':'book','📘':'book','📚':'books','📓':'notebook','🧠':'brain',
    '🎓':'school','📡':'antenna','🎸':'guitar-pick','🎵':'music','🎶':'music','🎧':'headphones','🥁':'music',
    '🛌':'bed','😴':'bed','🛏':'bed','🌅':'sunrise','🌄':'sunrise','💼':'briefcase','🌙':'moon','🌛':'moon','🌜':'moon',
    '✨':'sparkles','⭐':'star','🌟':'star','📊':'chart-bar','📈':'trending-up','📉':'trending-down','🏆':'trophy','🥇':'medal',
    '💪':'barbell','🏋️':'barbell','🏋':'barbell','🤸':'stretching','🧘':'yoga','🏃':'run','🚶':'walk','🚴':'bike','🏊':'swimming',
    '❄️':'snowflake','❄':'snowflake','🌬️':'wind','🌬':'wind','♟️':'chess','♟':'chess','⚙️':'settings','⚙':'settings',
    '✍️':'pencil','✍':'pencil','📝':'note','✏️':'pencil','🖊':'pen','💧':'droplet','💦':'droplet','☀️':'sun','☀':'sun',
    '❤️':'heart','❤':'heart','🧡':'heart','💛':'heart','💚':'heart','💙':'heart','💜':'heart','🎯':'target','☕':'coffee',
    '💊':'pill','💰':'coin','💵':'cash','💸':'cash','🪙':'coin','📱':'device-mobile','💻':'device-laptop','📷':'camera',
    '✅':'checkbox','☑️':'checkbox','📅':'calendar','🗓':'calendar','⏰':'clock','⏱':'clock','📌':'pin','🔔':'bell',
    '🙏':'hand-stop','🤝':'hand-stop','👍':'thumb-up','👎':'thumb-down','🧹':'... ','🚭':'... ',
    // food / nutrition
    '🍗':'meat','🍖':'meat','🥩':'meat','🍳':'egg','🥚':'egg','🥛':'milk','🥤':'cup','🧋':'cup','🍵':'cup',
    '🐟':'fish','🐠':'fish','🍣':'fish','🍤':'fish','🍚':'bowl','🍙':'bowl','🍜':'bowl','🥣':'bowl','🍲':'bowl',
    '🍞':'bread','🥖':'bread','🥐':'bread','🥗':'salad','🥦':'plant-2','🥬':'plant-2','🌱':'plant-2','🫑':'pepper','🌶':'pepper',
    '🥕':'carrot','🍎':'apple','🍏':'apple','🧀':'cheese','🥜':'seeding','🍴':'tools-kitchen-2','🍽️':'tools-kitchen-2','🍽':'tools-kitchen-2',
    '🔒':'lock','🔓':'lock-open','📍':'map-pin','🗺':'map','🧭':'compass','🏁':'flag','🚩':'flag','🏴':'flag'
  };
  var FALLBACK = 'point-filled';

  function iconName(emoji) {
    var n = MAP[emoji];
    if (n && n.indexOf('.') === 0) n = null;   // placeholder = no good match
    return n || FALLBACK;
  }

  // matches a single emoji (with optional variation selector / ZWJ sequences)
  var ONE = '\\p{Extended_Pictographic}(\\uFE0F|\\uFE0E)?(\\u200D\\p{Extended_Pictographic}(\\uFE0F|\\uFE0E)?)*';
  var ALL_EMOJI = new RegExp('^(\\s*(' + ONE + ')\\s*)+$', 'u');     // text node that is ONLY emoji(s)
  var SPLIT = new RegExp('(' + ONE + ')', 'gu');

  function skip(node) {
    var p = node.parentNode;
    while (p && p.nodeType === 1) {
      var tag = p.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'SCRIPT' || tag === 'STYLE') return true;
      if (p.isContentEditable) return true;
      if (p.classList && p.classList.contains('mps-emoji-wrap')) return true;
      p = p.parentNode;
    }
    return false;
  }

  function convertTextNode(tn) {
    var text = tn.nodeValue;
    if (!text || !ALL_EMOJI.test(text)) return;   // only pure-emoji nodes (safe; won't split sentences)
    if (skip(tn)) return;
    var span = document.createElement('span');
    span.className = 'mps-emoji-wrap';
    var html = '', m, last = 0;
    SPLIT.lastIndex = 0;
    while ((m = SPLIT.exec(text)) !== null) {
      html += escapeText(text.slice(last, m.index));
      html += '<i class="ti ti-' + iconName(m[1]) + ' mps-emoji-ico" aria-hidden="true"></i>';
      last = m.index + m[1].length;
    }
    html += escapeText(text.slice(last));
    span.innerHTML = html;
    try { tn.parentNode.replaceChild(span, tn); } catch (e) {}
  }
  function escapeText(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function scan(root) {
    try {
      var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null);
      var batch = [], n;
      while ((n = walker.nextNode())) batch.push(n);
      batch.forEach(convertTextNode);
    } catch (e) {}
  }

  var pending = false;
  function schedule() {
    if (pending) return; pending = true;
    setTimeout(function () { pending = false; scan(document.body); }, 120);
  }

  function start() {
    scan(document.body);
    try {
      new MutationObserver(function () { schedule(); })
        .observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
