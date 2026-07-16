import { ApErrorParams, ErrorCode, isNil } from '@activepieces/core-utils';
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
  Layers,
  Puzzle,
  Trash,
} from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { RequestTrial } from '@/app/components/request-trial';
import { CustomizeSelectorDialog } from '@/app/routes/platform/setup/pieces/customize-selector-dialog';
import { PieceActions } from '@/app/routes/platform/setup/pieces/piece-actions';
import { SyncPiecesButton } from '@/app/routes/platform/setup/pieces/sync-pieces';
import { ConfigurePieceOAuth2Dialog } from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { LockedAlert } from '@/components/custom/locked-alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { oauthAppsQueries } from '@/features/connections';
import {
  InstallPieceDialog,
  PieceIcon,
  piecesApi,
  piecesHooks,
} from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { PieceSetsTab } from './piece-sets/piece-sets-tab';

type TabValue = 'pieces' | 'piece-sets';

const PiecesListTab = () => {
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
                  isEnabled={isEnabled}
                />
                {row.original.pieceType === PieceType.CUSTOM && (
                  <ConfirmationDeleteDialog
                    title={t('Delete {name}', { name: row.original.name })}
                    entityName={t('Piece')}
                    message={t(
                      'This will permanently delete this piece, all steps using it will fail.',
                    )}
                    mutationFn={async () => {
                      await piecesApi.delete(row.original.id!);
                      await refetchPieces();
                    }}
                    onError={(error) => {
                      if (api.isError(error)) {
                        const apError = error.response?.data as ApErrorParams;
                        if (apError?.code === ErrorCode.VALIDATION) {
                          toast.error(apError.params.message);
                          return;
                        }
                      }
                      toast.error(t('Failed to delete piece'));
                    }}
                  >
                    <Button variant="ghost" size={'sm'} disabled={!isEnabled}>
                      <Trash className="size-4 text-destructive" />
                    </Button>
                  </ConfirmationDeleteDialog>
                )}
              </div>
            );
          },
        },
      ],
      [isEnabled, refetchPieces, refetchPiecesOAuth2AppsMap],
    );

  return (
    <>
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
        toolbarButtons={[
          <CustomizeSelectorDialog key="customize" isEnabled={isEnabled} />,
          <SyncPiecesButton key="sync" />,
          <InstallPieceDialog
            key="install"
            onInstallPiece={() => refetchPieces()}
            scope={PieceScope.PLATFORM}
          />,
        ]}
        virtualizeRows={true}
        hidePagination={true}
      />
    </>
  );
};

const PlatformPiecesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabValue) || 'pieces';

  const setTab = (tab: TabValue) => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'pieces') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams, { replace: true });
  };

  return (
    <>
      <DashboardPageHeader
        description={t('Manage the pieces that are available to your users')}
        title={t('Pieces')}
      />
      <div className="mx-auto w-full flex flex-col flex-1 min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setTab(v as TabValue)}
          className="flex flex-col flex-1 min-h-0 min-w-0"
        >
          <TabsList
            variant="outline"
            className="border-b w-full rounded-none justify-start shrink-0"
          >
            <TabsTrigger variant="outline" value="pieces">
              <Puzzle className="size-4 mr-2" />
              {t('Pieces')}
            </TabsTrigger>
            <TabsTrigger variant="outline" value="piece-sets">
              <Layers className="size-4 mr-2" />
              {t('Piece Sets')}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="pieces"
            className="flex-1 min-h-0 flex flex-col mt-0 min-w-0"
          >
            <PiecesListTab />
          </TabsContent>
          <TabsContent
            value="piece-sets"
            className="flex-1 min-h-0 flex flex-col mt-0 min-w-0"
          >
            <PieceSetsTab />
          </TabsContent>
        </Tabs>
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
