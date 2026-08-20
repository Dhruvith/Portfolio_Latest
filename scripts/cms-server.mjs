import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { createServer } from "node:http";
import {
  copyFile,
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
} from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const scrypt = promisify(scryptCallback);
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const HOST = "127.0.0.1";
const PORT = 8788;
const ENV_PATH = path.join(ROOT_DIR, ".env.cms.local");
const CONTENT_PATH = path.join(ROOT_DIR, "public", "content", "portfolio.json");
const BACKUP_DIR = path.join(ROOT_DIR, ".cms-backups");
const ALLOWED_ORIGINS = new Set([
  "http://admin.localhost:4180",
  "http://localhost:4180",
]);
const ALLOWED_HOSTS = new Set([
  `admin.localhost:${PORT}`,
  `localhost:${PORT}`,
  `${HOST}:${PORT}`,
]);
const SESSION_COOKIE = "dhruvith_cms_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const MAX_LOGIN_BODY_BYTES = 8 * 1024;
const MAX_CONTENT_BODY_BYTES = 256 * 1024;
const JSON_LIMITS = Object.freeze({
  maxDepth: 8,
  maxNodes: 10_000,
  maxObjectKeys: 200,
  maxArrayLength: 500,
  maxStringLength: 20_000,
  maxKeyLength: 128,
});
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function loadEnvFile(contents) {
  const values = Object.create(null);
  for (const line of contents.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    values[key] = value;
  }
  return values;
}

function parsePasswordHash(encoded) {
  const [algorithm, nValue, rValue, pValue, saltValue, hashValue, extra] = String(encoded || "").split("$");
  const N = Number(nValue);
  const r = Number(rValue);
  const p = Number(pValue);
  if (
    algorithm !== "scrypt" ||
    extra !== undefined ||
    !Number.isInteger(N) || N < 16_384 || N > 262_144 ||
    !Number.isInteger(r) || r < 1 || r > 32 ||
    !Number.isInteger(p) || p < 1 || p > 16
  ) {
    throw new Error("CMS_PASSWORD_HASH has an unsupported format.");
  }
  const salt = Buffer.from(saltValue || "", "base64");
  const expectedHash = Buffer.from(hashValue || "", "base64");
  if (salt.length < 16 || expectedHash.length !== 64) {
    throw new Error("CMS_PASSWORD_HASH is invalid.");
  }
  return { N, r, p, salt, expectedHash };
}

const env = loadEnvFile(await readFile(ENV_PATH, "utf8").catch((error) => {
  if (error.code === "ENOENT") {
    throw new Error("Missing .env.cms.local. Run: node scripts/cms-setup.mjs");
  }
  throw error;
}));
const passwordRecord = parsePasswordHash(env.CMS_PASSWORD_HASH);

const sessions = new Map();
const loginAttempts = new Map();
let writeQueue = Promise.resolve();

function setSecurityHeaders(response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  response.setHeader("Cross-Origin-Resource-Policy", "same-site");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
}

function applyCors(request, response) {
  const origin = request.headers.origin;
  if (!origin) return;
  if (!ALLOWED_ORIGINS.has(origin)) {
    throw new HttpError(403, "ORIGIN_NOT_ALLOWED", "Origin is not allowed.");
  }
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
  response.setHeader("Access-Control-Max-Age", "600");
  response.setHeader("Vary", "Origin");
}

function requireTrustedOrigin(request) {
  if (!ALLOWED_ORIGINS.has(request.headers.origin || "")) {
    throw new HttpError(403, "ORIGIN_REQUIRED", "A trusted admin origin is required.");
  }
}

function sendJson(response, status, payload, extraHeaders = {}) {
  setSecurityHeaders(response);
  for (const [name, value] of Object.entries(extraHeaders)) response.setHeader(name, value);
  const body = JSON.stringify(payload);
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Content-Length", Buffer.byteLength(body));
  response.end(body);
}

async function readJson(request, maxBytes) {
  const contentType = request.headers["content-type"] || "";
  if (!/^application\/json(?:\s*;|$)/iu.test(contentType)) {
    throw new HttpError(415, "JSON_REQUIRED", "Content-Type must be application/json.");
  }

  const declaredLength = Number(request.headers["content-length"] || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpError(413, "BODY_TOO_LARGE", "Request body is too large.");
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new HttpError(413, "BODY_TOO_LARGE", "Request body is too large.");
    }
    chunks.push(chunk);
  }

  if (size === 0) throw new HttpError(400, "EMPTY_BODY", "A JSON body is required.");
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body is not valid JSON.");
  }
}

