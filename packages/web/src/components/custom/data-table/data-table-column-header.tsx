import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  icon?: LucideIcon;
  sortable?: boolean;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  icon: Icon,
  sortable = false,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (sortable) {
    const sortDirection = column.getIsSorted();
    const SortIcon =
      sortDirection === 'desc'
        ? ArrowDown
        : sortDirection === 'asc'
        ? ArrowUp
        : ArrowUpDown;

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (sortDirection === false) {
            column.toggleSorting(false, false);
          } else if (sortDirection === 'asc') {
            column.toggleSorting(true, false);
          } else {
            column.clearSorting();
          }
        }}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg whitespace-nowrap outline-none hover:text-gray-12 focus-visible:ring-3 focus-visible:ring-accent-8/50 [&_svg]:size-4 [&_svg]:shrink-0',
          className,
        )}
      >
        {Icon && <Icon />}
        {title}
        <SortIcon />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
    >
      {Icon && <Icon />}
      <div>{title}</div>
    </div>
  );
}
