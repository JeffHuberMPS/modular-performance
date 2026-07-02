#!/usr/bin/env bash
# ============================================================================
#  MPS Journal — build the PRODUCTION index.html from the sandbox
#  ---------------------------------------------------------------------------
#  The sandbox (sandbox.html) is a full copy of the live journal PLUS the 6
#  upgrade "weapons". This script strips ONLY the sandbox isolation so the
#  result is drop-in ready to replace apps/journal/index.html on main.
#
#  What it reverts (isolation only — every feature stays):
#    - localStorage prefix   mps_jnls_            -> mps_jnl_          (real keys)
#    - Firestore doc prefix  /jnls__              -> /jnl__
#    - backup doc            journal_sandbox_backup      -> journal_backup
#    - sync ts key           journal_sandbox_synced_ts   -> journal_synced_ts
#    - list() slice(6)       -> slice(5)          (jnls__ is 6 chars, jnl__ is 5)
#    - <title>               MPS Journal — Sandbox -> MPS Journal
#    - removes the "JOURNAL SANDBOX BRANCH" comment header, on-screen flag
#      element, and its CSS rule.
#
#  Run from the repo root:  bash apps/journal/build-production.sh
#  Output:  apps/journal/index.upgraded.html   (review, then rename to index.html)
# ============================================================================
set -euo pipefail
SRC="apps/journal/sandbox.html"
OUT="apps/journal/index.upgraded.html"

cp "$SRC" "$OUT"

# --- simple, global string reversions (storage isolation) -------------------
perl -0777 -i -pe "s/mps_jnls_/mps_jnl_/g"                      "$OUT"
perl -0777 -i -pe "s{/jnls__}{/jnl__}g"                        "$OUT"
perl -0777 -i -pe "s/journal_sandbox_backup/journal_backup/g"  "$OUT"
perl -0777 -i -pe "s/journal_sandbox_synced_ts/journal_synced_ts/g" "$OUT"
perl -0777 -i -pe "s/startsWith\('jnls__'\)/startsWith('jnl__')/g" "$OUT"
perl -0777 -i -pe "s/k\.slice\(6\)/k.slice(5)/g"               "$OUT"

# --- title -----------------------------------------------------------------
perl -0777 -i -pe "s/<title>MPS Journal.*?<\/title>/<title>MPS Journal<\/title>/s" "$OUT"

# --- remove the "JOURNAL SANDBOX BRANCH" comment header --------------------
perl -0777 -i -pe "s/\s*<!-- =+\s*\n\s*JOURNAL SANDBOX BRANCH.*?=+ -->//s" "$OUT"

# --- remove the on-screen sandbox flag element (+ its comment) -------------
perl -0777 -i -pe "s/\s*<!-- Weapon 0: persistent sandbox label.*?<div id=\"sandbox-flag\".*?<\/div>//s" "$OUT"

# --- remove the sandbox-flag CSS rule (+ its comment) ----------------------
perl -0777 -i -pe "s/\s*\/\* Sandbox flag overlaps.*?html\.mps-embedded #sandbox-flag \{ display:none !important; \}//s" "$OUT"

echo "Wrote $OUT"
