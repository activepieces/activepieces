import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

type DataTableToolbarProps = {
  children?: React.ReactNode;
};

const DataTableToolbar = (params: DataTableToolbarProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 overflow-auto',
        DASHBOARD_CONTENT_PADDING_X,
      )}
    >
      <div className="flex flex-1 items-center space-x-2">
        {params.children}
      </div>
    </div>
  );
};
DataTableToolbar.displayName = 'DataTableToolbar';

export { DataTableToolbar };
