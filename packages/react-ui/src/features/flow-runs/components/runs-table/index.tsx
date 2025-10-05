import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  CheckIcon,
  Redo,
  RotateCw,
  ChevronDown,
  History,
  X,
} from 'lucide-react';
import { useMemo, useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
  DataTable,
  DataTableFilters,
} from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageTooltip } from '@/components/ui/message-tooltip';
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
  isFlowRunStateTerminal,
  Permission,
} from '@activepieces/shared';

import { runsTableColumns } from './columns';
import {
  RetriedRunsSnackbar,
  RUN_IDS_QUERY_PARAM,
} from './retried-runs-snackbar';

type SelectedRow = {
  id: string;
  status: FlowRunStatus;
};
export const RunsTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRows, setSelectedRows] = useState<Array<SelectedRow>>([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const [excludedRows, setExcludedRows] = useState<Set<string>>(new Set());

  const projectId = authenticationSession.getProjectId()!;
  const [retriedRunsIds, setRetriedRunsIds] = useState<string[]>([]);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['flow-run-table', searchParams.toString(), projectId],
    staleTime: 0,
    gcTime: 0,
    queryFn: () => {
      const status = searchParams.getAll('status') as FlowRunStatus[];
      const flowId = searchParams.getAll('flowId');
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const flowRunIds = searchParams.getAll(RUN_IDS_QUERY_PARAM);
      const failedStepName = searchParams.get('failedStepName') || undefined;
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
        failedStepName: failedStepName,
        flowRunIds,
      });
    },
    refetchInterval: (query) => {
      const allRuns = query.state.data?.data;
      const runningRuns = allRuns?.filter(
        (run) =>
          !isFlowRunStateTerminal({
            status: run.status,
            ignoreInternalError: false,
          }),
      );
      return runningRuns?.length ? 15 * 1000 : false;
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

  const filters: DataTableFilters<keyof FlowRun>[] = useMemo(
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
      },
      {
        type: 'select',
        title: t('Status'),
        accessorKey: 'status',
        options: Object.values(FlowRunStatus).map((status) => {
          return {
            label: formatUtils.convertEnumToHumanReadable(status),
            value: status,
            icon: flowRunUtils.getStatusIcon(status).Icon,
          };
        }),
        icon: CheckIcon,
      },
      {
        type: 'date',
        title: t('Created'),
        accessorKey: 'created',
        icon: CheckIcon,
      },
    ],
    [flows],
  );

  const retryRuns = useMutation({
    mutationFn: (retryParams: {
      runIds: string[];
      strategy: FlowRetryStrategy;
    }) => {
      const status = searchParams.getAll('status') as FlowRunStatus[];
      const flowId = searchParams.getAll('flowId');
      const createdAfter = searchParams.get('createdAfter') || undefined;
      const createdBefore = searchParams.get('createdBefore') || undefined;
      const failedStepName = searchParams.get('failedStepName') || undefined;
      return flowRunsApi.bulkRetry({
        projectId: authenticationSession.getProjectId()!,
        flowRunIds: selectedAll ? undefined : retryParams.runIds,
        strategy: retryParams.strategy,
        excludeFlowRunIds: selectedAll ? Array.from(excludedRows) : undefined,
        status,
        flowId,
        createdAfter,
        createdBefore,
        failedStepName,
      });
    },
    onSuccess: (runs) => {
      const runsIds = runs.map((run) => run.id);
      setRetriedRunsIds(runsIds);
      const isAlreadyViewingRetriedRuns = searchParams.get(RUN_IDS_QUERY_PARAM);
      refetch();
      if (isAlreadyViewingRetriedRuns) {
        navigate(authenticationSession.appendProjectRoutePrefix(`/runs`));
        setSearchParams({
          [RUN_IDS_QUERY_PARAM]: runsIds,
          [LIMIT_QUERY_PARAM]: runsIds.length.toString(),
        });
      }
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
                          retryRuns.mutate({
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
                            retryRuns.mutate({
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
    [retryRuns, userHasPermissionToRetryRun, t, selectedRows, data],
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

  const retriedRunsInQueryParams = searchParams.getAll(RUN_IDS_QUERY_PARAM);
  const customFilters =
    retriedRunsInQueryParams.length > 0
      ? [
          <Button
            key="retried-runs-filter"
            variant="outline"
            onClick={() => {
              navigate(authenticationSession.appendProjectRoutePrefix(`/runs`));
            }}
          >
            <div className="flex flex-row gap-2 items-center">
              {t('Viewing retried runs')} ({retriedRunsInQueryParams.length}){' '}
              <X className="size-4" />
            </div>
          </Button>,
        ]
      : [];

  return (
    <div className="relative">
      <DataTable
        emptyStateTextTitle={t('No flow runs found')}
        emptyStateTextDescription={t(
          'Come back later when your automations start running',
        )}
        emptyStateIcon={<History className="size-14" />}
        columns={columns}
        page={data}
        isLoading={isLoading || isFetchingFlows}
        filters={customFilters.length > 0 ? [] : filters}
        bulkActions={bulkActions}
        onRowClick={(row, newWindow) => handleRowClick(row, newWindow)}
        customFilters={customFilters}
        hidePagination={retriedRunsInQueryParams.length > 0}
      />
      <RetriedRunsSnackbar
        retriedRunsIds={retriedRunsIds}
        clearRetriedRuns={() => setRetriedRunsIds([])}
      />
    </div>
  );
};
