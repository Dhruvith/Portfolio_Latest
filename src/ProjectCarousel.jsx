import { ArrowLeft, ArrowRight, ArrowUpRight, GithubLogo } from "@phosphor-icons/react";
import { animate, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "./motionSystem.jsx";

const images = {
  "01": "/images/project-hospital-editorial.webp",
  "02": "/images/project-quiz-editorial.webp",
  "03": "/images/project-finance-editorial.webp",
  "04": "/images/project-fitness-editorial.webp",
};
const wrap = (value, count) => ((value % count) + count) % count;
const nearestTurn = (index, current, count) => index + Math.round((current - index) / count) * count;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function CardContent({ project, selected, front, onSelect }) {
  return (
    <button type="button" className="project-editorial-select" onClick={onSelect} tabIndex={front ? 0 : -1} aria-expanded={front && selected} aria-controls={front && selected ? "project-editorial-detail" : undefined}>
      <span className="project-editorial-meta"><span>{project.kind}</span><span>{project.year}</span></span>
      <strong>{project.title}</strong>
      <span className="project-editorial-summary">{project.summary}</span>
      <span className="project-editorial-image"><img src={images[project.id]} alt="" loading={front ? "eager" : "lazy"} draggable="false" /></span>
      <span className="project-editorial-bottom"><span>{project.year}</span><span>{front && selected ? "Close details" : "Explore project"} <ArrowUpRight size={17} /></span></span>
    </button>
  );
}

function ArcCard({ project, index, count, rotation, step, front, selected, onSelect }) {
  // A shallow arc keeps the photography legible with only four real projects.
  const offset = useTransform(rotation, (position) => {
    const distance = wrap(index - position, count);
    return distance > count / 2 ? distance - count : distance;
  });
  const x = useTransform(offset, (distance) => distance * step);
  const z = useTransform(offset, (distance) => -Math.abs(distance) * 128);
  const rotateY = useTransform(offset, (distance) => -clamp(distance, -1.4, 1.4) * 22);
  const scale = useTransform(offset, (distance) => 1 - Math.min(Math.abs(distance), 2) * 0.055);
  const opacity = useTransform(offset, (distance) => clamp(2.1 - Math.abs(distance) * 1.1, 0, 1));
  const zIndex = useTransform(offset, (distance) => Math.round((2.1 - Math.abs(distance)) * 10));
  const pointerEvents = useTransform(offset, (distance) => Math.abs(distance) > 1.45 ? "none" : "auto");
  return (
    <m.article className={`project-editorial-card project-arc-card${front ? " is-active" : ""}`} aria-hidden={!front} style={{ x, z, rotateY, scale, opacity, zIndex, pointerEvents }}>
      <CardContent project={project} selected={selected} front={front} onSelect={onSelect} />
    </m.article>
  );
}

function ProjectDetail({ selected, reduced }) {
  if (!selected) return null;
  return (
    <m.div id="project-editorial-detail" className="project-editorial-detail" initial={reduced ? false : { y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <div><small>THE DECISION</small><p>{selected.decision}</p></div>
      <div><small>THE RESULT</small><p>{selected.result}</p></div>
      <div><small>BUILT WITH</small><p>{selected.stack}</p></div>
      <div className="project-editorial-detail-links">
        {selected.title === "DFinance Manager" && <a href="#tools">Use the tool <ArrowRight size={17} /></a>}
        {/^https:\/\//i.test(selected.liveUrl || "") && selected.title !== "DFinance Manager" && <a href={selected.liveUrl} target="_blank" rel="noreferrer">Open project <ArrowUpRight size={17} /></a>}
        {/^https:\/\//i.test(selected.sourceUrl || "") && <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Source <GithubLogo size={17} /></a>}
      </div>
    </m.div>
  );
}

export function ProjectCarousel({ projects }) {
  const reduced = useReducedMotion();
  const rotation = useMotionValue(1);
  const target = useRef(1);
  const animation = useRef(null);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const stageRef = useRef(null);
  const [active, setActive] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [mobile, setMobile] = useState(false);
  const [step, setStep] = useState(440);
  const count = projects?.length || 0;
  const is3d = !mobile && !reduced && count > 2;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!is3d || !stageRef.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setStep(Math.min(450, entry.contentRect.width * 0.32)));
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [is3d]);
  useEffect(() => () => animation.current?.stop(), []);

  if (!count) return null;
  const current = wrap(active, count);
  const selected = projects.find((project) => project.id === selectedId);
  const goTo = (next) => {
    animation.current?.stop();
    target.current = next;
    setActive(wrap(next, count));
    setSelectedId(null);
    if (is3d) animation.current = animate(rotation, next, { type: "spring", stiffness: 230, damping: 29, mass: 1 });
    else rotation.jump(next);
  };
  const selectCard = (index) => {
    if (index !== current) return goTo(nearestTurn(index, rotation.get(), count));
    setSelectedId((value) => value === projects[index].id ? null : projects[index].id);
  };
  const onArrowKey = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    goTo(target.current + (event.key === "ArrowLeft" ? -1 : 1));
  };

  return (
    <div className="project-carousel" aria-label="Selected projects">
      {is3d ? (
        <div
          ref={stageRef}
          className="project-arc-stage"
          role="group"
          aria-roledescription="carousel"
          aria-label={`Project cards, ${projects[current].title} selected`}
          tabIndex={0}
          onKeyDown={onArrowKey}
          onPointerDown={(event) => {
            if (event.button !== 0 || drag.current) return;
            animation.current?.stop();
            drag.current = { id: event.pointerId, x: event.clientX, from: rotation.get(), moved: false };
          }}
          onPointerMove={(event) => {
            const gesture = drag.current;
            if (!gesture || gesture.id !== event.pointerId) return;
            const distance = event.clientX - gesture.x;
            if (Math.abs(distance) > 7 && !gesture.moved) {
              gesture.moved = true;
              event.currentTarget.setPointerCapture(event.pointerId);
            }
            if (gesture.moved) rotation.set(gesture.from - distance / step);
          }}
          onPointerUp={(event) => {
            const gesture = drag.current;
            if (!gesture || gesture.id !== event.pointerId) return;
            drag.current = null;
            if (!gesture.moved) return;
            suppressClick.current = true;
            requestAnimationFrame(() => { suppressClick.current = false; });
            goTo(Math.round(rotation.get() + clamp(rotation.getVelocity() * 0.12, -0.5, 0.5)));
          }}
          onPointerCancel={() => { drag.current = null; goTo(Math.round(rotation.get())); }}
          onClickCapture={(event) => {
            if (!suppressClick.current) return;
            suppressClick.current = false;
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {projects.map((project, index) => <ArcCard key={project.id} project={project} index={index} count={count} rotation={rotation} step={step} front={index === current} selected={selectedId === project.id} onSelect={() => selectCard(index)} />)}
        </div>
      ) : (
        <div
          className="project-editorial-grid project-editorial-flat"
          role="group"
          aria-roledescription="carousel"
          aria-label={`Project cards, ${projects[current].title} selected`}
          tabIndex={0}
          onKeyDown={onArrowKey}
          onPointerDown={(event) => { if (event.button === 0) drag.current = { id: event.pointerId, x: event.clientX, moved: false }; }}
          onPointerMove={(event) => {
            const gesture = drag.current;
            if (!gesture || gesture.id !== event.pointerId || gesture.moved || Math.abs(event.clientX - gesture.x) < 7) return;
            gesture.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => {
            if (!drag.current || drag.current.id !== event.pointerId) return;
            const distance = event.clientX - drag.current.x;
            drag.current = null;
            if (Math.abs(distance) < 65) return;
            suppressClick.current = true;
            requestAnimationFrame(() => { suppressClick.current = false; });
            goTo(target.current + (distance < 0 ? 1 : -1));
          }}
          onPointerCancel={() => { drag.current = null; }}
          onClickCapture={(event) => {
            if (!suppressClick.current) return;
            suppressClick.current = false;
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <article className="project-editorial-card is-active"><CardContent project={projects[current]} selected={selectedId === projects[current].id} front onSelect={() => selectCard(current)} /></article>
        </div>
      )}
      <div className="project-editorial-navigation">
        <span>{is3d ? "Drag to explore projects" : "Selected projects"}</span>
        <div className="project-arc-controls">
          <button type="button" onClick={() => goTo(target.current - 1)} aria-label="Previous project"><ArrowLeft size={19} /></button>
          <span className="project-arc-count" aria-live="polite" aria-atomic="true"><span className="sr-only">{projects[current].title}, project </span>{String(current + 1).padStart(2, "0")} <span aria-hidden="true">/</span> {String(count).padStart(2, "0")}</span>
          <button type="button" onClick={() => goTo(target.current + 1)} aria-label="Next project"><ArrowRight size={19} /></button>
        </div>
      </div>
      <ProjectDetail selected={selected} reduced={reduced} />
    </div>
  );
}
