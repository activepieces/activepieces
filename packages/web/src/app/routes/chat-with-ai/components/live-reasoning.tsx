import { motion, useReducedMotion, useSpring } from 'motion/react';
import { useEffect, useRef } from 'react';

import { StreamingText } from '@/components/prompt-kit/streaming-text';

export function LiveReasoning({ text }: { text: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const rollY = useSpring(0, ROLL_SPRING);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    const observer = new ResizeObserver(() => {
      const target = Math.min(0, viewport.clientHeight - content.offsetHeight);
      if (prefersReducedMotion) {
        rollY.jump(target);
      } else {
        rollY.set(target);
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [rollY, prefersReducedMotion]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0.12 }
          : {
              height: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
              opacity: { duration: 0.2, ease: 'easeOut' },
            }
      }
      style={{ overflow: 'hidden' }}
    >
      <div
        ref={viewportRef}
        className="relative mt-1.5 max-h-20 overflow-hidden text-sm leading-5 text-gray-11 break-words [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_85%,transparent)]"
      >
        <motion.div ref={contentRef} style={{ y: rollY }} className="py-2">
          <StreamingText text={text} className="[&_p]:my-0" />
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 backdrop-blur-xs [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 backdrop-blur-xs [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>
    </motion.div>
  );
}

const ROLL_SPRING = { stiffness: 40, damping: 16, mass: 1 };
