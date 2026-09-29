import { useMotionValue, useSpring } from "motion/react";
import { m, useReducedMotion } from "./motionSystem.jsx";

export function MagneticLink({ children, className, href }) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, { stiffness: 220, damping: 20, mass: 0.45 });
  const y = useSpring(pointerY, { stiffness: 220, damping: 20, mass: 0.45 });

  const reset = () => { pointerX.set(0); pointerY.set(0); };
  return <m.a
    className={className}
    href={href}
    style={reduceMotion ? undefined : { x, y }}
    onPointerMove={(event) => {
      if (reduceMotion || event.pointerType === "touch") return;
      const bounds = event.currentTarget.getBoundingClientRect();
      pointerX.set((event.clientX - bounds.left - bounds.width / 2) * 0.16);
      pointerY.set((event.clientY - bounds.top - bounds.height / 2) * 0.16);
    }}
    onPointerLeave={reset}
    onBlur={reset}
    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
  >{children}</m.a>;
}
