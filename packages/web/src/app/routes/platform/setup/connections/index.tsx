import { Permission } from '@activepieces/core-utils';
import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Globe, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableFilter } from '@/components/custom/data-table/data-table-filter';
import { DefaultTag } from '@/components/custom/global-connection-utils';
import { Page, PageHeader, Toolbar } from '@/components/custom/page';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import { EmptyMedia } from '@/components/ui/empty';
import {
  EditGlobalConnectionDialog,
  globalConnectionsMutations,
  globalConnectionsQueries,
} from '@/features/connections';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { listFormat, MutedCell } from '../../components/list-cell';
import {
  ConnectionNameCell,
  ConnectionStatus,
  connectionStatusLabel,
  ParamSearchInput,
} from '../../connections/connection-cells';
import { sampleData } from '../../sample-data';

const STATUS_QUERY_PARAM = 'status';
const GlobalConnectionsTable = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [selectedRows, setSelectedRows] = useState<
    Array<AppConnectionWithoutSensitiveData>
  >([]);
  const { checkAccess } = useAuthorization();
  const location = useLocation();

  const columns: ColumnDef<
    RowDataWithActions<AppConnectionWithoutSensitiveData>,
    unknown
  >[] = [
    {
      accessorKey: 'displayName',
      size: 380,
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
      accessorKey: 'projectsCount',
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Shared with')} />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-2">
          <MutedCell>
            {t('{count, plural, =0 {No projects} =1 {1 project} other {# projects}}', {
              count: row.original.projectIds.length,
            })}
          </MutedCell>
          {row.original.preSelectForNewProjects && <DefaultTag />}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      size: 140,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => <ConnectionStatus status={row.original.status} />,
    },
    {
      accessorKey: 'updated',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Updated')} />
      ),
      cell: ({ row }) => (
        <MutedCell>{listFormat.relativeDate(row.original.updated)}</MutedCell>
      ),
    },
    {
      id: 'actions',
      size: 96,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-1">
            <EditGlobalConnectionDialog
              connectionId={row.original.id}
              currentName={row.original.displayName}
              projectIds={row.original.projectIds}
              preSelectForNewProjects={
                row.original.preSelectForNewProjects ?? false
              }
              userHasPermissionToEdit={true}
              onEdit={() => {
                refetchGlobalConnections();
              }}
            />
            <ReconnectButtonDialog
              connection={row.original}
              onConnectionCreated={() => {
                refetchGlobalConnections();
              }}
              hasPermission={true}
            />
          </div>
        );
      },
    },
  ];

  const searchParams = new URLSearchParams(location.search);
  const {
    data: globalConnections,
    isLoading: isLoadingGlobalConnections,
    isError: isGlobalConnectionsError,
    refetch: refetchGlobalConnections,
  } = globalConnectionsQueries.useGlobalConnections({
    request: {
      displayName: searchParams.get('displayName') ?? undefined,
      cursor: searchParams.get(CURSOR_QUERY_PARAM) ?? undefined,
      limit: searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10,
      status:
        (searchParams.getAll(STATUS_QUERY_PARAM) as
          | AppConnectionStatus[]
          | undefined) ?? [],
    },
    extraKeys: [location.search],
    staleTime: 0,
    gcTime: 0,
  });
  const isSample = !platform.plan.globalConnectionsEnabled;

  const userHasPermissionToWriteAppConnection = checkAccess(
    Permission.WRITE_APP_CONNECTION,
  );

  const bulkDeleteGlobalConnections =
    globalConnectionsMutations.useBulkDeleteGlobalConnections(
      refetchGlobalConnections,
    );

  const bulkActions: BulkAction<AppConnectionWithoutSensitiveData>[] = useMemo(
    () => [
      {
        render: (
          _selectedRows: RowDataWithActions<AppConnectionWithoutSensitiveData>[],
          resetSelection: () => void,
        ) => {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmDialog
                title={t('deleteConnectionsTitle', {
                  count: selectedRows.length,
                })}
                description={t(
                  'The selected connections will be permanently deleted.',
                )}
                consequence={t('Flows using these connections will fail.')}
                confirmLabel={t('Delete')}
                typeToConfirm={
                  selectedRows.length === 1
                    ? selectedRows[0].displayName
                    : t('delete')
                }
                onConfirm={async () => {
                  try {
                    await bulkDeleteGlobalConnections.mutateAsync(
                      selectedRows.map((row) => row.id),
                    );
                    resetSelection();
                    setSelectedRows([]);
                  } catch (error) {
                    console.error('Error deleting connections:', error);
                  }
                }}
              >
                {selectedRows.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger-11 hover:text-danger-11"
                    disabled={!userHasPermissionToWriteAppConnection}
                  >
                    <Trash2 />
                    {`${t('Delete')} (${selectedRows.length})`}
                  </Button>
                )}
              </ConfirmDialog>
            </div>
          );
        },
      },
    ],
    [
      bulkDeleteGlobalConnections,
      selectedRows,
      userHasPermissionToWriteAppConnection,
    ],
  );

  return (
    <Page>
      <PageHeader
        title={t('Global connections')}
        description={t(
          'Connections the platform owns and shares with chosen projects, without exposing the credentials.',
        )}
      >
        <NewConnectionDialog
          isGlobalConnection={true}
          onConnectionCreated={() => {
            refetchGlobalConnections();
          }}
        >
          <AnimatedIconButton icon={PlusIcon} iconSize={20}>
            {t('New global connection')}
          </AnimatedIconButton>
        </NewConnectionDialog>
      </PageHeader>
      <Toolbar>
        <div className="min-w-64 flex-1">
          <ParamSearchInput
            paramKey="displayName"
            placeholder={t('Search global connections')}
          />
        </div>
        <DataTableFilter
          type="select"
          title={t('Status')}
          accessorKey={STATUS_QUERY_PARAM}
          options={Object.values(AppConnectionStatus).map((status) => ({
            label: connectionStatusLabel(status),
            value: status,
          }))}
        />
      </Toolbar>
      <DataTable
        emptyStateTextTitle={t('No global connections yet')}
        emptyStateTextDescription={t(
          'Create one connection and share it with as many projects as need it.',
        )}
        emptyStateIcon={
          <EmptyMedia variant="icon">
            <Globe />
          </EmptyMedia>
        }
        columns={columns}
        page={isSample ? sampleData.globalConnectionsPage() : globalConnections}
        isLoading={isSample ? false : isLoadingGlobalConnections}
        isError={isGlobalConnectionsError}
        errorStateEntity={t('connections')}
        onRetry={refetchGlobalConnections}
        selectColumn={true}
        onSelectedRowsChange={setSelectedRows}
        bulkActions={bulkActions}
      />
    </Page>
  );
};

export { GlobalConnectionsTable };
