import { ApErrorParams, ErrorCode, isNil } from '@activepieces/core-utils';
import {
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import { OAuth2GrantType, PieceScope, PieceType } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  MoreHorizontal,
  Package,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CustomizeSelectorSheet } from '@/app/routes/platform/setup/pieces/customize-selector-dialog';
import {
  OAuthStatus,
  OAuthStatusCell,
  PieceDetailSheet,
  PieceRowActions,
} from '@/app/routes/platform/setup/pieces/piece-detail-sheet';
import { PiecesHeaderMenu } from '@/app/routes/platform/setup/pieces/pieces-header-menu';
import { PiecesLockedBanner } from '@/app/routes/platform/setup/pieces/pieces-locked-banner';
import {
  ConfigurePieceOAuth2Dialog,
  RemovePieceOAuth2Dialog,
} from '@/app/routes/platform/setup/pieces/update-oauth2-dialog';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Page, PageHeader, Toolbar } from '@/components/custom/page';
import { SearchInput } from '@/components/custom/search-input';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<PieceSegment>('all');
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

  const onOAuthChanged = () => {
    refetchPieces();
    refetchOAuthApps();
  };

  const actionsFor = (piece: PieceMetadataModelSummary): PieceRowActions => ({
    pinned: platform.pinnedPieces.includes(piece.name),
    oauthStatus: oauthStatusOf({ piece, oauthApps }),
    isEnabled,
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
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Piece')} />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <PieceIcon
            size="xs"
            border
            displayName={row.original.displayName}
            logoUrl={row.original.logoUrl}
            showTooltip={false}
          />
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="shrink-0 font-medium text-gray-12">
              {row.original.displayName}
            </span>
            <TextWithTooltip tooltipMessage={row.original.name}>
              <span className="truncate text-xs text-gray-11">
                {row.original.name}
              </span>
            </TextWithTooltip>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'version',
      size: 96,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Version')}
          className="justify-end"
        />
      ),
      cell: ({ row }) => (
        <div className="text-right text-gray-11 tabular-nums">
          {row.original.version}
        </div>
      ),
    },
    {
      id: 'components',
      size: 184,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Actions & triggers')}
        />
      ),
      cell: ({ row }) => (
        <span className="text-gray-11">
          {t('{actions, plural, =1 {1 action} other {# actions}}', {
            actions: row.original.actions,
          })}
          {' · '}
          {t('{triggers, plural, =1 {1 trigger} other {# triggers}}', {
            triggers: row.original.triggers,
          })}
        </span>
      ),
    },
    {
      accessorKey: 'projectUsage',
      size: 96,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Projects')}
          className="justify-end"
        />
      ),
      cell: ({ row }) => (
        <div className="text-right text-gray-12 tabular-nums">
          {row.original.projectUsage}
        </div>
      ),
    },
    {
      id: 'oauth',
      size: 136,
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

  return (
    <Page fill>
      <PageHeader
        title={t('Pieces')}
        description={t(
          'Every piece builders can add to a flow. Pin favourites and bring your own OAuth apps.',
        )}
      >
        <PiecesHeaderMenu onCustomizeLayout={() => setLayoutOpen(true)} />
        <InstallPieceDialog
          onInstallPiece={() => refetchPieces()}
          scope={PieceScope.PLATFORM}
        />
      </PageHeader>
      <PiecesLockedBanner
        message={t(
          "Showing and hiding pieces needs a higher plan. You can browse the catalog, but changes won't stick.",
        )}
      />
      <Toolbar>
        <div className="w-full max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Search pieces')}
          />
        </div>
        <Tabs
          value={segment}
          onValueChange={(value) => setSegment(toSegment(value))}
        >
          <TabsList>
            {PIECE_SEGMENTS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {t(option.label)}
                <span className="text-gray-11 tabular-nums">
                  {counts[option.value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Toolbar>
      <DataTable
        emptyStateTextTitle={
          allPieces.length === 0
            ? t('No pieces installed')
            : t('No piece matches')
        }
        emptyStateTextDescription={
          allPieces.length === 0
            ? t(
                'Install a piece from npm, or upload a private archive built for this platform.',
              )
            : t('Try a different search or filter.')
        }
        emptyStateIcon={<Package className="size-6 text-gray-9" />}
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
            await piecesApi.delete(deleteTarget.id!);
            setOpenPieceName(null);
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
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('More actions')}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem
          disabled={!actions.isEnabled}
          onSelect={actions.onTogglePin}
        >
          {actions.pinned ? <PinOff /> : <Pin />}
          {actions.pinned
            ? t('Unpin from step picker')
            : t('Pin to step picker')}
        </DropdownMenuItem>
        {actions.oauthStatus !== 'none' && (
          <DropdownMenuItem
            disabled={!actions.isEnabled}
            onSelect={actions.onConfigureOAuth}
          >
            <Pencil />
            {t('Configure OAuth app')}
          </DropdownMenuItem>
        )}
        {actions.oauthStatus === 'configured' && (
          <DropdownMenuItem
            variant="destructive"
            disabled={!actions.isEnabled}
            onSelect={actions.onRemoveOAuth}
          >
            <Trash2 />
            {t('Remove OAuth app')}
          </DropdownMenuItem>
        )}
        {piece.pieceType === PieceType.CUSTOM && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={!actions.isEnabled}
              onSelect={actions.onDelete}
            >
              <Trash2 />
              {t('Delete piece')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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

function toSegment(value: string): PieceSegment {
  return (
    PIECE_SEGMENTS.find((option) => option.value === value)?.value ?? 'all'
  );
}

const PIECE_SEGMENTS: { value: PieceSegment; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'official', label: 'Official' },
  { value: 'custom', label: 'Custom' },
  { value: 'pinned', label: 'Pinned' },
];

type PieceSegment = 'all' | 'official' | 'custom' | 'pinned';

type PieceTarget = { name: string; displayName: string };
