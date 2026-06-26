/* ── Wearable "Notify me" capture ───────────────────────────────────
   When a signed-in user taps "Notify me" on a device in the Recovery
   tracker, the app POSTs { email, devices } here. We drop them into
   MailerLite so Jeff can SEE real demand:
     • master group  "Wearable Interest"            (every interested user)
     • per-device     "Wearable Interest — <device>" (who wants which device)

   Open MailerLite → Subscribers → Groups to see the counts per device.

   Reuses MAILERLITE_API_KEY already set in Vercel (same key the Stripe
   webhook uses). Free. Never throws back to the app — a failure here must
   never break the tracker. */

const ML = 'https://connect.mailerlite.com/api';

// Get a group id by exact name, creating the group if it doesn't exist yet.
async function getOrCreateGroupId(apiKey, name) {
  const find = await fetch(ML + '/groups?limit=250', {
    headers: { Authorization: 'Bearer ' + apiKey, Accept: 'application/json' }
  });
  if (find.ok) {
    const data = await find.json();
    const grp = (data.data || []).find(
      g => (g.name || '').trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (grp) return grp.id;
  }
  const create = await fetch(ML + '/groups', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name: name })
  });
  if (!create.ok) throw new Error('group create failed (' + create.status + ') for "' + name + '"');
  const cd = await create.json();
  return cd.data.id;
}

module.exports = async (req, res) => {
  // Allow the app (incl. embedded iframe) to call this.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const email = String(body.email || '').trim();
    // Full list of devices the user currently has toggled on (names).
    let devices = Array.isArray(body.devices) ? body.devices : (body.device ? [body.device] : []);
    devices = devices.map(d => String(d || '').trim().slice(0, 60)).filter(Boolean).slice(0, 12);

    if (!email || email.indexOf('@') === -1) {
      return res.status(400).json({ ok: false, error: 'valid email required' });
    }

    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) {
      console.warn('[wearable-interest] MAILERLITE_API_KEY not set — skipping');
      return res.status(200).json({ ok: true, skipped: 'no api key' });
    }

    // master group + one group per selected device
    const groupIds = [await getOrCreateGroupId(apiKey, 'Wearable Interest')];
    for (const d of devices) {
      try { groupIds.push(await getOrCreateGroupId(apiKey, 'Wearable Interest — ' + d)); }
      catch (e) { console.error('[wearable-interest] ' + e.message); }
    }

    const sub = await fetch(ML + '/subscribers', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email, groups: groupIds })
    });
    if (!sub.ok) {
      const t = await sub.text();
      console.error('[wearable-interest] subscriber add failed', sub.status, t);
      return res.status(200).json({ ok: false, error: 'mailerlite ' + sub.status });
    }

    console.log('[wearable-interest] recorded', email, '→', devices.join(', ') || '(none)');
    return res.status(200).json({ ok: true, devices: devices });
  } catch (e) {
    console.error('[wearable-interest] error', e.message);
    return res.status(200).json({ ok: false, error: e.message });
  }
};
