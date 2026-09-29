import { useRef } from "react";
import { useMotionValue, useTransform } from "motion/react";
import { m, useReducedMotion } from "./motionSystem.jsx";

export function PullCordSwitch({ theme, onToggle }) {
  const reduced = useReducedMotion();
  const pulled = useRef(false);
  const pullY = useMotionValue(0);
  const chainStretch = useTransform(pullY, [0, 72], [1, 2.05]);
  const switchTheme = () => onToggle(theme === "light" ? "dark" : "light");

  return (
    <div className="theme-cord" data-mode={theme}>
      <span className="theme-cord-glow" aria-hidden="true" />
      <img className="theme-cord-lamp" src="/images/pull-cord-lamp.png" alt="" aria-hidden="true" />
      <m.span className="theme-cord-line" style={{ scaleY: chainStretch }} aria-hidden="true" />
      <m.button
        type="button"
        className="theme-cord-knob"
        role="switch"
        aria-label={`Pull to turn the light ${theme === "light" ? "off" : "on"}`}
        aria-checked={theme === "dark"}
        aria-describedby="theme-cord-hint"
        title={`Pull down for ${theme === "light" ? "dark" : "light"} mode`}
        drag="y"
        dragConstraints={{ top: 0, bottom: 72 }}
        dragElastic={0.08}
        dragSnapToOrigin
        dragTransition={reduced ? { bounceStiffness: 1000, bounceDamping: 1000 } : { bounceStiffness: 500, bounceDamping: 28 }}
        style={{ y: pullY }}
        onDragStart={() => { pulled.current = true; }}
        onDragEnd={(_, info) => {
          if (info.offset.y >= 33) switchTheme();
          window.setTimeout(() => { pulled.current = false; }, 80);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          switchTheme();
        }}
        onClick={(event) => { if (!pulled.current) event.preventDefault(); }}
        whileTap={reduced ? undefined : { scale: 0.95 }}
      ><span className="theme-cord-grip" aria-hidden="true" /></m.button>
      <span className="theme-cord-label" id="theme-cord-hint">{theme === "light" ? "PULL FOR DARK" : "PULL FOR LIGHT"}</span>
    </div>
  );
}
