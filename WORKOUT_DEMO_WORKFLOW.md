# WORKOUT DEMO — REUSABLE WORKFLOW

This is a copy-paste job for Claude Code. It builds the first-open demo for the **Workout** pillar.
It reuses the demo system already in this repo (`shared/tour.js`, `demo-data.js`, `hub.html`).
Work on the **`workout-sandbox`** branch only. Do not touch `main` or the live site until Jeff approves.

---

## WHAT JEFF IS ASKING FOR (plain English)

When a brand-new customer opens the Workout tracker for the very first time, they should get a short,
hands-off demo, about 1 to 2 minutes. It does four things, in order:

1. **Show it full of data.** The dashboard opens already filled with 2 to 3 weeks of realistic fake
   workouts, so the buyer instantly sees what a used app looks like.
2. **Slow auto-scroll (a "pan").** The dashboard scrolls itself top to bottom on its own. Not too fast,
   not too slow. Fast enough to respect their time, slow enough to actually read. No manual scrolling.
3. **Teach the top 5 buttons.** A guided tour highlights the 5 most important things to click to
   actually use the tracker. The rest of the screen is grayed out and the one item is ringed in a
   **white outline**. Curious people can explore the other buttons later.
4. **Reset to zero.** The moment the demo ends (or they hit Skip), all the fake data is wiped so the
   customer starts on a clean, brand-new tracker and can use it right away.

The point: they see what it looks like, they learn the 5 buttons that matter, then they start fresh.

---

## THE PROMPT TO PASTE INTO CLAUDE CODE

> Build the first-open demo for the **Workout** pillar, on the `workout-sandbox` branch.
> Follow the existing demo system exactly (`MPS_DEMO_HANDOFF.md`). Requirements:
>
> **1. Sample data (2 to 3 weeks).** In `demo-data.js`, make `genWorkout` write 21 days
> (3 weeks) of realistic workouts ending on this week's Saturday, so the current week's charts fill.
> A lift every day (no gaps), weights that climb week to week with normal / deload / PR days,
> plus conditioning so every dashboard widget has data. Tag every entry as demo data so it can be
> wiped cleanly later. Keys: `mps_v3_history`, `mps_v3_prs`, `mps_v3_conditioning`.
>
> **2. Dashboard pan.** The Workout tour must open on the Dashboard and do the slow auto-scroll
> (`pan` step), top to bottom, about 5 to 9 seconds. Then move through tabs strictly left to right.
>
> **3. Top 5 features only.** Ring exactly the 5 make-or-break buttons in `TOURS.workout` in
> `shared/tour.js`. Gray out the rest, white ring on the target, "STEP X OF 5" + Skip on the card.
> The 5 must be the essentials to USE the tracker (see list below), NOT the analytics tabs.
>
> **4. Highlight the real Add-Workout flow.** Do not fake this with one centered note. Pre-fill
> TODAY's workout in the sample data (`mps_v3_state.days[today]` with a split + one exercise + one set)
> so the Weight / Reps / + Set boxes already EXIST when the tour runs, then ring the real controls:
> **+ Add Split** then **+ Add exercise** then **Weight** then **Reps** then **+ Set** then
> **End Workout & Save**. This is the most important part. (This is the known open gap for Workout.)
>
> **5. Reset to zero on finish.** On tour end or Skip, the hub calls `MPS_DEMO.clear()` which wipes
> ONLY the demo entries (by date/manifest, never real data) and reloads the app empty. Confirm this
> works for Workout.
>
> Test as a fresh user in Incognito on the beta link. Make it buttery smooth, zero glitches,
> skippable at any time. Do NOT deploy or touch `main`. Report back with what to click to test.

---

## THE TOP 5 WORKOUT BUTTONS (the tour targets)

These are the 5 essentials a new person needs to run the tracker. Confirm/adjust against the live app.

1. **+ Add Split** — start today's workout.
2. **+ Add exercise** — pick the lift from the dropdown.
3. **Weight + Reps** — log the numbers for a set.
4. **+ Set** — add the next set.
5. **End Workout & Save** — save the session so it hits the dashboard.

---

## THE RULES (Jeff's hard requirements)

- **White outline** on the highlighted item, screen grayed out around it.
- **Dashboard first** with the slow pan, THEN tabs left to right. Never bounce around.
- **Top 5 only.** Not every button, not the analytics tabs.
- **Reset to zero** when the demo ends, so the customer starts clean.
- **Buttery smooth, skippable anytime.** No glitches, no waiting on elements that do not exist yet
  (that is why TODAY's workout gets pre-filled).
- Pan speed: slow enough to read, fast enough not to waste time.

---

## HOW TO TEST (fresh customer view)

1. Incognito window.
2. Open the beta link, sign in with the test email (see `MPS_DEMO_HANDOFF.md` section at top).
3. Tap the **Workout** tile. The intro popup then the full demo should run automatically.
4. Watch: filled dashboard, slow pan, 5 white-ringed steps, then the app wipes to empty.
5. To re-run: use the red **RESET TEST ACCOUNT** button (test accounts only).

---

## GUARDRAILS

- Branch: **`workout-sandbox`** only. `main` and the live site stay untouched.
- Do not deploy (no version bump, no push to `main` or `unified-app`) until Jeff says so.
- This mirrors what was already done for the Expenses and Journal sandboxes.
