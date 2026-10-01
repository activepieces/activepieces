import {
  AppConnectionScope,
  AppConnectionStatus,
  MAX_PLATFORM_APP_CONNECTION_OWNERS,
  PlatformAppConnectionsListItem,
  PlatformAppConnectionsSummary,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Activity,
  CheckIcon,
  Clock,
  Folder,
  Globe,
  Puzzle,
  Trash,
  Unplug,
  User,
  Workflow,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectConnectionDialog } from '@/app/connections/reconnect-button-dialog';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PLATFORM_FEATURES, useFeatureGate } from '@/features/billing';
import {
  appConnectionUtils,
  EditGlobalConnectionFormDialog,
} from '@/features/connections';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import {
  PLATFORM_CONNECTIONS_PARAMS,
  platformAppConnectionsCache,
  platformAppConnectionsQueries,
} from '@/features/platform-admin';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

import { OwnerCell, ProjectCell, UsedByCell } from './connection-cells';
import { ConnectionRowActions, RowDialog } from './connection-row-actions';
import { DeleteConnectionsDialog } from './delete-connections-dialog';

export default function PlatformConnectionsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const globalLocked = !platform.plan.globalConnectionsEnabled;
  const {
    data: connections,
    isLoading,
    isError,
    refetch,
  } = platformAppConnectionsQueries.useList({
    scopeFilterEnabled: !globalLocked,
  });
  const { data: summary } = platformAppConnectionsQueries.useSummary();
  const { data: owners } = platformAppConnectionsQueries.useOwners();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const { pieces } = piecesHooks.usePieces({});
  const globalGate = useFeatureGate({
    locked: globalLocked,
    feature: PLATFORM_FEATURES.globalConnections,
  });
  const [pending, setPending] = useState<PendingAction | null>(null);
  const refresh = () => platformAppConnectionsCache.refresh({ queryClient });
  const narrowingParams = globalLocked
    ? NARROWING_PARAMS.filter(
        (param) => param !== PLATFORM_CONNECTIONS_PARAMS.scope,
      )
    : NARROWING_PARAMS;
  const narrowed = narrowingParams.some((param) => searchParams.has(param));
  const statuses = new Set(
    searchParams.getAll(PLATFORM_CONNECTIONS_PARAMS.status),
  );
  const lens = lensFor(statuses);
  const emptyState = emptyStateFor({
    narrowed,
    lens,
    statusFiltered: statuses.size > 0,
  });
  const goToPreviousPage = () =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const previous = connections?.previous;
        if (previous) {
          next.set(CURSOR_QUERY_PARAM, previous);
        } else {
          next.delete(CURSOR_QUERY_PARAM);
        }
        return next;
      },
      { replace: true },
    );
  const afterDeleting = ({ deleted }: { deleted: number }) => {
    if (deleted > 0 && deleted >= (connections?.data.length ?? 0)) {
      goToPreviousPage();
    }
  };
  const closePending = (open: boolean) => {
    if (open || !pending) {
      return;
    }
    const returnTo =
      pending.kind === 'delete'
        ? pending.connections.length === 1
          ? pending.connections[0].id
          : undefined
        : pending.connection.id;
    setPending(null);
    if (returnTo) {
      requestAnimationFrame(() => focusRowActions({ connectionId: returnTo }));
    }
  };
  const openRowDialog = useCallback((dialog: RowDialog) => {
    setPending(
      dialog.kind === 'delete'
        ? { kind: 'delete', connections: [dialog.connection] }
        : { kind: dialog.kind, connection: dialog.connection },
    );
  }, []);
  const openUpgrade = globalGate.open;

  const filters: DataTableFilters<string>[] = [
    {
      type: 'input',
      title: t('Name'),
      accessorKey: PLATFORM_CONNECTIONS_PARAMS.displayName,
      icon: Unplug,
    },
    {
      type: 'select',
      title: t('Status'),
      accessorKey: PLATFORM_CONNECTIONS_PARAMS.status,
      icon: CheckIcon,
      options: Object.values(AppConnectionStatus).map((status) => ({
        label: formatUtils.convertEnumToHumanReadable(status),
        value: status,
      })),
    },
    {
      type: 'select',
      title: t('Piece'),
      accessorKey: PLATFORM_CONNECTIONS_PARAMS.pieceName,
      icon: Puzzle,
      options: (pieces ?? []).map((piece) => ({
        label: piece.displayName,
        value: piece.name,
      })),
    },
    {
      type: 'select',
      title: t('Project'),
      accessorKey: PLATFORM_CONNECTIONS_PARAMS.projectIds,
      icon: Folder,
      options: (projects ?? []).map((project) => ({
        label: getProjectName(project),
        value: project.id,
      })),
    },
    {
      type: 'select',
      title: t('Owner'),
      accessorKey: PLATFORM_CONNECTIONS_PARAMS.ownerIds,
      icon: User,
      options: (owners?.data ?? []).map((owner) => ({
        label: owner.email,
        value: owner.id,
      })),
    },
    ...(globalLocked
      ? []
      : [
          {
            type: 'select' as const,
            title: t('Scope'),
            accessorKey: PLATFORM_CONNECTIONS_PARAMS.scope,
            icon: Globe,
            options: [
              { label: t('Project'), value: AppConnectionScope.PROJECT },
              { label: t('Global'), value: AppConnectionScope.PLATFORM },
            ],
          },
        ]),
  ];

  const columns = useMemo<
    ColumnDef<RowDataWithActions<PlatformAppConnectionsListItem>>[]
  >(
    () => [
      {
        accessorKey: 'displayName',
        size: 230,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Connection')}
            icon={Unplug}
          />
        ),
        cell: ({ row }) => (
          <CopyTextTooltip
            title={t('External ID')}
            text={row.original.externalId || ''}
          >
            <div className="flex w-fit min-w-0 items-center gap-2">
              <PieceIconWithPieceName
                pieceName={row.original.pieceName}
                showTooltip={false}
                size="sm"
              />
              <TextWithTooltip tooltipMessage={row.original.displayName}>
                <span className="max-w-[180px] truncate">
                  {row.original.displayName}
                </span>
              </TextWithTooltip>
            </div>
          </CopyTextTooltip>
        ),
      },
      {
        accessorKey: 'projects',
        size: 240,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Project')}
            icon={Folder}
          />
        ),
        cell: ({ row }) => <ProjectCell connection={row.original} />,
      },
      {
        accessorKey: 'owner',
        size: 140,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Owner')}
            icon={User}
          />
        ),
        cell: ({ row }) => <OwnerCell owner={row.original.owner} />,
      },
      {
        accessorKey: 'flows',
        size: 90,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Used by')}
            icon={Workflow}
          />
        ),
        cell: ({ row }) => (
          <UsedByCell
            flows={row.original.flows}
            flowCount={row.original.flowCount}
          />
        ),
      },
      {
        accessorKey: 'status',
        size: 110,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Status')}
            icon={Activity}
          />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const { variant, icon: Icon } =
            appConnectionUtils.getStatusIcon(status);
          return (
            <StatusIconWithText
              icon={Icon}
              text={formatUtils.convertEnumToHumanReadable(status)}
              variant={variant}
            />
          );
        },
      },
      {
        accessorKey: 'updated',
        size: 120,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Connected At')}
            icon={Clock}
          />
        ),
        cell: ({ row }) => (
          <FormattedDate date={new Date(row.original.updated)} />
        ),
      },
      {
        id: 'actions',
        size: 50,
        cell: ({ row }) => (
          <ConnectionRowActions
            connection={row.original}
            globalLocked={globalLocked}
            onOpenDialog={openRowDialog}
            onLockedAction={openUpgrade}
          />
        ),
      },
    ],
    [globalLocked, openRowDialog, openUpgrade],
  );

  const bulkActions: BulkAction<PlatformAppConnectionsListItem>[] = [
    {
      render: (selectedRows) =>
        selectedRows.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger-11 hover:text-danger-11"
              onClick={() =>
                setPending({
                  kind: 'delete',
                  connections: selectedRows,
                })
              }
            >
              <Trash className="mr-1 w-4" />
              {t('Delete ({count})', { count: selectedRows.length })}
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="flex w-full flex-col">
      <DashboardPageHeader
        title={t('Connections')}
        description={summaryLine(summary)}
      >
        {globalGate.locked ? (
          <Button
            size="sm"
            className="has-[>svg]:px-2.5"
            onClick={globalGate.open}
          >
            {globalGate.crown}
            {t('New global connection')}
          </Button>
        ) : (
          <NewConnectionDialog
            isGlobalConnection={true}
            onConnectionCreated={refresh}
          >
            <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
              {t('New global connection')}
            </AnimatedIconButton>
          </NewConnectionDialog>
        )}
      </DashboardPageHeader>
      {owners?.truncated && (
        <div className="px-6 pb-2 text-xs text-gray-11">
          {t('Owner filter is limited to the first {count} owners', {
            count: MAX_PLATFORM_APP_CONNECTION_OWNERS,
          })}
        </div>
      )}
      <DataTable
        emptyStateTextTitle={emptyState.title}
        emptyStateTextDescription={emptyState.description}
        emptyStateIcon={<Unplug className="size-14" />}
        columns={columns}
        page={connections}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('connections')}
        onRetry={refetch}
        filters={filters}
        toolbarButtons={[
          <AttentionTabs
            key="attention"
            lens={lens}
            summary={narrowed ? undefined : summary}
          />,
        ]}
        selectColumn={true}
        getRowId={(row) => row.id}
        isRowSelectionDisabled={(row) =>
          globalGate.locked && row.scope === AppConnectionScope.PLATFORM
        }
        bulkActions={bulkActions}
      />
      {pending?.kind === 'edit' && (
        <EditGlobalConnectionFormDialog
          key={pending.connection.id}
          open
          onOpenChange={closePending}
          connectionId={pending.connection.id}
          currentName={pending.connection.displayName}
          projectIds={pending.connection.projectIds}
          preSelectForNewProjects={
            pending.connection.preSelectForNewProjects ?? false
          }
          onEdit={refresh}
        />
      )}
      {pending?.kind === 'reconnect' && (
        <ReconnectConnectionDialog
          key={pending.connection.id}
          connection={pending.connection}
          open
          onOpenChange={closePending}
          onConnectionCreated={refresh}
        />
      )}
      {pending?.kind === 'delete' && (
        <DeleteConnectionsDialog
          connections={pending.connections}
          open
          onOpenChange={closePending}
          onDeleted={afterDeleting}
        />
      )}
      {globalGate.dialog}
    </div>
  );
}

