import type { Transition } from 'motion/react';

// One motion language for the panel's header and history: quick, ease-out,
// exits a little faster than entrances. Reduced motion keeps only the fade.
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function enter(duration: number, reduced: boolean | null): Transition {
  return { duration: reduced ? 0.1 : duration, ease: EASE_OUT };
}

function exit(duration: number, reduced: boolean | null): Transition {
  return { duration: reduced ? 0.08 : duration, ease: EASE_OUT };
}

export const historyMotion = {
  // The chat ↔ history swap.
  viewIn: (reduced: boolean | null) => enter(0.22, reduced),
  viewOut: (reduced: boolean | null) => exit(0.16, reduced),
  // The floating card's dropdown and the header title.
  popIn: (reduced: boolean | null) => enter(0.14, reduced),
  popOut: (reduced: boolean | null) => exit(0.1, reduced),
  // How far a view travels as it swaps. Small: it should read as a shift.
  shift: (reduced: boolean | null) => (reduced ? 0 : 10),
};
