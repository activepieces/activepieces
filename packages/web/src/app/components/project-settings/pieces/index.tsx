import { isNil } from '@activepieces/core-utils';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Info, Package, Puzzle, Tag, Hash, GitBranch } from 'lucide-react';
import { useMemo, useState } from 'react';

import { RequestTrial } from '@/app/components/request-trial';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableInputPopover } from '@/components/custom/data-table/data-table-input-popover';
import { LockedAlert } from '@/components/custom/locked-alert';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { pieceSetQueries } from '@/features/piece-sets';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';

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
];

const PiecesSettings = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { project } = projectCollectionUtils.useCurrentProject();
  const [searchQuery, setSearchQuery] = useState('');
  const { pieces, isLoading } = piecesHooks.usePieces({
    searchQuery,
    isTableQuery: true,
  });

  const { data: pieceSet } = pieceSetQueries.usePieceSet(
    project.pieceSetId ?? '',
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
      {platform.plan.managePiecesEnabled && (
        <Alert variant="primary">
          <Info className="size-4" />
          <AlertDescription className="flex items-center gap-2">
            {t(
              "This project's pieces are controlled by a Piece Set. Contact a platform admin to change it.",
            )}
            {!isNil(pieceSet) && (
              <Badge variant="outline" className="ml-1 font-medium">
                {pieceSet.name}
              </Badge>
            )}
          </AlertDescription>
        </Alert>
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
      />
    </div>
  );
};

PiecesSettings.displayName = 'PiecesSettings';
export { PiecesSettings };
