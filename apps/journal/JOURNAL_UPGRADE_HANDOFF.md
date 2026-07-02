# MPS Journal — Premium Upgrade: Integration & Handoff

Everything needed to merge the "Premium Journal" upgrade into the **live** app.
Built on the isolated `journal-sandbox` branch. The live Journal was never touched.

---

## 0. TL;DR — the fastest safe merge

The upgraded Journal is a **strict superset** of the live one (all old features + 6 new
"weapons"). The sandbox differs from production **only** by data-isolation. A production
build with that isolation reverted is already generated for you:

```
apps/journal/index.upgraded.html   <-- drop-in replacement for apps/journal/index.html
```

**Merge = 3 changes on `main`:**
1. Replace `apps/journal/index.html` with `apps/journal/index.upgraded.html`.
2. `hub.html`: add `allow="microphone"` to the app `<iframe>` (voice needs it in the hub).
3. (Optional) `shared/tour.js`: update the `journal:` step list (hub onboarding tour).

Then deploy and run the **Testing checklist** (section 8). Rollback = restore the old
`index.html` (section 9). That's it. Details below.

---

## 1. What was built (the 6 "weapons")

The Journal is the "aircraft carrier"; each weapon bolts on independently.

| # | Weapon | What it adds |
|---|--------|--------------|
| 0 | **Dry Dock** | Isolated sandbox copy so nothing could touch live data during the build. (Not merged — isolation only.) |
| 1 | **New Journal Body** | `Today's Biggest Win` tan banner (trapezoid, 45° ends); `Wasted Time` renamed to `Biggest Distraction` (old data preserved); Reflection block (`Biggest Lesson`, `Tomorrow's Top 3`, `Quote / Idea Vault`); `Daily Discipline Score` slider (0–10, default 5 centered); one `daily quote`; short labels. |
| 2 | **Smart Voice Entry** | A wireframe mic on the **left** of every text field. Tap → talk → live transcription; 4s silence auto-stops; tapping another mic switches instantly. Appends to existing text (never overwrites). Web Speech API — **free, no server**. Graceful error toast; never erases typed text. |
| 3 | **Save System** | Silent background auto-save (debounced ~1.2s; warns only on offline/failure). `SAVE JOURNAL` button = completion ritual: final save, marks day `complete`, "Saved TIME / Journal Complete / See you tomorrow" popup. Insights stats: `Journal Consistency %` (days journaled ÷ days available, no streaks/reset) and `Total Journal Entries` (only grows). |
| 4 | **Performance Insights** | Renamed Insights → **PERFORMANCE INSIGHTS**. `computePerf()` correlates each day's Discipline Score with that day's sleep hours, wake time, workout, habit %, and spending → plain-English insights ("When you sleep 8+ hours, your Daily Discipline Score averages 8.6/10"). `Growth Score` (recent 7-day avg × 10 + week trend). `AI Recommendation` card + `Blind Spot` card. **100% client-side math** — no AI server, no API, works offline. Honest: shows a "building insights" state until ≥5 scored days, and only claims a correlation with ≥2 days on each side. |
| 5 | **Light / Intense toggle** | Premium-only switch under the date; remembers choice. **Intense** = full journal (default). **Light** = fast Quick 4 (Biggest Win, Emotion, Tomorrow's Top 3, Discipline Score). Same entry underneath — hidden fields keep their data, nothing lost when switching. |
| 6 | **Demo Mode** | `WATCH DEMO` button loads ~18 days of realistic sample data **in memory** (entries + matching tracker data engineered so Performance Insights lights up). Guided spotlight walkthrough (STEP X OF 5, white ring, Skip tour) over Dashboard → Biggest Win → Voice mic → Discipline Score → Performance Insights. `DEMO MODE` banner; `EXIT DEMO` restores the real journal. **Never persists** — verified the real journal is untouched after exit. |

---

## 2. Files & what to do with each

| File | Status | Action for production |
|------|--------|-----------------------|
| `apps/journal/index.upgraded.html` | **Generated, production-ready** | **Rename to `apps/journal/index.html`** (replaces live). |
| `apps/journal/sandbox.html` | Source of truth (isolated) | Keep on the branch as reference; do **not** ship. |
| `apps/journal/build-production.sh` | Reproducible de-sandbox script | Keep; re-run if `sandbox.html` changes (see section 6). |
| `shared/tour.js` | `journal:` steps updated | **Optional** merge — see section 5. |
| `hub.html` | 2 sandbox-only edits + 1 production edit | Merge **only** `allow="microphone"` on the iframe (section 4). Do NOT merge the journal-path→`sandbox.html` change or the reset-button removal. |

**Do NOT bring to production:** the sandbox storage namespace, the "JOURNAL SANDBOX
BRANCH" flag, the hub journal-path override. The generated file already excludes them.

---

## 3. The one thing that matters most — DATA CONTINUITY

The upgrade keeps the **exact same storage layer** as the live Journal, so **all existing
entries keep working** with zero migration:

- localStorage keys: `mps_jnl_<uid>_<key>`  (production — restored in the generated file)
- Firestore docs:    `users/<uid>/app_storage/jnl__<key>`
- Silent backup doc: `users/<uid>/settings/journal_backup`
- Main data key:     `journal_v1`  (object of `{ "YYYY-MM-DD": entry }`)

**Backward compatibility built in:**
- Old entries with `wastedTime` automatically display/seed as **Biggest Distraction**
  (`existing.biggestDistraction || existing.wastedTime`). No data rewrite needed.
- All new fields are optional; old entries render fine (missing fields just show empty).
- History and Insights handle both old and new shapes.

**Entry shape (superset):**
```js
{
  date, workout, gratitude:[a,b,c], accomplishment:[a,b,c],
  affBecoming, affLearning, affIHave, anticipation, emotion,
  biggestDistraction,            // replaces wastedTime (legacy read-mapped)
  biggestWin,                    // Weapon 1
  biggestLesson, top3:[a,b,c], quoteVault,   // Weapon 1 reflection
  disciplineScore,               // Weapon 1 (0–10)
  complete, completedAt,         // Weapon 3 (Save Journal ritual)
  updatedAt, createdAt
}
```

**Performance Insights reads (read-only) the other trackers' cloud backups** to correlate:
`users/<uid>/settings/{habits_backup, sleep_backup, workout_backup, expenses_backup}`.
It never writes them. If a tracker has no data, the engine simply omits that correlation.

---

## 4. hub.html — the one production edit (voice)

Voice entry uses the browser mic. When the Journal runs **inside the hub iframe**, the
iframe must allow it. In `ensureFrame()` where the app iframe is created, add:

```js
frame.setAttribute('title', app.label);
frame.setAttribute('allow', 'microphone');   // <-- ADD THIS (lets Journal voice use the mic in the iframe)
```

Standalone (not embedded) needs nothing — the browser prompts for mic on first tap.

**Do NOT merge from the sandbox hub:** the journal-path change to `/apps/journal/sandbox.html`
(production must load `/apps/journal/`), and the "Reset Test Account" removal (that's a hub
dev button — your call whether to keep it on main; it was only hidden in the sandbox because
it floated over the Journal).

---

## 5. shared/tour.js — optional (hub onboarding tour)

The Journal's own **Watch Demo** uses a self-contained tour **inside index.html** (no
dependency on `shared/tour.js`). So the app works regardless.

