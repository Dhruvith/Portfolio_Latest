import { useReducedMotion } from "./motionSystem.jsx";

export function NowPlaying({ track, art, playing, enabled, onToggle }) {
  const reduced = useReducedMotion();
  return (
    <button className={`now-playing${playing ? " is-playing" : ""}`} type="button" onClick={onToggle} disabled={!enabled} aria-label={`${playing ? "Pause" : "Play"} ${track?.title || "music"}`}>
      <span className="now-playing-record" aria-hidden="true"><span /></span>
      <span className="now-playing-cover" aria-hidden="true"><img src={art || "/images/music-telangana-golden-hour.png"} alt="" /></span>
      <span className="now-playing-copy"><small>{playing ? "NOW PLAYING" : "READY TO PLAY"}</small><strong>{track?.title || "Select a song"}</strong><em>{track?.artist || "Dhruvith's selection"}</em></span>
      <span className="now-playing-bars" aria-hidden="true" data-motion={playing && !reduced ? "on" : "off"}><i /><i /><i /></span>
    </button>
  );
}
