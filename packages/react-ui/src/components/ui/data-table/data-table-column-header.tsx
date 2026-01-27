import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUpDown, LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

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
    const SortIcon = sortDirection === 'desc' ? ArrowDown : ArrowUpDown;

    return (
      <Button
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          if (sortDirection !== 'desc') {
            column.toggleSorting(true, false);
          }
        }}
        className={`h-auto text-foreground p-0 hover:bg-transparent -ml-3 ${className}`}
      >
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0 mr-2" />
        )}
        {title}
        <SortIcon className="ml-2 h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      className={`flex items-center justify-start space-x-2 py-4 whitespace-nowrap ${className}`}
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      <div className="text-sm text-foreground">{title}</div>
    </div>
  );
}
