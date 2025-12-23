# Serbian Mini Flashcards

Small single-page web app you can run on your phone to learn Serbian words with simple spaced repetition and pronunciation.

Files:

- `index.html` — UI
- `app.js` — logic, storage, review scheduler
- `styles.css` — styles

How to run (recommended on same Wi-Fi network so you can open on phone):

1. Open a terminal in this directory and run a minimal HTTP server (Python 3):

```bash
python3 -m http.server 8000
```

2. On your phone open a browser and go to `http://<your-computer-ip>:8000` (find IP with `ifconfig` or `ipconfig`).

3. (Optional) In Chrome/Safari use "Add to Home Screen" to create an app-like shortcut.

Quick usage:

- Add words with the form.
- Use "Start Review" to begin a session. Press "🔊 Pronounce" for audio.
- Mark "I knew it" or "I didn't" to move words through a simple spaced repetition schedule.
- Export JSON/CSV to back up; import JSON to restore.

Notes & next steps you might want:

- Improve SRS timings (they are short for fast testing). Increase `SCHEDULE_MINUTES` in `app.js` for longer intervals.
- Add server-hosted audio files or recorded pronunciations if `speechSynthesis` quality is insufficient.
- Convert to PWA (add manifest, service worker) for full offline install.

If you want, I can:

- Package this as a PWA for easier home-screen installs.
- Add spaced-repetition statistics and per-word history.
- Add a CSV/Anki import format.
