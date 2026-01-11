import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  sortable?: boolean;
}

export function DataTableColumnHeader<TData, TValue>({
  title,
  column,
  sortable = false,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!sortable) {
    return (
      <div
        className={cn(
          'flex items-center justify-start space-x-2 py-4',
          className,
        )}
      >
        <div className="text-sm font-semibold text-black dark:text-white">
          {title}
        </div>
      </div>
    );
  }

  const isSorted = column.getIsSorted();

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => {
          if (isSorted === 'asc') {
            column.toggleSorting(true);
          } else if (isSorted === 'desc') {
            column.clearSorting();
          } else {
            column.toggleSorting(false);
          }
        }}
      >
        <span className="text-sm font-semibold">{title}</span>
        {isSorted === 'desc' ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : isSorted === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ChevronsUpDown className="ml-2 h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
