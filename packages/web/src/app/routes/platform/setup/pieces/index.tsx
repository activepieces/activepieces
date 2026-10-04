import { ErrorCode, isNil } from '@activepieces/core-utils';
import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import { OAuth2GrantType, PieceScope, PieceType } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { KeyRound, Package, Pin, PinOff, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { CustomizeSelectorSheet } from '@/app/routes/platform/setup/pieces/customize-selector-dialog';
import {
  OAuthStatus,
  OAuthStatusCell,
  PieceDetailSheet,
  PieceRowActions,
} from '@/app/routes/platform/setup/pieces/piece-detail-sheet';
import { PiecesHeaderMenu } from '@/app/routes/platform/setup/pieces/pieces-header-menu';
import {
  ConfigurePieceOAuth2Dialog,
  RemovePieceOAuth2Dialog,
} from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import {
  MutedCell,
  NameCell,
  NumberCell,
} from '@/components/custom/list/list-cells';
import {
  CountTabs,
  ListSearch,
  ListToolbar,
} from '@/components/custom/list/list-toolbar';
import { RowMenu } from '@/components/custom/list/row-menu';
import { useUrlParam } from '@/components/custom/list/use-url-param';
import { Page } from '@/components/custom/page';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlanBadge, PLATFORM_FEATURES, TIER_LABELS } from '@/features/billing';
import { oauthAppsQueries, PiecesOAuth2AppsMap } from '@/features/connections';
import {
  InstallPieceDialog,
  PieceIcon,
  piecesApi,
  piecesHooks,
} from '@/features/pieces';
import { platformPiecesMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

export const PiecesListTab = () => {
  const { platform, refetch: refetchPlatform } =
    platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.managePiecesEnabled;
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [segment, setSegment] = useUrlParam<PieceSegment>({
    key: 'type',
    fallback: 'all',
    allowed: PIECE_SEGMENTS,
  });
  const [openPieceName, setOpenPieceName] = useState<string | null>(null);
  const [oauthTarget, setOauthTarget] = useState<PieceTarget | null>(null);
  const [removeOauthTarget, setRemoveOauthTarget] =
    useState<PieceTarget | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<PieceMetadataModelSummary | null>(null);
  const [layoutOpen, setLayoutOpen] = useState(false);

  const {
    pieces,
    refetch: refetchPieces,
    isLoading,
    isError,
  } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
  });
  const { data: oauthApps, refetch: refetchOAuthApps } =
    oauthAppsQueries.usePiecesOAuth2AppsMap();
  const { mutate: togglePin } = platformPiecesMutations.useTogglePiecePin({
    platformId: platform.id,
    pinnedPieces: platform.pinnedPieces,
    refetch: refetchPlatform,
  });

  const allPieces = useMemo(() => pieces ?? [], [pieces]);
  const counts = useMemo(
    () => ({
      all: allPieces.length,
      official: allPieces.filter((p) => p.pieceType === PieceType.OFFICIAL)
        .length,
      custom: allPieces.filter((p) => p.pieceType === PieceType.CUSTOM).length,
      pinned: allPieces.filter((p) => platform.pinnedPieces.includes(p.name))
        .length,
    }),
    [allPieces, platform.pinnedPieces],
  );
  const visiblePieces = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allPieces.filter(
      (piece) =>
        matchesSegment({
          piece,
          segment,
          pinnedPieces: platform.pinnedPieces,
        }) &&
        (query === '' ||
          piece.displayName.toLowerCase().includes(query) ||
          piece.name.toLowerCase().includes(query)),
    );
  }, [allPieces, search, segment, platform.pinnedPieces]);

  const openPiece =
    allPieces.find((piece) => piece.name === openPieceName) ?? null;
  const lockedReason = t('Available on the {tier} plan', {
    tier: TIER_LABELS[PLATFORM_FEATURES.pieces.tier],
  });

  const onOAuthChanged = () => {
    refetchPieces();
    refetchOAuthApps();
  };

  const actionsFor = (piece: PieceMetadataModelSummary): PieceRowActions => ({
    pinned: platform.pinnedPieces.includes(piece.name),
    oauthStatus: oauthStatusOf({ piece, oauthApps }),
    isEnabled,
    lockedReason,
    onTogglePin: () => togglePin(piece.name),
    onConfigureOAuth: () =>
      setOauthTarget({ name: piece.name, displayName: piece.displayName }),
    onRemoveOAuth: () =>
      setRemoveOauthTarget({
        name: piece.name,
        displayName: piece.displayName,
      }),
    onDelete: () => setDeleteTarget(piece),
  });

  const columns: ColumnDef<RowDataWithActions<PieceMetadataModelSummary>>[] = [
    {
      accessorKey: 'displayName',
      size: 360,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Piece')} />
      ),
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-fit max-w-full min-w-0">
              <NameCell
                media={
                  <PieceIcon
                    size="xs"
                    border
                    displayName={row.original.displayName}
                    logoUrl={row.original.logoUrl}
                    showTooltip={false}
                  />
                }
                title={row.original.displayName}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start" className="font-mono">
            {row.original.name}
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      accessorKey: 'version',
      size: 112,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Version')} />
      ),
      cell: ({ row }) => (
        <MutedCell className="tabular-nums">{row.original.version}</MutedCell>
      ),
    },
    {
      id: 'components',
      size: 208,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Actions and triggers')}
        />
      ),
      cell: ({ row }) => (
        <MutedCell className="tabular-nums">
          {componentsSummary({
            actions: row.original.actions,
            triggers: row.original.triggers,
          })}
        </MutedCell>
      ),
    },
    {
      accessorKey: 'projectUsage',
      size: 128,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Used in projects')}
          className="justify-end"
        />
      ),
      cell: ({ row }) => <NumberCell value={row.original.projectUsage} />,
    },
    {
      id: 'oauth',
      size: 152,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('OAuth app')} />
      ),
      cell: ({ row }) => (
        <OAuthStatusCell
          status={oauthStatusOf({ piece: row.original, oauthApps })}
        />
      ),
    },
    {
      id: 'actions',
      size: 56,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <PieceRowMenu
            actions={actionsFor(row.original)}
            piece={row.original}
          />
        </div>
      ),
    },
  ];

  const filtered = search.trim() !== '' || segment !== 'all';

  return (
    <Page fill>
      <AdminPageHeader
        page="pieces"
        badge={
          isEnabled ? undefined : (
            <PlanBadge tier={PLATFORM_FEATURES.pieces.tier} />
          )
        }
      >
        <PiecesHeaderMenu
          lockedReason={isEnabled ? null : lockedReason}
          onCustomizeLayout={() => setLayoutOpen(true)}
        />
        <InstallPieceDialog
          onInstallPiece={() => refetchPieces()}
          scope={PieceScope.PLATFORM}
        />
      </AdminPageHeader>
      <ListToolbar
        search={<ListSearch placeholder={t('Search pieces')} />}
        tabs={
          <CountTabs
            value={segment}
            onValueChange={setSegment}
            options={[
              { value: 'all', label: t('All'), count: counts.all },
              {
                value: 'official',
                label: t('Official'),
                count: counts.official,
              },
              { value: 'custom', label: t('Custom'), count: counts.custom },
              { value: 'pinned', label: t('Pinned'), count: counts.pinned },
            ]}
          />
        }
      />
      <DataTable
        emptyStateTextTitle={
          filtered ? t('No piece matches') : t('No pieces installed')
        }
        emptyStateTextDescription={
          filtered
            ? t('Try a different search or tab.')
            : t(
                'Install a piece from npm, or upload a private archive built for this platform.',
              )
        }
        emptyStateIcon={<Package />}
        columns={columns}
        page={{
          data: visiblePieces,
          next: null,
          previous: null,
        }}
        onRowClick={(row) => setOpenPieceName(row.name)}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('pieces')}
        onRetry={refetchPieces}
        virtualizeRows={true}
        hidePagination={true}
      />

      <PieceDetailSheet
        piece={openPiece}
        actions={openPiece ? actionsFor(openPiece) : null}
        onOpenChange={(open) => !open && setOpenPieceName(null)}
      />
      <ConfigurePieceOAuth2Dialog
        pieceName={oauthTarget?.name ?? ''}
        pieceDisplayName={oauthTarget?.displayName ?? ''}
        open={oauthTarget !== null}
        onOpenChange={(open) => !open && setOauthTarget(null)}
        onConfigurationDone={onOAuthChanged}
      />
      {removeOauthTarget && (
        <RemovePieceOAuth2Dialog
          pieceName={removeOauthTarget.name}
          pieceDisplayName={removeOauthTarget.displayName}
          open
          onOpenChange={(open) => !open && setRemoveOauthTarget(null)}
          onConfigurationDone={onOAuthChanged}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title={t('Delete {name}?', { name: deleteTarget.displayName })}
          description={t(
            'The piece is removed from the catalogue and no project can add it to a flow again.',
          )}
          consequence={t('Every step using it fails.')}
          confirmLabel={t('Delete piece')}
          onConfirm={async () => {
            if (isNil(deleteTarget.id)) {
              return;
            }
            await piecesApi.delete(deleteTarget.id);
            setOpenPieceName(null);
            await refetchPieces();
          }}
          onError={(error) => {
            const serverMessage = api.isApError(error, ErrorCode.VALIDATION)
              ? api.serverErrorMessage(error)
              : undefined;
            toast.error(serverMessage ?? t('Failed to delete piece'));
          }}
        />
      )}
      <CustomizeSelectorSheet open={layoutOpen} onOpenChange={setLayoutOpen} />
    </Page>
  );
};

