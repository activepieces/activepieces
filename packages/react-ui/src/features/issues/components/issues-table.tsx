import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { createSearchParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DataTable,
  PaginationParams,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { toast } from '@/components/ui/use-toast';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import { PopulatedIssue } from '@activepieces/ee-shared';
import { FlowRunStatus, Permission } from '@activepieces/shared';

import { useNewWindow } from '../../../components/embed-provider';
import { TableTitle } from '../../../components/ui/table-title';
import { issuesApi } from '../api/issues-api';
import { issueHooks } from '../hooks/issue-hooks';

const fetchData = async (
  _: Record<string, string>,
  pagination: PaginationParams,
) => {
  return issuesApi.list({
    projectId: authenticationSession.getProjectId()!,
    cursor: pagination.cursor,
    limit: pagination.limit,
  });
};

export default function IssuesTable() {
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const { refetch } = issueHooks.useIssuesNotification(
    platform.flowIssuesEnabled,
  );

  const handleMarkAsResolved = async (
    flowDisplayName: string,
    issueId: string,
  ) => {
    await issuesApi.resolve(issueId);
    refetch();
    toast({
      title: t('Success'),
      description: t('Issues in {flowDisplayName} is marked as resolved.', {
        flowDisplayName,
      }),
      duration: 3000,
    });
  };
  const { checkAccess } = useAuthorization();
  const openNewWindow = useNewWindow();
  const userHasPermissionToMarkAsResolved = checkAccess(
    Permission.WRITE_ISSUES,
  );
  const columns: ColumnDef<RowDataWithActions<PopulatedIssue>>[] = [
    {
      accessorKey: 'flowName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Flow Name')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.flowDisplayName}</div>;
      },
    },
    {
      accessorKey: 'count',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Count')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.count}</div>;
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
      accessorKey: 'actions',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-end justify-end">
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToMarkAsResolved}
            >
              <Button
                disabled={!userHasPermissionToMarkAsResolved}
                className="gap-2"
                size={'sm'}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('resolved');
                  row.original.delete();
                  handleMarkAsResolved(
                    row.original.flowDisplayName,
                    row.original.id,
                  );
                }}
              >
                <Check className="size-4" />
                {t('Mark as Resolved')}
              </Button>
            </PermissionNeededTooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex-col w-full">
      <div className="mb-4 flex">
        <div className="flex flex-col">
          <TableTitle>{t('Issues')}</TableTitle>
          <span className="text-md text-muted-foreground">
            {t(
              'Track failed runs grouped by flow name, and mark them as resolved when fixed.',
            )}
          </span>
        </div>
        <div className="ml-auto"></div>
      </div>
      <DataTable
        columns={columns}
        fetchData={fetchData}
        onRowClick={(row, newWindow) => {
          const searchParams = createSearchParams({
            flowId: row.flowId,
            createdAfter: row.created,
            status: [
              FlowRunStatus.FAILED,
              FlowRunStatus.INTERNAL_ERROR,
              FlowRunStatus.TIMEOUT,
            ],
          }).toString();
          if (newWindow) {
            openNewWindow('/runs', searchParams);
          } else {
            navigate({
              pathname: '/runs',
              search: searchParams,
            });
          }
        }}
      />
    </div>
  );
}
