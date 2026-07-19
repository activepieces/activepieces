import { Permission } from '@activepieces/core-utils';
import {
  PieceRunListItem,
  PieceRunSource,
  FlowRunStatus,
  isFlowRunStateTerminal,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Archive, Boxes, CheckIcon, Info, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { getDefaultRange } from '@/components/custom/date-time-picker-range';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import { DEFAULT_DATE_PRESET } from '@/features/flow-runs/hooks/flow-run-hooks';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { projectMembersHooks } from '@/features/members/hooks/project-members-hooks';
import { pieceRunsApi } from '@/features/piece-runs/api/piece-runs-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { PieceRunDetailSheet } from './piece-run-detail-sheet';
import {
  pieceRunsColumns,
  formatSource,
  SelectedRow,
} from './piece-runs-columns';

const PIECE_RUN_STATUSES = [
  FlowRunStatus.RUNNING,
  FlowRunStatus.SUCCEEDED,
  FlowRunStatus.FAILED,
  FlowRunStatus.TIMEOUT,
  FlowRunStatus.INTERNAL_ERROR,
];

export const PieceRunsTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = authenticationSession.getProjectId()!;
  const [selectedRun, setSelectedRun] = useState<PieceRunListItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<SelectedRow[]>([]);
  const [selectedAll, setSelectedAll] = useState(false);
  const [excludedRows, setExcludedRows] = useState<Set<string>>(new Set());
  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteRun = checkAccess(Permission.WRITE_RUN);
  const { projectMembers } = projectMembersHooks.useProjectMembers();

  const [hasSeededDefaultRange, setHasSeededDefaultRange] = useState(() =>
    searchParams.has('createdAfter'),
  );
  useEffect(() => {
    if (hasSeededDefaultRange) return;
    const range = getDefaultRange(DEFAULT_DATE_PRESET);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!next.has('createdAfter')) {
          next.set('createdAfter', range.from.toISOString());
          next.set('createdBefore', range.to.toISOString());
        }
        return next;
      },
      { replace: true },
    );
    setHasSeededDefaultRange(true);
  }, [hasSeededDefaultRange, setSearchParams]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['piece-runs-table', searchParams.toString(), projectId],
    enabled: hasSeededDefaultRange,
    staleTime: 0,
    gcTime: 0,
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
    queryFn: () => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limitParam = searchParams.get(LIMIT_QUERY_PARAM);
      const limit = limitParam ? parseInt(limitParam) : 10;
      const status = searchParams.getAll('status') as FlowRunStatus[];
      const source = searchParams.getAll('source') as PieceRunSource[];
      const userId = searchParams.getAll('userId');
      const createdAfter = searchParams.get('createdAfter');
      const createdBefore = searchParams.get('createdBefore');
      const includeArchived = searchParams.get('archivedAt') === 'true';
      return pieceRunsApi.list({
        projectId,
        cursor: cursor ?? undefined,
        limit,
        status,
        source,
        userId,
        createdAfter: createdAfter ?? undefined,
        createdBefore: createdBefore ?? undefined,
        includeArchived,
      });
    },
    refetchInterval: (query) => {
      const allRuns = query.state.data?.data as PieceRunListItem[] | undefined;
      const hasNonTerminal = allRuns?.some(
        (run) =>
          !isFlowRunStateTerminal({
            status: run.status,
            ignoreInternalError: false,
          }),
      );
      return hasNonTerminal ? 15 * 1000 : false;
    },
  });

  const filters: DataTableFilters<
    'status' | 'source' | 'userId' | 'created' | 'archivedAt'
  >[] = useMemo(
    () => [
      {
        type: 'select',
        title: t('Status'),
        accessorKey: 'status',
        options: PIECE_RUN_STATUSES.map((status) => ({
          label: formatUtils.convertEnumToHumanReadable(status),
          value: status,
          icon: flowRunUtils.getStatusIcon(status).Icon,
        })),
        icon: CheckIcon,
      },
      {
        type: 'select',
        title: t('Source'),
        accessorKey: 'source',
        options: Object.values(PieceRunSource).map((source) => ({
          label: formatSource(source),
          value: source,
        })),
        icon: CheckIcon,
      },
      ...(projectMembers && projectMembers.length > 0
        ? [
            {
              type: 'select' as const,
              title: t('Run By'),
              accessorKey: 'userId' as const,
              options: projectMembers.map((member) => ({
                label:
                  `${member.user.firstName} ${member.user.lastName}`.trim() ||
                  member.user.email,
                value: member.userId,
              })),
              icon: User,
            },
          ]
        : []),
      {
        type: 'date',
        title: t('Created'),
        accessorKey: 'created',
        icon: CheckIcon,
        defaultPresetName: DEFAULT_DATE_PRESET,
      },
      {
        type: 'checkbox',
        title: t('Show archived'),
        accessorKey: 'archivedAt',
      },
    ],
    [projectMembers],
  );

  const columns = useMemo(
    () =>
      pieceRunsColumns({
        data,
        selectedRows,
        setSelectedRows,
        selectedAll,
        setSelectedAll,
        excludedRows,
        setExcludedRows,
      }),
    [data, selectedRows, selectedAll, excludedRows],
  );

  const archiveRuns = useMutation({
    mutationFn: () =>
      pieceRunsApi.bulkArchive({
        projectId,
        pieceRunIds: selectedAll
          ? undefined
          : selectedRows.map((row) => row.id),
        excludePieceRunIds: selectedAll ? Array.from(excludedRows) : undefined,
        status:
          searchParams.getAll('status').length > 0
            ? (searchParams.getAll('status') as FlowRunStatus[])
            : undefined,
        source:
          searchParams.getAll('source').length > 0
            ? (searchParams.getAll('source') as PieceRunSource[])
            : undefined,
        userId:
          searchParams.getAll('userId').length > 0
            ? searchParams.getAll('userId')
            : undefined,
        createdAfter: searchParams.get('createdAfter') || undefined,
        createdBefore: searchParams.get('createdBefore') || undefined,
      }),
    onSuccess: () => {
      setSelectedRows([]);
      setSelectedAll(false);
      setExcludedRows(new Set());
      refetch();
    },
  });

  const bulkActions: BulkAction<PieceRunListItem>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => {
          const isDisabled =
            selectedRows.length === 0 || !userHasPermissionToWriteRun;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <PermissionNeededTooltip
                hasPermission={userHasPermissionToWriteRun}
              >
                <Button
                  disabled={isDisabled}
                  variant="ghost"
                  size="sm"
                  loading={archiveRuns.isPending}
                  onClick={() => {
                    archiveRuns.mutate();
                    resetSelection();
                  }}
                >
                  <Archive className="size-4 mr-1" />
                  {selectedRows.length > 0
                    ? `${t('Archive')} ${
                        !isDisabled
                          ? selectedAll
                            ? excludedRows.size > 0
                              ? `${t('all except')} ${excludedRows.size}`
                              : t('all')
                            : `(${selectedRows.length})`
                          : ''
                      }`
                    : t('Archive')}
                </Button>
              </PermissionNeededTooltip>
            </div>
          );
        },
      },
    ],
    [
      selectedRows,
      selectedAll,
      excludedRows,
      archiveRuns,
      userHasPermissionToWriteRun,
    ],
  );

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 pt-3 text-sm text-muted-foreground',
          DASHBOARD_CONTENT_PADDING_X,
        )}
      >
        <Info className="size-4 shrink-0" />
        <span>
          {t(
            'These are individual piece actions run outside of a flow by your chat agents, MCP servers, or the API.',
          )}
        </span>
      </div>
      <DataTable
        emptyStateTextTitle={t('No piece runs yet')}
        emptyStateTextDescription={t(
          'Runs of individual actions (via MCP, chat, or the API) will appear here.',
        )}
        emptyStateIcon={<Boxes className="size-14" />}
        columns={columns}
        page={data}
        isLoading={isLoading}
        filters={filters}
        bulkActions={bulkActions}
        onRowClick={(row) => {
          setSelectedRun(row);
          setIsSheetOpen(true);
        }}
      />
      <PieceRunDetailSheet
        run={selectedRun}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
};
