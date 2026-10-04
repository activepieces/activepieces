import { isNil } from '@activepieces/core-utils';
import {
  AppConnectionScope,
  AppConnectionStatus,
  MAX_PLATFORM_APP_CONNECTION_OWNERS,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  ArrowUpRight,
  Cable,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Unplug,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import {
  BulkAction,
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
import { RowMenu, RowMenuItem } from '@/components/custom/list/row-menu';
import {
  useUrlParam,
  writeParam,
} from '@/components/custom/list/use-url-param';
import { Page, PageHeader } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlanBadge, PLATFORM_FEATURES, TIER_LABELS } from '@/features/billing';
import {
  EditGlobalConnectionDialog,
  globalConnectionsMutations,
} from '@/features/connections';
import { piecesHooks } from '@/features/pieces';
import { platformAppConnectionsQueries } from '@/features/platform-admin/hooks/platform-app-connections-hooks';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';

import {
  ConnectionNameCell,
  ConnectionStatus,
  connectionStatusLabel,
  ownerLabel,
  UsedInCell,
} from './connection-cells';
import { ProjectConnectionSheet } from './project-connection-sheet';

export default function PlatformConnectionsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const globalEnabled = platform.plan.globalConnectionsEnabled;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scope] = useUrlParam<ScopeTab>({
    key: 'scope',
    fallback: 'all',
    allowed: SCOPE_TABS,
  });
  const {
    data: connections,
    isLoading,
    isError,
    refetch,
  } = platformAppConnectionsQueries.useList();
  const { data: owners } = platformAppConnectionsQueries.useOwners();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const { pieces } = piecesHooks.usePieces({});

  const [editing, setEditing] = useState<ConnectionRow | null>(null);
  const [reconnecting, setReconnecting] = useState<ConnectionRow | null>(null);
  const [viewing, setViewing] = useState<ConnectionRow | null>(null);
  const [deleting, setDeleting] = useState<ConnectionRow[] | null>(null);
  const { mutateAsync: deleteGlobal } =
    globalConnectionsMutations.useBulkDeleteGlobalConnections(() => refetch());

  const isGlobal = (row: ConnectionRow) =>
    row.scope === AppConnectionScope.PLATFORM;
  const openRow = (row: ConnectionRow) =>
    isGlobal(row) ? setEditing(row) : setViewing(row);

  const menuItems = (row: ConnectionRow): RowMenuItem[] =>
    isGlobal(row)
      ? [
          { label: t('Edit'), icon: Pencil, onSelect: () => setEditing(row) },
          {
            label: t('Reconnect'),
            icon: Cable,
            onSelect: () => setReconnecting(row),
          },
          {
            label: t('Delete'),
            icon: Trash2,
            destructive: true,
            onSelect: () => setDeleting([row]),
          },
        ]
      : [
          {
            label: t('View details'),
            icon: Eye,
            onSelect: () => setViewing(row),
          },
          {
            label: t('Open in project'),
            icon: ArrowUpRight,
            hidden: row.projects.length === 0,
            onSelect: () =>
              navigate(`/projects/${row.projects[0].id}/connections`),
          },
        ];

  const columns: ColumnDef<RowDataWithActions<ConnectionRow>>[] = [
    {
      accessorKey: 'displayName',
      size: 360,
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
      id: 'usedIn',
      size: 220,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Used in')} />
      ),
      cell: ({ row }) => <UsedInCell connection={row.original} />,
    },
    {
      id: 'owner',
      size: 180,
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
      size: 140,
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
          <RowMenu items={menuItems(row.original)} />
        </div>
      ),
    },
  ];

  const bulkActions: BulkAction<ConnectionRow>[] = [
    {
      render: (selected) =>
        selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-11 hover:text-danger-11"
            onClick={() => setDeleting(selected)}
          >
            <Trash2 />
            {t('Delete {count}', { count: selected.length })}
          </Button>
        ),
    },
  ];

  const filtered = FILTER_PARAMS.some(
    (param) => searchParams.getAll(param).length > 0,
  );
  const newGlobal = (
    <NewGlobalConnectionButton
      enabled={globalEnabled}
      onCreated={() => refetch()}
    />
  );
  const deleteName =
    deleting && deleting.length === 1 ? deleting[0].displayName : null;

  return (
    <Page>
      <PageHeader
        title={t('Connections')}
        description={t(
          'Every app connection on the platform. Global ones are shared with the projects you choose.',
        )}
      >
        {newGlobal}
      </PageHeader>
      <ListToolbar
        search={
          <ListSearch
            param="displayName"
            placeholder={t('Search connections')}
          />
        }
        tabs={
          <CountTabs
            value={scope}
            onValueChange={(next) =>
              setSearchParams(
                (prev) => {
                  const params = writeParam({
                    prev,
                    key: 'scope',
                    value: next,
                    fallback: 'all',
                  });
                  if (next === 'global') {
                    params.delete('projectIds');
                  }
                  return params;
                },
                { replace: true },
              )
            }
            options={[
              { value: 'all', label: t('All') },
              { value: 'global', label: t('Global') },
              { value: 'project', label: t('Project') },
            ]}
          />
        }
        filters={
          <>
            {scope !== 'global' && (
              <DataTableFilter
                type="select"
                title={t('Project')}
                accessorKey="projectIds"
                options={(projects ?? []).map((project) => ({
                  label: getProjectName(project),
                  value: project.id,
                }))}
              />
            )}
            <DataTableFilter
              type="select"
              title={t('Owner')}
              accessorKey="ownerIds"
              options={(owners?.data ?? []).map((owner) => ({
                label: ownerLabel({ owner }),
                value: owner.id,
              }))}
            />
            <DataTableFilter
              type="select"
              single
              title={t('Piece')}
              accessorKey="pieceName"
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
              accessorKey="status"
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
        emptyStateTextTitle={
          filtered ? t('No connections match') : emptyTitle({ scope })
        }
        emptyStateTextDescription={
          filtered
            ? t('Try a different search or clear a filter.')
            : emptyDescription({ scope })
        }
        emptyStateIcon={<Unplug />}
        emptyStateAction={
          !filtered && scope !== 'project' && globalEnabled
            ? newGlobal
            : undefined
        }
        columns={columns}
        page={connections}
        onRowClick={(row) => openRow(row)}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('connections')}
        onRetry={refetch}
        selectColumn={scope === 'global'}
        isRowSelectionDisabled={(row) => !isGlobal(row)}
        bulkActions={scope === 'global' ? bulkActions : []}
      />
      {editing && (
        <EditGlobalConnectionDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          connectionId={editing.id}
          currentName={editing.displayName}
          projectIds={editing.projectIds}
          preSelectForNewProjects={editing.preSelectForNewProjects ?? false}
          userHasPermissionToEdit
          onEdit={() => refetch()}
        />
      )}
      {reconnecting && (
        <ReconnectButtonDialog
          open
          onOpenChange={(open) => !open && setReconnecting(null)}
          connection={reconnecting}
          hasPermission
          onConnectionCreated={() => refetch()}
        />
      )}
      <ProjectConnectionSheet
        connection={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={
            deleteName
              ? t('Delete {name}?', { name: deleteName })
              : t('deleteConnectionsTitle', { count: deleting.length })
          }
          description={t('Every project it is shared with loses it at once.')}
          consequence={t('Flows using these connections will fail.')}
          confirmLabel={t('Delete')}
          typeToConfirm={deleteName ?? t('delete')}
          onConfirm={async () => {
            await deleteGlobal(deleting.map((row) => row.id));
          }}
        />
      )}
    </Page>
  );
}

