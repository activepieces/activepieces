import { cn } from '@/lib/utils';

type DataTableToolbarProps = {
  children?: React.ReactNode;
  className?: string;
};

const DataTableToolbar = ({ children, className }: DataTableToolbarProps) => {
  return (
    <div
      data-slot="toolbar"
      className={cn('mb-6 flex items-center gap-3', className)}
    >
      {children}
    </div>
  );
};
DataTableToolbar.displayName = 'DataTableToolbar';

export { DataTableToolbar };