`shared/tour.js` drives the **hub's** per-app onboarding tour. Its `journal:` steps were
updated to the new layout (dashboard → Biggest Win → mic → Discipline → Performance
Insights) and target `data-tour="dash|win|mic|disc|perf"` anchors, which the new Journal
provides. Merge it only if you use the hub onboarding tour; it's harmless either way.

> Note: `shared/tour.js` also had `scrollIntoView` switched to instant (smooth silently
> no-ops inside the React Journal). Safe, generic improvement.

---

## 6. Regenerating the production file (if you change the sandbox)

If you tweak `sandbox.html` and want a fresh production build:

```bash
bash apps/journal/build-production.sh    # writes apps/journal/index.upgraded.html
```

It reverts isolation only (leaves every feature intact):
`mps_jnls_`→`mps_jnl_`, `/jnls__`→`/jnl__`, `journal_sandbox_backup`→`journal_backup`,
`journal_sandbox_synced_ts`→`journal_synced_ts`, `slice(6)`→`slice(5)`, retitles, and strips
the sandbox flag element/CSS/comment. Verified: 0 sandbox markers remain; all weapons intact.

---

## 7. Tiers & gating (already wired)

Tier is read from the parent hub `<body>` class (`tier-core` / `tier-premium` / `tier-mono`);
standalone = all false = full-featured colored view. Behavior:

