import { Column } from '@tanstack/react-table';
import { LucideIcon } from 'lucide-react';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  icon?: LucideIcon;
}

export function DataTableColumnHeader<TData, TValue>({
  title,
  className,
  icon: Icon,
}: DataTableColumnHeaderProps<TData, TValue>) {
  return (
    <div
      className={`flex items-center justify-start space-x-2 py-4 whitespace-nowrap ${className}`}
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      <div className="text-sm text-foreground">{title}</div>
    </div>
  );
}
