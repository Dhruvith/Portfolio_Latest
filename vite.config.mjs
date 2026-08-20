import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

const personalAudioRoot = path.resolve(process.env.PERSONAL_AUDIO_DIR || "C:\\Users\\DELL\\Desktop\\Songs");

function servePersonalAudio(request, response, next) {
  let relativePath;
  try {
    relativePath = decodeURIComponent(String(request.url || "").split("?")[0]).replace(/^\/+/, "");
  } catch {
    response.statusCode = 400;
    response.end("Invalid audio path");
    return;
  }

  if (!/\.(mp3|m4a|ogg|wav)$/i.test(relativePath)) {
    next();
    return;
  }

  const filePath = path.resolve(personalAudioRoot, relativePath);
  const rootPrefix = `${personalAudioRoot}${path.sep}`.toLowerCase();
  if (!filePath.toLowerCase().startsWith(rootPrefix) || !existsSync(filePath)) {
    response.statusCode = 404;
    response.end("Audio file not found");
    return;
  }

  const stats = statSync(filePath);
  if (!stats.isFile()) {
    response.statusCode = 404;
    response.end("Audio file not found");
    return;
  }

  const contentTypes = { ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".wav": "audio/wav" };
  const contentType = contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  const range = request.headers.range;
  response.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("Content-Type", contentType);

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      response.statusCode = 416;
      response.setHeader("Content-Range", `bytes */${stats.size}`);
      response.end();
      return;
    }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), stats.size - 1) : stats.size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= stats.size) {
      response.statusCode = 416;
      response.setHeader("Content-Range", `bytes */${stats.size}`);
      response.end();
      return;
    }
    response.statusCode = 206;
    response.setHeader("Content-Range", `bytes ${start}-${end}/${stats.size}`);
    response.setHeader("Content-Length", end - start + 1);
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath, { start, end }).pipe(response);
    return;
  }

  response.statusCode = 200;
  response.setHeader("Content-Length", stats.size);
  if (request.method === "HEAD") response.end();
  else createReadStream(filePath).pipe(response);
}

function personalAudioLibrary() {
  const mount = (server) => {
    server.middlewares.use("/audio/library", servePersonalAudio);
  };
  return { name: "personal-audio-library", configureServer: mount, configurePreviewServer: mount };
}

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "127.0.0.1",
    allowedHosts: ["terminal.local", "127.0.0.1", "localhost"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), personalAudioLibrary()],
});
