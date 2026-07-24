# MPS — WORKOUT EXERCISE LIBRARY — CANONICAL SPEC

Built weapon by weapon. This file is the source of truth for taxonomy, naming, and the
data model. Do not build the database or UI until the weapon it depends on is locked.

Status: Weapon 1-4 LOCKED · Weapon 5 (Library UI) next.

### Weapon 4 COMPLETE (canonical DB = MPS_WORKOUT_EXERCISES.json)
- 198 records · 43 subsections, every one exactly 5 (visible) · 0 duplicate ids · all Big-10 tagged.
- All 11 sections done: Arms, Forearms, Chest, Shoulders, Back, Traps, Lats, Lower Back, Core, Legs, Compound.
- De-dup proven: Traps/Middle = 5 references + 0 new records; Big-10 lifts each live once and surface in Compound via collection tags.
- Back Squat = option A (canonical Overall Quads, placement `hidden:true`, shown only in Compound).
- Content still stubbed by design: instructions{} + media{} empty — filled in a later content pass.

### OPEN DECISION (needed before Legs + Compound Lifts)
Back Squat is in the Big-10 (Compound) but you REMOVED it from every Quad subsection
(Outer → Belt Squat, Overall → Wall Sit). The schema requires one canonical muscle home.
Options:
  A) Give Back Squat a canonical home in Legs/Quads/Overall Quads (role primary) and keep
     it OUT of the displayed subsection lists via a "collection-only" display flag. Cleanest.
  B) Same conflict applies to Conventional Deadlift (Lower Back + Compound) — already resolved:
     canonical home Lower Back, referenced by Compound. Back Squat has no such muscle home left.
Recommendation: A — canonical home = Legs/Overall Quads, shown only in Compound Lifts, not in
the four quad subsection lists. Preserves your removals AND keeps the Big-10 intact. Confirm.

---

## WEAPON 1 — NAMING STANDARD + CANONICAL-HOME RULES  (LOCKED)

### Naming rules
- Title Case every major word: `Incline Dumbbell Press`.
- Possessive uses `'s`: `Farmer's Carry` (never "Farmer Carry").
- Hyphenate compound modifiers before the movement: `Reverse-Grip`, `Close-Grip`,
  `Wide-Grip`, `Single-Leg`, `Single-Arm`, `Cross-Body`, `Chest-Supported`,
  `Bent-Over`, `Heel-Elevated`, `Low-to-High`, `Toes-to-Bar`.
- Word order: `[Angle/Grip] + [Equipment] + [Movement]` → `Seated Cable Row`.
- Singular movement name. Reps/plurals live in logging, not the name.
- Alternate spellings become `aliases`, never new records.

### Canonical-home rule
One record per exercise. Canonical home = its primary-muscle subsection. Every other
place it appears is a REFERENCE (tag or collection), not a copy. Compound Lifts is a
collection; it references records, never owns them.

### Resolved homes for known cross-listed exercises
| Exercise | Canonical home (primary) | Also shown in (reference) |
|---|---|---|
| Farmer's Carry | Forearms / Grip Strength | Traps/Upper Traps, Compound/Carry |
| Side Plank | Core / Obliques | Lower Back/Spinal Stability |
| Pallof Press | Core / Obliques | Lower Back/Spinal Stability |
| Face Pull | Shoulders / Rear Delts | Traps/Middle Traps |
| Chest-Supported Row | Back / Upper Back | Traps/Middle Traps |
| Bulgarian Split Squat | Legs / Quads / Center Quad | Glutes/Glute Max, Compound/Lunge |
| Walking Lunge | Legs / Quads / Outer Quad | Compound/Lunge, Glute Max |
| Conventional Deadlift | Lower Back | Compound/Hinge, Hamstrings, Traps |
| Reverse Pec Deck | Shoulders / Rear Delts | Traps/Middle Traps |
| Hammer Curl | Arms / Brachialis | Forearms/Brachioradialis |
| Reverse EZ Bar Curl | Arms / Brachialis | Forearms/Brachioradialis |

Default: primary mover wins the home; everything else is a tag.

### User-friendly categories that are NOT separate muscles
Keep the display name, tag so analytics never treats them as distinct muscles:
- Inner/Outer Chest → tag `chest` + `emphasis:inner|outer`.
- Upper/Lower Abs → `rectus_abdominis` + `emphasis:upper|lower`.
- Upper/Lower Lats → `latissimus_dorsi` + `emphasis:upper|lower`.
- Overall Quads, Compound Lifts → `collection`, not a muscle.

---

## WEAPON 2 — LOCKED TAXONOMY TREE  (LOCKED)

11 top-level sections. Each subsection maps to a canonical muscle tag (+ emphasis) or
is flagged `collection`. Display name stays user-friendly; the tag drives analytics.

1. ARMS
   - Biceps → Long Head `biceps_long` · Short Head `biceps_short` · Brachialis `brachialis`
   - Triceps → Long Head `triceps_long` · Lateral Head `triceps_lateral` · Medial Head `triceps_medial`

2. FOREARMS
   - Wrist Flexors `wrist_flexors` · Wrist Extensors `wrist_extensors`
   - Brachioradialis `brachioradialis` · Grip Strength `grip` (functional, not a muscle)

