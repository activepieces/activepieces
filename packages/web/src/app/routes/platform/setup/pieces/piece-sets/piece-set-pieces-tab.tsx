import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { isPieceVisible, PieceSet } from '@activepieces/shared';
import { t } from 'i18next';
import { Ban, CheckCircle2, ChevronRight, Package, Star } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminEmpty, SettingsPanel } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  ChangePieceSet,
  PieceSetChange,
  pieceSetChanges,
  pieceSetTerms,
} from '@/features/piece-sets';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { ConfirmExcludingRequiredActionsDialog } from './confirm-excluding-required-actions';
import { PieceActionsAndTriggersSheet } from './piece-actions-and-triggers-sheet';
import { CountTabs, SkeletonRows } from './policy-ui';

export const PieceSetPiecesTab = ({
  pieceSet,
  onChange,
}: PieceSetPiecesTabProps) => {
  const { pieces, isLoading, isError, refetch } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [managingPiece, setManagingPiece] =
    useState<PieceMetadataModelSummary | null>(null);
  const [pendingChange, setPendingChange] = useState<PieceSetChange | null>(
    null,
  );

  const allPieces = useMemo(() => pieces ?? [], [pieces]);
  const accessOf = (piece: PieceMetadataModelSummary): PieceAccess =>
    pieceAccess({ pieceSet, piece });
  const counts = useMemo(
    () =>
      isLoading
        ? undefined
        : {
            all: allPieces.length,
            allowed: allPieces.filter(
              (piece) => pieceAccess({ pieceSet, piece }) === 'allowed',
            ).length,
            limited: allPieces.filter(
              (piece) => pieceAccess({ pieceSet, piece }) === 'limited',
            ).length,
            blocked: allPieces.filter(
              (piece) => pieceAccess({ pieceSet, piece }) === 'blocked',
            ).length,
          },
    [isLoading, allPieces, pieceSet],
  );
  const visiblePieces = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allPieces.filter(
      (piece) =>
        (segment === 'all' || pieceAccess({ pieceSet, piece }) === segment) &&
        (query === '' || piece.displayName.toLowerCase().includes(query)),
    );
  }, [allPieces, pieceSet, search, segment]);

  const visibleNames = visiblePieces.map((piece) => piece.name);
  const selectedVisible = selected.filter((name) =>
    visibleNames.includes(name),
  );
  const selectedPieces = visiblePieces.filter((piece) =>
    selectedVisible.includes(piece.name),
  );
  const allSelected =
    visibleNames.length > 0 && selectedVisible.length === visibleNames.length;

  const setVisibility = ({
    targets,
    visible,
  }: {
    targets: PieceMetadataModelSummary[];
    visible: boolean;
  }) => {
    const change: PieceSetChange = {
      type: 'visibility',
      label: targets.length === 1 ? targets[0].displayName : undefined,
      visible: Object.fromEntries(
        targets.map((piece) => [piece.name, visible]),
      ),
    };
    const excluded = pieceSetChanges.excludedRequiredActions({
      pieceSet,
      change,
    });
    if (Object.keys(excluded).length > 0) {
      setPendingChange(change);
      return;
    }
    onChange(change).catch(() => undefined);
  };

  const setSelectedVisibility = (visible: boolean) => {
    setVisibility({
      targets: selectedPieces.filter(
        (piece) => (accessOf(piece) !== 'blocked') !== visible,
      ),
      visible,
    });
    setSelected([]);
  };

  const toggleSelected = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  return (
    <SettingsPanel
      flush
      title={t('Pieces')}
      description={t(
        'Every piece on the platform, and what this {term} allows of it.',
        pieceSetTerms.get(),
      )}
    >
      <div className="flex flex-wrap items-center gap-3 p-5">
        <div className="min-w-48 flex-1">
          <SearchInput
            placeholder={t('Search pieces')}
            value={search}
            onChange={setSearch}
          />
        </div>
        <CountTabs
          value={segment}
          onValueChange={(next) => {
            setSegment(next);
            setSelected([]);
          }}
          options={[
            { value: 'all', label: t('All'), count: counts?.all },
            { value: 'allowed', label: t('Allowed'), count: counts?.allowed },
            { value: 'limited', label: t('Limited'), count: counts?.limited },
            { value: 'blocked', label: t('Blocked'), count: counts?.blocked },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="p-5">
          <SkeletonRows count={6} className="h-10 rounded-xl" />
        </div>
      ) : isError ? (
        <DataFetchErrorState entity={t('pieces')} onRetry={refetch} />
      ) : visiblePieces.length === 0 ? (
        <AdminEmpty
          framed={false}
          icon={<Package />}
          title={
            search.trim() === ''
              ? EMPTY_SEGMENT_TITLES[segment]()
              : t('No piece matches')
          }
          description={
            search.trim() === ''
              ? EMPTY_SEGMENT_DESCRIPTIONS[segment]()
              : t('Try a different search or tab.')
          }
        />
      ) : (
        <div className="flex flex-col px-1 pb-1">
          <div className="flex h-12 items-center gap-3 px-3">
            <Checkbox
              aria-label={t('Select all pieces')}
              checked={
                allSelected
                  ? true
                  : selectedVisible.length > 0
                  ? 'indeterminate'
                  : false
              }
              onCheckedChange={() =>
                setSelected(allSelected ? [] : visibleNames)
              }
            />
            <span className="flex-1 text-sm font-medium text-gray-11 tabular-nums">
              {selectedVisible.length > 0
                ? t('{count} selected', { count: selectedVisible.length })
                : t('{count, plural, =1 {1 piece} other {# pieces}}', {
                    count: visiblePieces.length,
                  })}
            </span>
            {selectedVisible.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  {...adminControl(AdminControl.PIECE_SETS_INCLUDE_RUN)}
                  variant="outline"
                  size="sm"
                  disabled={selectedPieces.every(
                    (piece) => accessOf(piece) !== 'blocked',
                  )}
                  onClick={() => setSelectedVisibility(true)}
                >
                  <CheckCircle2 />
                  {t('Allow')}
                </Button>
                <Button
                  {...adminControl(AdminControl.PIECE_SETS_EXCLUDE_RUN)}
                  variant="outline"
                  size="sm"
                  disabled={selectedPieces.every(
                    (piece) => accessOf(piece) === 'blocked',
                  )}
                  onClick={() => setSelectedVisibility(false)}
                >
                  <Ban />
                  {t('Block')}
                </Button>
              </div>
            )}
          </div>
          {visiblePieces.map((piece) => {
            const access = accessOf(piece);
            const allowed = access !== 'blocked';
            return (
              <div
                {...adminControl(
                  allowed ? AdminControl.PIECE_SETS_COMPONENTS_OPEN : undefined,
                )}
                key={piece.name}
                role={allowed ? 'button' : undefined}
                tabIndex={allowed ? 0 : undefined}
                onClick={allowed ? () => setManagingPiece(piece) : undefined}
                onKeyDown={(event) => {
                  if (
                    allowed &&
                    event.target === event.currentTarget &&
                    (event.key === 'Enter' || event.key === ' ')
                  ) {
                    event.preventDefault();
                    setManagingPiece(piece);
                  }
                }}
                className={cn(
                  'flex h-12 items-center gap-3 rounded-lg border-t border-gray-6 px-3 outline-hidden',
                  allowed &&
                    'cursor-pointer hover:bg-gray-2 focus-visible:bg-gray-2',
                )}
              >
                <span onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    aria-label={t('Select {name}', { name: piece.displayName })}
                    checked={selected.includes(piece.name)}
                    onCheckedChange={() => toggleSelected(piece.name)}
                  />
                </span>
                <PieceIcon
                  size="xs"
                  border
                  displayName={piece.displayName}
                  logoUrl={piece.logoUrl}
                  showTooltip={false}
                />
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm font-medium',
                    allowed ? 'text-gray-12' : 'text-gray-11',
                  )}
                >
                  {piece.displayName}
                </span>
                <span
                  className={cn(
                    'hidden shrink-0 items-center gap-1.5 text-sm tabular-nums sm:flex',
                    access === 'limited' ? 'text-accent-11' : 'text-gray-11',
                  )}
                >
                  {allowed
                    ? componentSummary({ pieceSet, piece })
                    : t('Blocked')}
                  {requiredCount({ pieceSet, piece }) > 0 && (
                    <span className="flex items-center gap-1 text-warning-11">
                      <Star className="size-3.5 fill-current" />
                      {t('{count} required', {
                        count: requiredCount({ pieceSet, piece }),
                      })}
                    </span>
                  )}
                </span>
                <span
                  className="flex"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Switch
                    {...adminControl(AdminControl.PIECE_SETS_PIECE_TOGGLE)}
                    aria-label={t('Allow {name}', { name: piece.displayName })}
                    checked={allowed}
                    onCheckedChange={(checked) =>
                      setVisibility({ targets: [piece], visible: checked })
                    }
                  />
                </span>
                <ChevronRight
                  aria-hidden
                  className={cn('size-4 text-gray-9', !allowed && 'invisible')}
                />
              </div>
            );
          })}
        </div>
      )}

      <ConfirmExcludingRequiredActionsDialog
        excludedRequiredActions={
          pendingChange === null
            ? null
            : pieceSetChanges.excludedRequiredActions({
                pieceSet,
                change: pendingChange,
              })
        }
        reason="removePieces"
        onConfirm={() => {
          const change = pendingChange;
          setPendingChange(null);
          return change === null ? undefined : onChange(change);
        }}
        onCancel={() => setPendingChange(null)}
      />

      {managingPiece && (
        <PieceActionsAndTriggersSheet
          pieceName={managingPiece.name}
          pieceDisplayName={managingPiece.displayName}
          open={true}
          onOpenChange={(open) => {
            if (!open) setManagingPiece(null);
          }}
          pieceSet={pieceSet}
          onChange={onChange}
        />
      )}
    </SettingsPanel>
  );
};

