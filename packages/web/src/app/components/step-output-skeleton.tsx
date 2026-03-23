import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const StepOutputSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex  w-full  h-full  px-4', className)}>
      <div className="space-y-2 grow">
        <div className="flex items-center gap-2">
          <Skeleton className="w-40 h-4" />
        </div>
        <Skeleton className="w-full h-40" />
      </div>
    </div>
  );
};

StepOutputSkeleton.displayName = 'StepOutputSkeleton';
export { StepOutputSkeleton };
