import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Buildings,
  CaretDown,
  DownloadSimple,
  EnvelopeSimple,
  FilmSlate,
  GithubLogo,
  LinkedinLogo,
  List,
  ListBullets,
  MapPin,
  MapTrifold,
  MagnifyingGlass,
  MusicNotes,
  Pause,
  Play,
  Shuffle,
  Crosshair,
  SkipBack,
  SkipForward,
  Toolbox,
  Trophy,
  X,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "leaflet/dist/leaflet.css";
import Lenis from "lenis";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadPortfolioContent } from "./lib/portfolioContent.js";
import {
  identity, hero, story, work, educationSection, toolsSection, tools,
  experienceSection, musicSection, musicPlaylists, signals, placesSection,
  lifeNotes, contact, experience, projects, timeline, education, stack,
} from "../public/content/portfolio.json";

gsap.registerPlugin(ScrollTrigger);

// One editorial source for both the initial render and the local CMS.
// Keep the large travel dataset out of the initial JavaScript; the CMS fetch loads it.
const fallbackContent = {
  identity, hero, story, work, educationSection, toolsSection, tools,
  experienceSection, musicSection, musicPlaylists, signals, placesSection,
  lifeNotes, contact, experience, projects, timeline, education, stack, places: [],
};

const sectionMeta = {
  top: { label: "Opening" },
  education: { label: "Education" },
  work: { label: "Projects" },
  experience: { label: "Experience" },
  story: { label: "Method" },
  tools: { label: "Tools" },
  principles: { label: "Principles" },
  music: { label: "Music" },
  signals: { label: "More about me" },
  contact: { label: "Contact" },
};

