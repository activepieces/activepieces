import { Column } from '@tanstack/react-table';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  icon?: React.ReactNode;
}

export function DataTableColumnHeader<TData, TValue>({
  title,
  className,
  icon,
}: DataTableColumnHeaderProps<TData, TValue>) {
  return (
    <div
      className={`flex items-center justify-between space-x-2 py-4 ${className}`}
    >
      <div className="text-sm font-semibold text-black dark:text-white flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </div>
    </div>
  );
}
