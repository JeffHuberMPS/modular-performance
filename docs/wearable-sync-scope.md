# Wearable Sync — Scope (what it would really take)

**Status:** NOT built. Manual biometric fields (resting HR, HRV, weight) ARE built into Recovery (Premium). This doc scopes *automatic* sync from a wearable.

## The core constraint
MPS is a **website** (runs in a browser / installed as a PWA). A website **cannot** read data straight off an Apple Watch / phone health app. That access is only granted to a **native app** installed from the App Store / Play Store. So "connect your Apple Watch" is impossible from the current web app — full stop. It would require building a real native app, which is a separate, much larger product.

The wearables that *do* offer a web path are **Fitbit, Oura, Whoop, Garmin** — they each have a cloud API you connect to over the internet (OAuth), no native app required.

## What each option takes

| Source | Possible from the web app? | What's required |
|---|---|---|
| **Apple Health / Apple Watch** | ❌ No | A native iOS app (App Store build) — separate project |
| **Google Fit / Android** | ⚠️ Partial | Google API + OAuth + a backend; being deprecated by Google in 2026 |
| **Fitbit** | ✅ Yes | Fitbit developer account, app approval, OAuth login, a small backend to hold the login token |
| **Oura** | ✅ Yes | Oura developer account, OAuth, backend token storage |
| **Whoop** | ✅ Yes | Whoop developer account (approval required), OAuth, backend |
| **Garmin** | ✅ Yes (stricter) | Garmin program application + approval, OAuth, backend |

## The work (for a web-API provider like Fitbit/Oura)
1. **Register a developer app** with the provider (your account) → get API keys. *(Your action.)*
2. **Backend service** to securely hold each user's login token and pull their data on a schedule. The current app has **no backend** (it's static files + Firebase). This is the biggest new piece — a small server or cloud function.
3. **"Connect" flow** in Recovery: user taps Connect → logs into Fitbit/Oura → we store the token.
4. **Daily pull + map** their sleep/HR/HRV into the Recovery entry shape.
5. **Token refresh, error handling, disconnect** — the unglamorous but necessary plumbing.

## Rough effort
- **One web provider (e.g. Oura), done properly:** several days of focused work + provider approval wait time.
- **Apple Watch:** a native app — weeks, a separate product and an App Store listing.

## Recommendation
1. **Now:** manual biometric fields (done) cover the "track my HR/HRV/weight" need for launch.
2. **Phase 2 (post-launch):** add **one** web provider first — **Oura or Fitbit** — as the flagship integration, since their APIs are the cleanest. Decide based on which device your audience actually wears.
3. **Apple Watch:** only if/when a native MPS app is on the roadmap.

**Bottom line:** auto-sync is a real Phase-2 project (needs a backend + a provider account), not a toggle. Manual entry ships now; we add Oura/Fitbit when you're ready to invest in the backend.