function PieceRowMenu({
  piece,
  actions,
}: {
  piece: PieceMetadataModelSummary;
  actions: PieceRowActions;
}) {
  const locked = !actions.isEnabled;
  return (
    <RowMenu
      items={[
        {
          label: actions.pinned
            ? t('Unpin from step picker')
            : t('Pin to step picker'),
          icon: actions.pinned ? PinOff : Pin,
          onSelect: actions.onTogglePin,
          disabled: locked,
          disabledReason: actions.lockedReason,
        },
        {
          label:
            actions.oauthStatus === 'configured'
              ? t('Change OAuth app')
              : t('Set up OAuth app'),
          icon: KeyRound,
          onSelect: actions.onConfigureOAuth,
          hidden: actions.oauthStatus === 'none',
          disabled: locked,
          disabledReason: actions.lockedReason,
        },
        {
          label: t('Delete piece'),
          icon: Trash2,
          onSelect: actions.onDelete,
          destructive: true,
          hidden: piece.pieceType !== PieceType.CUSTOM,
          disabled: locked,
          disabledReason: actions.lockedReason,
        },
      ]}
    />
  );
}

function componentsSummary({
  actions,
  triggers,
}: {
  actions: number;
  triggers: number;
}) {
  return [
    actions > 0
      ? t('{actions, plural, =1 {1 action} other {# actions}}', { actions })
      : null,
    triggers > 0
      ? t('{triggers, plural, =1 {1 trigger} other {# triggers}}', {
          triggers,
        })
      : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
}

function oauthStatusOf({
  piece,
  oauthApps,
}: {
  piece: PieceMetadataModelSummary;
  oauthApps: PiecesOAuth2AppsMap | undefined;
}): OAuthStatus {
  if (!supportsOAuth2App(piece)) {
    return 'none';
  }
  const apps = oauthApps?.[piece.name];
  if (apps?.platformOAuth2App) {
    return 'configured';
  }
  if (apps?.cloudOAuth2App) {
    return 'default';
  }
  return 'missing';
}

function supportsOAuth2App(piece: PieceMetadataModelSummary) {
  const pieceAuth = Array.isArray(piece.auth)
    ? piece.auth.find((auth) => auth.type === PropertyType.OAUTH2)
    : piece.auth;
  if (isNil(pieceAuth) || pieceAuth.type !== PropertyType.OAUTH2) {
    return false;
  }
  return pieceAuth.grantType !== OAuth2GrantType.CLIENT_CREDENTIALS;
}

function matchesSegment({
  piece,
  segment,
  pinnedPieces,
}: {
  piece: PieceMetadataModelSummary;
  segment: PieceSegment;
  pinnedPieces: string[];
}) {
  switch (segment) {
    case 'all':
      return true;
    case 'official':
      return piece.pieceType === PieceType.OFFICIAL;
    case 'custom':
      return piece.pieceType === PieceType.CUSTOM;
    case 'pinned':
      return pinnedPieces.includes(piece.name);
  }
}

const PIECE_SEGMENTS = ['all', 'official', 'custom', 'pinned'] as const;

type PieceSegment = (typeof PIECE_SEGMENTS)[number];

type PieceTarget = { name: string; displayName: string };
