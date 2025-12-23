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

Pronunciation / Voices

- The app uses the browser `speechSynthesis` API to pronounce Serbian words. For best results the browser must have a Serbian (`sr` / `sr-RS`) voice installed.
- Some mobile browsers (especially default Android/iOS builds) may only provide English voices. If the Serbian voice isn't available the app will pick the closest available voice — you can change the voice using the dropdown next to the Pronounce button and the choice is saved.
- To get a proper Serbian voice:
  - macOS: System Settings → Accessibility → Spoken Content → Voices, add a Serbian voice if available.
  - iOS: Settings → Accessibility → Spoken Content → Voices, add Serbian where available.
  - Android: Install a TTS engine that includes Serbian (Google Text-to-speech or other engines) and enable it in Settings → Text-to-speech.
  - Desktop Chrome/Firefox: voices available depend on the OS speech voices.

If you want, I can package the app as a PWA so you can install it and keep voices cached.

Per-word audio (upload only)

- The app supports attaching per-word audio via the **Upload** button next to any word. Upload MP3/WebM/OGG files and they'll be saved in the browser (as data URLs) and used for playback.
- Playback priority: if a word has uploaded audio it will be played; otherwise the app falls back to `speechSynthesis`.
- Notes and limitations:
  - Audio is stored in `localStorage` as base64 data URLs — this is convenient and requires no server, but large audio files can increase storage usage quickly (localStorage limits vary by browser).
  - If you want persistent backups, use the Export JSON feature which includes audio data; import restores audio too.
