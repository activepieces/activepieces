import { isNil } from '@activepieces/core-utils';
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
import { Crown, Plus, Trash2, Unplug } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectConnectionDialog } from '@/app/connections/reconnect-button-dialog';
import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableFilter } from '@/components/custom/data-table/data-table-filter';
import { DateCell, MutedCell } from '@/components/custom/list/list-cells';
import {
  CountTabs,
  ListSearch,
  ListToolbar,
} from '@/components/custom/list/list-toolbar';
import { RowMenu } from '@/components/custom/list/row-menu';
import { Page } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { PLATFORM_FEATURES, useFeatureGate } from '@/features/billing';
import { EditGlobalConnectionDialog } from '@/features/connections';
import { piecesHooks } from '@/features/pieces';
import {
  PLATFORM_CONNECTIONS_PARAMS,
  platformAppConnectionsCache,
  platformAppConnectionsMutations,
  platformAppConnectionsQueries,
} from '@/features/platform-admin';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectConnectionsPath } from '@/lib/route-utils';

import {
  ConnectionActionHandlers,
  connectionActionsUtils,
} from './connection-actions';
import {
  ConnectionNameCell,
  ConnectionStatus,
  connectionStatusLabel,
  ownerLabel,
  UsedByCell,
  WhereCell,
} from './connection-cells';
import { ConnectionSheet } from './connection-sheet';
import { DeleteConnectionsDialog } from './delete-connections-dialog';