function validateJsonShape(root) {
  if (root === null || Array.isArray(root) || typeof root !== "object") {
    throw new HttpError(422, "INVALID_CONTENT", "Portfolio content must be a JSON object.");
  }

  let nodeCount = 0;
  const visit = (value, depth) => {
    nodeCount += 1;
    if (nodeCount > JSON_LIMITS.maxNodes) {
      throw new HttpError(422, "CONTENT_TOO_COMPLEX", "Portfolio content contains too many values.");
    }
    if (depth > JSON_LIMITS.maxDepth) {
      throw new HttpError(422, "CONTENT_TOO_DEEP", "Portfolio content is nested too deeply.");
    }

    if (value === null || typeof value === "boolean") return;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new HttpError(422, "INVALID_NUMBER", "Numbers must be finite.");
      return;
    }
    if (typeof value === "string") {
      if (value.length > JSON_LIMITS.maxStringLength) {
        throw new HttpError(422, "STRING_TOO_LONG", "Portfolio content contains a string that is too long.");
      }
      return;
    }
    if (Array.isArray(value)) {
      if (value.length > JSON_LIMITS.maxArrayLength) {
        throw new HttpError(422, "ARRAY_TOO_LONG", "Portfolio content contains an array that is too long.");
      }
      for (const item of value) visit(item, depth + 1);
      return;
    }
    if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
      throw new HttpError(422, "INVALID_VALUE", "Portfolio content contains an unsupported value.");
    }

    const keys = Object.keys(value);
    if (keys.length > JSON_LIMITS.maxObjectKeys) {
      throw new HttpError(422, "OBJECT_TOO_LARGE", "Portfolio content contains an object with too many fields.");
    }
    for (const key of keys) {
      if (FORBIDDEN_KEYS.has(key)) {
        throw new HttpError(422, "FORBIDDEN_KEY", "Portfolio content contains a forbidden object key.");
      }
      if (key.length === 0 || key.length > JSON_LIMITS.maxKeyLength) {
        throw new HttpError(422, "INVALID_KEY", "Portfolio content contains an invalid object key.");
      }
      visit(value[key], depth + 1);
    }
  };

  visit(root, 0);
}

function parseCookies(header = "") {
  const cookies = Object.create(null);
  for (const pair of header.split(";")) {
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    cookies[name] = value;
  }
  return cookies;
}

function getSession(request) {
  const sessionId = parseCookies(request.headers.cookie)[SESSION_COOKIE];
  if (!sessionId || !/^[a-f0-9]{64}$/u.test(sessionId)) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return { id: sessionId, ...session };
}

function requireSession(request) {
  const session = getSession(request);
  if (!session) throw new HttpError(401, "AUTHENTICATION_REQUIRED", "Authentication required.");
  return session;
}

function safeStringEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function requireCsrf(request, session) {
  const supplied = request.headers["x-csrf-token"];
  if (!safeStringEqual(supplied, session.csrfToken)) {
    throw new HttpError(403, "INVALID_CSRF_TOKEN", "CSRF token is missing or invalid.");
  }
}

function setSessionCookie(response, sessionId) {
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${sessionId}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  );
}

