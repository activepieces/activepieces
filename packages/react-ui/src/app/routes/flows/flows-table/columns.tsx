import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { EllipsisVertical } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';

import FlowActionMenu from '@/app/components/flow-actions-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { FolderBadge } from '@/features/folders/component/folder-badge';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { formatUtils } from '@/lib/utils';
import { PopulatedFlow } from '@activepieces/shared';

type FlowsTableColumnsProps = {
  refetch: () => void;
  refresh: number;
  setRefresh: Dispatch<SetStateAction<number>>;
  selectedRows: PopulatedFlow[];
  setSelectedRows: Dispatch<SetStateAction<PopulatedFlow[]>>;
};

export const flowsTableColumns = ({
  refetch,
  refresh,
  setRefresh,
  selectedRows,
  setSelectedRows,
}: FlowsTableColumnsProps): (ColumnDef<RowDataWithActions<PopulatedFlow>> & {
  accessorKey: string;
})[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || table.getIsSomePageRowsSelected()
        }
        onCheckedChange={(value) => {
          const isChecked = !!value;
          table.toggleAllPageRowsSelected(isChecked);

          if (isChecked) {
            const allRowIds = table
              .getRowModel()
              .rows.map((row) => row.original);

            const newSelectedRowIds = [...allRowIds, ...selectedRows];

            const uniqueRowIds = Array.from(
              new Map(
                newSelectedRowIds.map((item) => [item.id, item]),
              ).values(),
            );

            setSelectedRows(uniqueRowIds);
          } else {
            const filteredRowIds = selectedRows.filter((row) => {
              return !table
                .getRowModel()
                .rows.some((r) => r.original.version.id === row.version.id);
            });
            setSelectedRows(filteredRowIds);
          }
        }}
      />
    ),
    cell: ({ row }) => {
      const isChecked = selectedRows.some(
        (selectedRow) =>
          selectedRow.id === row.original.id &&
          selectedRow.status === row.original.status,
      );
      return (
        <Checkbox
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Name')} />
    ),
    cell: ({ row }) => {
      const status = row.original.version.displayName;
      return <div className="text-left">{status}</div>;
    },
  },
  {
    accessorKey: 'steps',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Steps')} />
    ),
    cell: ({ row }) => {
      return (
        <PieceIconList
          trigger={row.original.version.trigger}
          maxNumberOfIconsToShow={2}
        />
      );
    },
  },
  {
    accessorKey: 'folderId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Folder')} />
    ),
    cell: ({ row }) => {
      const folderId = row.original.folderId;
      return (
        <div className="text-left min-w-[150px]">
          {folderId ? (
            <FolderBadge folderId={folderId} />
          ) : (
            <span>{t('Uncategorized')}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'created',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Created')} />
    ),
    cell: ({ row }) => {
      const created = row.original.created;
      return (
        <div className="text-left font-medium min-w-[150px]">
          {formatUtils.formatDate(new Date(created))}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Status')} />
    ),
    cell: ({ row }) => {
      return (
        <div
          className="flex items-center space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <FlowStatusToggle
            flow={row.original}
            flowVersion={row.original.version}
          ></FlowStatusToggle>
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      const flow = row.original;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <FlowActionMenu
            insideBuilder={false}
            flow={flow}
            readonly={false}
            flowVersion={flow.version}
            onRename={() => {
              setRefresh(refresh + 1);
              refetch();
            }}
            onMoveTo={() => {
              setRefresh(refresh + 1);
              refetch();
            }}
            onDuplicate={() => {
              setRefresh(refresh + 1);
              refetch();
            }}
            onDelete={() => {
              setRefresh(refresh + 1);
              refetch();
            }}
          >
            <EllipsisVertical className="h-10 w-10" />
          </FlowActionMenu>
        </div>
      );
    },
  },
];
