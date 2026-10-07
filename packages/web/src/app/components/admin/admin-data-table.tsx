import {
  DataTable,
  DataTableProps,
  DataWithId,
} from '@/components/custom/data-table';

import { adminSurface } from './admin-surface';

export function AdminDataTable<
  TData extends DataWithId,
  TValue,
  Keys extends string,
>(props: DataTableProps<TData, TValue, Keys>) {
  return (
    <div
      data-slot="admin-data-table"
      className="flex max-h-full min-h-0 flex-initial flex-col"
    >
      <DataTable
        {...props}
        emptyStateIcon={
          <span className="flex size-10 items-center justify-center rounded-lg bg-gray-3 text-gray-11 [&_svg]:size-5">
            {props.emptyStateIcon}
          </span>
        }
        bordered
        frameClassName={adminSurface.listFrame}
        toolbarClassName="px-0 pt-0 pb-4"
      />
    </div>
  );
}