function clearSessionCookie(response) {
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0`,
  );
}

async function verifyPassword(password) {
  if (typeof password !== "string" || password.length > 256) return false;
  const actualHash = await scrypt(password, passwordRecord.salt, passwordRecord.expectedHash.length, {
    N: passwordRecord.N,
    r: passwordRecord.r,
    p: passwordRecord.p,
    maxmem: 64 * 1024 * 1024,
  });
  return timingSafeEqual(actualHash, passwordRecord.expectedHash);
}

function getLoginState(ip) {
  const now = Date.now();
  const state = loginAttempts.get(ip);
  if (state?.blockedUntil > now) return state;
  if (!state || state.windowEndsAt <= now) {
    const fresh = { failures: 0, windowEndsAt: now + LOGIN_WINDOW_MS, blockedUntil: 0 };
    loginAttempts.set(ip, fresh);
    return fresh;
  }
  return state;
}

function registerLoginFailure(ip) {
  const state = getLoginState(ip);
  state.failures += 1;
  if (state.failures >= MAX_LOGIN_FAILURES) state.blockedUntil = Date.now() + LOGIN_BLOCK_MS;
}

function clearLoginFailures(ip) {
  loginAttempts.delete(ip);
}

function contentRevision(contents) {
  return `"sha256-${createHash("sha256").update(contents).digest("base64url")}"`;
}

async function readContent() {
  let contents;
  try {
    contents = await readFile(CONTENT_PATH, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new HttpError(404, "CONTENT_NOT_FOUND", "Portfolio content has not been created yet.");
    }
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(contents);
    validateJsonShape(parsed);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "CONTENT_INVALID", "Stored portfolio content is invalid.");
  }
  const metadata = await stat(CONTENT_PATH);
  return { parsed, contents, metadata };
}

function timestampForFilename() {
  return new Date().toISOString().replaceAll(":", "-");
}

async function persistContent(content) {
  validateJsonShape(content);
  const serialized = `${JSON.stringify(content, null, 2)}\n`;
  if (Buffer.byteLength(serialized) > MAX_CONTENT_BODY_BYTES) {
    throw new HttpError(413, "CONTENT_TOO_LARGE", "Serialized portfolio content is too large.");
  }

  await mkdir(path.dirname(CONTENT_PATH), { recursive: true });
  await mkdir(BACKUP_DIR, { recursive: true });

  let backupFilename = null;
  try {
    await stat(CONTENT_PATH);
    backupFilename = `portfolio-${timestampForFilename()}-${randomBytes(4).toString("hex")}.json`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);
    await copyFile(CONTENT_PATH, backupPath, fsConstants.COPYFILE_EXCL);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const temporaryPath = path.join(
    path.dirname(CONTENT_PATH),
    `.portfolio.${process.pid}.${randomBytes(8).toString("hex")}.tmp`,
  );
  const temporary = await open(temporaryPath, "wx", 0o600);
  try {
    await temporary.writeFile(serialized, "utf8");
    await temporary.sync();
  } finally {
    await temporary.close();
  }

  try {
    await rename(temporaryPath, CONTENT_PATH);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }

  return { backupFilename, revision: contentRevision(serialized) };
}

async function handleRequest(request, response) {
  setSecurityHeaders(response);
  if (!ALLOWED_HOSTS.has(request.headers.host || "")) {
    throw new HttpError(400, "INVALID_HOST", "Host header is not allowed.");
  }
  applyCors(request, response);

  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  if (url.search) throw new HttpError(400, "QUERY_NOT_ALLOWED", "Query parameters are not supported.");

  if (request.method === "OPTIONS") {
    requireTrustedOrigin(request);
    response.statusCode = 204;
    response.end();
    return;
  }

  if (url.pathname === "/api/login" && request.method === "POST") {
    requireTrustedOrigin(request);
    const ip = request.socket.remoteAddress || "unknown";
    const state = getLoginState(ip);
    if (state.blockedUntil > Date.now()) {
      const retryAfter = Math.ceil((state.blockedUntil - Date.now()) / 1000);
      response.setHeader("Retry-After", String(retryAfter));
      throw new HttpError(429, "LOGIN_RATE_LIMITED", "Too many login attempts. Try again later.");
    }

    const body = await readJson(request, MAX_LOGIN_BODY_BYTES);
    const valid = await verifyPassword(body?.password);
    if (!valid) {
      registerLoginFailure(ip);
      throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid credentials.");
    }

    clearLoginFailures(ip);
    const sessionId = randomBytes(32).toString("hex");
    const csrfToken = randomBytes(32).toString("base64url");
    sessions.set(sessionId, { csrfToken, expiresAt: Date.now() + SESSION_TTL_MS });
    setSessionCookie(response, sessionId);
    sendJson(response, 200, { authenticated: true, csrfToken, expiresInSeconds: SESSION_TTL_MS / 1000 });
    return;
  }

  if (url.pathname === "/api/session" && request.method === "GET") {
    const session = requireSession(request);
    sendJson(response, 200, {
      authenticated: true,
      csrfToken: session.csrfToken,
      expiresAt: new Date(session.expiresAt).toISOString(),
    });
    return;
  }

  if (url.pathname === "/api/logout" && request.method === "POST") {
    requireTrustedOrigin(request);
    const session = requireSession(request);
    requireCsrf(request, session);
    sessions.delete(session.id);
    clearSessionCookie(response);
    sendJson(response, 200, { authenticated: false });
    return;
  }

  if (url.pathname === "/api/content" && request.method === "GET") {
    requireSession(request);
    const { parsed, contents, metadata } = await readContent();
    sendJson(response, 200, parsed, {
      ETag: contentRevision(contents),
      "Last-Modified": metadata.mtime.toUTCString(),
    });
    return;
  }

  if (url.pathname === "/api/content" && request.method === "PUT") {
    requireTrustedOrigin(request);
    const session = requireSession(request);
    requireCsrf(request, session);
    const content = await readJson(request, MAX_CONTENT_BODY_BYTES);
    validateJsonShape(content);

    const writeOperation = writeQueue.then(() => persistContent(content));
    writeQueue = writeOperation.catch(() => {});
    const result = await writeOperation;
    sendJson(response, 200, {
      saved: true,
      revision: result.revision,
      backup: result.backupFilename,
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  throw new HttpError(404, "NOT_FOUND", "Endpoint not found.");
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    const known = error instanceof HttpError;
    const status = known ? error.status : 500;
    const code = known ? error.code : "INTERNAL_ERROR";
    const message = known ? error.message : "Internal server error.";
    if (!known) console.error(error);
    if (!response.headersSent) {
      sendJson(response, status, { error: { code, message } });
    } else {
      response.end();
    }
  });
});

server.requestTimeout = 15_000;
server.headersTimeout = 10_000;
server.keepAliveTimeout = 5_000;
server.maxRequestsPerSocket = 100;

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(id);
  }
  for (const [ip, state] of loginAttempts) {
    if (state.windowEndsAt <= now && state.blockedUntil <= now) loginAttempts.delete(ip);
  }
}, 10 * 60 * 1000);
cleanupTimer.unref();

server.listen(PORT, HOST, () => {
  console.log(`Local CMS API listening on http://localhost:${PORT}`);
  console.log("Allowed admin origins: http://admin.localhost:4180, http://localhost:4180");
});

function shutdown(signal) {
  console.log(`\n${signal} received; shutting down CMS API.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
