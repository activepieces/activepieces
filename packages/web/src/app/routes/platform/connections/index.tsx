import { Permission } from '@activepieces/core-utils';
import {
  AppConnectionScope,
  AppConnectionStatus,
  MAX_PLATFORM_APP_CONNECTION_OWNERS,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Activity,
  Clock,
  Folder,
  Globe,
  MapPin,
  Plus,
  Puzzle,
  Trash2,
  Unplug,
  User,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  AdminDataTable,
  AdminPage,
  AdminPageHeader,
  adminPageResources,
} from '@/app/components/admin';
import { EnterpriseLockedSection } from '@/app/components/enterprise-gate';
import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import {
  BulkAction,
  DataTableFilters,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { Button } from '@/components/ui/button';
import { LockedGem, useEnterpriseGate } from '@/features/billing';
import { piecesHooks } from '@/features/pieces';
import { platformAppConnectionsQueries } from '@/features/platform-admin/hooks/platform-app-connections-hooks';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

import {
  ConnectionRowActions,
  GlobalConnectionAccess,
} from './connection-actions';
import {
  ConnectionNameCell,
  ConnectionStatus,
  OwnerCell,
  WhereCell,
  connectionCellsUtils,
} from './connection-cells';
import { ConnectionSheet } from './connection-sheet';
import { DeleteConnectionsDialog } from './delete-connections-dialog';

export default function PlatformConnectionsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const globalLocked = !platform.plan.globalConnectionsEnabled;
  const gate = useEnterpriseGate({
    unlocked: !globalLocked,
    featureKey: 'GLOBAL_CONNECTIONS',
  });
  const explainLock = useRef(gate.explain);
  explainLock.current = gate.explain;
  const access: GlobalConnectionAccess = useMemo(
    () => ({ locked: globalLocked, upgrade: () => explainLock.current() }),
    [globalLocked],
  );

  const [searchParams] = useSearchParams();
  const {
    data: connections,
    isLoading,
    isError,
    refetch,
  } = platformAppConnectionsQueries.useList({
    scopeFilterEnabled: !globalLocked,
  });
  const { data: owners } = platformAppConnectionsQueries.useOwners();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const { pieces } = piecesHooks.usePlatformCatalog();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const resetBulkSelection = useRef<(() => void) | null>(null);
  const narrowBulkSelection = useRef<((rowIds: string[]) => void) | null>(null);
  const { checkAccess } = useAuthorization();
  const canWriteConnections = checkAccess(Permission.WRITE_APP_CONNECTION);
  const [deleting, setDeleting] = useState<PlatformAppConnectionsListItem[]>(
    [],
  );

  const rows = connections?.data ?? [];
  const viewing = rows.find((row) => row.id === viewingId) ?? null;
  const refresh = useCallback(() => {
    refetch().catch(() => undefined);
  }, [refetch]);
  const filtered = FILTER_PARAMS.some((param) => searchParams.has(param));

  const filters: DataTableFilters<FilterKey>[] = [
    {
      type: 'input',
      title: t('Name'),
      accessorKey: 'displayName',
      icon: Unplug,
    },
    ...(globalLocked
      ? []
      : [
          {
            type: 'select' as const,
            title: t('Scope'),
            accessorKey: 'scope' as const,
            icon: Globe,
            options: [
              { label: t('Global'), value: AppConnectionScope.PLATFORM },
              { label: t('Project'), value: AppConnectionScope.PROJECT },
            ],
          },
        ]),
    {
      type: 'select',
      title: t('Status'),
      accessorKey: 'status',
      icon: Activity,
      options: Object.values(AppConnectionStatus).map((status) => ({
        label: connectionCellsUtils.statusLabel(status),
        value: status,
      })),
    },
    {
      type: 'select',
      title: t('Piece'),
      accessorKey: 'pieceName',
      icon: Puzzle,
      options: (pieces ?? []).map((piece) => ({
        label: piece.displayName,
        value: piece.name,
      })),
    },
    {
      type: 'select',
      title: t('Project'),
      accessorKey: 'projectIds',
      icon: Folder,
      options: (projects ?? []).map((project) => ({
        label: getProjectName(project),
        value: project.id,
      })),
    },
    {
      type: 'select',
      title: t('Owner'),
      accessorKey: 'ownerIds',
      icon: User,
      options: (owners?.data ?? []).map((owner) => ({
        label: connectionCellsUtils.ownerLabel(owner),
        value: owner.id,
      })),
    },
  ];

  const columns: ColumnDef<
    RowDataWithActions<PlatformAppConnectionsListItem>
  >[] = useMemo(
    () => [
      {
        accessorKey: 'displayName',
        size: 260,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Connection')}
            icon={Unplug}
          />
        ),
        cell: ({ row }) => <ConnectionNameCell connection={row.original} />,
      },
      {
        id: 'where',
        size: 280,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Where')}
            icon={MapPin}
          />
        ),
        cell: ({ row }) => <WhereCell connection={row.original} />,
      },
      {
        id: 'owner',
        size: 180,
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
        accessorKey: 'status',
        size: 120,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Status')}
            icon={Activity}
          />
        ),
        cell: ({ row }) => <ConnectionStatus status={row.original.status} />,
      },
      {
        accessorKey: 'updated',
        size: 150,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Updated')}
            icon={Clock}
          />
        ),
        cell: ({ row }) => (
          <FormattedDate date={new Date(row.original.updated)} />
        ),
      },
      {
        id: 'actions',
        size: 110,
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end gap-1"
            onClick={(event) => event.stopPropagation()}
          >
            <ConnectionRowActions
              connection={row.original}
              access={access}
              onChanged={refresh}
            />
          </div>
        ),
      },
    ],
    [access, refresh],
  );

  const bulkActions: BulkAction<PlatformAppConnectionsListItem>[] = [
    {
      render: (selected, resetSelection, selectOnly) =>
        selected.length > 0 && (
          <Button
            {...adminControl(AdminControl.CONNECTIONS_CONNECTION_DELETE_OPEN)}
            variant="ghost"
            size="sm"
            className="text-danger-11 hover:text-danger-11"
            disabled={!canWriteConnections}
            onClick={() => {
              resetBulkSelection.current = resetSelection;
              narrowBulkSelection.current = selectOnly;
              setDeleting(selected);
            }}
          >
            <Trash2 />
            {t('Delete ({count})', { count: selected.length })}
          </Button>
        ),
    },
  ];

  const newGlobalConnection = globalLocked ? (
    <Button onClick={access.upgrade}>
      <LockedGem />
      {t('New global connection')}
    </Button>
  ) : (
    <NewConnectionDialog isGlobalConnection onConnectionCreated={refresh}>
      <Button {...adminControl(AdminControl.CONNECTIONS_CONNECTION_OPEN)}>
        <Plus />
        {t('New global connection')}
      </Button>
    </NewConnectionDialog>
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title={t('Connections')}
        description={t(
          'Every connection in every project, and the global ones you share with the projects you choose.',
        )}
        resources={adminPageResources.connections}
      >
        {newGlobalConnection}
      </AdminPageHeader>
      <EnterpriseLockedSection
        unlocked={!globalLocked}
        featureKey="GLOBAL_CONNECTIONS"
        line={t('Global connections are locked.')}
      />
      <div className="flex flex-col gap-2">
        {owners?.truncated && (
          <p className="text-xs text-gray-11">
            {t('Owner filter is limited to the first {count} owners', {
              count: MAX_PLATFORM_APP_CONNECTION_OWNERS,
            })}
          </p>
        )}
        <AdminDataTable
          emptyStateTextTitle={
            filtered ? t('No connections match') : t('No connections yet')
          }
          emptyStateTextDescription={
            filtered
              ? t('Try a different search or clear a filter.')
              : t(
                  'Connections from every project appear here, next to the global ones you share.',
                )
          }
          emptyStateIcon={<Unplug />}
          emptyStateAction={filtered ? undefined : newGlobalConnection}
          columns={columns}
          page={connections}
          isLoading={isLoading}
          isError={isError}
          errorStateEntity={t('connections')}
          onRetry={refetch}
          filters={filters}
          onRowClick={(row) => setViewingId(row.id)}
          selectColumn={!globalLocked}
          getRowId={(row) => row.id}
          isRowSelectionDisabled={(row) =>
            row.scope !== AppConnectionScope.PLATFORM
          }
          bulkActions={bulkActions}
        />
      </div>
      <ConnectionSheet
        connection={viewing}
        access={access}
        onChanged={refresh}
        onDelete={(connection) => {
          resetBulkSelection.current = null;
          setDeleting([connection]);
        }}
        onOpenChange={(open) => !open && setViewingId(null)}
      />
      <DeleteConnectionsDialog
        connections={deleting}
        open={deleting.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting([]);
            resetBulkSelection.current = null;
          }
        }}
        onDeleted={refresh}
        onFinished={() => {
          if (deleting.some((connection) => connection.id === viewingId)) {
            setViewingId(null);
          }
          resetBulkSelection.current?.();
          resetBulkSelection.current = null;
        }}
        onPartialFailure={(failed) => {
          const viewingDeleted =
            deleting.some((connection) => connection.id === viewingId) &&
            !failed.some((connection) => connection.id === viewingId);
          if (viewingDeleted) {
            setViewingId(null);
          }
          narrowBulkSelection.current?.(
            failed.map((connection) => connection.id),
          );
          setDeleting(failed);
        }}
      />
    </AdminPage>
  );
}

const FILTER_PARAMS = [
  'displayName',
  'scope',
  'status',
  'pieceName',
  'projectIds',
  'ownerIds',
] as const;

type FilterKey = (typeof FILTER_PARAMS)[number];