function NewGlobalConnectionButton({
  enabled,
  onCreated,
}: {
  enabled: boolean;
  onCreated: () => void;
}) {
  if (!enabled) {
    const tier = PLATFORM_FEATURES.globalConnections.tier;
    return (
      <div className="flex items-center gap-2">
        <PlanBadge tier={tier} />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Button disabled>
                <Plus />
                {t('New global connection')}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t('Available on the {tier} plan', { tier: TIER_LABELS[tier] })}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }
  return (
    <NewConnectionDialog isGlobalConnection onConnectionCreated={onCreated}>
      <Button>
        <Plus />
        {t('New global connection')}
      </Button>
    </NewConnectionDialog>
  );
}

function emptyTitle({ scope }: { scope: ScopeTab }): string {
  switch (scope) {
    case 'global':
      return t('No global connections yet');
    case 'project':
      return t('No project connections yet');
    case 'all':
      return t('No connections yet');
  }
}

function emptyDescription({ scope }: { scope: ScopeTab }): string {
  switch (scope) {
    case 'global':
      return t(
        'Create one connection and share it with as many projects as need it.',
      );
    case 'project':
      return t(
        'Connections created in any project on this platform appear here.',
      );
    case 'all':
      return t(
        'Connections from every project appear here, next to the global ones you share.',
      );
  }
}

const SCOPE_TABS = ['all', 'global', 'project'] as const;
const FILTER_PARAMS = [
  'displayName',
  'projectIds',
  'ownerIds',
  'pieceName',
  'status',
];

type ScopeTab = (typeof SCOPE_TABS)[number];
type ConnectionRow = PlatformAppConnectionsListItem;
