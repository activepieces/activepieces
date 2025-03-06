type DataTableToolbarProps = {
  children?: React.ReactNode;
};

const DataTableToolbar = (params: DataTableToolbarProps) => {
  return (
    <div className="flex items-center justify-between py-4 min-h-[70px]">
       <div className="flex flex-col lg:flex-row flex-1 items-start lg:items-center space-x-0 lg:space-x-2">
        {params.children}
      </div>
    </div>
  );
};
DataTableToolbar.displayName = 'DataTableToolbar';

export { DataTableToolbar };
