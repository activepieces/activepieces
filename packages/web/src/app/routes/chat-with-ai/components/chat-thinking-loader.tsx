import { t } from 'i18next';
import lottie from 'lottie-web';
import { Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback, useRef } from 'react';

import { cn } from '@/lib/utils';

import chatLoadingAnimation from './chat-loading.lottie.json';

export function pickRandomIndex(current: number, length: number): number {
  let next = Math.floor(Math.random() * (length - 1));
  if (next >= current) next++;
  return next;
}

export const THINKING_MESSAGES = [
  'Hold on, thinking real hard',
  'Hmm let me figure this out',
  'Cooking something up for you',
  'Brb, talking to the robots',
  'Give me a sec, almost there',
  'No rush... ok maybe a little rush',
  'Connecting all the dots',
  'My brain is warming up',
  'One moment, doing robot stuff',
  'Let me ask my robot friends',
  'Hang tight, magic in progress',
  'Putting the puzzle pieces together',
  'Almost got it, just one more thing',
  'Thinking... thinking... still thinking',
  'Making your flow extra nice',
  'On it! Be right back',
  'Grabbing the right tools',
  'Crunching some numbers real quick',
  'Let me check my notes',
  'Working behind the scenes',
  'Doing the heavy lifting for you',
  'Getting everything ready',
  "Okay okay, I'm on it",
  'Bear with me, good things take a sec',
  "Setting things up, won't be long",
  'Let me think about this one',
  'Running through some ideas',
  "Almost ready, just dotting the i's",
  'Doing my best work here',
  'Hold tight, something cool is coming',
  'Working my magic',
  'Just a few more seconds',
  'Getting your automation game on',
  'Figuring out the best way to help',
  'Warming up, almost showtime',
];

function ChatThinkingLoader({
  onStop,
  className,
  showText = true,
}: {
  onStop?: () => void;
  className?: string;
  showText?: boolean;
}) {
  const [messageIndex, setMessageIndex] = useState(() =>
    Math.floor(Math.random() * THINKING_MESSAGES.length),
  );

  const rotateMessage = useCallback(() => {
    setMessageIndex((i) => pickRandomIndex(i, THINKING_MESSAGES.length));
  }, []);

  useEffect(() => {
    const interval = setInterval(rotateMessage, 6000);
    return () => clearInterval(interval);
  }, [rotateMessage]);

  return (
    <div
      dir="ltr"
      className={cn('flex items-center justify-start gap-1', className)}
    >
      <LottieLoader />

      {showText && (
        <div className="h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={messageIndex}
              className="inline-flex items-center gap-1 text-sm"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <span className="bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite] bg-gradient-to-r from-muted-foreground from-30% via-neutral-300 via-50% to-muted-foreground to-70% bg-clip-text text-transparent dark:via-white">
                {t(THINKING_MESSAGES[messageIndex])}
              </span>
            </motion.span>
          </AnimatePresence>
        </div>
      )}

      {onStop && (
        <button
          type="button"
          onClick={onStop}
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Square className="h-2.5 w-2.5 fill-current" />
          {t('Stop')}
        </button>
      )}
    </div>
  );
}

export function LottieLoader() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const animation = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: chatLoadingAnimation,
    });
    return () => {
      animation.destroy();
    };
  }, []);

  return (
    <div className="h-7 w-7 shrink-0 overflow-hidden">
      <div ref={containerRef} className="h-7 w-12 -translate-x-2.5" />
    </div>
  );
}

export { ChatThinkingLoader };
