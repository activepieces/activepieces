import { t } from 'i18next';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect } from 'react';

import { CHAT_SPARK_PATHS } from '@/components/icons/chat-spark';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { isMac } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

import { useChatWidth } from './chat-window';

const ICON = 24;
const NOTCH = 48;
const INSET_X = (NOTCH - ICON) / 2;
const INSET_TOP = INSET_X + 1;
const NOTCH_BOX = 100;
const SHADOW_COVER = 4;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export function ChatNotch({ className }: { className?: string }) {
  const setOpen = useChatPanel((s) => s.setOpen);
  const needsYou = useChatPanel((s) => s.gateOpen);
  const isHidden = useChatWidth() !== 'closed';
  const progress = useMotionValue(isHidden ? 0 : 1);

  useEffect(() => {
    const controls = animate(progress, isHidden ? 0 : 1, {
      duration: 0.2,
      ease: EASE_OUT,
      delay: isHidden ? 0.05 : 0,
    });
    return () => controls.stop();
  }, [isHidden, progress]);

  const fillD = useTransform(progress, (p) => notchOutline(p).fill);
  const edgeD = useTransform(progress, (p) => notchOutline(p).edge);
  const opacity = useTransform(progress, [0.04, 0.25], [0, 1]);

  return (
    <div
      className={cn(
        'pointer-events-none absolute left-0 z-10 max-md:hidden',
        className,
      )}
      style={{ width: NOTCH_BOX, height: NOTCH_BOX }}
    >
      <motion.svg
        width={NOTCH_BOX}
        height={NOTCH_BOX}
        viewBox={`0 0 ${NOTCH_BOX} ${NOTCH_BOX}`}
        className="absolute inset-0 overflow-visible"
        style={{ opacity }}
      >
        <motion.path d={fillD} className="fill-gray-2" />
        <motion.path d={edgeD} className="fill-none stroke-gray-6" />
      </motion.svg>
      <TooltipProvider delayDuration={300}>
        <Tooltip open={isHidden ? false : undefined}>
          <TooltipTrigger asChild>
            <motion.button
              type="button"
              aria-label={needsYou ? t('Chat, it needs you') : t('Chat')}
              aria-keyshortcuts="Meta+J Control+J"
              onClick={() => setOpen(true)}
              initial={false}
              whileHover="hover"
              animate={
                isHidden
                  ? { opacity: 0, scale: 0.6, y: 6 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              transition={{
                duration: isHidden ? 0.12 : 0.2,
                ease: EASE_OUT,
                delay: isHidden ? 0 : 0.08,
              }}
              className={cn(
                'group absolute bottom-0 left-0 flex items-start justify-start rounded-md text-gray-12 outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-8',
                isHidden ? 'pointer-events-none' : 'pointer-events-auto',
              )}
              style={{
                width: NOTCH,
                height: NOTCH,
                paddingLeft: INSET_X,
                paddingTop: INSET_TOP,
              }}
            >
              <NotchChatIcon className="size-6" />
              {needsYou && (
                <span
                  aria-hidden
                  className="absolute top-1 left-9 size-2.5 rounded-full border-2 border-gray-2 bg-accent-9"
                />
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {t('Chat')}
            <kbd className="font-sans text-xs opacity-60">
              {isMac() ? '⌘J' : 'Ctrl+J'}
            </kbd>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

const writeLine = (order: number) => ({
  hover: {
    pathLength: [0, 1],
    transition: { duration: 0.45, ease: EASE_OUT, delay: order * 0.06 },
  },
});

function NotchChatIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={CHAT_SPARK_PATHS.bubble} />
      <path
        d={CHAT_SPARK_PATHS.spark}
        className="fill-accent-9 stroke-accent-9 dark:fill-accent-10 dark:stroke-accent-10"
      />
      {CHAT_SPARK_PATHS.lines.map((d, i) => (
        <motion.path key={d} d={d} variants={writeLine(i)} />
      ))}
    </svg>
  );
}

function notchOutline(progress: number) {
  const b = NOTCH_BOX;
  const w = Math.max(0.01, NOTCH * progress);
  const h = Math.max(0.01, NOTCH * progress);
  const fillet = Math.min(22, Math.min(w, h) * 0.37);
  const corner = fillet;
  const kF = 0.78;
  const kR = 0.62;
  const top = b - h;
  const edge = [
    `M 0.5 ${top - fillet}`,
    `C 0.5 ${top - fillet + fillet * kF} ${fillet - fillet * kF} ${
      top + 0.5
    } ${fillet} ${top + 0.5}`,
    `L ${w - corner} ${top + 0.5}`,
    `C ${w - corner + corner * kR} ${top + 0.5} ${w - 0.5} ${
      top + corner - corner * kR
    } ${w - 0.5} ${top + corner}`,
    `L ${w - 0.5} ${b - fillet}`,
    `C ${w - 0.5} ${b - fillet + fillet * kF} ${w + fillet - fillet * kF} ${
      b - 0.5
    } ${w + fillet} ${b - 0.5}`,
  ].join(' ');
  const fill = `${edge.replace('M 0.5', 'M 0')} L ${w + fillet} ${
    b + SHADOW_COVER
  } L 0 ${b + SHADOW_COVER} Z`;
  return { edge, fill };
}
