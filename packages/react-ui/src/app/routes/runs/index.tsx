import { useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  EllipsisVertical,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  DataTable,
  PaginationParams,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import {
  FlowRetryStrategy,
  FlowRun,
  FlowRunStatus,
  Permission,
  isFailedState,
} from '@activepieces/shared';

import { useNewWindow } from '../../../components/embed-provider';
import { TableTitle } from '../../../components/ui/table-title';

const fetchData = async (
  params: {
    flowId: string[];
    status: FlowRunStatus[];
    created: string;
  },
  pagination: PaginationParams,
) => {
  const status = params.status;
  return flowRunsApi.list({
    status,
    projectId: authenticationSession.getProjectId()!,
    flowId: params.flowId,
    cursor: pagination.cursor,
    limit: pagination.limit ?? 10,
    createdAfter: pagination.createdAfter,
    createdBefore: pagination.createdBefore,
  });
};

const FlowRunsPage = () => {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const { data, isFetching } = flowsHooks.useFlows({
    limit: 1000,
    cursor: undefined,
  });
  const openNewWindow = useNewWindow();
  const flows = data?.data;
  const { checkAccess } = useAuthorization();
  const userHasPermissionToRetryRun = checkAccess(Permission.RETRY_RUN);
  const { mutate } = useMutation<
    FlowRun,
    Error,
    { row: RowDataWithActions<FlowRun>; strategy: FlowRetryStrategy }
  >({
    mutationFn: (data) =>
      flowRunsApi.retry(data.row.id, { strategy: data.strategy }),
    onSuccess: (updatedRun, { row }) => {
      row.update(updatedRun);
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const columns: ColumnDef<RowDataWithActions<FlowRun>>[] = useMemo(
    () => [
      {
        accessorKey: 'flowId',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Flow')} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-left">{row.original.flowDisplayName}</div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Status')} />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const { variant, Icon } = flowRunUtils.getStatusIcon(status);
          return (
            <div className="text-left">
              <StatusIconWithText
                icon={Icon}
                text={formatUtils.convertEnumToHumanReadable(status)}
                variant={variant}
              />
            </div>
          );
        },
      },
      {
        accessorKey: 'created',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Start Time')} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-left">
              {formatUtils.formatDate(new Date(row.original.startTime))}
            </div>
          );
        },
      },
      {
        accessorKey: 'duration',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Duration')} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-left">
              {row.original.finishTime &&
                formatUtils.formatDuration(row.original.duration)}
            </div>
          );
        },
      },
      {
        accessorKey: 'actions',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('Actions')} />
        ),
        cell: ({ row }) => {
          return (
            <div
              className="flex items-end justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                  asChild
                  className="rounded-full p-2 hover:bg-muted cursor-pointer"
                >
                  <EllipsisVertical className="h-10 w-10" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <PermissionNeededTooltip
                    hasPermission={userHasPermissionToRetryRun}
                  >
                    <DropdownMenuItem
                      disabled={!userHasPermissionToRetryRun}
                      onClick={() =>
                        mutate({
                          row: row.original,
                          strategy: FlowRetryStrategy.ON_LATEST_VERSION,
                        })
                      }
                    >
                      <div className="flex flex-row gap-2 items-center">
                        <RefreshCw className="h-4 w-4" />
                        <span>{t('Retry on latest version')}</span>
                      </div>
                    </DropdownMenuItem>
                  </PermissionNeededTooltip>

                  {isFailedState(row.original.status) && (
                    <PermissionNeededTooltip
                      hasPermission={userHasPermissionToRetryRun}
                    >
                      <DropdownMenuItem
                        disabled={!userHasPermissionToRetryRun}
                        onClick={() =>
                          mutate({
                            row: row.original,
                            strategy: FlowRetryStrategy.FROM_FAILED_STEP,
                          })
                        }
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <RotateCcw className="h-4 w-4" />
                          <span>{t('Retry from failed step')}</span>
                        </div>
                      </DropdownMenuItem>
                    </PermissionNeededTooltip>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  const filters = useMemo(
    () => [
      {
        type: 'select',
        title: t('Flow name'),
        accessorKey: 'flowId',
        options:
          flows?.map((flow) => ({
            label: flow.version.displayName,
            value: flow.id,
          })) || [],
        icon: CheckIcon,
      } as const,
      {
        type: 'select',
        title: t('Status'),
        accessorKey: 'status',
        options: Object.values(FlowRunStatus)
          .filter((status) => status !== FlowRunStatus.STOPPED)
          .map((status) => {
            return {
              label: formatUtils.convertEnumToHumanReadable(status),
              value: status,
              icon: flowRunUtils.getStatusIcon(status).Icon,
            };
          }),
        icon: CheckIcon,
      } as const,
      {
        type: 'date',
        title: t('Created'),
        accessorKey: 'created',
        options: [],
        icon: CheckIcon,
      } as const,
    ],
    [flows],
  );

  useEffect(() => {
    if (!isFetching) {
      setRefresh((prev) => prev + 1);
    }
  }, [isFetching]);

  return (
    <div className="flex-col w-full">
      <div className="mb-4 flex">
        <TableTitle>{t('Flow Runs')}</TableTitle>
        <div className="ml-auto"></div>
      </div>
      <DataTable
        columns={columns}
        fetchData={fetchData}
        filters={filters}
        refresh={refresh}
        onRowClick={(row, newWindow) => {
          if (newWindow) {
            openNewWindow(`/runs/${row.id}`);
          } else {
            navigate(`/runs/${row.id}`);
          }
        }}
      />
    </div>
  );
};

FlowRunsPage.displayName = 'FlowRunsTable';
export { FlowRunsPage };