function ExperienceRow({ item }) {
  return (
    <article className="experience-row" data-reveal>
      <div className="experience-role">
        <small>{item.year}</small>
        <h3>{item.role}</h3>
        <p><Buildings size={15} weight="light" /> {item.company} · {item.location}</p>
      </div>
      <div className="experience-scope">
        <p>{item.summary}</p>
        <ul aria-label={`${item.role} highlights`}>
          {item.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
        </ul>
      </div>
      <p className="experience-stack">{item.stack}</p>
    </article>
  );
}

function ProjectRow({ project, open, onToggle }) {
  return (
    <article className={`project-row${open ? " is-open" : ""}`} data-reveal>
      <button className="project-trigger" type="button" onClick={onToggle} aria-expanded={open} aria-controls={`project-${project.id}`}>
        <span className="project-title-block">
          <small>{project.kind}</small>
          <strong>{project.title}</strong>
        </span>
        <span className="project-summary">{project.summary}</span>
        <span className="project-year">{project.year}</span>
        <CaretDown className="project-caret" size={22} />
      </button>
      <div className="project-details" id={`project-${project.id}`} hidden={!open}>
        <div>
          <small>Implementation</small>
          <p>{project.decision}</p>
        </div>
        <div>
          <small>Outcome</small>
          <p>{project.result}</p>
        </div>
        <div>
          <small>Relevant stack</small>
          <p>{project.stack}</p>
          {(project.liveUrl || project.sourceUrl) && (
            <span className="project-actions">
              {project.title === "DFinance Manager" ? <a href="#tools">Try it here <ArrowRight size={14} /></a> : project.liveUrl && <a href={normalizeHttpsUrl(project.liveUrl)} target="_blank" rel="noreferrer">Open project <ArrowUpRight size={14} /></a>}
              {project.sourceUrl && <a href={project.sourceUrl} target="_blank" rel="noreferrer">Source <GithubLogo size={14} /></a>}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function ToolCard({ tool, onLaunch }) {
  const safeUrl = normalizeHttpsUrl(tool.url);
  const safeEmbedUrl = normalizeHttpsUrl(tool.embedUrl);
  const runsHere = tool.kind === "native" || Boolean(safeEmbedUrl);
  const content = (
    <>
      <span className="tool-status">{tool.status || "Available"}</span>
      <div>
        <h3>{tool.title}</h3>
        <p>{tool.description}</p>
      </div>
      <small>{tool.stack}</small>
      {runsHere ? <span className="tool-action">Use here <ArrowRight size={18} /></span> : safeUrl && <ArrowUpRight size={20} aria-hidden="true" />}
    </>
  );

  if (runsHere) {
    return <button className={`tool-card${tool.id === "ai-news" ? " is-featured" : ""}`} type="button" onClick={() => onLaunch({ ...tool, url: safeUrl, embedUrl: safeEmbedUrl })} data-reveal>{content}</button>;
  }

  return safeUrl ? (
    <a className="tool-card" href={safeUrl} target="_blank" rel="noreferrer" data-reveal>{content}</a>
  ) : (
    <article className="tool-card is-pending" data-reveal>{content}</article>
  );
}

const financeModes = {
  sip: {
    label: "SIP",
    title: "Systematic Investment Plan",
    description: "Estimate the future value of a monthly investment.",
    resultLabel: "Estimated corpus",
    fields: [
      ["principal", "Monthly investment", "5000"],
      ["rate", "Expected return", "12"],
      ["time", "Time period", "10"],
    ],
  },
  swp: {
    label: "SWP",
    title: "Systematic Withdrawal Plan",
    description: "Project the balance left after regular monthly withdrawals.",
    resultLabel: "Projected balance",
    fields: [
      ["principal", "Initial investment", "1000000"],
      ["rate", "Expected return", "8"],
      ["time", "Time period", "20"],
      ["withdrawal", "Monthly withdrawal", "5000"],
    ],
  },
  loan: {
    label: "Loan EMI",
    title: "Loan repayment",
    description: "Calculate the monthly repayment for a fixed-rate loan.",
    resultLabel: "Monthly EMI",
    fields: [
      ["principal", "Loan amount", "1000000"],
      ["rate", "Interest rate", "8.5"],
      ["time", "Loan tenure", "20"],
    ],
  },
  fd: {
    label: "Fixed deposit",
    title: "Fixed deposit growth",
    description: "Estimate maturity value using annual compounding.",
    resultLabel: "Maturity value",
    fields: [
      ["principal", "Deposit amount", "100000"],
      ["rate", "Interest rate", "7"],
      ["time", "Time period", "5"],
    ],
  },
};

function DFinanceManager() {
  const [mode, setMode] = useState("sip");
  const [result, setResult] = useState(null);
  const activeMode = financeModes[mode];
  const formatCurrency = (value) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

  const calculate = (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const principal = Number(values.principal);
    const annualRate = Number(values.rate);
    const years = Number(values.time);
    const monthlyRate = annualRate / 1200;
    const months = years * 12;
    let nextResult = 0;

    if (mode === "sip") {
      nextResult = monthlyRate === 0
        ? principal * months
        : principal * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    } else if (mode === "swp") {
      nextResult = principal;
      for (let month = 0; month < months; month += 1) nextResult = nextResult * (1 + monthlyRate) - Number(values.withdrawal);
    } else if (mode === "loan") {
      nextResult = monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    } else {
      nextResult = principal * Math.pow(1 + annualRate / 100, years);
    }

    setResult(Number.isFinite(nextResult) ? Math.round(nextResult) : null);
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setResult(null);
  };

  return (
    <div className="dfinance-app">
      <aside aria-label="Finance calculators">
        <span>DF / CALCULATORS</span>
        <nav>
          {Object.entries(financeModes).map(([key, item]) => (
            <button className={mode === key ? "is-active" : ""} type="button" onClick={() => changeMode(key)} key={key}>
              {item.label}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          ))}
        </nav>
        <small>Planning estimates only. Not financial advice.</small>
      </aside>
      <div className="dfinance-calculator">
        <header>
          <span>{activeMode.label}</span>
          <h3>{activeMode.title}</h3>
          <p>{activeMode.description}</p>
        </header>
        <form onSubmit={calculate} key={mode}>
          <div className="dfinance-fields">
            {activeMode.fields.map(([name, label, placeholder]) => (
              <label key={name}>
                <span>{label}</span>
                <span className="dfinance-input">
                  {name === "principal" || name === "withdrawal" ? <b>₹</b> : null}
                  <input name={name} type="number" min="0" step="any" defaultValue={placeholder} required />
                  {name === "rate" ? <b>%</b> : name === "time" ? <b>yr</b> : null}
                </span>
              </label>
            ))}
          </div>
          <button className="dfinance-submit" type="submit">Calculate <ArrowRight size={18} /></button>
        </form>
        <div className={`dfinance-result${result === null ? " is-empty" : ""}`} aria-live="polite">
          <small>{activeMode.resultLabel}</small>
          <strong>{result === null ? "Enter values to see an estimate" : formatCurrency(result)}</strong>
        </div>
      </div>
    </div>
  );
}

function normalizeHttpsUrl(value, allowedHosts) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || (allowedHosts && !allowedHosts.includes(url.hostname))) return "";
    return url.href;
  } catch {
    return "";
  }
}

function normalizeNewsSource(value) {
  const safeUrl = normalizeHttpsUrl(value);
  if (!safeUrl) return "";
  const hostname = new URL(safeUrl).hostname.toLowerCase().replace(/^www\./, "");
  if (hostname === "x.com" || hostname === "reddit.com" || hostname.endsWith(".reddit.com") || hostname === "medium.com" || hostname.endsWith(".medium.com")) {
    return safeUrl;
  }
  return "";
}

function formatNewsDate(value, includeTime = false) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata", timeZoneName: "short" } : {}),
  }).format(date);
}

