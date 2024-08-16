import { t } from 'i18next';
import { ColumnDef } from '@tanstack/react-table';
import { Trash } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { isNil, PieceType } from '@activepieces/shared';

import { piecesApi } from '../lib/pieces-api';

import { InstallPieceDialog } from './install-piece-dialog';
import { PieceIcon } from './piece-icon';

const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('App')} />
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
      <DataTableColumnHeader column={column} title={t('Display Name')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.displayName}</div>;
    },
  },
  {
    accessorKey: 'packageName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Package Name')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.name}</div>;
    },
  },
  {
    accessorKey: 'version',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Version')} />
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
            title={t('Delete {{name}}', { name: row.original.name })}
            entityName={t('Piece')}
            message={t('This will permanently delete this piece, all steps using it will fail.')}
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
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="mx-auto w-full flex-col">
      <div className="mb-4 flex">
        <h1 className="text-3xl font-bold">{t('Pieces')}</h1>
        <div className="ml-auto">
          <InstallPieceDialog onInstallPiece={() => setRefresh(refresh + 1)} />
        </div>
      </div>
      <DataTable columns={columns} refresh={refresh} fetchData={fetchData} />
    </div>
  );
}