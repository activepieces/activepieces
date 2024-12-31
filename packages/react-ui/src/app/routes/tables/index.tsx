import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Trash, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { useNewWindow } from '@/components/embed-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TableTitle } from '@/components/ui/table-title';
import { toast } from '@/components/ui/use-toast';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { formatUtils } from '@/lib/utils';
import { Table } from '@activepieces/shared';

function TablesPage() {
  const openNewWindow = useNewWindow();
  const navigate = useNavigate();
  const [showNewTableDialog, setShowNewTableDialog] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [selectedRows, setSelectedRows] = useState<Array<{ id: string }>>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tablesApi.list(),
  });

  const createTableMutation = useMutation({
    mutationFn: async () => {
      return tablesApi.create({ name: newTableName });
    },
    onSuccess: () => {
      setNewTableName('');
      setShowNewTableDialog(false);
      refetch();
      toast({
        title: t('Success'),
        description: t('Table has been created'),
        duration: 3000,
      });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: string) => {
      return tablesApi.delete(id);
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast({
        title: t('Error deleting table.'),
        variant: 'destructive',
      });
    },
  });

  const handleCreateTable = () => {
    createTableMutation.mutate();
  };

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
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <ConfirmationDeleteDialog
              title={t('Delete Table')}
              message={t(
                'Are you sure you want to delete this table? This action cannot be undone.',
              )}
              mutationFn={async () =>
                deleteTableMutation.mutate(row.original.id)
              }
              entityName={t('table')}
            >
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </ConfirmationDeleteDialog>
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
    onError: () => {
      toast({
        title: t('Error deleting connections'),
        variant: 'destructive',
      });
    },
  });

  const bulkActions: BulkAction<Table>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmationDeleteDialog
                title={t('Confirm Deletion')}
                message={t(
                  'Are you sure you want to delete the selected tables? This action cannot be undone.',
                )}
                entityName="table"
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
                  <Button
                    className="w-full mr-2"
                    size="sm"
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
    ],
    [bulkDeleteMutation, selectedRows],
  );

  return (
    <div className="flex-col w-full">
      <div className="flex items-center justify-between">
        <TableTitle>{t('Tables')}</TableTitle>
        <Button
          onClick={() => setShowNewTableDialog(true)}
          variant="default"
          className="flex gap-2 items-center"
        >
          {t('New Table')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        page={data}
        hidePagination={true}
        isLoading={isLoading}
        onRowClick={(row, newWindow) => {
          if (newWindow) {
            openNewWindow(`/tables/${row.id}`);
          } else {
            navigate(`/tables/${row.id}`);
          }
        }}
        bulkActions={bulkActions}
      />

      <Dialog open={showNewTableDialog} onOpenChange={setShowNewTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Create New Table')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t('Table name')}
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTable();
                }
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewTableDialog(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleCreateTable}
              disabled={!newTableName.trim() || createTableMutation.isPending}
            >
              {createTableMutation.isPending ? t('Creating...') : t('Create')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { TablesPage };
