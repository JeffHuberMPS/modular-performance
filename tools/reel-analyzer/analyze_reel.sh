#!/usr/bin/env bash
# Free reel analyzer. Input: a local video file. Output: frames + contact sheet + audio + info.
# Usage: ./analyze_reel.sh path/to/reel.mp4 [out_dir]
set -euo pipefail
IN="${1:?usage: analyze_reel.sh reel.mp4 [out_dir]}"
OUT="${2:-./reel_out_$(basename "${IN%.*}")}"
mkdir -p "$OUT/frames" "$OUT/scenes"

# 1. Basic info (length, size, fps)
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate \
  -of default=nw=1 "$IN" > "$OUT/info.txt"

# 2. One frame every 0.5s (catches every text change / caption word)
ffmpeg -v error -y -i "$IN" -vf "fps=2,scale=720:-2" -q:v 3 "$OUT/frames/f_%04d.jpg"

# 3. Scene-cut frames (every hard cut / new shot)
ffmpeg -v error -y -i "$IN" -vf "select='gt(scene,0.25)',scale=720:-2" -vsync vfr -q:v 3 "$OUT/scenes/s_%03d.jpg"

# 4. Contact sheet: 20 evenly spaced frames in one image, fast overview
ffmpeg -v error -y -i "$IN" -vf "fps=1/$(awk -F= '/duration/{printf "%.2f", ($2<20?1:$2/20)}' "$OUT/info.txt"),scale=270:-2,tile=5x4" \
  -frames:v 1 "$OUT/contact_sheet.jpg" || true

# 5. Audio (mono 16k wav) for transcription
ffmpeg -v error -y -i "$IN" -vn -ac 1 -ar 16000 "$OUT/audio.wav" || echo "no audio track"

echo "Done -> $OUT"
ls "$OUT"
