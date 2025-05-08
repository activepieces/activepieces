import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatUtils } from '@/lib/utils';
import { PopulatedIssue } from '@activepieces/ee-shared';

export const issuesTableColumns: ColumnDef<
  RowDataWithActions<PopulatedIssue>
>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: 'flowName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Flow Name')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left"> {row.original.flowDisplayName} </div>;
    },
  },
  {
    accessorKey: 'count',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Count')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left"> {row.original.count} </div>;
    },
  },
  {
    accessorKey: 'created',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('First Seen')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      );
    },
  },
  {
    accessorKey: 'lastOccurrence',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Last Seen')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.lastOccurrence))}
        </div>
      );
    },
  },
];
