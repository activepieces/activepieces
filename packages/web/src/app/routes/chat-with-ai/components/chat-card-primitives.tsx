import { Skeleton } from '@/components/ui/skeleton';

import { ChatCard, ChatCardBody, ChatCardHeader } from './chat-ui/chat-card';

export function ChatCardSkeleton({ rows = 3 }: ChatCardSkeletonProps) {
  return (
    <ChatCard>
      <ChatCardHeader
        tile={<Skeleton className="size-8 shrink-0 rounded-lg" />}
        title={<Skeleton className="h-4 w-2/3" />}
        meta={<Skeleton className="mt-1.5 h-3 w-1/3" />}
      />
      <ChatCardBody className="gap-0.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex min-h-11 items-center gap-2.5 px-2.5">
            <Skeleton className="size-4 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </ChatCardBody>
    </ChatCard>
  );
}

type ChatCardSkeletonProps = {
  rows?: number;
};