- **Core**: Journal + Insights locked (upgrade screens). Light/Intense hidden.
- **Elite**: full Journal + Performance Insights. History capped to last 60 days. Light/Intense hidden.
- **Premium**: everything + Light/Intense toggle + Check-In + full history + colorful theme.

No gating changes needed for the merge — it matches the live tier model.

---

## 8. Testing checklist (after merge, before wide release)

Data continuity:
- [ ] Existing users' past entries still load and display.
- [ ] A pre-existing "Wasted Time" entry shows under **Biggest Distraction** in History.
- [ ] Editing an old entry and saving does not lose old fields.

New features:
- [ ] Biggest Win, Reflection block, Discipline slider save and reload.
- [ ] Mic appears on every field; tap → allow mic → speech fills the field; 4s pause stops it.
- [ ] Typing then talking appends (doesn't overwrite); voice failure shows a toast, keeps text.
- [ ] Auto-save persists without any "Saving…" flashing; offline shows the warning.
- [ ] SAVE JOURNAL shows the completion popup; entry marked `complete`.
- [ ] Insights: Consistency % and Total Entries update; Performance Insights shows Growth
      Score and correlations once there's enough data (or the "building" state otherwise).
- [ ] Premium: Light/Intense toggle appears, remembers choice, hides/reveals fields, loses nothing.
- [ ] WATCH DEMO plays the walkthrough; EXIT DEMO leaves the real journal empty/unchanged
      (confirm no `journal_v1` demo data persisted).
- [ ] Core account: Journal/Insights show the upgrade screens (still gated).

Cross-device:
- [ ] Save on one device, confirm it syncs to another (same `journal_backup` doc).

---

## 9. Rollback

The change is a single-file swap (plus the small hub edit), so rollback is trivial:
```bash
git checkout <previous-commit> -- apps/journal/index.html hub.html shared/tour.js
```
Deploy. No data migration happened, so there's nothing to undo in the database.

---

## 10. External dependencies / accounts

- **Firebase** (project `modular-performance`): no change. The live domain
  `modular-performance.com` is already an Authorized Domain. (The sandbox preview domain was
  added during the build — irrelevant to production.)
- **Voice**: Web Speech API (browser-native). No key, no server, no cost. Best in Chrome.
- **Performance Insights / "AI Recommendation"**: pure client-side statistics on the user's
  own data. **No AI server, no API, no signups, no monthly cost.** ("AI" is a label; under
  the hood it's a correlation engine. Rename the card if you prefer — it needs nothing extra.)
- **Fonts**: Inter, Bebas Neue, Playfair Display, Saira Condensed (already loaded via the
  existing Google Fonts link).

---

## 11. Deploy notes & gotchas

- **Stale cache is the #1 recurring issue.** After deploy, bump the service-worker
  `CACHE_VERSION` and hub `APP_VERSION`, and tell users to load `…/hub.html?v=<new>` (or
  hard-refresh Ctrl+Shift+R). During the build, cached hub/journal repeatedly showed
  already-fixed states.
- **Demo tour scroll**: the demo uses an in-app React tour that re-measures each step
  (`scrollIntoView({block:'center'})`, instant). The earlier shared vanilla-engine attempt
  fought React re-renders on the heavier page — that's why the Journal uses its own tour.
- **Icons are wireframe SVG only** (no emojis) per house style — kept throughout.
- **Copy avoids em dashes** per house style (this doc aside).
- **Parallel work**: the build ran in a git worktree at
  `…/Modular Performance/mps-journal-sandbox-wt` (branch `journal-sandbox`) because another
  process edits `main` in the same repo. Merge from the branch's production file, not by
  blanket-merging the branch (which carries sandbox-only files).

---

## 12. Branch & links

- Branch: `journal-sandbox` (GitHub `JeffHuberMPS/modular-performance`).
- Live sandbox preview: `https://modular-performance-git-journal-sandbox-jeffhubermps-projects.vercel.app/apps/journal/sandbox.html`
- Production-ready file: `apps/journal/index.upgraded.html` (this branch).
- This doc: `apps/journal/JOURNAL_UPGRADE_HANDOFF.md`.
