import React from 'react';

interface DataTableBulkActionsProps<TData> {
  selectedRows: TData[];
  actions: Array<{
    render: (selectedRows: TData[], resetSelection: () => void) => React.ReactNode;
  }>;
}

export function DataTableBulkActions<TData>({
  selectedRows,
  actions,
}: DataTableBulkActionsProps<TData>) {
  return (
    <div className="flex justify-end space-x-2 mb-4">
      {actions.map((action, index) => (
        <React.Fragment key={index}>
          {action.render(selectedRows, () => {})}
        </React.Fragment>
      ))}
    </div>
  );
}
