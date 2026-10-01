import { Permission } from '@activepieces/core-utils';
import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  Trash,
  Globe,
  Search,
  Activity,
  Clock,
  FolderOpen,
  Puzzle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { DefaultTag } from '@/components/custom/global-connection-utils';
import { Page, PageHeader } from '@/components/custom/page';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import {
  EditGlobalConnectionDialog,
  globalConnectionsMutations,
  globalConnectionsQueries,
  appConnectionUtils,
} from '@/features/connections';
import { PieceIconWithPieceName } from '@/features/pieces';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

import { sampleData } from '../../sample-data';

const STATUS_QUERY_PARAM = 'status';
const filters: DataTableFilters<keyof AppConnectionWithoutSensitiveData>[] = [
  {
    type: 'input',
    title: t('Search'),
    accessorKey: 'displayName',
    icon: Search,
  },
  {
    type: 'select',
    title: t('Status'),
    accessorKey: STATUS_QUERY_PARAM,
    options: Object.values(AppConnectionStatus).map((status) => {
      return {
        label: formatUtils.convertEnumToReadable(status),
        value: status,
      };
    }),
    icon: CheckIcon,
  },
];

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
      size: 260,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Name')}
          icon={Puzzle}
        />
      ),
      cell: ({ row }) => {
        return (
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
              <span className="truncate">{row.original.displayName}</span>
            </div>
          </CopyTextTooltip>
        );
      },
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
      cell: ({ row }) => {
        const status = row.original.status;
        const { variant, icon: Icon } =
          appConnectionUtils.getStatusIcon(status);
        return (
          <div className="text-left">
            <StatusIconWithText
              icon={Icon}
              text={formatUtils.convertEnumToReadable(status)}
              variant={variant}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'updated',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Connected At')}
          icon={Clock}
        />
      ),
      cell: ({ row }) => {
        return (
          <FormattedDate
            date={new Date(row.original.updated)}
            className="text-left"
          />
        );
      },
    },
    {
      accessorKey: 'projectsCount',
      size: 100,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Projects')}
          icon={FolderOpen}
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left tabular-nums">
            {row.original.projectIds.length}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end gap-2">
            {row.original.preSelectForNewProjects && <DefaultTag />}
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
                    <Trash />
                    {`${t('Delete')} (${selectedRows.length})`}
                  </Button>
                )}
              </ConfirmDialog>
            </div>
          );
        },
      },
    ],
    [bulkDeleteGlobalConnections, selectedRows],
  );

  return (
    <Page>
      <PageHeader
        title={t('Global Connections')}
        description={t('Manage platform-wide connections to external systems.')}
      >
        <NewConnectionDialog
          isGlobalConnection={true}
          onConnectionCreated={() => {
            refetchGlobalConnections();
          }}
        >
          <AnimatedIconButton icon={PlusIcon} iconSize={20}>
            {t('New Connection')}
          </AnimatedIconButton>
        </NewConnectionDialog>
      </PageHeader>
      <DataTable
        emptyStateTextTitle={t('No global connections found')}
        emptyStateTextDescription={t(
          'Create a global connection that can be shared to multiple projects',
        )}
        emptyStateIcon={<Globe className="size-14" />}
        columns={columns}
        page={isSample ? sampleData.globalConnectionsPage() : globalConnections}
        isLoading={isSample ? false : isLoadingGlobalConnections}
        isError={isGlobalConnectionsError}
        errorStateEntity={t('connections')}
        onRetry={refetchGlobalConnections}
        filters={filters}
        selectColumn={true}
        onSelectedRowsChange={setSelectedRows}
        bulkActions={bulkActions}
      />
    </Page>
  );
};

export { GlobalConnectionsTable };
