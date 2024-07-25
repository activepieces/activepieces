import { ColumnDef } from '@tanstack/react-table';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { toast } from '@/components/ui/use-toast';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import { PopulatedIssue } from '@activepieces/ee-shared';

import { issuesApi } from '../api/issues-api';
import { issueHooks } from '../hooks/issue-hooks';

const fetchData = async (queryParams: URLSearchParams) => {
  const pagination: {
    cursor?: string;
    limit?: number;
  } = {
    cursor: queryParams.get('cursor') ?? undefined,
    limit: parseInt(queryParams.get('limit') ?? '10'),
  };

  return issuesApi.list({
    projectId: authenticationSession.getProjectId(),
    cursor: pagination.cursor,
    limit: pagination.limit,
  });
};

export default function IssuesTable() {
  const { refetch } = issueHooks.useIssuesNotification();

  // TODO implement permissions here when done
  const handleMarkAsResolved = async (
    flowDisplayName: string,
    issueId: string,
    deleteRow: () => void,
  ) => {
    deleteRow();
    await issuesApi.resolve(issueId);
    refetch();
    toast({
      title: 'Success',
      description: `Issues in ${flowDisplayName} is marked as resolved.`,
      duration: 3000,
    });
  };

  const columns: ColumnDef<RowDataWithActions<PopulatedIssue>>[] = [
    {
      accessorKey: 'flowName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Flow Name" />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.flowDisplayName}</div>;
      },
    },
    {
      accessorKey: 'count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Count" />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.count}</div>;
      },
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="First Seen" />
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
        <DataTableColumnHeader column={column} title="Last Seen" />
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
      accessorKey: 'actions',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-end justify-end">
            <Button
              className="gap-2"
              size={'sm'}
              onClick={() =>
                handleMarkAsResolved(
                  row.original.flowDisplayName,
                  row.original.id,
                  row.original.delete,
                )
              }
            >
              <Check className="size-4" />
              Mark as Resolved
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex-col w-full">
      <div className="mb-4 flex">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">Issues </h1>
          <span className="text-md text-muted-foreground">
            Track failed runs grouped by flow name, and mark them as resolved
            when fixed.
          </span>
        </div>
        <div className="ml-auto"></div>
      </div>
      <DataTable columns={columns} fetchData={fetchData} />
    </div>
  );
}
