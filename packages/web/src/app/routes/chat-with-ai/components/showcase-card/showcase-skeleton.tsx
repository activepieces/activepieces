import { motion, useReducedMotion } from 'motion/react';

import { Skeleton } from '@/components/ui/skeleton';

// Shown while the agent is still streaming the `ap_show_showcase` tool input, so the
// card animates in from a loading state instead of popping in fully formed. Mirrors
// ShowcaseCard's shell + tile layout so the swap to the real card is seamless.
export function ShowcaseCardSkeleton() {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  return (
    <motion.div
      className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5 dark:bg-neutral-900"
      initial={animate ? { opacity: 0, y: 16, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <Skeleton className="h-5 w-1/2" />
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="flex items-start gap-3 rounded-xl border bg-background p-3"
            initial={animate ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05, ease: 'easeOut' }}
          >
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2 py-0.5">
              <Skeleton className="h-3.5 w-2/3 rounded" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
