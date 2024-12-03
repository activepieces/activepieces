import { Column } from '@tanstack/react-table';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  return (
    <div
      className={`flex items-center justify-start space-x-2 py-4 ${className}`}
    >
      <div className="text-sm font-semibold text-black dark:text-white">
        {title}
      </div>
    </div>
  );
}
