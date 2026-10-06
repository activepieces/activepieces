import {
  ArrowDataTransferVerticalIcon,
  ArrowDown02Icon,
  ArrowUp02Icon,
} from '@hugeicons/core-free-icons';
import { Column } from '@tanstack/react-table';

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
import { cn } from '@/lib/utils';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  icon?: IconSvgElement;
  sortable?: boolean;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  sortable = false,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (sortable) {
    const sortDirection = column.getIsSorted();
    const SortIcon =
      sortDirection === 'desc'
        ? ArrowDown02Icon
        : sortDirection === 'asc'
        ? ArrowUp02Icon
        : ArrowDataTransferVerticalIcon;

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
          'group/sort inline-flex items-center gap-1 rounded-md whitespace-nowrap outline-none hover:text-gray-12 focus-visible:ring-3 focus-visible:ring-gray-8/50 [&_svg]:size-3.5 [&_svg]:shrink-0',
          sortDirection !== false && 'text-gray-12',
          className,
        )}
      >
        {title}
        <HugeiconsIcon
          icon={SortIcon}
          className={cn(
            sortDirection === false &&
              'opacity-0 transition-opacity group-hover/sort:opacity-100 group-focus-visible/sort:opacity-100',
          )}
        />
      </button>
    );
  }

  return (
    <div className={cn('flex items-center whitespace-nowrap', className)}>
      {title}
    </div>
  );
}
