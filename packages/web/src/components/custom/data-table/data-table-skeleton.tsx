import { Skeleton } from '@/components/ui/skeleton';

export function DataTableSkeleton({
  skeletonRowCount = 10,
}: {
  skeletonRowCount?: number;
}) {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
        <TableRowSkeleton key={rowIndex} />
      ))}
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div id="table-loading" className="w-full" data-testid="header-cell">
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