function AiNewsWorkbench() {
  const [feed, setFeed] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [view, setView] = useState("latest");
  const [source, setSource] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/ai-news.json", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("The briefing could not be loaded.");
        return response.json();
      })
      .then((data) => {
        setFeed(data);
        setLoadState("ready");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setLoadState("error");
      });
    return () => controller.abort();
  }, []);

  const items = Array.isArray(feed?.items) ? feed.items : [];
  const latestIds = new Set(feed?.editions?.[0]?.itemIds || items.slice(0, 5).map((item) => item.id));
  const latestItems = items.filter((item) => latestIds.has(item.id));
  const archiveItems = items.filter((item) => !latestIds.has(item.id));
  const visibleItems = (view === "latest" ? latestItems : archiveItems).filter((item) => source === "all" || item.sourceType === source);
  const sourceLabels = { all: "All sources", x: "X", reddit: "Reddit", medium: "Medium" };

  return (
    <div className="ai-news-app">
      <header className="ai-news-masthead">
        <div>
          <span>AI BRIEFING</span>
          <h3>Five developments worth your time.</h3>
          <p>AI, machine learning, and technology—with links to the original sources.</p>
        </div>
        <dl>
          <div><dt>EDITION</dt><dd>{feed?.generatedAt ? formatNewsDate(feed.generatedAt) : "First run pending"}</dd></div>
          <div><dt>SCHEDULE</dt><dd>08:15 IST</dd></div>
          <div><dt>ARCHIVE</dt><dd>{archiveItems.length} {archiveItems.length === 1 ? "story" : "stories"}</dd></div>
        </dl>
      </header>

      {feed?.generatedAt && Date.now() - Date.parse(feed.generatedAt) > 48 * 60 * 60 * 1000 && (
        <p className="ai-news-stale" role="status">You are reading the last published edition. A newer briefing is not available yet.</p>
      )}

      <div className="ai-news-controls">
        <div className="ai-news-view" role="tablist" aria-label="Briefing editions">
          <button type="button" role="tab" aria-selected={view === "latest"} className={view === "latest" ? "is-active" : ""} onClick={() => setView("latest")}>Latest five</button>
          <button type="button" role="tab" aria-selected={view === "archive"} className={view === "archive" ? "is-active" : ""} onClick={() => setView("archive")}>Archive</button>
        </div>
        <div className="ai-news-sources" aria-label="Filter by source">
          {Object.entries(sourceLabels).map(([id, label]) => (
            <button type="button" className={source === id ? "is-active" : ""} aria-pressed={source === id} onClick={() => setSource(id)} key={id}>{label}</button>
          ))}
        </div>
      </div>

      {loadState === "loading" && <div className="ai-news-message"><span />Loading the briefing…</div>}
      {loadState === "error" && <div className="ai-news-message is-error">The briefing is temporarily unavailable. The last validated edition will return here.</div>}
      {loadState === "ready" && !items.length && (
        <div className="ai-news-first-run">
          <span>READY FOR THE FIRST EDITION</span>
          <strong>The reader is connected.</strong>
          <p>The next validated edition is being prepared. Published briefings remain available here when a refresh is delayed.</p>
        </div>
      )}
      {loadState === "ready" && items.length > 0 && !visibleItems.length && (
        <div className="ai-news-message">No {source === "all" ? "archived" : sourceLabels[source]} stories in this view yet.</div>
      )}
      {visibleItems.length > 0 && (
        <ol className="ai-news-list">
          {visibleItems.map((item, index) => {
            const sourceUrl = normalizeNewsSource(item.sourceUrl);
            return (
              <li key={item.id || item.sourceUrl}>
                <span className="ai-news-index">{String(index + 1).padStart(2, "0")}</span>
                <article>
                  <div className="ai-news-meta">
                    <span className={`source-${item.sourceType}`}>{sourceLabels[item.sourceType] || "Source"}</span>
                    <time dateTime={item.publishedAt}>{formatNewsDate(item.publishedAt, true)}</time>
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.summary}</p>
                  <aside><strong>Why it matters</strong><span>{item.whyItMatters}</span></aside>
                  <footer>
                    <div>{(item.topics || []).map((topic) => <span key={topic}>{topic}</span>)}</div>
                    {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer">Read source <ArrowUpRight size={15} /></a>}
                  </footer>
                </article>
              </li>
            );
          })}
        </ol>
      )}
      <footer className="ai-news-note">Public posts are summarized for discovery. Follow the source link before relying on a claim.</footer>
    </div>
  );
}

function EducationRecord({ item }) {
  return (
    <div className="education-record" data-reveal>
      <div className="education-primary">
        <span>{item.period}</span>
        <h3>{item.institution}</h3>
        <p>{item.location}</p>
      </div>
      <div className="education-degree">
        <small>DEGREE</small>
        <strong>{item.degree}</strong>
        <p>CGPA <b>{item.cgpa}</b></p>
      </div>
      <details className="education-detail" onToggle={() => ScrollTrigger.refresh()}>
        <summary>Coursework, achievements & certifications</summary>
        <div>
          <small>RELEVANT COURSEWORK</small>
          <ul>{item.coursework.map((entry) => <li key={entry}>{entry}</li>)}</ul>
        </div>
        <div>
          <small>ACHIEVEMENTS</small>
          <ul>{item.achievements.map((entry) => <li key={entry}>{entry}</li>)}</ul>
        </div>
        <div>
          <small>CERTIFICATIONS</small>
          <ul>{item.certifications.map((entry) => <li key={entry}>{entry}</li>)}</ul>
        </div>
      </details>
    </div>
  );
}

