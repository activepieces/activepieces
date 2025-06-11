import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { formatUtils } from '@/lib/utils';
import { PopulatedIssue } from '@activepieces/shared';

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
    accessorKey: 'step',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Step')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left"> {row.original.step?.name} </div>;
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
  {
    id: 'status',
    accessorKey: 'status',
    header: t('Status'),
    cell: ({ row }) => {
      const issue = row.original;
      return (
        <div
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
          style={{
            backgroundColor:
              issue.status === 'UNRESOLVED'
                ? '#FEF3C7'
                : issue.status === 'RESOLVED'
                ? '#D1FAE5'
                : '#E5E7EB',
            color:
              issue.status === 'UNRESOLVED'
                ? '#92400E'
                : issue.status === 'RESOLVED'
                ? '#065F46'
                : '#374151',
          }}
        >
          {issue.status.toLowerCase()}
        </div>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      return filterValue.includes(row.getValue(columnId));
    },
  },
];
