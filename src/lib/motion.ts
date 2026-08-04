/** Universal transition tokens shared by every Framer Motion animation. */

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const SPRING = { type: "spring", stiffness: 380, damping: 30 } as const;

export const DURATION = {
  fast: 0.2,
  base: 0.3,
  slow: 0.45,
} as const;

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
} as const;
