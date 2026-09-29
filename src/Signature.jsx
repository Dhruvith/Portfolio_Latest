import { useEffect, useRef } from "react";

// A small CSS-depth signature, not a WebGL scene or an autoplaying video.
export function Signature() {
  const root = useRef(null);
  const word = useRef(null);
  const dot = useRef(null);
  const flourish = useRef(null);
  const animations = useRef([]);
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const resetTilt = () => {
    root.current?.style.removeProperty("--sign-x");
    root.current?.style.removeProperty("--sign-y");
  };
  const cancel = () => {
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
  };
  const replay = () => {
    cancel();
    if (reduced() || !word.current?.animate) return;
    animations.current = [
      word.current.animate([
        { clipPath: "inset(-30% 110% -40% -12%)", transform: "translateY(4px)" },
        { clipPath: "inset(-30% -12% -40% -12%)", transform: "translateY(0)" },
      ], { duration: 1450, easing: "cubic-bezier(.65,0,.25,1)" }),
      dot.current.animate([
        { opacity: 0, transform: "translateY(-8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 240, delay: 1250, fill: "backwards", easing: "ease-out" }),
      flourish.current.animate([
        { strokeDashoffset: 360, opacity: 0 },
        { strokeDashoffset: 0, opacity: 1 },
      ], { duration: 820, delay: 740, fill: "backwards", easing: "cubic-bezier(.22,1,.36,1)" }),
    ];
  };
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) replay();
      else { cancel(); resetTilt(); }
    }, { threshold: .6 });
    observer.observe(root.current);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onPreference = () => { cancel(); resetTilt(); };
    preference.addEventListener("change", onPreference);
    return () => { observer.disconnect(); preference.removeEventListener("change", onPreference); cancel(); };
  }, []);
  return <button ref={root} type="button" className="signature-button" aria-label="Replay Dhruvith’s signature" onClick={replay}
    onPointerMove={(event) => {
      if (reduced() || event.pointerType !== "mouse") return;
      const box = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--sign-x", `${(event.clientY - box.top) / box.height * -10 + 5}deg`);
      event.currentTarget.style.setProperty("--sign-y", `${(event.clientX - box.left) / box.width * 16 - 8}deg`);
    }} onPointerLeave={resetTilt} onBlur={resetTilt}>
    <span className="signature-depth" aria-hidden="true"><span ref={word} className="signature-ink">Dhruvith</span><span ref={dot} className="signature-period">.</span><svg className="signature-flourish" viewBox="0 0 340 44" preserveAspectRatio="none"><path ref={flourish} d="M7 26 C70 8 123 17 178 24 S279 34 335 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="360" /></svg></span>
  </button>;
}