function formatPlaybackTime(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function normalizeLocalAudioSource(value) {
  const source = String(value || "").trim();
  if (/^\/audio\/[a-z0-9/_().%+\- ]+\.(mp3|m4a|ogg|wav)$/i.test(source)) return source;
  return normalizeHttpsUrl(source);
}

function MinimalPlaylistPlayer({ playlist }) {
  const tracks = playlist.tracks || [];
  const audioRef = useRef(null);
  const pendingPlayRef = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState("");
  const currentTrack = tracks[currentIndex] || {};
  const audioSource = normalizeLocalAudioSource(currentTrack.audioSrc);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setPlaybackError("");
    if (audioSource && pendingPlayRef.current) {
      audio.play()
        .then(() => setPlaying(true))
        .catch(() => {
          setPlaying(false);
          setPlaybackError("Playback unavailable");
        });
    }
    pendingPlayRef.current = false;
  }, [audioSource, currentIndex, playlist.id]);

  const moveTrack = (direction) => {
    if (!tracks.length) return;
    const nextIndex = shuffle
      ? Math.floor(Math.random() * tracks.length)
      : (currentIndex + direction + tracks.length) % tracks.length;
    pendingPlayRef.current = playing && Boolean(normalizeLocalAudioSource(tracks[nextIndex]?.audioSrc));
    setCurrentIndex(nextIndex);
  };

  const chooseTrack = (index) => {
    if (!tracks[index]) return;
    pendingPlayRef.current = Boolean(normalizeLocalAudioSource(tracks[index].audioSrc));
    setCurrentIndex(index);
    setQueueOpen(false);
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audioSource || !audio) return;
    if (playing) audio.pause();
    else {
      setPlaybackError("");
      audio.play().catch(() => {
        setPlaying(false);
        setPlaybackError("Playback unavailable");
      });
    }
  };

  return (
    <div className="minimal-player">
      <audio
        ref={audioRef}
        src={audioSource || undefined}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onCanPlay={() => setPlaybackError("")}
        onError={() => {
          setPlaying(false);
          setPlaybackError("Playback unavailable");
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onEnded={() => moveTrack(1)}
      />
      <header className="minimal-player-header">
        <strong>{currentTrack.title || playlist.title}</strong>
        <div>
          <button className={shuffle ? "is-active" : ""} type="button" onClick={() => setShuffle((value) => !value)} disabled={!tracks.length} aria-label="Shuffle songs" aria-pressed={shuffle}><Shuffle size={16} /></button>
          <button type="button" onClick={() => setQueueOpen((value) => !value)} aria-expanded={queueOpen}><ListBullets size={16} /> Songs</button>
        </div>
      </header>
      <label className="minimal-progress">
        <span className="sr-only">Song position</span>
        <input type="range" min="0" max={Math.max(1, duration)} value={Math.min(currentTime, Math.max(1, duration))} onChange={(event) => { if (audioRef.current) audioRef.current.currentTime = Number(event.target.value); }} disabled={!audioSource || !duration} />
        <span className={playbackError ? "minimal-playback-error" : ""} aria-live="polite">
          {playbackError || `${formatPlaybackTime(currentTime)} / ${formatPlaybackTime(duration)}`}
        </span>
      </label>
      <div className="minimal-transport">
        <button type="button" onClick={() => moveTrack(-1)} disabled={!tracks.length} aria-label="Previous song"><SkipBack size={18} weight="fill" /></button>
        <button
          className="minimal-play"
          type="button"
          onClick={togglePlayback}
          disabled={!audioSource}
          aria-label={audioSource ? (playing ? "Pause" : "Play") : "Audio file required for in-page playback"}
          title={audioSource ? undefined : "Add the permitted audio file in Content Studio to enable playback"}
        >
          {playing ? <Pause size={25} weight="fill" /> : <Play size={25} weight="fill" />}
        </button>
        <button type="button" onClick={() => moveTrack(1)} disabled={!tracks.length} aria-label="Next song"><SkipForward size={18} weight="fill" /></button>
      </div>
      {queueOpen && (
        <aside className="minimal-queue" aria-label={`${playlist.title} songs`}>
          <header><strong>{playlist.title}</strong><button type="button" onClick={() => setQueueOpen(false)} aria-label="Close song list"><X size={17} /></button></header>
          <ol>
            {tracks.map((track, index) => (
              <li key={`${track.title}-${index}`}>
                <button className={index === currentIndex ? "is-current" : ""} type="button" onClick={() => chooseTrack(index)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{track.title}<small>{track.artist}</small></strong>
                  {index === currentIndex && <MusicNotes size={15} weight="fill" />}
                </button>
              </li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  );
}

function MinimalMusicExperience({ playlists }) {
  const availablePlaylists = (playlists || []).filter((playlist) => playlist?.title && playlist?.tracks?.length);
  const firstKey = availablePlaylists[0]?.id || availablePlaylists[0]?.url || "";
  const [activeKey, setActiveKey] = useState(firstKey);
  const active = availablePlaylists.find((playlist) => (playlist.id || playlist.url) === activeKey) || availablePlaylists[0];

  useEffect(() => {
    if (!availablePlaylists.some((playlist) => (playlist.id || playlist.url) === activeKey)) setActiveKey(firstKey);
  }, [activeKey, availablePlaylists, firstKey]);

  if (!active) return null;

  return (
    <article className="music-stage" data-reveal>
      <img className="music-stage-art" src={active.banner || "/images/music-telangana-golden-hour.png"} alt="Golden-hour countryside near Hyderabad" />
      <div className="music-stage-shade" aria-hidden="true" />
      <header className="music-stage-header">
        <div className="music-stage-brand"><strong>MUSIC I LOVE</strong><small>Selected by Dhruvith</small></div>
        {availablePlaylists.length > 1 ? (
          <nav aria-label="Choose a playlist">
            {availablePlaylists.map((playlist) => {
              const key = playlist.id || playlist.url;
              return <button className={key === (active.id || active.url) ? "is-active" : ""} type="button" onClick={() => setActiveKey(key)} key={key}>{playlist.tabLabel || playlist.title}</button>;
            })}
          </nav>
        ) : <span className="music-track-count">{active.tracks.length} tracks</span>}
      </header>
      <div className="music-stage-title">
        <h3>{active.title}</h3>
        <p>{active.note}</p>
      </div>
      <div className="minimal-player-dock"><MinimalPlaylistPlayer playlist={active} key={active.id || active.url} /></div>
    </article>
  );
}

function TravelMap({ places }) {
  const mapNode = useRef(null);
  const mapInstance = useRef(null);
  const mapRuntime = useRef(null);
  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const validPlaces = useMemo(
    () => places.filter((place) => Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng)) && Math.abs(Number(place.lat)) <= 90 && Math.abs(Number(place.lng)) <= 180),
    [places],
  );
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return validPlaces.filter((place) => [place.city, place.note, place.firstVisited, place.lastVisited]
      .some((value) => String(value || "").toLowerCase().includes(normalized))).slice(0, 7);
  }, [query, validPlaces]);

  const formatVisitDate = (value) => {
    if (!value) return "Unknown";
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  };

  const focusPlace = (place) => {
    setSelectedPlace(place);
    setQuery("");
    mapInstance.current?.flyTo([Number(place.lat), Number(place.lng)], 16, { duration: 0.8 });
  };

  const fitAll = () => {
    setSelectedPlace(null);
    const runtime = mapRuntime.current;
    if (runtime?.bounds) runtime.map.fitBounds(runtime.bounds.pad(0.08), { maxZoom: 8, animate: true, duration: 0.75 });
  };

  useEffect(() => {
    if (!mapNode.current || mapInstance.current || !validPlaces.length) return undefined;
    let disposed = false;
    Promise.all([import("leaflet"), import("supercluster")]).then(([{ default: Leaflet }, { default: Supercluster }]) => {
      if (disposed || !mapNode.current) return;
      const bounds = Leaflet.latLngBounds(validPlaces.map((place) => [Number(place.lat), Number(place.lng)]));
      const map = Leaflet.map(mapNode.current, {
        attributionControl: true,
        boxZoom: true,
        doubleClickZoom: true,
        markerZoomAnimation: true,
        scrollWheelZoom: true,
        wheelDebounceTime: 28,
        wheelPxPerZoomLevel: 90,
        zoomAnimation: true,
        zoomControl: false,
      });
      Leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      Leaflet.control.zoom({ position: "bottomright" }).addTo(map);

      const pointIndex = new Supercluster({ radius: 42, maxZoom: 17 }).load(validPlaces.map((place) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [Number(place.lng), Number(place.lat)] },
        properties: { place },
      })));
      const visibleLayer = Leaflet.layerGroup().addTo(map);

      const placeMarker = (place, coordinates) => {
        const tooltip = document.createElement("span");
        const title = document.createElement("strong");
        const detail = document.createElement("small");
        title.textContent = place.city;
        detail.textContent = `${place.note || "Visited"} · last ${formatVisitDate(place.lastVisited)}`;
        tooltip.append(title, detail);

        const marker = Leaflet.marker([coordinates[1], coordinates[0]], {
          keyboard: true,
          title: place.city,
          icon: Leaflet.divIcon({
            className: "atlas-point",
            html: "<span></span><i></i>",
            iconSize: [28, 36],
            iconAnchor: [14, 34],
            tooltipAnchor: [0, -28],
          }),
        }).bindTooltip(tooltip, { direction: "top", offset: [0, -8], opacity: 1 });
        marker.on("click", () => {
          setSelectedPlace(place);
          marker.openTooltip();
        });
        return marker;
      };

      if (validPlaces.length === 1) map.setView(bounds.getCenter(), 11, { animate: false });
      else map.fitBounds(bounds.pad(0.35), { maxZoom: 6, animate: false });

      const renderVisiblePoints = () => {
        visibleLayer.clearLayers();
        const view = map.getBounds();
        const zoom = Math.max(0, Math.min(17, Math.round(map.getZoom())));
        pointIndex.getClusters([view.getWest(), view.getSouth(), view.getEast(), view.getNorth()], zoom).forEach((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          if (feature.properties.cluster) {
            const count = Number(feature.properties.point_count);
            const clusterMarker = Leaflet.marker([lat, lng], {
              icon: Leaflet.divIcon({
                className: "atlas-cluster",
                html: `<span>${count}</span>`,
                iconSize: [42, 42],
              }),
            });
            clusterMarker.on("click", () => {
              const nextZoom = Math.min(pointIndex.getClusterExpansionZoom(feature.properties.cluster_id), 17);
              map.setView([lat, lng], nextZoom, { animate: true });
            });
            visibleLayer.addLayer(clusterMarker);
          } else {
            visibleLayer.addLayer(placeMarker(feature.properties.place, feature.geometry.coordinates));
          }
        });
      };

      map.on("moveend", renderVisiblePoints);
      renderVisiblePoints();

      mapInstance.current = map;
      mapRuntime.current = { map, bounds };
    });
    return () => {
      disposed = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      mapRuntime.current = null;
    };
  }, [validPlaces]);

  return (
    <div className="atlas-layout" aria-label={`${validPlaces.length} visited places`}>
      <div ref={mapNode} className="atlas-map" role="application" aria-label="Interactive visited-places map. Zoom in and hover or tap a marker for details." />
      <div className="atlas-search">
        <MagnifyingGlass size={19} weight="bold" aria-hidden="true" />
        <input
          aria-label="Search visited places"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${validPlaces.length} saved places`}
          type="search"
          value={query}
        />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear place search"><X size={17} /></button>}
        {matches.length > 0 && (
          <div className="atlas-results">
            {matches.map((place) => (
              <button type="button" key={place.id} onClick={() => focusPlace(place)}>
                <MapPin size={17} weight="fill" />
                <span><strong>{place.city}</strong><small>{place.note} · {formatVisitDate(place.lastVisited)}</small></span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="atlas-fit" type="button" onClick={fitAll} aria-label="Fit all visited places on map">
        <Crosshair size={20} weight="bold" />
      </button>
      <div className="atlas-count"><MapPin size={15} weight="fill" /><strong>{validPlaces.length}</strong> places</div>
      {selectedPlace && (
        <aside className="atlas-place-card" aria-live="polite">
          <button type="button" onClick={() => setSelectedPlace(null)} aria-label="Close place details"><X size={17} /></button>
          <span>VISITED PLACE</span>
          <h4>{selectedPlace.city}</h4>
          <div><strong>{selectedPlace.visitCount || 1}</strong><small>VISITS</small></div>
          <p><span>First</span>{formatVisitDate(selectedPlace.firstVisited)}</p>
          <p><span>Latest</span>{formatVisitDate(selectedPlace.lastVisited)}</p>
        </aside>
      )}
      <div className="atlas-hint" aria-hidden="true">
        <i /> <span>Scroll to zoom · drag to explore</span>
      </div>
    </div>
  );
}

export function App() {
  const [openProject, setOpenProject] = useState("02");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [content, setContent] = useState(fallbackContent);
  const [activeSection, setActiveSection] = useState("top");
  const workbenchRef = useRef(null);
  const toolTriggerRef = useRef(null);

  useEffect(() => {
    ScrollTrigger.refresh();
  }, [content, openProject]);

  useEffect(() => {
    if (!activeTool || !workbenchRef.current) return;
    workbenchRef.current.focus({ preventScroll: true });
    workbenchRef.current.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    ScrollTrigger.refresh();
  }, [activeTool]);

  const launchTool = (tool) => {
    toolTriggerRef.current = document.activeElement;
    setActiveTool(tool);
  };
  const closeTool = () => {
    setActiveTool(null);
    toolTriggerRef.current?.focus({ preventScroll: true });
  };


  useEffect(() => {
    loadPortfolioContent()
      .then((data) => setContent({ ...fallbackContent, ...data }))
      .catch(() => setContent(fallbackContent));
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = reduceMotion ? null : new Lenis({
      duration: 0.8,
      easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.12,
    });
    let rafId;

    const raf = (time) => {
      lenis?.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    if (lenis) rafId = requestAnimationFrame(raf);

    const updateProgress = () => {
      const marker = window.innerHeight * 0.42;
      let current = "top";
      Object.keys(sectionMeta).forEach((id) => {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= marker) current = id;
      });
      setActiveSection((previous) => (previous === current ? previous : current));
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    const context = gsap.context(() => {
      if (reduceMotion) return;

      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".site-nav", { y: -14, opacity: 0, duration: 0.5 }, 0)
        .from(".hero-media", { x: 24, opacity: 0.35, duration: 0.85 }, 0.08)
        .from(".hero-line", { y: 30, opacity: 0, duration: 0.78, stagger: 0.08 }, 0.12)
        .from(".hero-support", { y: 16, opacity: 0, duration: 0.52 }, 0.42)
        .from(".hero-chapter", { y: 18, opacity: 0, duration: 0.52 }, 0.58);

      gsap.utils.toArray("[data-reveal]").forEach((node) => {
        const isHeading = node.matches(".section-heading, .music-heading");
        gsap.from(isHeading ? Array.from(node.children) : node, {
          y: isHeading ? 24 : 28,
          opacity: 0,
          duration: isHeading ? 0.9 : 0.76,
          stagger: isHeading ? 0.075 : 0,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: node, start: "top 86%", once: true },
        });
      });

      gsap.to(".music-stage-art", {
        yPercent: 5,
        scale: 1.035,
        ease: "none",
        scrollTrigger: { trigger: ".music-stage", start: "top bottom", end: "bottom top", scrub: 0.7 },
      });

      gsap.timeline({
        scrollTrigger: { trigger: ".contact-section footer", start: "top 88%", once: true },
      })
        .fromTo(".footer-signature-word", {
          clipPath: "inset(-12% 100% -18% 0)",
          x: -7,
          filter: "blur(1.5px)",
        }, {
          clipPath: "inset(-12% -6% -18% 0)",
          x: 0,
          filter: "blur(0px)",
          duration: 1.45,
          ease: "power2.inOut",
        })
        .fromTo(".footer-signature-dot", {
          y: -18,
          scale: 0,
          opacity: 0,
        }, {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.38,
          ease: "back.out(2.8)",
        }, "-=0.06")
        .fromTo(".footer-signature", {
          rotate: -4.5,
        }, {
          rotate: -3,
          duration: 0.6,
          ease: "elastic.out(1, 0.48)",
        }, "-=0.22");

      gsap.utils.toArray(".timeline-row").forEach((node) => {
        ScrollTrigger.create({
          trigger: node,
          start: "top 62%",
          end: "bottom 38%",
          toggleClass: { targets: node, className: "is-active" },
        });
      });
    });

    const handleKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("keydown", handleKey);
      context.revert();
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="portfolio-shell">
      <a className="skip-link" href="#education">Skip to content</a>
      <div className="grain" aria-hidden="true" />

      <header className="site-nav">
        <a className="nav-identity" href="#top" aria-label="Dhruvith Chokkarapu, home" aria-current={activeSection === "top" ? "location" : undefined}>
          <strong>{content.identity.name.toUpperCase()}</strong>
          <i aria-hidden="true" />
          <span>{content.identity.role}, {content.identity.city}</span>
        </a>
        <button className="menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation">
          {menuOpen ? <X size={22} /> : <List size={22} />}
        </button>
        <nav className={menuOpen ? "is-open" : ""} aria-label="Primary navigation">
          <a className={activeSection === "education" ? "is-active" : ""} href="#education" aria-current={activeSection === "education" ? "location" : undefined} onClick={closeMenu}>Education</a>
          <a className={activeSection === "work" ? "is-active" : ""} href="#work" aria-current={activeSection === "work" ? "location" : undefined} onClick={closeMenu}>Projects</a>
          <a className={activeSection === "experience" ? "is-active" : ""} href="#experience" aria-current={activeSection === "experience" ? "location" : undefined} onClick={closeMenu}>Experience</a>
          <a className={activeSection === "tools" ? "is-active" : ""} href="#tools" aria-current={activeSection === "tools" ? "location" : undefined} onClick={closeMenu}>Tools</a>
          <a className={["music", "signals"].includes(activeSection) ? "is-active" : ""} href="#music" aria-current={["music", "signals"].includes(activeSection) ? "location" : undefined} onClick={closeMenu}>Outside work</a>
          <a className={activeSection === "contact" ? "is-active" : ""} href="#contact" aria-current={activeSection === "contact" ? "location" : undefined} onClick={closeMenu}>Contact</a>
          <a className="resume-link" href="/Dhruvith_Chokkarapu_Resume.pdf" download onClick={closeMenu}>
            Resume <ArrowUpRight size={15} weight="bold" />
          </a>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="hero-eyebrow hero-support">{content.identity.role} <span> / {content.identity.city}</span></p>
            <h1>
              <span className="hero-line-wrap"><span className="hero-line">{content.hero.lineOne}</span></span>
              <span className="hero-line-wrap"><span className="hero-line"><em>{content.hero.lineTwo}</em></span></span>
            </h1>
            <p className="hero-description hero-support">
              {content.hero.description}
            </p>
            <div className="hero-actions hero-support">
              <a href="#work">Explore my work <ArrowDown size={18} /></a>
              <a href="#tools">Try my tools <ArrowUpRight size={18} /></a>
            </div>
          </div>

          <aside className="hero-media current-work" aria-label="Current work">
            <span className="current-work-label">{content.hero.currentLabel}</span>
            <h2>{content.hero.currentTitle}</h2>
            <p>{content.experience[0].summary}</p>
            <ul>{content.experience[0].highlights.map((item) => <li key={item}>{item}</li>)}</ul>
            <a href="#experience">More about my role <ArrowUpRight size={18} /></a>
          </aside>

          <a className="hero-chapter" href="#education">
            <strong>{content.hero.chapter}<br /><em>{content.hero.chapterEmphasis}</em></strong>
            <ArrowRight size={22} />
            <div className="hero-feature">
              <small>THE JOURNEY</small>
              <b>VIT → Projects → Production</b>
              <p>Education, experiments, and the work that followed.</p>
            </div>
            <div className="hero-scroll"><i><b /></i><small>SCROLL</small></div>
          </a>
        </section>

        <section className="education-section" id="education">
          <header className="section-heading compact" data-reveal>
            <span>{content.educationSection.label}</span>
            <h2>{content.educationSection.heading} <em>{content.educationSection.emphasis}</em></h2>
            <p>{content.educationSection.copy}</p>
          </header>
          <EducationRecord item={content.education} />
        </section>

        <section className="work-section" id="work">
          <header className="section-heading compact" data-reveal>
            <span>{content.work.label}</span>
            <h2>{content.work.heading} <em>{content.work.emphasis}</em></h2>
            <p>{content.work.copy}</p>
          </header>
          <div className="project-list">
            {content.projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                open={openProject === project.id}
                onToggle={() => setOpenProject((current) => (current === project.id ? "" : project.id))}
              />
            ))}
          </div>
        </section>

        <section className="experience-section" id="experience">
          <header className="section-heading compact" data-reveal>
            <span>{content.experienceSection.label}</span>
            <h2>{content.experienceSection.heading} <em>{content.experienceSection.emphasis}</em></h2>
            <p>{content.experienceSection.copy}</p>
          </header>
          <div className="experience-list">
            {content.experience.map((item) => <ExperienceRow item={item} key={item.id} />)}
          </div>
        </section>

        <section className="story-section" id="story">
          <header className="section-heading" data-reveal>
            <span>{content.story.label}</span>
            <h2>{content.story.heading} <em>{content.story.emphasis}</em></h2>
            <p>{content.story.copy}</p>
          </header>
          <div className="timeline">
            {content.timeline.map((item) => (
              <article className="timeline-row" key={item.number} data-reveal>
                <div><small>{item.time}</small><strong>{item.place}</strong></div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          <blockquote className="story-belief" data-reveal>
            <span>Engineer, not developer.</span>
            <strong>{content.story.beliefLead} {content.story.beliefBody} <em>{content.story.beliefEmphasis}</em></strong>
          </blockquote>
          <div className="stack-ledger" data-reveal>
            <header><span>TECHNOLOGIES I WORK WITH</span></header>
            <div>{content.stack.map(([name, logo]) => (
              <span className="stack-item" key={name}><img src={logo} alt="" aria-hidden="true" /><b>{name}</b></span>
            ))}</div>
          </div>
        </section>

        <section className="tools-section" id="tools">
          <header className="section-heading compact" data-reveal>
            <span>{content.toolsSection.label}</span>
            <h2>{content.toolsSection.heading} <em>{content.toolsSection.emphasis}</em></h2>
            <p>{content.toolsSection.copy}</p>
          </header>
          {content.tools.length ? (
            <div className="tool-grid">
              {content.tools.map((tool) => <ToolCard tool={tool} onLaunch={launchTool} key={tool.id || tool.title} />)}
            </div>
          ) : (
            <div className="tool-empty" data-reveal>
              <Toolbox size={30} weight="light" />
              <span><small>PUBLIC ACCESS NEXT</small><strong>Interactive tools are being prepared.</strong></span>
              <p>Each tool will open directly from here once its public link and access notes are ready.</p>
            </div>
          )}
          {activeTool && (
            <section ref={workbenchRef} tabIndex={-1} className={`tool-workbench${activeTool.id === "ai-news" ? " is-news" : ""}`} aria-label={`${activeTool.title} tool`}>
              <header>
                <div><small>USE HERE</small><strong>{activeTool.title}</strong></div>
                <span>
                  {activeTool.url && <a href={activeTool.url} target="_blank" rel="noreferrer">Open full screen <ArrowUpRight size={16} /></a>}
                  <button type="button" onClick={closeTool} aria-label={`Close ${activeTool.title}`}><X size={18} /></button>
                </span>
              </header>
              {activeTool.id === "ai-news" ? (
                <AiNewsWorkbench />
              ) : activeTool.id === "dfinance" ? (
                <DFinanceManager />
              ) : (
                <iframe
                  title={`${activeTool.title} live tool`}
                  src={activeTool.embedUrl}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
                />
              )}
            </section>
          )}
        </section>

        <section className="music-section" id="music">
          <header className="music-heading" data-reveal>
            <span>{content.musicSection.label}</span>
            <h2>{content.musicSection.heading} <em>{content.musicSection.emphasis}</em></h2>
            <p>{content.musicSection.copy}</p>
          </header>
          <MinimalMusicExperience playlists={content.musicPlaylists} />
        </section>

        <section className="signals-section" id="signals">
          <div className="signals-intro" data-reveal>
            <span>{content.signals.label}</span>
            <h2>{content.signals.heading} <em>{content.signals.emphasis}</em></h2>
            <p>{content.signals.copy}</p>
          </div>
          <aside className="life-notes" data-reveal>
            <MapPin size={19} /><span>{content.lifeNotes[0]}</span>
            <FilmSlate size={19} /><span>{content.lifeNotes[1]}</span>
            <Trophy size={19} /><span>{content.lifeNotes[2]}</span>
          </aside>
          <div className="personal-grid">
            <article className="atlas-card" data-reveal>
              <header>
                <span><MapTrifold size={18} weight="light" /> {content.placesSection.label}</span>
                <small>{content.places.length} places{content.placesSection.firstVisited && content.placesSection.lastVisited ? ` · ${content.placesSection.firstVisited.slice(0, 4)}—${content.placesSection.lastVisited.slice(0, 4)}` : ""}</small>
              </header>
              <div className="atlas-copy">
                <h3>{content.placesSection.heading}</h3>
                <p>{content.placesSection.copy}</p>
              </div>
              <TravelMap places={content.places} />
            </article>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-statement" data-reveal>
            <span>{content.contact.label}</span>
            <h2>{content.contact.heading}</h2>
            <p>{content.contact.copy}</p>
          </div>
          <div className="contact-links" data-reveal>
            <a href={`mailto:${content.contact.email}`}><EnvelopeSimple size={22} /><span><small>Email</small>{content.contact.email}</span><ArrowUpRight size={18} /></a>
            <a href={content.contact.github} target="_blank" rel="noreferrer"><GithubLogo size={22} /><span><small>GitHub</small>{content.contact.github.replace("https://", "")}</span><ArrowUpRight size={18} /></a>
            <a href={content.contact.linkedin} target="_blank" rel="noreferrer"><LinkedinLogo size={22} /><span><small>LinkedIn</small>{content.identity.name}</span><ArrowUpRight size={18} /></a>
            <a href="/Dhruvith_Chokkarapu_Resume.pdf" download><DownloadSimple size={22} /><span><small>Resume</small>Download PDF</span><ArrowDown size={18} /></a>
          </div>
          <footer>
            <span className="footer-signature" aria-label="Signed, Dhruvith">
              <span className="footer-signature-word" aria-hidden="true">Dhruvith</span>
              <span className="footer-signature-dot" aria-hidden="true">.</span>
            </span>
            <span>© 2026 Dhruvith Chokkarapu</span>
            <span>Built locally in Hyderabad</span>
            <a href="#top">Back to top <ArrowUpRight size={14} /></a>
          </footer>
        </section>
      </main>
    </div>
  );
}
