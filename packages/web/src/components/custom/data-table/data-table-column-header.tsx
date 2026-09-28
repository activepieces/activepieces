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
import { Button } from '@/components/ui/button';

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
  icon: Icon,
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
      <Button
        variant="ghost"
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
        className={`h-auto text-gray-12 p-0 hover:bg-transparent -ml-3 ${className}`}
      >
        {Icon && (
          <HugeiconsIcon
            icon={Icon}
            className="h-4 w-4 text-gray-12 flex-shrink-0 mr-2"
          />
        )}
        {title}
        <HugeiconsIcon icon={SortIcon} className="ml-2 h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className={`flex items-center justify-start space-x-2 whitespace-nowrap ${className}`}
    >
      {Icon && (
        <HugeiconsIcon
          icon={Icon}
          className="h-4 w-4 text-gray-11 flex-shrink-0"
        />
      )}
      <div className="text-xs font-normal text-gray-12">{title}</div>
    </div>
  );
}
