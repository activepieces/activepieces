import { useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, PlayIcon, Redo, RotateCw, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BulkAction } from '@/components/ui/data-table'
import {
  DataTable,
  PaginationParams,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
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
  isFailedState,
  Permission,
} from '@activepieces/shared';

import { useNewWindow } from '../../../components/embed-provider';
import { TableTitle } from '../../../components/ui/table-title';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';

const fetchData = async (
  params: {
    flowId: string[];
    status: FlowRunStatus[];
    created: string;
  },
  pagination: PaginationParams,
) => {
  console.log("FETCHING DATA", params);
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

  const columns: ColumnDef<RowDataWithActions<FlowRun>>[] = useMemo(
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
        notClickable: true,
      },
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

  const replayRun = useMutation({
    mutationFn: (params: { runIds: string[]; strategy: FlowRetryStrategy }) =>
      Promise.all(params.runIds.map(runId => flowRunsApi.retry(runId, { strategy: params.strategy }))),
    onSuccess: () => {
      toast({
        title: t('Runs replayed successfully'),
        variant: 'default',
      });
      setRefresh((prev) => prev + 1);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const bulkActions: BulkAction<FlowRun>[] = useMemo(() => [
    {
      render: (selectedRows, resetSelection) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              asChild
            >
              <Button
                disabled={selectedRows.length === 0 || !userHasPermissionToRetryRun}
                className="w-full"
              >
                <PlayIcon className="mr-2 h-4 w-4" />
                {selectedRows.length > 0
                  ? `${t('Retry')} (${selectedRows.length})`
                  : t('Retry')}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToRetryRun}
              >
                <DropdownMenuItem
                  disabled={!userHasPermissionToRetryRun}
                  onClick={() => {
                    replayRun.mutate({ runIds: selectedRows.map(row => row.id), strategy: FlowRetryStrategy.ON_LATEST_VERSION });
                    resetSelection();
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <RotateCw className="h-4 w-4" />
                    <span>{t('on latest version')}</span>
                  </div>
                </DropdownMenuItem>
              </PermissionNeededTooltip>

              {selectedRows.some(row => isFailedState(row.status)) && (
                <PermissionNeededTooltip
                  hasPermission={userHasPermissionToRetryRun}
                >
                  <DropdownMenuItem
                    disabled={!userHasPermissionToRetryRun}
                    onClick={() => {  
                      replayRun.mutate({ runIds: selectedRows.map(row => row.id), strategy: FlowRetryStrategy.FROM_FAILED_STEP });
                      resetSelection();
                    }}
                  >
                    <div className="flex flex-row gap-2 items-center">
                      <Redo className="h-4 w-4" />
                      <span>{t('from failed step')}</span>
                    </div>
                  </DropdownMenuItem>
                </PermissionNeededTooltip>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [replayRun, userHasPermissionToRetryRun, t]);

  const handleRowClick = useCallback((row: FlowRun, newWindow: boolean) => {
    if (newWindow) {
      openNewWindow(`/runs/${row.id}`);
    } else {
      navigate(`/runs/${row.id}`);
    }
  }, [navigate, openNewWindow]);

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
        bulkActions={bulkActions}
        onRowClick={(row, newWindow) => handleRowClick(row, newWindow)}
      />
    </div>
  );
};

FlowRunsPage.displayName = 'FlowRunsTable';
export { FlowRunsPage };

