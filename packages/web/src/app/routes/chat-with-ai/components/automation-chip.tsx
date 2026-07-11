import { CornerDownRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useId } from 'react';

import { cn } from '@/lib/utils';

// AI-flavoured hues used for the (subtle) animated gradient on the automation suggestion.
const AI_STOPS = ['#8142E3', '#4F8CFF', '#C061F5'];

export function AutomationChip({
  label,
  onClick,
  index = 0,
  className,
}: {
  label: string;
  onClick: () => void;
  index?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const gradientId = `ai-grad-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const textGradient = `linear-gradient(90deg, ${AI_STOPS[0]}, ${AI_STOPS[1]}, ${AI_STOPS[2]}, ${AI_STOPS[0]})`;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full min-w-0 cursor-pointer items-start gap-2 text-left text-sm transition-opacity hover:opacity-80',
        className,
      )}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: 'easeOut' }}
    >
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        className="pointer-events-none absolute"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={AI_STOPS[0]}>
              {!reduce && (
                <animate
                  attributeName="stop-color"
                  values={`${AI_STOPS[0]};${AI_STOPS[1]};${AI_STOPS[2]};${AI_STOPS[0]}`}
                  dur="6s"
                  repeatCount="indefinite"
                />
              )}
            </stop>
            <stop offset="100%" stopColor={AI_STOPS[2]}>
              {!reduce && (
                <animate
                  attributeName="stop-color"
                  values={`${AI_STOPS[2]};${AI_STOPS[0]};${AI_STOPS[1]};${AI_STOPS[2]}`}
                  dur="6s"
                  repeatCount="indefinite"
                />
              )}
            </stop>
          </linearGradient>
        </defs>
      </svg>
      <CornerDownRight
        className="mt-0.5 size-4 shrink-0"
        stroke={`url(#${gradientId})`}
        aria-hidden="true"
      />
      <motion.span
        className="min-w-0 flex-1 bg-clip-text text-transparent"
        style={{
          backgroundImage: textGradient,
          backgroundSize: reduce ? '100% 100%' : '200% 100%',
        }}
        animate={
          reduce ? undefined : { backgroundPosition: ['0% 50%', '100% 50%'] }
        }
        transition={
          reduce
            ? undefined
            : {
                duration: 6,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }
        }
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