export default function PlatformConnectionsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const globalLocked = !platform.plan.globalConnectionsEnabled;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const { mutate: revalidate } =
    platformAppConnectionsMutations.useRevalidate();
  const upgrade = useFeatureGate({
    locked: globalLocked,
    feature: PLATFORM_FEATURES.globalConnections,
  });
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const refresh = () => platformAppConnectionsCache.refresh({ queryClient });

  const rows = connections?.data ?? [];
  const viewing = rows.find((row) => row.id === viewingId) ?? null;
  const statuses = new Set(
    searchParams.getAll(PLATFORM_CONNECTIONS_PARAMS.status),
  );
  const lens = lensFor(statuses);
  const narrowed = NARROWING_PARAMS.filter(
    (param) => !globalLocked || param !== PLATFORM_CONNECTIONS_PARAMS.scope,
  ).some((param) => searchParams.has(param));

  const actionHandlers: ConnectionActionHandlers = {
    edit: (row) => setPending({ kind: 'edit', connection: row }),
    reconnect: (row) => setPending({ kind: 'reconnect', connection: row }),
    test: (row) => revalidate(row),
    openProject: (projectId) => navigate(projectConnectionsPath(projectId)),
    delete: (row) => setPending({ kind: 'delete', connections: [row] }),
    upgrade: upgrade.open,
  };
  const actionsFor = (connection: PlatformAppConnectionsListItem) =>
    connectionActionsUtils.connectionActions({
      connection,
      globalLocked,
      handlers: actionHandlers,
    });

  const selectLens = (next: Lens) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete(PLATFORM_CONNECTIONS_PARAMS.status);
        params.delete(CURSOR_QUERY_PARAM);
        if (next === 'attention') {
          NEEDS_ATTENTION_STATUSES.forEach((status) =>
            params.append(PLATFORM_CONNECTIONS_PARAMS.status, status),
          );
        }
        return params;
      },
      { replace: true },
    );

  const columns: ColumnDef<
    RowDataWithActions<PlatformAppConnectionsListItem>
  >[] = [
    {
      accessorKey: 'displayName',
      size: 300,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Connection')} />
      ),
      cell: ({ row }) => (
        <ConnectionNameCell
          pieceName={row.original.pieceName}
          displayName={row.original.displayName}
        />
      ),
    },
    {
      id: 'where',
      size: 220,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Where')} />
      ),
      cell: ({ row }) => <WhereCell connection={row.original} />,
    },
    {
      id: 'usedBy',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Used by')} />
      ),
      cell: ({ row }) => <UsedByCell connection={row.original} />,
    },
    {
      id: 'owner',
      size: 160,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Owner')} />
      ),
      cell: ({ row }) => (
        <MutedCell>{ownerLabel({ owner: row.original.owner })}</MutedCell>
      ),
    },
    {
      id: 'status',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => <ConnectionStatus status={row.original.status} />,
    },
    {
      id: 'updated',
      size: 130,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Updated')} />
      ),
      cell: ({ row }) => <DateCell value={row.original.updated} />,
    },
    {
      id: 'actions',
      size: 56,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RowMenu items={actionsFor(row.original)} />
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction<PlatformAppConnectionsListItem>[] = [
    {
      render: (selected) =>
        selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-11 hover:text-danger-11"
            onClick={() =>
              setPending({ kind: 'delete', connections: selected })
            }
          >
            <Trash2 />
            {t('Delete {count}', { count: selected.length })}
          </Button>
        ),
    },
  ];

  const newGlobal = globalLocked ? (
    <Button onClick={upgrade.open}>
      <Crown />
      {t('New global connection')}
    </Button>
  ) : (
    <NewConnectionDialog isGlobalConnection onConnectionCreated={refresh}>
      <Button>
        <Plus />
        {t('New global connection')}
      </Button>
    </NewConnectionDialog>
  );
  const emptyState = emptyStateFor({ narrowed, lens });

  return (
    <Page>
      <AdminPageHeader page="connections" description={summaryLine(summary)}>
        {newGlobal}
      </AdminPageHeader>
      <ListToolbar
        search={
          <ListSearch
            param={PLATFORM_CONNECTIONS_PARAMS.displayName}
            placeholder={t('Search connections')}
          />
        }
        tabs={
          <CountTabs
            value={lens}
            onValueChange={selectLens}
            options={[
              {
                value: 'all',
                label: t('All'),
                count: narrowed ? undefined : summary?.total,
              },
              {
                value: 'attention',
                label: t('Needs attention'),
                count:
                  narrowed || !summary ? undefined : needsAttention(summary),
              },
            ]}
          />
        }
        filters={
          <>
            {!globalLocked && (
              <DataTableFilter
                type="select"
                single
                title={t('Scope')}
                accessorKey={PLATFORM_CONNECTIONS_PARAMS.scope}
                options={[
                  { label: t('Global'), value: AppConnectionScope.PLATFORM },
                  { label: t('Project'), value: AppConnectionScope.PROJECT },
                ]}
              />
            )}
            <DataTableFilter
              type="select"
              title={t('Project')}
              accessorKey={PLATFORM_CONNECTIONS_PARAMS.projectIds}
              options={(projects ?? []).map((project) => ({
                label: getProjectName(project),
                value: project.id,
              }))}
            />
            <DataTableFilter
              type="select"
              title={t('Owner')}
              accessorKey={PLATFORM_CONNECTIONS_PARAMS.ownerIds}
              options={(owners?.data ?? []).map((owner) => ({
                label: ownerLabel({ owner }),
                value: owner.id,
              }))}
            />
            <DataTableFilter
              type="select"
              title={t('Piece')}
              accessorKey={PLATFORM_CONNECTIONS_PARAMS.pieceName}
              options={(pieces ?? [])
                .filter((piece) => !isNil(piece.auth))
                .map((piece) => ({
                  label: piece.displayName,
                  value: piece.name,
                  icon: piece.logoUrl,
                }))}
            />
            <DataTableFilter
              type="select"
              title={t('Status')}
              accessorKey={PLATFORM_CONNECTIONS_PARAMS.status}
              options={Object.values(AppConnectionStatus).map((status) => ({
                label: connectionStatusLabel(status),
                value: status,
              }))}
            />
          </>
        }
      />
      {owners?.truncated && (
        <p className="text-xs text-gray-11">
          {t('Owner filter is limited to the first {count} owners', {
            count: MAX_PLATFORM_APP_CONNECTION_OWNERS,
          })}
        </p>
      )}
      <DataTable
        emptyStateTextTitle={emptyState.title}
        emptyStateTextDescription={emptyState.description}
        emptyStateIcon={<Unplug />}
        emptyStateAction={!narrowed && lens === 'all' ? newGlobal : undefined}
        columns={columns}
        page={connections}
        onRowClick={(row) => setViewingId(row.id)}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('connections')}
        onRetry={refetch}
        selectColumn
        getRowId={(row) => row.id}
        isRowSelectionDisabled={(row) =>
          globalLocked && row.scope === AppConnectionScope.PLATFORM
        }
        bulkActions={bulkActions}
      />
      <ConnectionSheet
        connection={viewing}
        actions={
          viewing
            ? connectionActionsUtils.connectionActions({
                connection: viewing,
                globalLocked,
                handlers: actionHandlers,
                withTest: false,
              })
            : []
        }
        onTest={(row) => revalidate(row)}
        onOpenChange={(open) => !open && setViewingId(null)}
      />
      {pending?.kind === 'edit' && (
        <EditGlobalConnectionDialog
          key={pending.connection.id}
          open
          onOpenChange={(open) => !open && setPending(null)}
          connectionId={pending.connection.id}
          currentName={pending.connection.displayName}
          projectIds={pending.connection.projectIds}
          preSelectForNewProjects={
            pending.connection.preSelectForNewProjects ?? false
          }
          userHasPermissionToEdit
          onEdit={refresh}
        />
      )}
      {pending?.kind === 'reconnect' && (
        <ReconnectConnectionDialog
          key={pending.connection.id}
          connection={pending.connection}
          open
          onOpenChange={(open) => !open && setPending(null)}
          onConnectionCreated={refresh}
        />
      )}
      {pending?.kind === 'delete' && (
        <DeleteConnectionsDialog
          connections={pending.connections}
          open
          onOpenChange={(open) => !open && setPending(null)}
          onDeleted={({ deleted }) => {
            if (
              pending.connections.some(
                (connection) => connection.id === viewingId,
              )
            ) {
              setViewingId(null);
            }
            if (deleted > 0 && deleted >= rows.length) {
              setSearchParams(
                (prev) => {
                  const params = new URLSearchParams(prev);
                  if (connections?.previous) {
                    params.set(CURSOR_QUERY_PARAM, connections.previous);
                  } else {
                    params.delete(CURSOR_QUERY_PARAM);
                  }
                  return params;
                },
                { replace: true },
              );
            }
          }}
        />
      )}
      {upgrade.dialog}
    </Page>
  );
}

