import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const StepOutputSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex h-full w-full px-4', className)}>
      <div className="flex grow flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
};

StepOutputSkeleton.displayName = 'StepOutputSkeleton';
export { StepOutputSkeleton };
