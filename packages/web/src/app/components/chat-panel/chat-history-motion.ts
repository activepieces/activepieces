import type { Transition } from 'motion/react';

import { MOTION } from '@/features/workspace/lib/chat-layout';

function enter({
  reduced,
  instant,
}: {
  reduced: boolean | null;
  instant: boolean;
}) {
  return {
    initial: instant ? false : { opacity: 0, x: shift(reduced) },
    animate: { opacity: 1, x: 0, transition: openTransition(reduced) },
    exit: { opacity: 0, x: shift(reduced), transition: closeTransition() },
  };
}

function openTransition(reduced: boolean | null): Transition {
  return {
    duration: reduced ? MOTION.fast : MOTION.base,
    ease: MOTION.easeOut,
  };
}

function closeTransition(): Transition {
  return { duration: MOTION.fast, ease: MOTION.easeOut };
}

function shift(reduced: boolean | null): number {
  return reduced ? 0 : SHIFT_PX;
}

const SHIFT_PX = 8;

export const historyMotion = {
  enter,
};
