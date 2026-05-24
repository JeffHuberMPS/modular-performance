// MPS Shared Components
// Reusable UI helpers used across all apps

window.MPS_UI = (function() {

  // ── Toast notification ──────────────────────────────────────
  let _toastTimeout = null;

  function toast(msg, type) {
    let el = document.getElementById('mps-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mps-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.borderLeftColor = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#FFC107';
    el.classList.add('show');
    if (_toastTimeout) clearTimeout(_toastTimeout);
    _toastTimeout = setTimeout(() => el.classList.remove('show'), 3000);
  }

  // ── Confirm overlay (no browser confirm()) ──────────────────
  function confirm(message, onYes, onNo) {
    const backdrop = document.createElement('div');
    backdrop.className = 'overlay-backdrop';
    backdrop.innerHTML = `
      <div class="overlay-sheet" style="padding:var(--space-2xl)">
        <p style="color:var(--text-primary);margin-bottom:var(--space-xl);font-size:15px">${message}</p>
        <div style="display:flex;gap:var(--space-md)">
          <button id="mps-confirm-yes" class="btn btn-danger" style="flex:1">Confirm</button>
          <button id="mps-confirm-no"  class="btn btn-ghost"  style="flex:1">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(backdrop);

    backdrop.querySelector('#mps-confirm-yes').addEventListener('click', () => {
      backdrop.remove();
      if (onYes) onYes();
    });
    backdrop.querySelector('#mps-confirm-no').addEventListener('click', () => {
      backdrop.remove();
      if (onNo) onNo();
    });
  }

  // ── Format date to YYYY-MM-DD ───────────────────────────────
  function dateStr(date) {
    const d = date || new Date();
    return d.toISOString().split('T')[0];
  }

  // ── Format date for display ─────────────────────────────────
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return { toast, confirm, dateStr, formatDate };
})();
