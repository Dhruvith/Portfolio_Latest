# Local CMS security

The CMS API is intentionally local-only. It binds to `127.0.0.1:8788` and accepts browser credentials only from these exact admin origins:

- `http://admin.localhost:4174`
- `http://localhost:4174`

It uses only Node.js built-ins. Do not expose port `8788` through a tunnel, router, reverse proxy, or public deployment.

## Initial setup

From the project root, run:

```powershell
node scripts/cms-setup.mjs
```

The script asks for a password without echoing it, derives a salted scrypt hash, and writes only the hash to `.env.cms.local`. It also adds `.env.cms.local` and `.cms-backups/` to `.gitignore` before writing secrets.

For a non-interactive shell, provide the password through the process environment rather than a command-line argument:

```powershell
$securePassword = Read-Host "CMS password" -AsSecureString
$credential = [System.Net.NetworkCredential]::new("", $securePassword)
$env:CMS_PASSWORD = $credential.Password
try { node scripts/cms-setup.mjs } finally { Remove-Item Env:CMS_PASSWORD }
```

Use `--force` only to rotate an existing password. Rotation invalidates all sessions when the server restarts.

## Start

```powershell
node scripts/cms-server.mjs
```

The admin frontend must include `credentials: "include"` and use the API hostname that matches its own hostname:

- From `http://admin.localhost:4174`, call `http://admin.localhost:8788`.
- From `http://localhost:4174`, call `http://localhost:8788`.

Matching the hostnames lets the `SameSite=Strict` session cookie work without weakening its policy.

## API contract

- `POST /api/login` with `{"password":"..."}` returns a CSRF token and sets a random, eight-hour `HttpOnly; SameSite=Strict` cookie.
- `GET /api/session` restores the authenticated state and returns the current CSRF token after a page reload.
- `GET /api/content` returns the authenticated contents of `public/content/portfolio.json`.
- `PUT /api/content` replaces that JSON document. Send the login/session token as `X-CSRF-Token`.
- `POST /api/logout` deletes the server-side session. Send the same CSRF header.

All browser requests must use an exact allowed `Origin`. Authenticated mutations require both the session cookie and CSRF token. Login attempts are rate-limited per direct socket address. The server deliberately ignores proxy-forwarding headers.

## Content protection

The API rejects request bodies larger than 256 KiB, excessive nesting/collection sizes, non-JSON values, and the prototype-manipulation keys `__proto__`, `prototype`, and `constructor`. Login bodies are capped at 8 KiB.

Successful writes use a temporary file plus an atomic rename. Before replacing an existing document, the server copies it to a timestamped file in `.cms-backups/`. Backups are local and ignored by Git. Restore one by stopping the server and copying the selected backup to `public/content/portfolio.json`.

## Security boundaries

- Sessions live only in server memory and disappear on restart.
- The cookie omits `Secure` because this service is deliberately plain HTTP on loopback. Do not change the bind address or expose it. If this becomes a networked service, add TLS, a durable session store, stronger operational monitoring, and a new deployment-specific threat review.
- The CMS protects the authoring API; `public/content/portfolio.json` remains a public site asset by design.
- Keep `.env.cms.local` private. Never paste it into source, screenshots, issues, or chat.

## Manual smoke test

Use the real password only in your local shell. The following checks login, authenticated content access, a CSRF-protected save, and logout:

```powershell
$origin = "http://localhost:4174"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$securePassword = Read-Host "CMS password" -AsSecureString
$password = [System.Net.NetworkCredential]::new("", $securePassword).Password
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:8788/api/login" -WebSession $session -Headers @{ Origin = $origin } -ContentType "application/json" -Body (@{ password = $password } | ConvertTo-Json)
$password = $null
Invoke-RestMethod -Method Get -Uri "http://localhost:8788/api/content" -WebSession $session -Headers @{ Origin = $origin }
$content = Get-Content -Raw "public/content/portfolio.json" | ConvertFrom-Json
Invoke-RestMethod -Method Put -Uri "http://localhost:8788/api/content" -WebSession $session -Headers @{ Origin = $origin; "X-CSRF-Token" = $login.csrfToken } -ContentType "application/json" -Body ($content | ConvertTo-Json -Depth 20)
Invoke-RestMethod -Method Post -Uri "http://localhost:8788/api/logout" -WebSession $session -Headers @{ Origin = $origin; "X-CSRF-Token" = $login.csrfToken } -ContentType "application/json" -Body "{}"
```

Expected negative tests:

```powershell
# Disallowed origin: 403
Invoke-WebRequest -Method Post -Uri "http://localhost:8788/api/login" -Headers @{ Origin = "http://evil.localhost:4174" } -ContentType "application/json" -Body '{"password":"wrong"}' -SkipHttpErrorCheck

# Missing authentication: 401
Invoke-WebRequest -Method Get -Uri "http://localhost:8788/api/content" -Headers @{ Origin = "http://localhost:4174" } -SkipHttpErrorCheck

# Missing CSRF after authentication: 403
Invoke-WebRequest -Method Put -Uri "http://localhost:8788/api/content" -WebSession $session -Headers @{ Origin = $origin } -ContentType "application/json" -Body '{}' -SkipHttpErrorCheck
```
