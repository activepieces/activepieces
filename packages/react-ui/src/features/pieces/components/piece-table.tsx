import { ColumnDef } from '@tanstack/react-table';
import { Trash } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { isNil, PieceType } from '@activepieces/shared';

import { piecesApi } from '../lib/pieces-api';

import { PieceIcon } from './piece-icon';

const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="App" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          <PieceIcon
            circle={true}
            size={'md'}
            border={true}
            displayName={row.original.displayName}
            logoUrl={row.original.logoUrl}
            showTooltip={false}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'displayName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Display Name" />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.displayName}</div>;
    },
  },
  {
    accessorKey: 'packageName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Package Name" />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.name}</div>;
    },
  },
  {
    accessorKey: 'version',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Version" />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.version}</div>;
    },
  },
  {
    accessorKey: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      if (
        row.original.pieceType === PieceType.CUSTOM &&
        !isNil(row.original.projectId)
      ) {
        return (
          <ConfirmationDeleteDialog
            title={`Delete ${row.original.name}`}
            entityName="Piece"
            message="This will permanently delete this piece, all steps using it will fail."
            mutationFn={async () => {
              row.original.delete();
              await piecesApi.delete(row.original.id!);
            }}
          >
            <div className="flex items-end justify-end">
              <Button variant="ghost" className="size-8 p-0">
                <Trash className="size-4 text-destructive" />
              </Button>
            </div>
          </ConfirmationDeleteDialog>
        );
      }
      return null;
    },
  },
];
const fetchData = async () => {
  const pieces = await piecesApi.list({
    includeHidden: true,
  });
  return {
    data: pieces,
    next: null,
    previous: null,
  };
};

export default function PiecesTable() {
  return (
    <div className="mx-auto w-full flex-col">
      <div className="-space-y-2">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          Pieces
        </h3>
        <div className="ml-auto"></div>
      </div>
      <DataTable columns={columns} fetchData={fetchData} />
    </div>
  );
}
