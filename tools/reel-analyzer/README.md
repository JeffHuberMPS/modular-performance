# Reel Analyzer (free backup for vidIQ)

Why: this cloud container can't reach instagram.com or the Whisper model host. So the reel must come in as a **file**.

## Step 1: Get the video (pick one, all free)
- **Phone screen record** (easiest, works every time). Play the reel with sound, then record. Trim the edges.
- **PC / Mac:** `pip install yt-dlp`, then `yt-dlp "REEL_URL" -o reel.mp4`. If it asks for login: `--cookies-from-browser chrome`.
- Save the file into this repo (e.g. `tools/reel-analyzer/inbox/reel.mp4`) or attach it to the chat.

## Step 2: Run
`./analyze_reel.sh inbox/reel.mp4`

Output folder has:
- `frames/` one frame every 0.5s (every text change)
- `scenes/` one frame per hard cut
- `contact_sheet.jpg` whole reel on one image
- `audio.wav` for transcription
- `info.txt` length / resolution

## Step 3: Tell Claude "analyze reel_out_xxx"
Claude reads the frames, so it gets: exact on-screen text, fonts and colors, shot order, cut timing, caption style.

## Voice / script (pick one)
1. Read it off the on-screen captions (most reels have them). Free, already covered by the frames.
2. Instagram's own captions: tap the CC button on the reel and copy.
3. ElevenLabs transcribe (connector is linked; uses a few credits).
4. On your own PC: `pip install faster-whisper`, then transcribe `audio.wav`.

## Tested
Run on a synthetic 6s video: produced 12 frames, contact sheet, wav, and info.
