# Portfolio playlist audio

Place only audio files that you own or have permission to publish in this folder.

Production tracks live in `public/audio/library/` and are copied unchanged into the built site. Playlist entries in `public/content/portfolio.json` reference them with root-relative URLs such as:

```json
{ "audioSrc": "/audio/library/example.mp3" }
```

Keep the filename and `audioSrc` value identical, including spaces and capitalization. Supported formats are MP3, M4A, OGG, and WAV.

The custom player streams the complete file inside the portfolio and never opens another site or tab. Before adding or replacing a track, confirm that you have permission to publish it and test the production URL after deployment.
