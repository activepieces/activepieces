import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Package } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { RequestTrial } from '@/app/components/request-trial';
import { ApplyTags } from '@/app/routes/platform/setup/pieces/apply-tags';
import { PieceActions } from '@/app/routes/platform/setup/pieces/piece-actions';
import { SyncPiecesButton } from '@/app/routes/platform/setup/pieces/sync-pieces';
import { ConfigurePieceOAuth2Dialog } from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { LockedAlert } from '@/components/ui/locked-alert';
import { oauthAppsQueries } from '@/features/connections/lib/oauth-apps-hooks';
import { InstallPieceDialog } from '@/features/pieces/components/install-piece-dialog';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  ApEdition,
  ApFlagId,
  BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
  isNil,
  OAuth2GrantType,
  PieceScope,
} from '@activepieces/shared';

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
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const { refetch: refetchPiecesClientIdsMap } =
    oauthAppsQueries.usePieceToClientIdMap(platform.cloudAuthEnabled, edition!);

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
              variant="secondary"
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              variant="secondary"
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
            const isOAuth2Enabled =
              row.original.auth &&
              row.original.auth.type === PropertyType.OAUTH2 &&
              (row.original.auth.grantType ===
                BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE ||
                row.original.auth.grantType ===
                  OAuth2GrantType.AUTHORIZATION_CODE ||
                isNil(row.original.auth.grantType));
            return (
              <div className="flex justify-end">
                {isOAuth2Enabled && (
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
    </>
  );
};

PlatformPiecesPage.displayName = 'PlatformPiecesPage';
export { PlatformPiecesPage };
