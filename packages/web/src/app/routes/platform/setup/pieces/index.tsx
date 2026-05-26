import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import { isNil, OAuth2GrantType, PieceScope } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Package, Hash, GitBranch, Puzzle } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { RequestTrial } from '@/app/components/request-trial';
import { ApplyTags } from '@/app/routes/platform/setup/pieces/apply-tags';
import { PieceActions } from '@/app/routes/platform/setup/pieces/piece-actions';
import { SyncPiecesButton } from '@/app/routes/platform/setup/pieces/sync-pieces';
import { ConfigurePieceOAuth2Dialog } from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { LockedAlert } from '@/components/custom/locked-alert';
import { Badge } from '@/components/ui/badge';
import { oauthAppsQueries } from '@/features/connections';
import { InstallPieceDialog, PieceIcon, piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';

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
    isTableQuery: true,
  });

  const { refetch: refetchPiecesOAuth2AppsMap } =
    oauthAppsQueries.usePiecesOAuth2AppsMap();

  const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] =
    useMemo(
      () => [
        {
          accessorKey: 'displayName',
          size: 300,
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('Name')}
              icon={Puzzle}
            />
          ),
          cell: ({ row }) => {
            return (
              <div className="flex items-center gap-2">
                <PieceIcon
                  size={'sm'}
                  border={true}
                  displayName={row.original.displayName}
                  logoUrl={row.original.logoUrl}
                  showTooltip={false}
                />
                <div className="flex flex-col gap-0.5">
                  <span>{row.original.displayName}</span>
                  {row.original.tags && row.original.tags.length > 0 && (
                    <div className="flex gap-1">
                      {row.original.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs py-0 px-1.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          },
        },
        {
          accessorKey: 'packageName',
          size: 250,
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
          size: 80,
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
          id: 'actions',
          size: 80,
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

  return (
    <>
      <DashboardPageHeader
        description={t('Manage the pieces that are available to your users')}
        title={t('Pieces')}
      />
      <div className="mx-auto w-full flex flex-col flex-1 min-h-0">
        {!isEnabled && (
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
          bulkActions={[
            {
              render: (selectedRows) => (
                <ApplyTags
                  selectedPieces={selectedRows}
                  onApplyTags={() => refetchPieces()}
                />
              ),
            },
          ]}
          toolbarButtons={[
            <SyncPiecesButton key="sync" />,
            <InstallPieceDialog
              key="install"
              onInstallPiece={() => refetchPieces()}
              scope={PieceScope.PLATFORM}
            />,
          ]}
          selectColumn={true}
          virtualizeRows={true}
          hidePagination={true}
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
