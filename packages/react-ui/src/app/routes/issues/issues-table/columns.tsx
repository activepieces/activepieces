import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Archive, Check, X } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { formatUtils } from '@/lib/utils';
import {
  IssueStatus,
  PopulatedIssue,
  FlowRunStatus,
} from '@activepieces/shared';

export const issuesTableColumns: ColumnDef<
  RowDataWithActions<PopulatedIssue>
>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        variant="secondary"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        variant="secondary"
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
      <DataTableColumnHeader column={column} title={t('Runs Failed')} />
    ),
    cell: ({ row }) => {
      return (
        <div
          className="text-center hover:underline cursor-pointer"
          onClick={() => {
            window.open(
              `/runs?status=${FlowRunStatus.FAILED}&flowId=${row.original.flowId}&failedStepName=${row.original.step?.stepName}`,
              '_blank',
            );
          }}
          role="button"
        >
          <span className="block text-center">{row.original.count}</span>
        </div>
      );
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Status')} />
    ),
    cell: ({ row }) => {
      const issue = row.original;
      const status =
        issue.status === IssueStatus.ARCHIVED
          ? t('Archived')
          : issue.status === IssueStatus.RESOLVED
          ? t('Resolved')
          : t('Unresolved');
      const icon =
        issue.status === IssueStatus.ARCHIVED
          ? Archive
          : issue.status === IssueStatus.RESOLVED
          ? Check
          : X;
      return (
        <div className="flex justify-center">
          <StatusIconWithText
            variant={
              issue.status === IssueStatus.ARCHIVED
                ? 'default'
                : issue.status === IssueStatus.RESOLVED
                ? 'success'
                : 'error'
            }
            icon={icon}
            text={status}
          />
        </div>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      return filterValue.includes(row.getValue(columnId));
    },
  },
];
