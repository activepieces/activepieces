import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Trash, Globe } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { ReconnectButtonDialog } from '@/app/connections/reconnect-button-dialog';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import { TableTitle } from '@/components/custom/table-title';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkAction,
  CURSOR_QUERY_PARAM,
  DataTable,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { EditGlobalConnectionDialog } from '@/features/connections/components/edit-global-connection-dialog';
import {
  globalConnectionsMutations,
  globalConnectionsQueries,
} from '@/features/connections/lib/global-connections-hooks';
import { appConnectionUtils } from '@/features/connections/lib/utils';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
  Permission,
} from '@activepieces/shared';

const STATUS_QUERY_PARAM = 'status';
const filters = [
  {
    type: 'select',
    title: t('Status'),
    accessorKey: STATUS_QUERY_PARAM,
    options: Object.values(AppConnectionStatus).map((status) => {
      return {
        label: formatUtils.convertEnumToHumanReadable(status),
        value: status,
      };
    }),
    icon: CheckIcon,
  } as const,
];

const GlobalConnectionsTable = () => {
  const [refresh, setRefresh] = useState(0);
  const [selectedRows, setSelectedRows] = useState<
    Array<AppConnectionWithoutSensitiveData>
  >([]);
  const { checkAccess } = useAuthorization();
  const location = useLocation();
  const { platform } = platformHooks.useCurrentPlatform();

  const columns: ColumnDef<
    RowDataWithActions<AppConnectionWithoutSensitiveData>,
    unknown
  >[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          variant="secondary"
          checked={
            table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()
          }
          onCheckedChange={(value) => {
            const isChecked = !!value;
            table.toggleAllPageRowsSelected(isChecked);

            if (isChecked) {
              const allRows = table
                .getRowModel()
                .rows.map((row) => row.original);

              const newSelectedRows = [...allRows, ...selectedRows];
              const uniqueRows = Array.from(
                new Map(
                  newSelectedRows.map((item) => [item.id, item]),
                ).values(),
              );
              setSelectedRows(uniqueRows);
            } else {
              const filteredRows = selectedRows.filter((row) => {
                return !table
                  .getRowModel()
                  .rows.some((r) => r.original.id === row.id);
              });
              setSelectedRows(filteredRows);
            }
          }}
        />
      ),
      cell: ({ row }) => {
        const isChecked = selectedRows.some(
          (selectedRow) => selectedRow.id === row.original.id,
        );
        return (
          <Checkbox
            variant="secondary"
            checked={isChecked}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              let newSelectedRows = [...selectedRows];
              if (isChecked) {
                const exists = newSelectedRows.some(
                  (selectedRow) => selectedRow.id === row.original.id,
                );
                if (!exists) {
                  newSelectedRows.push(row.original);
                }
              } else {
                newSelectedRows = newSelectedRows.filter(
                  (selectedRow) => selectedRow.id !== row.original.id,
                );
              }
              setSelectedRows(newSelectedRows);
              row.toggleSelected(!!value);
            }}
          />
        );
      },
      accessorKey: 'select',
    },
    {
      accessorKey: 'pieceName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('App')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            <PieceIconWithPieceName pieceName={row.original.pieceName} />
          </div>
        );
      },
    },
    {
      accessorKey: 'displayName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => {
        return (
          <CopyTextTooltip
            title={t('External ID')}
            text={row.original.externalId || ''}
          >
            <div className="text-left">{row.original.displayName}</div>
          </CopyTextTooltip>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const { variant, icon: Icon } =
          appConnectionUtils.getStatusIcon(status);
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
      accessorKey: 'updated',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Connected At')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {formatUtils.formatDate(new Date(row.original.updated))}
          </div>
        );
      },
    },
    {
      accessorKey: 'projectsCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Projects')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">{row.original.projectIds.length}</div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2 justify-end">
            <EditGlobalConnectionDialog
              connectionId={row.original.id}
              currentName={row.original.displayName}
              projectIds={row.original.projectIds}
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
    refetch: refetchGlobalConnections,
  } = globalConnectionsQueries.useGlobalConnections({
    request: {
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
        render: (_, resetSelection) => {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmationDeleteDialog
                title={t('Confirm Deletion')}
                message={t(
                  'Are you sure you want to delete the selected connections? This action cannot be undone.',
                )}
                entityName="connections"
                mutationFn={async () => {
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
                    className="w-full mr-2"
                    size="sm"
                    disabled={!userHasPermissionToWriteAppConnection}
                    variant="destructive"
                  >
                    <Trash className="mr-2 w-4" />
                    {`${t('Delete')} (${selectedRows.length})`}
                  </Button>
                )}
              </ConfirmationDeleteDialog>
            </div>
          );
        },
      },
      {
        render: () => {
          return (
            <NewConnectionDialog
              isGlobalConnection={true}
              onConnectionCreated={() => {
                setRefresh(refresh + 1);
                refetchGlobalConnections();
              }}
            >
              <Button variant="default" size="sm">
                {t('New Connection')}
              </Button>
            </NewConnectionDialog>
          );
        },
      },
    ],
    [bulkDeleteGlobalConnections, selectedRows, refresh],
  );

  return (
    <div className="flex-col w-full">
      <LockedFeatureGuard
        featureKey="GLOBAL_CONNECTIONS"
        locked={!platform.plan.globalConnectionsEnabled}
        lockTitle={t('Enable Global Connections')}
        lockDescription={t(
          'Manage platform-wide connections to external systems.',
        )}
        lockVideoUrl="https://cdn.activepieces.com/videos/showcase/global-connections.mp4"
      >
        <TableTitle
          description={t(
            'Manage platform-wide connections to external systems.',
          )}
        >
          {t('Global Connections')}
        </TableTitle>
        <DataTable
          emptyStateTextTitle={t('No global connections found')}
          emptyStateTextDescription={t(
            'Create a global connection that can be shared to multiple projects',
          )}
          emptyStateIcon={<Globe className="size-14" />}
          columns={columns}
          page={globalConnections}
          isLoading={isLoadingGlobalConnections}
          filters={filters}
          bulkActions={bulkActions}
        />
      </LockedFeatureGuard>
    </div>
  );
};

export { GlobalConnectionsTable };
