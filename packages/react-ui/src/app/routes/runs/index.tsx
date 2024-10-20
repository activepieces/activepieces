import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, PlayIcon, Redo, RotateCw, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BulkAction, CURSOR_QUERY_PARAM, LIMIT_QUERY_PARAM } from '@/components/ui/data-table'
import {
  DataTable,
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


const FlowRunsPage = () => {

  const params = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['flow-run-table', window.location.search],
    staleTime: 0,
    queryFn: () => {
      const searchParams = new URLSearchParams(window.location.search);
      const status = searchParams.getAll('status') || params.status;
      const flowId = searchParams.getAll('flowId') || params.flowId;
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM) ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!) : 10;
      const createdAfter = searchParams.get('createdAfter');
      const createdBefore = searchParams.get('createdBefore');


      return flowRunsApi.list({
        status: status ? status.map(s => s as FlowRunStatus) : undefined,
        projectId: authenticationSession.getProjectId()!,
        flowId,
        cursor: cursor ?? undefined,
        limit,
        createdAfter: createdAfter ?? undefined,
        createdBefore: createdBefore ?? undefined,
      });
    },
  });


  const navigate = useNavigate();
  const { data: flowsData, isFetching: isFetchingFlows } = flowsHooks.useFlows({
    limit: 1000,
    cursor: undefined,
  });
  const openNewWindow = useNewWindow();
  const flows = flowsData?.data;
  const { checkAccess } = useAuthorization();
  const userHasPermissionToRetryRun = checkAccess(Permission.RETRY_RUN);

  const columns: ColumnDef<RowDataWithActions<FlowRun>>[] = [
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
  ]

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


  const replayRun = useMutation({
    mutationFn: (params: { runIds: string[]; strategy: FlowRetryStrategy }) =>
      Promise.all(params.runIds.map(runId => flowRunsApi.retry(runId, { strategy: params.strategy }))),
    onSuccess: () => {
      toast({
        title: t('Runs replayed successfully'),
        variant: 'default',
      });
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
        page={data}
        isLoading={isLoading || isFetchingFlows}
        filters={filters}
        bulkActions={bulkActions}
        onRowClick={(row, newWindow) => handleRowClick(row, newWindow)}
      />
    </div>
  );
};

FlowRunsPage.displayName = 'FlowRunsTable';
export { FlowRunsPage };

