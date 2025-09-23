import { useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Trash2,
  Plus,
  CheckIcon,
  Table2,
  UploadCloud,
  EllipsisVertical,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { LoadingScreen } from '@/components/ui/loading-screen';
// import { PushToGitDialog } from '@/features/git-sync/components/push-to-git-dialog';
import { ApTableActionsMenu } from '@/features/tables/components/ap-table-actions-menu';
import { tableHooks } from '@/features/tables/lib/table-hooks';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { useNewWindow } from '@/lib/navigation-utils';
import { formatUtils } from '@/lib/utils';
import { Permission, Table } from '@activepieces/shared';

const ApTablesPage = () => {
  const openNewWindow = useNewWindow();
  const [selectedRows, setSelectedRows] = useState<Table[]>([]);
  const { data: project } = projectHooks.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );
  const userHasPermissionToPushToGit = useAuthorization().checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );
  const { data, isLoading, refetch } = tableHooks.useTables();
  const { mutate: createTable, isPending: isCreatingTable } =
    tableHooks.useCreateTable();
  const navigate = useNavigate();
  const columns: ColumnDef<RowDataWithActions<Table>, unknown>[] = [
    {
      id: 'select',
      accessorKey: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()
          }
          variant="secondary"
          onCheckedChange={(value) => {
            const isChecked = !!value;
            table.toggleAllPageRowsSelected(isChecked);
            if (isChecked) {
              const allRows = table
                .getRowModel()
                .rows.map((row) => row.original);
              setSelectedRows(allRows);
            } else {
              setSelectedRows([]);
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
                newSelectedRows.push(row.original);
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
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => <div className="text-left">{row.original.name}</div>,
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div
            onAuxClick={(e) => {
              e.stopPropagation();
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="flex items-center justify-end w-full"
          >
            <ApTableActionsMenu table={row.original} refetch={refetch}>
              <Button variant="ghost" size="icon">
                <EllipsisVertical />
              </Button>
            </ApTableActionsMenu>
          </div>
        );
      },
    },
  ];

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => tablesApi.delete(id)));
    },
    onSuccess: () => {
      refetch();
    },
  });

  const bulkActions: BulkAction<Table>[] = useMemo(
    () => [
      {
        render: (_, __) => (
          <PermissionNeededTooltip hasPermission={userHasTableWritePermission}>
            <Button
              onClick={() => createTable({ name: t('New Table') })}
              className="flex items-center gap-2"
              disabled={!userHasTableWritePermission}
            >
              <Plus className="h-4 w-4" />
              {t('New Table')}
            </Button>
          </PermissionNeededTooltip>
        ),
      },
      {
        render: (_, resetSelection) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmationDeleteDialog
              title={t('Delete Tables')}
              showToast={false}
              message={t(
                'Are you sure you want to delete the selected tables? This action cannot be undone.',
              )}
              entityName={t('table')}
              mutationFn={async () => {
                try {
                  await bulkDeleteMutation.mutateAsync(
                    selectedRows.map((row) => row.id),
                  );
                  resetSelection();
                  setSelectedRows([]);
                } catch (error) {
                  console.error('Error deleting tables:', error);
                }
              }}
            >
              {selectedRows.length > 0 && (
                <Button className="w-full mr-2" size="sm" variant="destructive">
                  <Trash2 className="mr-2 w-4" />
                  {`${t('Delete')} (${selectedRows.length})`}
                </Button>
              )}
            </ConfirmationDeleteDialog>
          </div>
        ),
      },
      {
        render: (_) => (
          <div onClick={(e) => e.stopPropagation()}>
            {/* <PermissionNeededTooltip
              hasPermission={userHasPermissionToPushToGit}
            >
              <PushToGitDialog type="table" tables={selectedRows}>
                {selectedRows.length > 0 && (
                  <Button className="w-full mr-2" size="sm" variant="outline">
                    <UploadCloud className="mr-2 w-4" />
                    {`${t('Push to Git')} (${selectedRows.length})`}
                  </Button>
                )}
              </PushToGitDialog>
            </PermissionNeededTooltip> */}
          </div>
        ),
      },
    ],
    [bulkDeleteMutation, selectedRows, userHasPermissionToPushToGit],
  );
  if (isCreatingTable) {
    return <LoadingScreen mode="container" />;
  }

  return (
    <LockedFeatureGuard
      featureKey="TABLES"
      locked={!platform.plan.tablesEnabled}
      lockTitle={t('Tables')}
      lockDescription={t(
        'Create and manage your tables to store your automation data',
      )}
    >
      <div className="flex-col w-full gap-4">
        <DashboardPageHeader
          description={t(
            'Create and manage your tables to store your automation data',
          )}
          title={t('Tables')}
          tutorialTab="tables"
        ></DashboardPageHeader>
        <DataTable
          filters={[
            {
              accessorKey: 'name',
              type: 'input',
              title: t('Name'),
              icon: CheckIcon,
              options: [],
            },
          ]}
          emptyStateIcon={<Table2 className="size-14" />}
          emptyStateTextTitle={t('No tables have been created yet')}
          emptyStateTextDescription={t(
            'Create a table to get started and start managing your automation data',
          )}
          columns={columns}
          page={data}
          isLoading={isLoading}
          onRowClick={(row, newWindow) => {
            const path = `/projects/${project.id}/tables/${row.id}`;
            if (newWindow) {
              openNewWindow(path);
            } else {
              navigate(path);
            }
          }}
          bulkActions={bulkActions}
        />
      </div>
    </LockedFeatureGuard>
  );
};

ApTablesPage.displayName = 'ApTablesPage';

export { ApTablesPage };
