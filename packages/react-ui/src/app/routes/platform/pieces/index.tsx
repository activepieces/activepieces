import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { useState } from 'react';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { PieceScope } from '@activepieces/shared';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { InstallPieceDialog } from '@/features/pieces/components/install-piece-dialog';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { platformHooks } from '@/hooks/platform-hooks';
import { Checkbox } from '@/components/ui/checkbox';


const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}

      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
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

const PlatformPiecesPage = () => {
  const [refresh, setRefresh] = useState(0);
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.managePiecesEnabled;

  return (
    <LockedFeatureGuard
      locked={!isEnabled}
      lockTitle={t('Control Pieces')}
      lockDescription={t(
        "Show the pieces that matter most to your users and hide the ones that you don't like",
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/pieces.mp4"
    >
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <div className="mx-auto w-full flex-col">
          <div className="mb-4 flex">
            <h1 className="text-3xl font-bold">{t('Pieces')}</h1>
            <div className="ml-auto">
              <InstallPieceDialog onInstallPiece={() => setRefresh(refresh + 1)} scope={PieceScope.PLATFORM} />
            </div>
          </div>
          <DataTable columns={columns} refresh={refresh} fetchData={fetchData} />
        </div>
      </div>
    </LockedFeatureGuard>
  );
}

PlatformPiecesPage.displayName = 'PlatformPiecesPage';
export { PlatformPiecesPage };