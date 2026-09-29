import { LazyMotion, MotionConfig, domMax, m, useReducedMotion } from "motion/react";

// One timing language for the site: brisk feedback, quiet entrances, no bounce.
export const motionEase = [0.22, 1, 0.36, 1];
export const motionTime = { quick: 0.22, reveal: 0.58, hero: 0.72 };

export function MotionProvider({ children }) {
  return <LazyMotion features={domMax} strict><MotionConfig reducedMotion="user">{children}</MotionConfig></LazyMotion>;
}

export function Reveal({ as = "div", className, children, index = 0, ...props }) {
  const reduceMotion = useReducedMotion();
  const Element = m[as];
  return (
    <Element
      className={className}
      initial={reduceMotion ? false : { opacity: 0.72, y: 14 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: motionTime.reveal, ease: motionEase, delay: Math.min(index, 5) * 0.065 } }}
      viewport={{ once: true, amount: 0.06, margin: "0px 0px 12% 0px" }}
      transition={{ duration: motionTime.quick, ease: motionEase }}
      {...props}
    >
      {children}
    </Element>
  );
}

export { m, useReducedMotion };