function pieceAccess({
  pieceSet,
  piece,
}: {
  pieceSet: PieceSet;
  piece: PieceMetadataModelSummary;
}): PieceAccess {
  if (!isPieceVisible({ pieces: pieceSet.config.pieces, name: piece.name })) {
    return 'blocked';
  }
  const curated =
    piece.name in pieceSet.config.selectedActions ||
    piece.name in pieceSet.config.selectedTriggers;
  return curated ? 'limited' : 'allowed';
}

function componentSummary({
  pieceSet,
  piece,
}: {
  pieceSet: PieceSet;
  piece: PieceMetadataModelSummary;
}): string {
  if (pieceAccess({ pieceSet, piece }) !== 'limited') {
    return t('Everything');
  }
  const total = piece.actions + piece.triggers;
  const count =
    (pieceSet.config.selectedActions[piece.name]?.length ?? piece.actions) +
    (pieceSet.config.selectedTriggers[piece.name]?.length ?? piece.triggers);
  return t('{count} of {total} included', { count, total });
}

function requiredCount({
  pieceSet,
  piece,
}: {
  pieceSet: PieceSet;
  piece: PieceMetadataModelSummary;
}): number {
  return (pieceSet.config.requiredActions.actions[piece.name] ?? []).length;
}

const EMPTY_SEGMENT_TITLES: Record<Segment, () => string> = {
  all: () => t('No pieces yet'),
  allowed: () => t('No piece is allowed'),
  limited: () => t('No piece is limited'),
  blocked: () => t('No piece is blocked'),
};

const EMPTY_SEGMENT_DESCRIPTIONS: Record<Segment, () => string> = {
  all: () => t('Install a piece and it shows up here.'),
  allowed: () => t('Allow pieces from the Blocked tab.'),
  limited: () => t('Open an allowed piece to limit it to some of its actions.'),
  blocked: () =>
    t('Every piece is available on this {term}.', pieceSetTerms.get()),
};

type PieceAccess = 'allowed' | 'limited' | 'blocked';
type Segment = PieceAccess | 'all';

type PieceSetPiecesTabProps = {
  pieceSet: PieceSet;
  onChange: ChangePieceSet;
};
