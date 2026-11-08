import { motion } from 'motion/react';
import { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ChatCardSkeleton({ rows = 3 }: ChatCardSkeletonProps) {
  return (
    <ChatCard>
      <Skeleton className="h-5 w-2/3" />
      <div className="mt-4 space-y-0.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="size-7 shrink-0 rounded-md" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </ChatCard>
  );
}

function ChatCard({ children, className }: ChatCardProps) {
  return (
    <motion.div
      className={cn(
        'rounded-xl border border-gray-6/60 bg-panel p-4 shadow-lg backdrop-blur-sm transition-colors',
        className,
      )}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

type ChatCardSkeletonProps = {
  rows?: number;
};

type ChatCardProps = {
  children: ReactNode;
  className?: string;
};
