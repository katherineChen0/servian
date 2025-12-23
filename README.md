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


Pronunciation / Voices

- The app uses the browser `speechSynthesis` API to pronounce Serbian words. For best results the browser must have a Serbian (`sr` / `sr-RS`) voice installed.
- Some mobile browsers (especially default Android/iOS builds) may only provide English voices. If the Serbian voice isn't available the app will pick the closest available voice — you can change the voice using the dropdown next to the Pronounce button and the choice is saved.
- To get a proper Serbian voice:
  - macOS: System Settings → Accessibility → Spoken Content → Voices, add a Serbian voice if available.
  - iOS: Settings → Accessibility → Spoken Content → Voices, add Serbian where available.
  - Android: Install a TTS engine that includes Serbian (Google Text-to-speech or other engines) and enable it in Settings → Text-to-speech.
  - Desktop Chrome/Firefox: voices available depend on the OS speech voices.

