import { ArrowSquareOut, Check, FloppyDisk, LockKey, SignOut, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import {
  adminEmail,
  firebaseIsConfigured,
  loadCloudContent,
  publicSiteUrl,
  saveCloudContent,
  signInWithGoogle,
  signOutCloud,
  watchCloudSession,
} from "./firebaseRepository.js";

const API = `${window.location.hostname === "admin.localhost" ? "http://admin.localhost:8788" : "http://localhost:8788"}/api`;
const localHostnames = new Set(["localhost", "admin.localhost", "127.0.0.1"]);
const cloudMode = import.meta.env.VITE_CMS_BACKEND === "firebase" || !localHostnames.has(window.location.hostname);

const labels = {
  identity: "Identity",
  hero: "Opening",
  story: "Story",
  storyBeats: "Story transitions",
  timeline: "Timeline",
  experienceSection: "Experience intro",
  experience: "Experience",
  work: "Projects intro",
  projects: "Projects",
  educationSection: "Education intro",
  education: "Education",
  toolsSection: "Tools intro",
  tools: "Public tools",
  principlesSection: "Principles intro",
  principles: "Principles",
  stack: "Stack",
  musicSection: "Music intro",
  musicPlaylists: "Music playlists",
  signals: "About intro",
  placesSection: "Places intro",
  places: "Places",
  lifeNotes: "Life notes",
  contact: "Contact",
};

const collectionTemplates = {
  tools: {
    id: "",
    title: "",
    description: "",
    status: "Available",
    url: "",
    embedUrl: "",
    stack: "",
  },
  musicPlaylists: {
    id: "",
    title: "",
    note: "",
    url: "",
  },
};

const sectionOrder = [
  "identity", "hero",
  "educationSection", "education",
  "work", "projects",
  "experienceSection", "experience",
  "story", "timeline", "storyBeats",
  "toolsSection", "tools",
  "principlesSection", "principles", "stack",
  "musicSection", "musicPlaylists",
  "signals", "lifeNotes", "placesSection", "places",
  "contact",
];

function humanize(value) {
  return String(value).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

function cloneWith(root, path, value) {
  const next = structuredClone(root);
  let cursor = next;
  for (let index = 0; index < path.length - 1; index += 1) cursor = cursor[path[index]];
  cursor[path.at(-1)] = value;
  return next;
}

function blankLike(value) {
  if (Array.isArray(value)) return value.map(blankLike);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, blankLike(item)]));
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return "";
}

