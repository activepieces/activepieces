import { motion, useReducedMotion } from 'motion/react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';

const CYCLE_SECONDS = 5;

const ICON_PATHS = [
  {
    name: 'vertical',
    d: 'M16.466 7.5C15.643 4.237 13.952 2 12 2 9.239 2 7 6.477 7 12s2.239 10 5 10c.342 0 .677-.069 1-.2',
    duration: 0.45,
    delay: 0,
  },
  {
    name: 'horizontal',
    d: 'M19 15.57c-1.804.885-4.274 1.43-7 1.43-5.523 0-10-2.239-10-5s4.477-5 10-5c4.838 0 8.873 1.718 9.8 4',
    duration: 0.6,
    delay: 0.2,
  },
  {
    name: 'arrow',
    d: 'm15.194 13.707 3.814 1.86-1.86 3.814',
    duration: 0.25,
    delay: 0.55,
  },
];

export function RecurringChip({ onSend }: { onSend: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      onClick={onSend}
      className="recurring-chip flex w-fit max-w-full items-start gap-2 text-left text-sm cursor-pointer min-w-0 rounded-md pl-1 pr-2 py-1 transition-colors"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-4 shrink-0 mt-0.5"
      >
        {ICON_PATHS.map((path) => (
          <motion.path
            key={path.name}
            d={path.d}
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: path.duration,
                    delay: path.delay,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatDelay: CYCLE_SECONDS - path.duration,
                  }
            }
          />
        ))}
      </svg>
      <TextWithTooltip tooltipMessage={RECURRING_AUTOMATION_REPLY}>
        <span className="min-w-0 flex-1 recurring-chip-gradient">
          {RECURRING_AUTOMATION_REPLY}
        </span>
      </TextWithTooltip>
    </button>
  );
}

// Synced with guides/one_time_task.md and build_flow.md — sent verbatim on click.
export const RECURRING_AUTOMATION_REPLY = 'Run this automatically every day';
