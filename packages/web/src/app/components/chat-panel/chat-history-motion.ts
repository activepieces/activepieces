import type { Transition } from 'motion/react';

import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

function transition({
  duration,
  reducedDuration,
  reduced,
}: {
  duration: number;
  reducedDuration: number;
  reduced: boolean | null;
}): Transition {
  return {
    duration: reduced ? reducedDuration : duration,
    ease: chatLayoutUtils.MOVE_EASE.out,
  };
}

const ENTER_REDUCED = 0.1;
const EXIT_REDUCED = 0.08;

export const historyMotion = {
  viewIn: (reduced: boolean | null) =>
    transition({ duration: 0.22, reducedDuration: ENTER_REDUCED, reduced }),
  viewOut: (reduced: boolean | null) =>
    transition({ duration: 0.16, reducedDuration: EXIT_REDUCED, reduced }),
  popIn: (reduced: boolean | null) =>
    transition({ duration: 0.14, reducedDuration: ENTER_REDUCED, reduced }),
  popOut: (reduced: boolean | null) =>
    transition({ duration: 0.1, reducedDuration: EXIT_REDUCED, reduced }),
  shift: (reduced: boolean | null) => (reduced ? 0 : 10),
};
