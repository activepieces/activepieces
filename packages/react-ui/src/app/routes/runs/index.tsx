import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageTooltip } from '@/components/ui/message-tooltip';
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
  isFailedState,
  Permission,
} from '@activepieces/shared';

import { useNewWindow } from '../../../components/embed-provider';
import { TableTitle } from '../../../components/ui/table-title';
import TaskLimitAlert from '../flows/task-limit-alert';

type SelectedRow = {
  id: string;
  status: FlowRunStatus;
};

const FlowRunsPage = () => {
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

  const columns: ColumnDef<RowDataWithActions<FlowRun>>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center">
          <Checkbox
            checked={selectedAll || table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              table.toggleAllPageRowsSelected(isChecked);

              if (isChecked) {
                const currentPageRows = table.getRowModel().rows.map((row) => ({
                  id: row.original.id,
                  status: row.original.status,
                }));

                setSelectedRows((prev) => {
                  const uniqueRows = new Map<string, SelectedRow>([
                    ...prev.map(
                      (row) => [row.id, row] as [string, SelectedRow],
                    ),
                    ...currentPageRows.map(
                      (row) => [row.id, row] as [string, SelectedRow],
                    ),
                  ]);

                  return Array.from(uniqueRows.values());
                });
              } else {
                setSelectedAll(false);
                setSelectedRows([]);
                setExcludedRows(new Set());
              }
            }}
          />
          {selectedRows.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    const currentPageRows = table
                      .getRowModel()
                      .rows.map((row) => ({
                        id: row.original.id,
                        status: row.original.status,
                      }));
                    setSelectedRows(currentPageRows);
                    setSelectedAll(false);
                    setExcludedRows(new Set());
                    table.toggleAllPageRowsSelected(true);
                  }}
                >
                  {t('Select shown')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    if (data?.data) {
                      const allRows = data.data.map((row) => ({
                        id: row.id,
                        status: row.status,
                      }));
                      setSelectedRows(allRows);
                      setSelectedAll(true);
                      setExcludedRows(new Set());
                      table.toggleAllPageRowsSelected(true);
                    }
                  }}
                >
                  {t('Select all')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ),
      cell: ({ row }) => {
        const isExcluded = excludedRows.has(row.original.id);
        const isSelected = selectedAll
          ? !isExcluded
          : selectedRows.some(
              (selectedRow) => selectedRow.id === row.original.id,
            );

        return (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(value) => {
              const isChecked = !!value;

              if (selectedAll) {
                if (isChecked) {
                  const newExcluded = new Set(excludedRows);
                  newExcluded.delete(row.original.id);
                  setExcludedRows(newExcluded);
                } else {
                  setExcludedRows(new Set([...excludedRows, row.original.id]));
                }
              } else {
                if (isChecked) {
                  setSelectedRows((prev) => [
                    ...prev,
                    {
                      id: row.original.id,
                      status: row.original.status,
                    },
                  ]);
                } else {
                  setSelectedRows((prev) =>
                    prev.filter(
                      (selectedRow) => selectedRow.id !== row.original.id,
                    ),
                  );
                }
              }
              row.toggleSelected(isChecked);
            }}
          />
        );
      },
    },
    {
      accessorKey: 'flowId',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Flow')} />
      ),
      cell: ({ row }) => {
        return <div className="text-left">{row.original.flowDisplayName}</div>;
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
  ];

  return (
    <div className="flex flex-col gap-4 grow">
      <TaskLimitAlert />
      <div className="flex-col w-full">
        <TableTitle
          description={t(
            'Track the automation run history and status and troubleshoot issues.',
          )}
        >
          {t('Flow Runs')}
        </TableTitle>
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
      </div>
    </div>
  );
};

FlowRunsPage.displayName = 'FlowRunsTable';
export { FlowRunsPage };
