import { Skeleton } from '@/components/ui/skeleton';
import { pageColumnUtils } from '@/lib/page-column-utils';
import { cn } from '@/lib/utils';

import { useChatWidth } from './chat-window';

export function ChatContentColumn({ children }: { children: React.ReactNode }) {
  const full = useChatWidth() === 'full';
  return (
    <div
      id={pageColumnUtils.ID}
      inert={full}
      className={cn(
        'relative isolate flex min-w-0 flex-1 flex-col overflow-hidden',
        !full && '[view-transition-name:ap-page]',
      )}
    >
      {children}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex flex-col gap-4 bg-gray-1 p-6"
    >
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-full" />
      {SKELETON_ROWS.map((width) => (
        <Skeleton key={width} className="h-5" style={{ width }} />
      ))}
    </div>
  );
}

const SKELETON_ROWS = ['92%', '84%', '88%', '76%', '90%', '70%'];