function Field({ name, value, path, root, setRoot }) {
  if (Array.isArray(value)) {
    return (
      <fieldset className="collection">
        <legend>{humanize(name)} <span>{value.length}</span></legend>
        <div className="collection-list">
          {value.map((item, index) => (
            <div className="collection-item" key={`${path.join(".")}-${index}`}>
              <div className="item-index">{String(index + 1).padStart(2, "0")}</div>
              <Field name={typeof item === "object" ? `${humanize(name)} ${index + 1}` : `${index + 1}`} value={item} path={[...path, index]} root={root} setRoot={setRoot} />
              <button className="remove" type="button" onClick={() => setRoot(cloneWith(root, path, value.filter((_, itemIndex) => itemIndex !== index)))}>Remove</button>
            </div>
          ))}
        </div>
        <button className="secondary" type="button" onClick={() => setRoot(cloneWith(root, path, [...value, blankLike(value[0] ?? collectionTemplates[name] ?? "")]))}>Add item</button>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    return (
      <fieldset className="group">
        <legend>{humanize(name)}</legend>
        <div className="field-grid">
          {Object.entries(value).map(([key, item]) => (
            <Field key={key} name={key} value={item} path={[...path, key]} root={root} setRoot={setRoot} />
          ))}
        </div>
      </fieldset>
    );
  }

  const long = String(value).length > 72 || /copy|body|summary|decision|result|description/i.test(name);
  return (
    <label className={long ? "field wide" : "field"}>
      <span>{humanize(name)}</span>
      {long ? (
        <textarea value={value ?? ""} rows={Math.max(3, Math.ceil(String(value).length / 72))} onChange={(event) => setRoot(cloneWith(root, path, event.target.value))} />
      ) : (
        <input value={value ?? ""} onChange={(event) => setRoot(cloneWith(root, path, event.target.value))} />
      )}
    </label>
  );
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { credentials: "include", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function Login({ onLogin, cloud = false, message = "" }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (cloud) {
        await signInWithGoogle();
      } else {
        const result = await api("/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
        onLogin(result.csrfToken);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-card">
        <span className="eyebrow">{cloud ? "PRIVATE CONTENT STUDIO" : "LOCAL CONTENT STUDIO"}</span>
        <LockKey size={34} weight="light" />
        <h1>Private by default.</h1>
        <p>{cloud ? `Only the verified ${adminEmail} Google account can save changes.` : "This editor only talks to the CMS process bound to this computer."}</p>
        <form onSubmit={submit}>
          {!cloud && <label><span>Password</span><input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>}
          {(error || message) && <div className="error"><WarningCircle /> {error || message}</div>}
          <button type="submit" disabled={busy || (!cloud && !password)}>{busy ? "Checking…" : cloud ? "Continue with Google" : "Unlock studio"}</button>
        </form>
      </section>
    </main>
  );
}

export function App() {
  const [csrf, setCsrf] = useState("");
  const [content, setContent] = useState(null);
  const [saved, setSaved] = useState(null);
  const [section, setSection] = useState("identity");
  const [status, setStatus] = useState("Checking session…");
  const [sessionMessage, setSessionMessage] = useState("");

  useEffect(() => {
    if (cloudMode) {
      if (!firebaseIsConfigured()) {
        setSessionMessage("Add the Firebase web configuration to .env.local before deploying this studio.");
        setStatus("signed-out");
        return undefined;
      }

      let unsubscribe;
      watchCloudSession(async (user) => {
        if (!user) {
          setContent(null);
          setStatus("signed-out");
          return;
        }
        if (!user.emailVerified || user.email !== adminEmail) {
          await signOutCloud();
          setSessionMessage(`Use the verified ${adminEmail} Google account.`);
          return;
        }
        try {
          const payload = await loadCloudContent();
          setContent(payload);
          setSaved(structuredClone(payload));
          setSessionMessage("");
          setStatus("ready");
        } catch (error) {
          setSessionMessage(error.message);
          setStatus("signed-out");
        }
      }).then((stop) => { unsubscribe = stop; }).catch((error) => {
        setSessionMessage(error.message);
        setStatus("signed-out");
      });
      return () => unsubscribe?.();
    }

    api("/session").then((result) => {
      if (!result.authenticated) return setStatus("signed-out");
      setCsrf(result.csrfToken);
      return api("/content").then((payload) => { setContent(payload); setSaved(payload); setStatus("ready"); });
    }).catch(() => setStatus("signed-out"));
    return undefined;
  }, []);

  const dirty = useMemo(() => content && saved && JSON.stringify(content) !== JSON.stringify(saved), [content, saved]);
  const editorSections = useMemo(() => {
    if (!content) return [];
    const rank = new Map(sectionOrder.map((key, index) => [key, index]));
    return Object.keys(content).sort((left, right) => (rank.get(left) ?? 999) - (rank.get(right) ?? 999));
  }, [content]);

  const finishLogin = async (token) => {
    setCsrf(token);
    const payload = await api("/content");
    setContent(payload);
    setSaved(payload);
    setStatus("ready");
  };

  const save = async () => {
    setStatus("saving");
    try {
      if (cloudMode) await saveCloudContent(content);
      else await api("/content", { method: "PUT", headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf }, body: JSON.stringify(content) });
      setSaved(structuredClone(content));
      setStatus("saved");
      setTimeout(() => setStatus("ready"), 1600);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const logout = async () => {
    if (cloudMode) await signOutCloud().catch(() => {});
    else await api("/logout", { method: "POST", headers: { "X-CSRF-Token": csrf } }).catch(() => {});
    setContent(null);
    setStatus("signed-out");
  };

  if (status === "Checking session…") return <main className="loading">Checking local session…</main>;
  if (status === "signed-out" || !content) return <Login onLogin={finishLogin} cloud={cloudMode} message={sessionMessage} />;

  return (
    <div className="studio">
      <aside className="sidebar">
        <div><span className="eyebrow">DHRUVITH</span><h1>Content Studio</h1><p>{cloudMode ? "Firebase editor" : "Local editor"}</p></div>
        <nav>
          {editorSections.map((key) => <button className={section === key ? "active" : ""} key={key} onClick={() => setSection(key)}>{labels[key] || humanize(key)}</button>)}
        </nav>
        <button className="logout" onClick={logout}><SignOut /> Sign out</button>
      </aside>
      <main className="editor">
        <header className="editor-header">
          <div><span className="eyebrow">EDITING</span><h2>{labels[section] || humanize(section)}</h2></div>
          <div className="actions">
            <a href={publicSiteUrl} target="_blank" rel="noreferrer">View site <ArrowSquareOut /></a>
            <button className="save" onClick={save} disabled={!dirty || status === "saving"}><FloppyDisk /> {status === "saving" ? "Saving…" : "Save changes"}</button>
          </div>
        </header>
        <div className="save-state" aria-live="polite">
          {status === "saved" ? <><Check /> Saved. Refresh the portfolio to see it.</> : dirty ? "Unsaved changes" : status === "ready" ? "All changes saved" : status}
        </div>
        <section className="form-surface">
          <Field name={section} value={content[section]} path={[section]} root={content} setRoot={setContent} />
        </section>
      </main>
    </div>
  );
}
