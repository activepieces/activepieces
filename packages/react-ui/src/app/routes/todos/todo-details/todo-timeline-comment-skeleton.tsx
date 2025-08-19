import { Skeleton } from '@/components/ui/skeleton';

interface TodoTimelineCommentSkeletonProps {
  showConnector?: boolean;
}

export const TodoTimelineCommentSkeleton = ({
  showConnector,
}: TodoTimelineCommentSkeletonProps) => {
  return (
    <div className="relative">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          {/* Avatar skeleton */}
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex items-center gap-2">
            {/* Author name skeleton */}
            <Skeleton className="h-4 w-24" />
            {/* Timestamp skeleton */}
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="relative">
          {/* Connector line */}
          {showConnector && (
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          )}
          <div className="pl-12">
            {/* Content skeleton - multiple lines to simulate markdown content */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          {showConnector && <div className="mb-8"></div>}
        </div>
      </div>
    </div>
  );
};
