import { ArrowDown, ArrowUpRight, Printer } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { m, useReducedMotion } from "./motionSystem.jsx";

const resumePath = "/Dhruvith_Chokkarapu_Resume.pdf";

export function ResumePrinter({ identity }) {
  const reduceMotion = useReducedMotion();
  const downloadRef = useRef(null);
  const [phase, setPhase] = useState("idle");

  const print = () => setPhase("ready");
  const tear = () => setPhase("torn");

  return (
    <section className="resume-section" id="resume" aria-labelledby="resume-heading">
      <div className="resume-intro">
        <span className="resume-eyebrow">THE RESUME</span>
        <h2 id="resume-heading">A closer look<br />at the work.</h2>
        <p>Education, projects, and production experience in one PDF.</p>
        <div className="resume-intro-actions">
          <button type="button" onClick={print}><Printer size={18} /> {phase === "idle" ? "Print resume" : "Print again"}</button>
          <a href={resumePath} target="_blank" rel="noreferrer">Open PDF <ArrowUpRight size={17} /></a>
        </div>
      </div>

      <div className="resume-printer-scene">
        <div className="resume-printer-art" aria-hidden="true">
          <img src="/images/resume-printer.png" alt="" loading="lazy" />
        </div>
        {phase !== "idle" && (
          <m.div
            className={`resume-receipt${phase === "torn" ? " is-torn" : ""}`}
            initial={reduceMotion ? false : { y: -45, scaleY: 0.35, opacity: 0 }}
            animate={phase === "torn" ? { y: 145, rotate: 7, opacity: 0 } : { y: 0, scaleY: 1, opacity: 1 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 23 }}
            drag={phase === "ready" && !reduceMotion ? "y" : false}
            dragConstraints={{ top: 0, bottom: 160 }}
            dragElastic={0.16}
            onDragEnd={(_, info) => {
              if (info.offset.y > 85) {
                tear();
                downloadRef.current?.click();
              }
            }}
          >
            <div className="resume-receipt-inner">
              <small>PROFILE / 2026</small>
              <strong>{identity.name}</strong>
              <span>{identity.role}<br />{identity.city}, India</span>
              <i aria-hidden="true" />
              <p>Education<br />Selected projects<br />Production experience<br />Usable tools</p>
              <b>RESUME · PDF</b>
              <small>Pull down to download</small>
            </div>
          </m.div>
        )}
        <div className="resume-printer-controls">
          <span role="status">{phase === "idle" ? "Ready to print" : phase === "ready" ? "Ready to tear" : "Downloaded"}</span>
          {phase === "ready" && <a ref={downloadRef} href={resumePath} download onClick={tear}>Tear off & download <ArrowDown size={17} /></a>}
          {phase === "torn" && <button type="button" onClick={print}>Print again</button>}
        </div>
      </div>
    </section>
  );
}
