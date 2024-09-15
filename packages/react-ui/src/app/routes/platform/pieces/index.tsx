import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { ApplyTags } from '@/app/routes/platform/pieces/apply-tags';
import { SyncPiecesButton } from '@/app/routes/platform/pieces/sync-pieces';
import { TogglePieceButton } from '@/app/routes/platform/pieces/toggle-piece-button';
import { ConfigurePieceOAuth2Dialog } from '@/app/routes/platform/pieces/update-oauth2-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { InstallPieceDialog } from '@/features/pieces/components/install-piece-dialog';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import { PieceScope } from '@activepieces/shared';

import { TableTitle } from '../../../../components/ui/table-title';

const PlatformPiecesPage = () => {
  const [refresh, setRefresh] = useState(0);
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.managePiecesEnabled;

  const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] =
    useMemo(
      () => [
        {
          id: 'select',
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
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
          accessorKey: 'tags',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title={t('Tags')} />
          ),
          cell: ({ row }) => {
            return (
              <div className="text-left">
                <div className="flex gap-2">
                  {row.original.tags?.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            );
          },
        },
      ],
      [],
    );

  const fetchData = async () => {
    const pieces = await piecesApi.list({
      includeHidden: true,
      includeTags: true,
    });
    return {
      data: pieces,
      next: null,
      previous: null,
    };
  };

  const [selectedPieces, setSelectedPieces] = useState<
    PieceMetadataModelSummary[]
  >([]);

  return (
    <LockedFeatureGuard
      featureKey="PIECES"
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
            <TableTitle>{t('Pieces')}</TableTitle>
            <div className="ml-auto">
              <div className="flex gap-3">
                <ApplyTags
                  selectedPieces={selectedPieces}
                  onApplyTags={() => {
                    setRefresh(refresh + 1);
                  }}
                ></ApplyTags>
                <SyncPiecesButton />
                <InstallPieceDialog
                  onInstallPiece={() => setRefresh(refresh + 1)}
                  scope={PieceScope.PLATFORM}
                />
              </div>
            </div>
          </div>
          <DataTable
            columns={columns}
            actions={[
              (row) => {
                if (row.auth && row.auth.type === PropertyType.OAUTH2) {
                  return <ConfigurePieceOAuth2Dialog pieceName={row.name} />;
                }
                return <></>;
              },
              (row) => <TogglePieceButton pieceName={row.name} />,
            ]}
            refresh={refresh}
            fetchData={fetchData}
            onSelectedRowsChange={setSelectedPieces}
          />
        </div>
      </div>
    </LockedFeatureGuard>
  );
};

PlatformPiecesPage.displayName = 'PlatformPiecesPage';
export { PlatformPiecesPage };
