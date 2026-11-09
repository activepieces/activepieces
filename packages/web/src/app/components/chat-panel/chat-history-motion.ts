import type { Transition } from 'motion/react';

function enter(reduced: boolean | null) {
  return {
    initial: { opacity: 0, x: shift(reduced) },
    animate: { opacity: 1, x: 0, transition: openTransition() },
    exit: { opacity: 0, x: shift(reduced), transition: closeTransition() },
  };
}

function openTransition(): Transition {
  return { duration: OPEN_DURATION_S, ease: EASE_OUT };
}

function closeTransition(): Transition {
  return { duration: CLOSE_DURATION_S, ease: EASE_OUT };
}

function shift(reduced: boolean | null): number {
  return reduced ? 0 : SHIFT_PX;
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const OPEN_DURATION_S = 0.15;
const CLOSE_DURATION_S = 0.12;
const SHIFT_PX = 8;

export const historyMotion = {
  enter,
  EASE_OUT,
  OPEN_DURATION_S,
  CLOSE_DURATION_S,
  SHIFT_PX,
};
