import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { RequestTrial } from '@/app/components/request-trial';
import { ApplyTags } from '@/app/routes/platform/setup/pieces/apply-tags';
import { PieceActions } from '@/app/routes/platform/setup/pieces/piece-actions';
import { SyncPiecesButton } from '@/app/routes/platform/setup/pieces/sync-pieces';
import { ConfigurePieceOAuth2Dialog } from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { LockedAlert } from '@/components/ui/locked-alert';
import { oauth2AppsHooks } from '@/features/connections/lib/oauth2-apps-hooks';
import { InstallPieceDialog } from '@/features/pieces/components/install-piece-dialog';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import { ApEdition, ApFlagId, PieceScope } from '@activepieces/shared';

import { TableTitle } from '../../../../../components/ui/table-title';
const PlatformPiecesPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.managePiecesEnabled;
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('name') ?? '';
  const {
    pieces,
    refetch: refetchPieces,
    isLoading,
  } = piecesHooks.usePieces({
    searchQuery,
    includeTags: true,
    includeHidden: true,
  });
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { refetch: refetchPiecesClientIdsMap } =
    oauth2AppsHooks.usePieceToClientIdMap(platform.cloudAuthEnabled, edition!);
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
              onCheckedChange={(value) => {
                row.toggleSelected(!!value);
              }}
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
        {
          id: 'actions',
          cell: ({ row }) => {
            return (
              <div className="flex justify-end">
                {row.original.auth &&
                  row.original.auth.type === PropertyType.OAUTH2 && (
                    <ConfigurePieceOAuth2Dialog
                      pieceName={row.original.name}
                      onConfigurationDone={() => {
                        refetchPieces();
                        refetchPiecesClientIdsMap();
                      }}
                      isEnabled={isEnabled}
                    />
                  )}
                <PieceActions
                  pieceName={row.original.name}
                  isEnabled={isEnabled}
                />
              </div>
            );
          },
        },
      ],
      [],
    );

  const [selectedPieces, setSelectedPieces] = useState<
    PieceMetadataModelSummary[]
  >([]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <div className="mx-auto w-full flex-col">
        {!isEnabled && (
          <LockedAlert
            title={t('Control Pieces')}
            description={t(
              "Got an idea for a piece that matters to your users?",
            )}
            button={
              <RequestTrial
                featureKey="ENTERPRISE_PIECES"
                buttonVariant="outline-primary"
              />
            }
          />
        )}
        <div className="mb-4 flex">
          <TableTitle>{t('Pieces')}</TableTitle>
          <div className="ml-auto">
            <div className="flex gap-3">
              <ApplyTags
                selectedPieces={selectedPieces}
                onApplyTags={() => {
                  refetchPieces();
                }}
              ></ApplyTags>
              <SyncPiecesButton />
              <InstallPieceDialog
                onInstallPiece={() => refetchPieces()}
                scope={PieceScope.PLATFORM}
              />
            </div>
          </div>
        </div>
        <DataTable
          columns={columns}
          filters={[
            {
              type: 'input',
              title: t('Piece Name'),
              accessorKey: 'name',
              options: [],
              icon: CheckIcon,
            } as const,
          ]}
          page={{
            data: pieces ?? [],
            next: null,
            previous: null,
          }}
          isLoading={isLoading}
          onSelectedRowsChange={setSelectedPieces}
        />
      </div>
    </div>
  );
};

PlatformPiecesPage.displayName = 'PlatformPiecesPage';
export { PlatformPiecesPage };
