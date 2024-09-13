import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Trash } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { InstallPieceDialog } from '@/features/pieces/components/install-piece-dialog';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { ApFlagId, isNil, PieceScope, PieceType } from '@activepieces/shared';

import { TableTitle } from '../../../../components/ui/table-title';

import { ManagePiecesDialog } from './manage-pieces-dialog';

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
            title={t('Delete {name}', { name: row.original.name })}
            entityName={t('Piece')}
            message={t(
              'This will permanently delete this piece, all steps using it will fail.',
            )}
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

const fetchData = async ({ name }: { name: string }) => {
  const pieces = await piecesApi.list({
    searchQuery: name,
    includeHidden: false,
  });

  return {
    data: pieces,
    next: null,
    previous: null,
  };
};

const filters = [
  {
    type: 'input',
    title: t('Piece Name'),
    accessorKey: 'name',
    options: [],
    icon: CheckIcon,
  } as const,
];
const ProjectPiecesPage = () => {
  const [refresh, setRefresh] = useState(0);

  const { data: installPiecesEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.INSTALL_PROJECT_PIECES_ENABLED,
  );

  const { data: managedPiecesEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.MANAGE_PROJECT_PIECES_ENABLED,
  );

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <div className="mx-auto w-full flex-col">
        <div className="mb-4 flex">
          <TableTitle>{t('Pieces')}</TableTitle>
          <div className="ml-auto">
            {installPiecesEnabled && (
              <InstallPieceDialog
                onInstallPiece={() => setRefresh(refresh + 1)}
                scope={PieceScope.PROJECT}
              />
            )}
          </div>
        </div>
        <div className="flex justify-end">
          {managedPiecesEnabled && (
            <ManagePiecesDialog onSuccess={() => setRefresh(refresh + 1)} />
          )}
        </div>
        <DataTable
          columns={columns}
          filters={filters}
          refresh={refresh}
          fetchData={(filterParams) => fetchData(filterParams)}
          hidePagination={true}
        />
      </div>
    </div>
  );
};

ProjectPiecesPage.displayName = 'ProjectPiecesPage';
export { ProjectPiecesPage };
