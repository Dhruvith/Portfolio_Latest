import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteCli = path.join(root, "node_modules", "vite", "bin", "vite.js");

const children = [
  spawn(process.execPath, ["scripts/cms-server.mjs"], { cwd: root, stdio: "inherit" }),
  spawn(process.execPath, [viteCli, "--config", "admin/vite.config.js"], { cwd: root, stdio: "inherit" }),
];

const stop = () => {
  for (const child of children) if (!child.killed) child.kill();
  process.exit();
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const child of children) child.on("exit", (code) => { if (code && code !== 0) stop(); });
