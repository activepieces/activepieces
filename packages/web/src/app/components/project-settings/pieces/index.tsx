import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { PieceType } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Package, Trash, Puzzle, Tag, Hash, GitBranch } from 'lucide-react';
import { useMemo, useState } from 'react';

import { RequestTrial } from '@/app/components/request-trial';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableInputPopover } from '@/components/custom/data-table/data-table-input-popover';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { LockedAlert } from '@/components/custom/locked-alert';
import { Button } from '@/components/ui/button';
import { piecesApi, PieceIcon, piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';

import { ManagePiecesDialog } from './manage-pieces-dialog';

const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Piece')} icon={Puzzle} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          <PieceIcon
            size={'sm'}
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
      <DataTableColumnHeader
        column={column}
        title={t('Display Name')}
        icon={Tag}
      />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.displayName}</div>;
    },
  },
  {
    accessorKey: 'packageName',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Package Name')}
        icon={Hash}
      />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.name}</div>;
    },
  },
  {
    accessorKey: 'version',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Version')}
        icon={GitBranch}
      />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.version}</div>;
    },
  },
  {
    accessorKey: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      if (row.original.pieceType !== PieceType.CUSTOM) {
        return null;
      }
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
    },
  },
];

const PiecesSettings = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [searchQuery, setSearchQuery] = useState('');
  const { pieces, isLoading, refetch } = piecesHooks.usePieces({
    searchQuery,
    isTableQuery: true,
  });

  const toolbarButtons = useMemo(
    () => [<ManagePiecesDialog key="manage" onSuccess={() => refetch()} />],
    [refetch],
  );

  const customFilters = useMemo(
    () => [
      <DataTableInputPopover
        key="search"
        title={t('Piece Name')}
        filterValue={searchQuery}
        handleFilterChange={setSearchQuery}
      />,
    ],
    [searchQuery],
  );

  return (
    <div className="space-y-6">
      {!platform.plan.managePiecesEnabled && (
        <LockedAlert
          title={t('Control Pieces')}
          description={t(
            "Show the pieces that matter most to your users and hide the ones you don't like.",
          )}
          button={
            <RequestTrial
              featureKey="ENTERPRISE_PIECES"
              buttonVariant="basic"
            />
          }
        />
      )}
      <DataTable
        emptyStateTextTitle={t('No pieces found')}
        emptyStateTextDescription={t(
          'Add a piece to your project that you want to use in your automations',
        )}
        emptyStateIcon={<Package className="size-14" />}
        columns={columns}
        customFilters={customFilters}
        page={{
          data: pieces ?? [],
          next: null,
          previous: null,
        }}
        isLoading={isLoading}
        hidePagination={true}
        toolbarButtons={platform.plan.managePiecesEnabled ? toolbarButtons : []}
      />
    </div>
  );
};

PiecesSettings.displayName = 'PiecesSettings';
export { PiecesSettings };
