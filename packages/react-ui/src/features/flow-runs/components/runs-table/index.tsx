import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  CheckIcon,
  PlayIcon,
  Redo,
  RotateCw,
  ChevronDown,
  History,
} from 'lucide-react';
import { useMemo, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
  DataTable,
} from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageTooltip } from '@/components/ui/message-tooltip';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { formatUtils } from '@/lib/utils';
import {
  FlowRetryStrategy,
  FlowRun,
  FlowRunStatus,
  isFailedState,
  Permission,
} from '@activepieces/shared';

import { runsTableColumns } from './columns';

type SelectedRow = {
  id: string;
  status: FlowRunStatus;
};

export const RunsTable = () => {
  const [searchParams] = useSearchParams();
  const [selectedRows, setSelectedRows] = useState<Array<SelectedRow>>([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const [excludedRows, setExcludedRows] = useState<Set<string>>(new Set());

  const projectId = authenticationSession.getProjectId()!;

  const { data, isLoading } = useQuery({
    queryKey: ['flow-run-table', searchParams.toString(), projectId],
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      const status = searchParams.getAll('status') as FlowRunStatus[];
      const flowId = searchParams.getAll('flowId');
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;
      const createdAfter = searchParams.get('createdAfter');
      const createdBefore = searchParams.get('createdBefore');

      return flowRunsApi.list({
        status: status ?? undefined,
        projectId,
        flowId,
        cursor: cursor ?? undefined,
        limit,
        createdAfter: createdAfter ?? undefined,
        createdBefore: createdBefore ?? undefined,
      });
    },
  });

  const columns = runsTableColumns({
    data,
    selectedRows,
    setSelectedRows,
    selectedAll,
    setSelectedAll,
    excludedRows,
    setExcludedRows,
  });

  const navigate = useNavigate();
  const { data: flowsData, isFetching: isFetchingFlows } = flowsHooks.useFlows({
    limit: 1000,
    cursor: undefined,
  });
  const openNewWindow = useNewWindow();
  const flows = flowsData?.data;
  const { checkAccess } = useAuthorization();
  const userHasPermissionToRetryRun = checkAccess(Permission.WRITE_RUN);

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
    mutationFn: (retryParams: {
      runIds: string[];
      strategy: FlowRetryStrategy;
    }) => {
      const status = searchParams.getAll('status') as FlowRunStatus[];
      const flowId = searchParams.getAll('flowId');
      const createdAfter = searchParams.get('createdAfter') || undefined;
      const createdBefore = searchParams.get('createdBefore') || undefined;
      return flowRunsApi.bulkRetry({
        projectId: authenticationSession.getProjectId()!,
        flowRunIds: selectedAll ? undefined : retryParams.runIds,
        strategy: retryParams.strategy,
        excludeFlowRunIds: selectedAll ? Array.from(excludedRows) : undefined,
        status,
        flowId,
        createdAfter,
        createdBefore,
      });
    },
    onSuccess: () => {
      toast({
        title: t('Runs replayed successfully'),
        variant: 'default',
      });
      navigate(window.location.pathname);
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const bulkActions: BulkAction<FlowRun>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => {
          const allFailed = selectedRows.every((row) =>
            isFailedState(row.status),
          );
          const isDisabled =
            selectedRows.length === 0 || !userHasPermissionToRetryRun;

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToRetryRun}
              >
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild disabled={isDisabled}>
                    <Button disabled={isDisabled} className="h-9 w-full">
                      <PlayIcon className="mr-2 h-3 w-4" />
                      {selectedRows.length > 0
                        ? `${t('Retry')} ${
                            selectedAll
                              ? excludedRows.size > 0
                                ? `${t('all except')} ${excludedRows.size}`
                                : t('all')
                              : `(${selectedRows.length})`
                          }`
                        : t('Retry')}
                      <ChevronDown className="h-3 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <PermissionNeededTooltip
                      hasPermission={userHasPermissionToRetryRun}
                    >
                      <DropdownMenuItem
                        disabled={!userHasPermissionToRetryRun}
                        onClick={() => {
                          replayRun.mutate({
                            runIds: selectedRows.map((row) => row.id),
                            strategy: FlowRetryStrategy.ON_LATEST_VERSION,
                          });
                          resetSelection();
                          setSelectedRows([]);
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-row gap-2 items-center">
                          <RotateCw className="h-4 w-4" />
                          <span>{t('on latest version')}</span>
                        </div>
                      </DropdownMenuItem>
                    </PermissionNeededTooltip>

                    {selectedRows.some((row) => isFailedState(row.status)) && (
                      <MessageTooltip
                        message={t(
                          'Only failed runs can be retried from failed step',
                        )}
                        isDisabled={!allFailed}
                      >
                        <DropdownMenuItem
                          disabled={!userHasPermissionToRetryRun || !allFailed}
                          onClick={() => {
                            replayRun.mutate({
                              runIds: selectedRows.map((row) => row.id),
                              strategy: FlowRetryStrategy.FROM_FAILED_STEP,
                            });
                            resetSelection();
                            setSelectedRows([]);
                            setSelectedAll(false);
                            setExcludedRows(new Set());
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-row gap-2 items-center">
                            <Redo className="h-4 w-4" />
                            <span>{t('from failed step')}</span>
                          </div>
                        </DropdownMenuItem>
                      </MessageTooltip>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionNeededTooltip>
            </div>
          );
        },
      },
    ],
    [replayRun, userHasPermissionToRetryRun, t, selectedRows, data],
  );

  const handleRowClick = useCallback(
    (row: FlowRun, newWindow: boolean) => {
      if (newWindow) {
        openNewWindow(
          authenticationSession.appendProjectRoutePrefix(`/runs/${row.id}`),
        );
      } else {
        navigate(
          authenticationSession.appendProjectRoutePrefix(`/runs/${row.id}`),
        );
      }
    },
    [navigate, openNewWindow],
  );

  return (
    <DataTable
      emptyStateTextTitle={t('No flow runs found')}
      emptyStateTextDescription={t(
        'Come back later when your automations start running',
      )}
      emptyStateIcon={<History className="size-14" />}
      columns={columns}
      page={data}
      isLoading={isLoading || isFetchingFlows}
      filters={filters}
      bulkActions={bulkActions}
      onRowClick={(row, newWindow) => handleRowClick(row, newWindow)}
    />
  );
};
