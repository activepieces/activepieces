import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNewWindow } from '@/components/embed-provider';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TableTitle } from '@/components/ui/table-title';
import { formatUtils } from '@/lib/utils';
import { SeekPage, Table } from '@activepieces/shared';

const staticData: SeekPage<Table> = {
  data: [
    {
      id: '1',
      name: 'Table 1',
      projectId: 'proj-1',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-02T00:00:00Z',
    },
    {
      id: '2',
      name: 'Table 2',
      projectId: 'proj-2',
      created: '2023-02-01T00:00:00Z',
      updated: '2023-02-02T00:00:00Z',
    },
    {
      id: '3',
      name: 'Table 3',
      projectId: 'proj-3',
      created: '2023-03-01T00:00:00Z',
      updated: '2023-03-02T00:00:00Z',
    },
  ],
  next: null,
  previous: null,
};

function TablesPage() {
  const openNewWindow = useNewWindow();
  const navigate = useNavigate();

  const [selectedRows, setSelectedRows] = useState<Array<{ id: string }>>([]);
  const [data] = useState(staticData);

  const columns: ColumnDef<RowDataWithActions<Table>, unknown>[] = [
    {
      id: 'select',
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
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-col w-full">
      <TableTitle>Tables</TableTitle>
      <DataTable
        columns={columns}
        page={data}
        hidePagination={true}
        isLoading={false}
        onRowClick={(row, newWindow) => {
          if (newWindow) {
            openNewWindow(`/tables/${row.id}`);
          } else {
            navigate(`/tables/${row.id}`);
          }
        }}
      />
    </div>
  );
}

export { TablesPage };
