import { isNil } from '@activepieces/core-utils';
import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import { OAuth2GrantType, PieceScope, PieceType } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  Package,
  Hash,
  GitBranch,
  Puzzle,
  Trash,
} from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  AdminDataTable,
  AdminPage,
  AdminPageHeader,
  ConfirmDialog,
  adminPageResources,
  useAdminAction,
} from '@/app/components/admin';
import { EnterpriseLockedSection } from '@/app/components/enterprise-gate';
import { DownloadPiecesReportButton } from '@/app/routes/platform/setup/pieces/download-pieces-report';
import { PieceActions } from '@/app/routes/platform/setup/pieces/piece-actions';
import { SyncPiecesButton } from '@/app/routes/platform/setup/pieces/sync-pieces';
import { ConfigurePieceOAuth2Dialog } from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Button } from '@/components/ui/button';
import { oauthAppsQueries } from '@/features/connections';
import {
  InstallPieceDialog,
  PieceIcon,
  piecesApi,
  piecesHooks,
} from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';

export const PiecesListTab = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.managePiecesEnabled;
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('name') ?? '';
  const {
    pieces,
    refetch: refetchPieces,
    isLoading,
    isError,
  } = piecesHooks.usePieces({
    searchQuery,
    includeHidden: true,
    isTableQuery: true,
  });

  const { refetch: refetchPiecesOAuth2AppsMap } =
    oauthAppsQueries.usePiecesOAuth2AppsMap();

  const { mutateAsync: deletePiece } =
    useAdminAction<PieceMetadataModelSummary>({
      verb: 'delete',
      name: (piece) => piece.displayName,
      run: async (piece) => {
        await piecesApi.delete(piece.id!);
        await refetchPieces();
      },
    });

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
          size: 190,
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
                  displayName={row.original.displayName}
                  isEnabled={isEnabled}
                />
                {row.original.pieceType === PieceType.CUSTOM && (
                  <ConfirmDialog
                    title={t('Delete {name}?', {
                      name: row.original.displayName,
                    })}
                    description={t(
                      'This will permanently delete this piece, all steps using it will fail.',
                    )}
                    confirmLabel={t('Delete piece')}
                    controlId={AdminControl.PIECES_DELETE_CONFIRM}
                    onConfirm={() => deletePiece(row.original)}
                  >
                    <Button
                      {...adminControl(AdminControl.PIECES_DELETE_OPEN)}
                      variant="ghost"
                      size={'sm'}
                      aria-label={t('Delete {name}', {
                        name: row.original.displayName,
                      })}
                      disabled={!isEnabled}
                    >
                      <Trash className="size-4 text-danger-11" />
                    </Button>
                  </ConfirmDialog>
                )}
              </div>
            );
          },
        },
      ],
      [isEnabled, refetchPieces, refetchPiecesOAuth2AppsMap, deletePiece],
    );

  return (
    <AdminPage fill>
      <AdminPageHeader
        title={t('Catalog')}
        description={t('Manage the pieces that are available to your users')}
        resources={adminPageResources.pieces}
      >
        <InstallPieceDialog
          onInstallPiece={() => refetchPieces()}
          scope={PieceScope.PLATFORM}
        />
      </AdminPageHeader>
      <EnterpriseLockedSection
        unlocked={isEnabled}
        featureKey="PIECES"
        line={t('Hiding pieces from your users is locked.')}
      />
      <AdminDataTable
        emptyStateTextTitle={t('No pieces found')}
        emptyStateTextDescription={t(
          'Start by installing pieces that you want to use in your automations',
        )}
        emptyStateIcon={<Package />}
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
        isError={isError}
        errorStateEntity={t('pieces')}
        onRetry={refetchPieces}
        toolbarButtons={[
          <DownloadPiecesReportButton key="download-report" />,
          <SyncPiecesButton key="sync" />,
        ]}
        virtualizeRows={true}
        hidePagination={true}
      />
    </AdminPage>
  );
};

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
