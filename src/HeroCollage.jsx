import { m, useReducedMotion } from "./motionSystem.jsx";

const photoMotion = { type: "spring", stiffness: 170, damping: 24 };

export function HeroCollage() {
  const reduced = useReducedMotion();

  return (
    <div className="hero-collage" aria-label="Hyderabad and the ideas behind the work">
      <m.figure
        className="hero-photo hero-photo-city"
        initial={reduced ? false : { y: 30, rotate: -7, opacity: 0 }}
        animate={{ y: 0, rotate: -6, opacity: 1 }}
        whileHover={reduced ? undefined : { y: -9, rotate: -3 }}
        transition={photoMotion}
      >
        <img src="/images/hero-charminar-dusk-v2.webp" alt="Charminar in Hyderabad at dusk" fetchPriority="high" />
        <figcaption>Hyderabad, India <span>/ home</span></figcaption>
      </m.figure>

      <m.figure
        className="hero-photo hero-photo-architecture"
        initial={reduced ? false : { y: 35, rotate: 8, opacity: 0 }}
        animate={{ y: 0, rotate: 6, opacity: 1 }}
        whileHover={reduced ? undefined : { y: -8, rotate: 3 }}
        transition={{ ...photoMotion, delay: 0.13 }}
      >
        <img src="/images/hero-stair-shadow.webp" alt="Architectural stairwell and afternoon shadows" fetchPriority="high" />
      </m.figure>

      <m.div
        className="hero-note"
        initial={reduced ? false : { y: 28, rotate: 4, opacity: 0 }}
        animate={{ y: 0, rotate: 3, opacity: 1 }}
        whileHover={reduced ? undefined : { y: -5, rotate: 1 }}
        transition={{ ...photoMotion, delay: 0.2 }}
      >
        <p>REAL PROBLEMS<br />BETTER SYSTEMS</p>
        <i aria-hidden="true" />
        <p>AI<br />DATA<br />PRODUCTS<br />PEOPLE</p>
      </m.div>
      <span className="hero-collage-caption">Building from Hyderabad</span>
    </div>
  );
}
