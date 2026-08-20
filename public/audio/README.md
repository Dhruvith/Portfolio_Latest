# Local playlist audio

Place only audio files that you own or have permission to publish in this folder.

For the local-only personal library, Vite mounts `C:\Users\DELL\Desktop\Songs` at `/audio/library/` through loopback-only middleware. The source MP3 files stay outside the project and are not copied into production builds or committed to Git. Set `PERSONAL_AUDIO_DIR` before starting Vite if the folder moves.

For each track in the local Content Studio, set `audioSrc` to a root-relative path such as:

```text
/audio/the-night-we-met.mp3
```

Supported local formats: MP3, M4A, OGG, and WAV.

When `audioSrc` is present, the custom player plays the complete file inside the portfolio. When it is empty, the in-page play control stays disabled; it never opens another site or tab.
