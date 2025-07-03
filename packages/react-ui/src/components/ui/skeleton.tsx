import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted/50', className)}
      {...props}
    />
  );
}

function SkeletonList({
  className,
  numberOfItems = 3,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  numberOfItems?: number;
}) {
  const array = Array(numberOfItems).fill(null);
  return (
    <div className="space-y-3">
      {array.map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4 w-full', className)}
          {...props}
        />
      ))}
    </div>
  );
}
SkeletonList.displayName = 'SkeletonList';
Skeleton.displayName = 'Skeleton';
export { Skeleton, SkeletonList };