function lensFor(statuses: Set<string>): Lens {
  const isAttention =
    statuses.size === NEEDS_ATTENTION_STATUSES.length &&
    NEEDS_ATTENTION_STATUSES.every((status) => statuses.has(status));
  return isAttention ? 'attention' : 'all';
}

function needsAttention(summary: PlatformAppConnectionsSummary): number {
  return NEEDS_ATTENTION_STATUSES.reduce(
    (count, status) => count + (summary.byStatus[status] ?? 0),
    0,
  );
}

function summaryLine(
  summary: PlatformAppConnectionsSummary | undefined,
): string {
  if (!summary) {
    return t(
      'Every connection in every project, and the global ones you share.',
    );
  }
  return t(
    '{total, plural, =1 {1 connection across every project} other {# connections across every project}}{attention, plural, =0 {} =1 { · 1 needs attention} other { · # need attention}}',
    { total: summary.total, attention: needsAttention(summary) },
  );
}

function emptyStateFor({ narrowed, lens }: { narrowed: boolean; lens: Lens }): {
  title: string;
  description: string;
} {
  if (lens === 'attention' && !narrowed) {
    return {
      title: t('Nothing needs attention'),
      description: t('Every connection on this platform is working.'),
    };
  }
  if (narrowed) {
    return {
      title: t('No connections match'),
      description: t('Try a different search or clear a filter.'),
    };
  }
  return {
    title: t('No connections yet'),
    description: t(
      'Connections from every project appear here, next to the global ones you share.',
    ),
  };
}

const NEEDS_ATTENTION_STATUSES = [
  AppConnectionStatus.ERROR,
  AppConnectionStatus.MISSING,
];
const NARROWING_PARAMS: string[] = [
  PLATFORM_CONNECTIONS_PARAMS.displayName,
  PLATFORM_CONNECTIONS_PARAMS.pieceName,
  PLATFORM_CONNECTIONS_PARAMS.projectIds,
  PLATFORM_CONNECTIONS_PARAMS.ownerIds,
  PLATFORM_CONNECTIONS_PARAMS.scope,
];

type Lens = 'all' | 'attention';

type PendingAction =
  | {
      kind: 'edit' | 'reconnect';
      connection: PlatformAppConnectionsListItem;
    }
  | {
      kind: 'delete';
      connections: PlatformAppConnectionsListItem[];
    };