const AttentionTabs = ({
  lens: value,
  summary,
}: {
  lens: string;
  summary: PlatformAppConnectionsSummary | undefined;
}) => {
  const [, setSearchParams] = useSearchParams();

  const selectLens = (lens: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PLATFORM_CONNECTIONS_PARAMS.status);
        next.delete(CURSOR_QUERY_PARAM);
        if (lens === ATTENTION_LENS) {
          NEEDS_ATTENTION_STATUSES.forEach((status) =>
            next.append(PLATFORM_CONNECTIONS_PARAMS.status, status),
          );
        }
        return next;
      },
      { replace: true },
    );
  };

  return (
    <Tabs value={value} onValueChange={selectLens}>
      <TabsList>
        <TabsTrigger value={ALL_LENS}>
          {t('All')}
          <LensCount count={summary?.total} />
        </TabsTrigger>
        <TabsTrigger value={ATTENTION_LENS}>
          {t('Needs attention')}
          <LensCount count={summary ? needsAttention(summary) : undefined} />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

const LensCount = ({ count }: { count: number | undefined }) => {
  if (count === undefined) {
    return null;
  }
  return <span className="ml-1.5 text-xs text-gray-11">{count}</span>;
};

function focusRowActions({ connectionId }: { connectionId: string }) {
  document
    .querySelector<HTMLElement>(
      `[data-connection-actions="${CSS.escape(connectionId)}"]`,
    )
    ?.focus();
}

function emptyStateFor({
  narrowed,
  lens,
  statusFiltered,
}: {
  narrowed: boolean;
  lens: string;
  statusFiltered: boolean;
}): { title: string; description: string } {
  if (lens === ATTENTION_LENS && !narrowed) {
    return {
      title: t('Nothing needs attention'),
      description: t('Every connection on this platform is working.'),
    };
  }
  if (narrowed || statusFiltered) {
    return {
      title: t('No connection matches'),
      description: t('Try a different search or clear a filter.'),
    };
  }
  return {
    title: t('No connections found'),
    description: t(
      'Connections created in any project on this platform will appear here.',
    ),
  };
}

function lensFor(statuses: Set<string>): string {
  if (statuses.size === 0) {
    return ALL_LENS;
  }
  const isAttention =
    statuses.size === NEEDS_ATTENTION_STATUSES.length &&
    NEEDS_ATTENTION_STATUSES.every((status) => statuses.has(status));
  return isAttention ? ATTENTION_LENS : '';
}

function needsAttention(summary: PlatformAppConnectionsSummary): number {
  return NEEDS_ATTENTION_STATUSES.reduce(
    (count, status) => count + summary.byStatus[status],
    0,
  );
}

function summaryLine(
  summary: PlatformAppConnectionsSummary | undefined,
): string {
  if (!summary) {
    return t('Every connection in every project on this platform');
  }
  return t(
    '{total, plural, =1 {1 connection across every project} other {# connections across every project}}{attention, plural, =0 {} =1 { · 1 needs attention} other { · # need attention}}',
    { total: summary.total, attention: needsAttention(summary) },
  );
}

const ALL_LENS = 'all';
const ATTENTION_LENS = 'attention';
const NEEDS_ATTENTION_STATUSES = [
  AppConnectionStatus.ERROR,
  AppConnectionStatus.MISSING,
];
const NARROWING_PARAMS = [
  PLATFORM_CONNECTIONS_PARAMS.displayName,
  PLATFORM_CONNECTIONS_PARAMS.pieceName,
  PLATFORM_CONNECTIONS_PARAMS.projectIds,
  PLATFORM_CONNECTIONS_PARAMS.ownerIds,
  PLATFORM_CONNECTIONS_PARAMS.scope,
];

type PendingAction =
  | {
      kind: 'edit' | 'reconnect';
      connection: PlatformAppConnectionsListItem;
    }
  | {
      kind: 'delete';
      connections: PlatformAppConnectionsListItem[];
    };
