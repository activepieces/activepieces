import { t } from 'i18next';
import { Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { TextShimmer } from '@/components/ui/text-shimmer';
import { cn } from '@/lib/utils';

// The full-space onboarding moment: while the company research runs, the empty
// chat is taken over by three steps on a connected progress spine, crossing
// out one by one — the user is entering the world of AI, not staring at a
// spinner. Phases arrive over the websocket ('reading' | 'understanding' |
// 'crafting'); 'done' crosses out the last step during the exit hold.
export function PersonalizationJourney({
  phase,
  message,
  firstName,
  compact = false,
}: {
  phase: string | null;
  message: string | null;
  firstName: string;
  compact?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const activeIndex = phaseToIndex(phase);
  const headline = firstName
    ? t('Making this yours, {name}.', { name: firstName })
    : t('Making this yours.');

  return (
    <div
      className={cn(
        'flex w-full flex-col items-start',
        compact ? 'gap-6' : 'gap-9',
      )}
    >
      <motion.h1
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'font-bold leading-[1.1] text-balance font-sentient',
          compact ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl',
        )}
      >
        {reducedMotion ? (
          headline
        ) : (
          // The AI glow: a slow primary glint sweeping through the black
          // title — deliberately the ONE place primary appears on this screen.
          <TextShimmer
            duration={7}
            spread={14}
            className="font-bold leading-[1.1]"
            style={{
              // --primary is an HSL triple in this theme — the resolved
              // --color-* tokens are the only safe full-color variables here.
              backgroundImage:
                'linear-gradient(to right, var(--color-foreground) 38%, var(--color-primary) 50%, var(--color-foreground) 62%)',
              animationDuration: '7s',
            }}
          >
            {headline}
          </TextShimmer>
        )}
      </motion.h1>

      <div className="flex w-full flex-col">
        {JOURNEY_STEPS.map((step, index) => (
          <JourneyStep
            key={step.key}
            label={t(step.label)}
            index={index}
            isLast={index === JOURNEY_STEPS.length - 1}
            state={
              index < activeIndex
                ? 'done'
                : index === activeIndex
                ? 'active'
                : 'upcoming'
            }
            subtext={index === activeIndex ? message : null}
            compact={compact}
            reducedMotion={!!reducedMotion}
          />
        ))}
      </div>
    </div>
  );
}

function JourneyStep({
  label,
  index,
  isLast,
  state,
  subtext,
  compact,
  reducedMotion,
}: {
  label: string;
  index: number;
  isLast: boolean;
  state: 'done' | 'active' | 'upcoming';
  subtext: string | null;
  compact: boolean;
  reducedMotion: boolean;
}) {
  const markerSize = compact ? 'size-7' : 'size-9';

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.2 + index * 0.12,
        ease: 'easeOut',
      }}
      className="flex gap-4"
    >
      {/* Marker column: the marker plus the spine segment below it. */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={false}
          animate={
            reducedMotion
              ? { scale: 1 }
              : { scale: state === 'done' ? [1, 1.12, 1] : 1 }
          }
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className={cn(
            'relative flex shrink-0 items-center justify-center rounded-full transition-all duration-500',
            markerSize,
            state === 'done' && 'bg-foreground text-background',
            state === 'active' && 'text-foreground',
            state === 'upcoming' &&
              'border border-border text-muted-foreground/50',
          )}
        >
          {state === 'active' && (
            <>
              <span
                className={cn(
                  'absolute inset-0 rounded-full border-2 border-foreground/70 border-t-transparent',
                  !reducedMotion && 'animate-spin [animation-duration:1.6s]',
                )}
              />
              <span className="absolute inset-1 rounded-full bg-foreground/5" />
            </>
          )}
          {/* One-shot ripple the moment a step completes */}
          {state === 'done' && !reducedMotion && (
            <motion.span
              aria-hidden
              initial={{ scale: 0.8, opacity: 0.45 }}
              animate={{ scale: 1.9, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border border-foreground/40"
            />
          )}
          <AnimatePresence mode="wait" initial={false}>
            {state === 'done' ? (
              <motion.span
                key="check"
                initial={reducedMotion ? false : { scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              >
                <Check
                  className={compact ? 'size-3.5' : 'size-4'}
                  strokeWidth={3}
                />
              </motion.span>
            ) : (
              <motion.span
                key="number"
                initial={false}
                exit={reducedMotion ? undefined : { scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeIn' }}
                className={cn(
                  'relative font-semibold',
                  compact ? 'text-xs' : 'text-sm',
                )}
              >
                {index + 1}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
        {!isLast && (
          <div
            className={cn(
              'relative my-1 w-px flex-1 bg-border',
              compact ? 'min-h-4' : 'min-h-6',
            )}
          >
            <motion.span
              aria-hidden
              initial={false}
              animate={{ scaleY: state === 'done' ? 1 : 0 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.1 }
              }
              className="absolute inset-0 origin-top bg-foreground"
            />
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex min-w-0 flex-col gap-1',
          compact ? 'pb-4 pt-1' : 'pb-6 pt-1.5',
          isLast && 'pb-0',
        )}
      >
        <span
          className={cn(
            'relative w-fit font-medium transition-colors duration-500',
            compact ? 'text-base' : 'text-xl',
            state === 'done' && 'text-foreground/70',
            state === 'upcoming' && 'text-muted-foreground/50',
          )}
        >
          {state === 'active' && !reducedMotion ? (
            <TextShimmer>{label}</TextShimmer>
          ) : (
            label
          )}
        </span>
        <AnimatePresence mode="wait" initial={false}>
          {state === 'active' && subtext && (
            <motion.span
              key={subtext}
              initial={reducedMotion ? false : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-sm text-muted-foreground"
            >
              {subtext}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function phaseToIndex(phase: string | null): number {
  switch (phase) {
    case 'understanding':
      return 1;
    case 'crafting':
      return 2;
    case 'done':
      return JOURNEY_STEPS.length;
    default:
      // 'reading', 'starting', or nothing yet — the journey opens on step one.
      return 0;
  }
}

const JOURNEY_STEPS = [
  { key: 'reading', label: 'Reading your website' },
  { key: 'understanding', label: 'Researching your company & role' },
  { key: 'crafting', label: 'Crafting your use cases' },
] as const;
