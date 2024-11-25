import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { useMemo } from 'react';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DataTable,
  LIMIT_QUERY_PARAM,
  CURSOR_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
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

export default function IssuesTable() {
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const { refetch } = issueHooks.useIssuesNotification(
    platform.flowIssuesEnabled,
  );

  const [searchParams] = useSearchParams();

  const { data, isLoading } = useQuery({
    queryKey: ['issues', searchParams.toString()],
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;
      return issuesApi.list({
        projectId: authenticationSession.getProjectId()!,
        cursor: cursor ?? undefined,
        limit,
      });
    },
  });

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

  const columns: ColumnDef<RowDataWithActions<PopulatedIssue>>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
          return (
            <div className="text-left">{row.original.flowDisplayName}</div>
          );
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
    ],
    [userHasPermissionToMarkAsResolved, handleMarkAsResolved, t],
  );

  return (
    <div className="flex-col w-full">
      <div className=" flex">
        <TableTitle
          description={t(
            'Track failed runs grouped by flow name, and mark them as resolved when fixed.',
          )}
        >
          {t('Issues')}
        </TableTitle>
        <div className="ml-auto"></div>
      </div>
      <DataTable
        page={data}
        isLoading={isLoading}
        columns={columns}
        bulkActions={[
          {
            render: (selectedRows, resetSelection) => {
              return (
                <div className="flex items-center gap-2">
                  <PermissionNeededTooltip
                    hasPermission={userHasPermissionToMarkAsResolved}
                  >
                    <Button
                      disabled={!userHasPermissionToMarkAsResolved}
                      className="gap-2"
                      size={'sm'}
                      onClick={(e) => {
                        selectedRows.forEach((row) => {
                          handleMarkAsResolved(row.flowDisplayName, row.id);
                          row.delete();
                        });
                        resetSelection();
                      }}
                    >
                      <Check className="size-3" />
                      {t('Mark as Resolved')}{' '}
                      {selectedRows.length === 0
                        ? ''
                        : `(${selectedRows.length})`}
                    </Button>
                  </PermissionNeededTooltip>
                </div>
              );
            },
          },
        ]}
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
