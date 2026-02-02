import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  Package,
  Tag,
  Hash,
  GitBranch,
  Tags,
  Puzzle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { RequestTrial } from '@/app/components/request-trial';
import { ApplyTags } from '@/app/routes/platform/setup/pieces/apply-tags';
import { PieceActions } from '@/app/routes/platform/setup/pieces/piece-actions';
import { SyncPiecesButton } from '@/app/routes/platform/setup/pieces/sync-pieces';
import { ConfigurePieceOAuth2Dialog } from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { Badge } from '@/components/ui/badge';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { LockedAlert } from '@/components/ui/locked-alert';
import { oauthAppsQueries } from '@/features/connections/lib/oauth-apps-hooks';
import { InstallPieceDialog } from '@/features/pieces/components/install-piece-dialog';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import { isNil, OAuth2GrantType, PieceScope } from '@activepieces/shared';

const PlatformPiecesPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.managePiecesEnabled;
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

  const { refetch: refetchPiecesOAuth2AppsMap } =
    oauthAppsQueries.usePiecesOAuth2AppsMap();

  const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] =
    useMemo(
      () => [
        {
          accessorKey: 'name',
          size: 80,
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('Piece')}
              icon={Puzzle}
            />
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
          size: 180,
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
          size: 200,
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
          size: 100,
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
          accessorKey: 'tags',
          size: 150,
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('Tags')}
              icon={Tags}
            />
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
                {shouldShowOauth2SettingForPiece(row.original) && (
                  <ConfigurePieceOAuth2Dialog
                    pieceName={row.original.name}
                    onConfigurationDone={() => {
                      refetchPieces();
                      refetchPiecesOAuth2AppsMap();
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
    <>
      <DashboardPageHeader
        description={t('Manage the pieces that are available to your users')}
        title={t('Pieces')}
      >
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
      </DashboardPageHeader>
      <div className="mx-auto w-full flex-col">
        {!isEnabled && (
          <LockedAlert
            title={t('Control Pieces')}
            description={t(
              "Show the pieces that matter most to your users and hide the ones you don't like.",
            )}
            button={
              <RequestTrial
                featureKey="ENTERPRISE_PIECES"
                buttonVariant="outline-primary"
              />
            }
          />
        )}
        <DataTable
          emptyStateTextTitle={t('No pieces found')}
          emptyStateTextDescription={t(
            'Start by installing pieces that you want to use in your automations',
          )}
          emptyStateIcon={<Package className="size-14" />}
          columns={columns}
          filters={[
            {
              type: 'input',
              title: t('Piece Name'),
              accessorKey: 'name',
              icon: CheckIcon,
            },
          ]}
          page={{
            data: pieces ?? [],
            next: null,
            previous: null,
          }}
          isLoading={isLoading}
          selectColumn={true}
          onSelectedRowsChange={setSelectedPieces}
        />
      </div>
    </>
  );
};

PlatformPiecesPage.displayName = 'PlatformPiecesPage';
export { PlatformPiecesPage };

function shouldShowOauth2SettingForPiece(piece: PieceMetadataModelSummary) {
  const pieceAuth = Array.isArray(piece.auth)
    ? piece.auth.find((auth) => auth.type === PropertyType.OAUTH2)
    : piece.auth;
  if (isNil(pieceAuth)) {
    return false;
  }
  if (pieceAuth.type !== PropertyType.OAUTH2) {
    return false;
  }
  if (pieceAuth.grantType === OAuth2GrantType.CLIENT_CREDENTIALS) {
    return false;
  }
  return true;
}