3. CHEST  (tag `chest` for all; emphasis distinguishes)
   - Upper `emphasis:upper` · Middle `emphasis:middle` · Lower `emphasis:lower`
   - Inner `emphasis:inner` · Outer `emphasis:outer`

4. SHOULDERS
   - Front Delts `delts_front` · Side Delts `delts_side` · Rear Delts `delts_rear`
   - (Traps are NOT here — own section.)

5. TRAPS
   - Upper Traps `traps_upper` · Middle Traps `traps_middle` · Lower Traps `traps_lower`

6. BACK
   - Upper Back `back_upper` · Middle Back `back_middle`
   - (Lower Back and Lats are NOT here — own sections.)

7. LOWER BACK
   - Lower Back `erectors` · Spinal Stability `spinal_stability` (functional/anti-movement)

8. LATS  (tag `latissimus_dorsi`; emphasis distinguishes)
   - Upper Lats `emphasis:upper` · Lower Lats `emphasis:lower`

9. CORE
   - Upper Abs `rectus_abdominis emphasis:upper` · Lower Abs `rectus_abdominis emphasis:lower`
   - Obliques `obliques` · Serratus `serratus` (kept here intentionally, tagged separately)
   - (No Lower Back subsection under Core.)

10. LEGS
   - QUADS: Inner/Teardrop `vastus_medialis` · Outer `vastus_lateralis` ·
     Center `rectus_femoris` · Overall Quads `collection:quads`
   - HAMSTRINGS: Outer `hamstrings emphasis:lateral` · Inner `hamstrings emphasis:medial`
     (two user-facing sections only — do not split into three)
   - GLUTES / HIP REGION: Upper Glutes `glute_med_upper` · Glute Max `gluteus_maximus` ·
     Side Glutes `gluteus_medius` · Inner Thigh/Adductors `adductors`
     (Adductors sit here for usability — do not relocate without approval)
   - CALVES: Upper `gastrocnemius` · Lower `soleus`

11. COMPOUND LIFTS  `collection:compound`
   - Movement patterns: Horizontal Push · Vertical Push · Horizontal Pull ·
     Vertical Pull · Squat · Hinge · Lunge · Hip Extension · Dip · Carry
   - Not an anatomical region. References canonical records by movement pattern.

### Data-model note
Top-level section = `bodyRegion` EXCEPT Compound Lifts (`collection`). Subsection =
`subsection` id + its canonical muscle tag(s). A record lists `subsections[]` so it can
appear in more than one, while staying ONE record.

---

## WEAPON 3 — EXERCISE SCHEMA + PROOF RECORDS  (LOCKED)

One canonical record per exercise. `id` is a stable kebab-case slug (never changes —
history + PRs key off it). `placements[]` is how one record appears in many library
categories: exactly one `role:"primary"` (the canonical home), the rest `role:"reference"`.

### Schema (annotated)
```
{
  "id": "kebab-slug",                 // STABLE. history/PRs reference this. never rename.
  "name": "Display Name",             // Weapon-1 naming rules
  "aliases": ["Alt Spelling"],        // alternate names, NOT new records
  "primaryMuscles": ["muscle_tag"],   // Weapon-2 tags
  "secondaryMuscles": ["muscle_tag"],
  "placements": [                      // where it shows in the library
    { "bodyRegion": "legs", "subsection": "center_quad", "role": "primary", "emphasis": null },
    { "bodyRegion": "glutes", "subsection": "glute_max", "role": "reference" }
  ],
  "collections": ["compound:lunge"],   // Compound Lifts membership (movement pattern)
  "movementPattern": "lunge",          // horizontal_push|vertical_push|horizontal_pull|
                                       // vertical_pull|squat|hinge|lunge|hip_extension|dip|carry|isolation
  "type": "compound",                  // compound | isolation
  "equipment": ["barbell"],            // barbell|dumbbell|cable|machine|bodyweight|band|kettlebell|ez_bar|smith|other
  "difficulty": "intermediate",        // beginner | intermediate | advanced
  "isUnilateral": true,
  "tracking": {                        // what the logger shows for this exercise
    "primary": "weight_reps",          // weight_reps|bodyweight_reps|assisted_reps|time|distance|rounds|isometric
    "supportsWeight": true, "supportsReps": true,
    "supportsTime": false, "supportsDistance": false, "supportsRounds": false
  },
  "instructions": { "setup": "", "execution": "", "commonMistakes": "", "safetyNotes": "" },
  "media": { "thumb": null, "video": null }
  // history + personalRecords are NOT stored on the record — they are DERIVED from
  // workout history keyed by this id (keeps the library static + analytics clean).
}
```

### Proof records (3 hard cases)
Full JSON in `MPS_WORKOUT_EXERCISES.sample.json`. They prove:
- `barbell-curl` — simplest: one primary placement, isolation, weight+reps.
- `farmers-carry` — carry: grip primary, NO reps (time+distance); appears in Forearms
  (primary) + Traps (reference) + Compound/Carry collection. One record, three homes.
- `bulgarian-split-squat` — unilateral compound: primary Center Quad, reference Glute Max,
  Compound/Lunge collection, secondary glutes/hamstrings.
