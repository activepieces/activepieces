import { Skeleton } from '@/components/ui/skeleton';

export function DataTableSkeleton({
  skeletonRowCount = 10,
}: {
  skeletonRowCount?: number;
}) {
  return (
    <div>
      <div className="p-2">
        {Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
          <TableRowSkeleton key={rowIndex} />
        ))}
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div
      id="table-loading"
      className="w-full h-10  mb-4  rounded-sm"
      data-testid="header-cell"
    >
      <Skeleton className="w-full min-h-10" />
    </div>
  );
}
