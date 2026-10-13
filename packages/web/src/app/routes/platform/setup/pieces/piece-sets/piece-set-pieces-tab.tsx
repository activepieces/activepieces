import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  ComponentSelection,
  isPieceVisible,
  PieceAudienceFilter,
  PieceSet,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Package,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  AdminEmpty,
  AdminFetchErrorState,
  ConfirmDialog,
  InstantSwitch,
  SettingsPanel,
} from '@/app/components/admin';
import { LogoPlate } from '@/components/custom/logo-plate';
import { SearchInput } from '@/components/custom/search-input';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import {
  ChangePieceSet,
  PieceSetChange,
  pieceSetChanges,
  pieceSetTerms,
} from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { FrozenRows, listUtils } from '@/lib/list-utils';
import { cn } from '@/lib/utils';

import {
  ConfirmExcludingRequiredActionsDialog,
  ExcludingReason,
  excludingRequiredActionsConfirm,
} from './confirm-excluding-required-actions';
import { PieceActionsAndTriggersSheet } from './piece-actions-and-triggers-sheet';
import { CountTabs, savedOrThrow } from './policy-ui';

export const PieceSetPiecesTab = ({
  pieceSet,
  onChange,
}: PieceSetPiecesTabProps) => {
  const { pieces, isLoading, isError, refetch } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
    audience: PieceAudienceFilter.ALL,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get(SEARCH_PARAM) ?? '';
  const [segment, setSegment] = useState<Segment>('all');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [managingPiece, setManagingPiece] =
    useState<PieceMetadataModelSummary | null>(null);
  const [pieceToShow, setPieceToShow] =
    useState<PieceMetadataModelSummary | null>(null);
  const [pending, setPending] = useState<PendingBulk | null>(null);

  const allPieces = useMemo(() => pieces ?? [], [pieces]);
  const accessByName = useMemo(
    () =>
      new Map(
        allPieces.map((piece) => [
          piece.name,
          pieceAccess({ pieceSet, piece }),
        ]),
      ),
    [allPieces, pieceSet],
  );
  const accessOf = (piece: PieceMetadataModelSummary): PieceAccess =>
    accessByName.get(piece.name) ?? 'allowed';
  const counts = useMemo(() => {
    if (pieces === undefined) {
      return undefined;
    }
    const values = [...accessByName.values()];
    return {
      all: values.length,
      allowed: values.filter((access) => access === 'allowed').length,
      limited: values.filter((access) => access === 'limited').length,
      blocked: values.filter((access) => access === 'blocked').length,
    };
  }, [pieces, accessByName]);
  const [frozenRows, setFrozenRows] = useState<FrozenRows<
    PieceMetadataModelSummary[]
  > | null>(null);
  const rows = listUtils.freezeRows({
    previous: frozenRows,
    filterKey: `${segment}|${search.trim().toLowerCase()}`,
    source: allPieces,
    computeNames: () =>
      filterPieceNames({
        pieces: allPieces,
        accessByName,
        segment,
        search,
      }),
  });
  if (rows !== frozenRows) {
    setFrozenRows(rows);
  }
  const piecesByName = useMemo(
    () => new Map(allPieces.map((piece) => [piece.name, piece])),
    [allPieces],
  );
  const visiblePieces = useMemo(
    () =>
      rows.names
        .map((name) => piecesByName.get(name))
        .filter((piece) => piece !== undefined),
    [rows, piecesByName],
  );

  const selectedPieces = visiblePieces.filter((piece) =>
    selected.has(piece.name),
  );
  const allSelected =
    visiblePieces.length > 0 && selectedPieces.length === visiblePieces.length;

  const setSearch = (value: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === '') {
          next.delete(SEARCH_PARAM);
        } else {
          next.set(SEARCH_PARAM, value);
        }
        return next;
      },
      { replace: true },
    );

  const applyBulk = (bulk: PendingBulk) => {
    const excluded = pieceSetChanges.excludedRequiredActions({
      pieceSet,
      change: bulk.change,
    });
    if (Object.keys(excluded).length > 0) {
      setPending(bulk);
      return;
    }
    runBulk(bulk.change).catch(() => undefined);
  };

  const runBulk = async (change: PieceSetChange) => {
    const saved = await onChange(change);
    if (saved) {
      setSelected(new Set());
    }
  };

  const showSelected = (scope: ShowScope) =>
    applyBulk({
      reason: 'excludeActions',
      change: showChange({ targets: selectedPieces, scope }),
    });

  const hideSelected = () =>
    applyBulk({
      reason: 'removePieces',
      change: visibilityChange({
        targets: selectedPieces.filter(
          (piece) => accessOf(piece) !== 'blocked',
        ),
        visible: false,
      }),
    });

  const toggleSelected = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });

  const openPiece = (piece: PieceMetadataModelSummary) => {
    if (accessOf(piece) === 'blocked') {
      setPieceToShow(piece);
      return;
    }
    setManagingPiece(piece);
  };

  const body = (() => {
    if (isError && pieces === undefined) {
      return (
        <div className="p-5">
          <AdminFetchErrorState entity={t('pieces')} onRetry={refetch} />
        </div>
      );
    }
    if (isLoading) {
      return <PieceRowsSkeleton />;
    }
    if (visiblePieces.length === 0) {
      return (
        <AdminEmpty
          framed={false}
          icon={<Package />}
          title={
            search.trim() === ''
              ? emptySegmentTitle(segment)
              : t('No piece matches')
          }
          description={
            search.trim() === ''
              ? emptySegmentDescription(segment)
              : t('Try a different search or filter.')
          }
        />
      );
    }
    return (
      <div className="flex flex-col px-1 pb-1">
        <div className="flex min-h-12 flex-wrap items-center gap-3 px-3 py-1.5">
          <Checkbox
            aria-label={t('Select all pieces')}
            checked={
              allSelected
                ? true
                : selectedPieces.length > 0
                ? 'indeterminate'
                : false
            }
            onCheckedChange={() =>
              setSelected(
                allSelected
                  ? new Set()
                  : new Set(visiblePieces.map((piece) => piece.name)),
              )
            }
          />
          <span className="flex-1 text-sm font-medium text-gray-11 tabular-nums">
            {selectedPieces.length > 0
              ? t('{count} selected', { count: selectedPieces.length })
              : t('{count, plural, =1 {1 piece} other {# pieces}}', {
                  count: visiblePieces.length,
                })}
          </span>
          {selectedPieces.length > 0 && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CheckCircle2 />
                    {t('Show')}
                    <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    {...adminControl(AdminControl.PIECE_SETS_INCLUDE_RUN)}
                    onSelect={() => showSelected('everything')}
                  >
                    {t('With all actions and triggers')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    {...adminControl(AdminControl.PIECE_SETS_INCLUDE_RUN)}
                    onSelect={() => showSelected('actions')}
                  >
                    {t('With actions only')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    {...adminControl(AdminControl.PIECE_SETS_INCLUDE_RUN)}
                    onSelect={() => showSelected('triggers')}
                  >
                    {t('With triggers only')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                {...adminControl(AdminControl.PIECE_SETS_EXCLUDE_RUN)}
                variant="outline"
                size="sm"
                disabled={selectedPieces.every(
                  (piece) => accessOf(piece) === 'blocked',
                )}
                onClick={hideSelected}
              >
                <Ban />
                {t('Hide')}
              </Button>
            </div>
          )}
        </div>
        <div
          className="border-t border-gray-6"
          style={{
            height: Math.min(
              visiblePieces.length * ROW_HEIGHT,
              MAX_LIST_HEIGHT,
            ),
          }}
        >
          <VirtualizedScrollArea
            items={visiblePieces}
            estimateSize={() => ROW_HEIGHT}
            getItemKey={(index) => visiblePieces[index].name}
            overscan={6}
            renderItem={(piece) => (
              <PieceRow
                piece={piece}
                pieceSet={pieceSet}
                access={accessOf(piece)}
                selected={selected.has(piece.name)}
                onToggleSelected={() => toggleSelected(piece.name)}
                onOpen={() => openPiece(piece)}
                onChange={onChange}
              />
            )}
          />
        </div>
      </div>
    );
  })();

  return (
    <SettingsPanel
      flush
      title={t('Pieces')}
      description={t(
        'Every piece on the platform, and whether builders on this {term} see it.',
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
          label={t('Filter pieces')}
          value={segment}
          onValueChange={setSegment}
          options={[
            { value: 'all', label: t('All'), count: counts?.all },
            { value: 'allowed', label: t('Shown'), count: counts?.allowed },
            { value: 'limited', label: t('Limited'), count: counts?.limited },
            { value: 'blocked', label: t('Hidden'), count: counts?.blocked },
          ]}
        />
        {segment === 'blocked' && (
          <p className="basis-full text-xs text-gray-11">
            {t('Hidden from the builder. Flows already using it keep running.')}
          </p>
        )}
      </div>

      {body}

      <ConfirmExcludingRequiredActionsDialog
        excludedRequiredActions={
          pending === null
            ? null
            : pieceSetChanges.excludedRequiredActions({
                pieceSet,
                change: pending.change,
              })
        }
        reason={pending?.reason ?? 'removePieces'}
        onConfirm={() => {
          const bulk = pending;
          setPending(null);
          return bulk === null ? undefined : runBulk(bulk.change);
        }}
        onCancel={() => setPending(null)}
      />

      <ConfirmDialog
        open={pieceToShow !== null}
        onOpenChange={(open) => {
          if (!open) setPieceToShow(null);
        }}
        title={t('Show {name}?', { name: pieceToShow?.displayName ?? '' })}
        description={t(
          'To choose its actions and triggers, show {name} on this {term} first.',
          { ...pieceSetTerms.get(), name: pieceToShow?.displayName ?? '' },
        )}
        confirmLabel={t('Show')}
        destructive={false}
        onConfirm={async () => {
          const piece = pieceToShow;
          if (piece === null) {
            return;
          }
          await savedOrThrow(
            onChange(visibilityChange({ targets: [piece], visible: true })),
          );
          setManagingPiece(piece);
        }}
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

function PieceRow({
  piece,
  pieceSet,
  access,
  selected,
  onToggleSelected,
  onOpen,
  onChange,
}: {
  piece: PieceMetadataModelSummary;
  pieceSet: PieceSet;
  access: PieceAccess;
  selected: boolean;
  onToggleSelected: () => void;
  onOpen: () => void;
  onChange: ChangePieceSet;
}) {
  const shown = access !== 'blocked';
  const required = requiredCount({ pieceSet, piece });
  const summary = shown ? componentSummary({ pieceSet, piece }) : t('Hidden');
  return (
    <div className="flex h-14 items-center gap-3 border-b border-gray-6 px-3 last:border-b-0">
      <Checkbox
        aria-label={t('Select {name}', { name: piece.displayName })}
        checked={selected}
        onCheckedChange={onToggleSelected}
      />
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-accent-8"
      >
        <LogoPlate src={piece.logoUrl} alt="" size="xs" border />
        <span className="flex min-w-0 flex-1 flex-col">
          <TextWithTooltip tooltipMessage={piece.displayName}>
            <span
              className={cn(
                'truncate text-sm font-medium',
                shown ? 'text-gray-12' : 'text-gray-11',
              )}
            >
              {piece.displayName}
            </span>
          </TextWithTooltip>
          <span className="flex min-w-0 items-center gap-2 text-xs text-gray-11">
            <span className="truncate font-mono">{piece.name}</span>
            <span className="shrink-0 tabular-nums">v{piece.version}</span>
            <span
              className={cn(
                'shrink-0 md:hidden',
                access === 'limited' && 'text-accent-11',
              )}
            >
              {summary}
            </span>
          </span>
        </span>
      </button>
      {required > 0 && (
        <Badge variant="outline" className="shrink-0">
          {t('requiredCount', { count: required })}
        </Badge>
      )}
      <span
        className={cn(
          'hidden w-32 shrink-0 truncate text-sm tabular-nums md:inline',
          access === 'limited' ? 'text-accent-11' : 'text-gray-11',
        )}
      >
        {summary}
      </span>
      <InstantSwitch
        controlId={AdminControl.PIECE_SETS_PIECE_TOGGLE}
        aria-label={t('Show {name} in the builder', {
          name: piece.displayName,
        })}
        checked={shown}
        confirmBefore={(next) =>
          next
            ? null
            : excludingRequiredActionsConfirm({
                excludedRequiredActions:
                  pieceSetChanges.excludedRequiredActions({
                    pieceSet,
                    change: visibilityChange({
                      targets: [piece],
                      visible: false,
                    }),
                  }),
                reason: 'removePieces',
              })
        }
        onCheckedChange={(next) =>
          savedOrThrow(
            onChange(visibilityChange({ targets: [piece], visible: next })),
          )
        }
      />
      <Button
        {...adminControl(AdminControl.PIECE_SETS_COMPONENTS_OPEN)}
        variant="ghost"
        size="icon-sm"
        aria-label={
          shown
            ? t('Actions and triggers for {name}', { name: piece.displayName })
            : t('Show {name} to choose its actions and triggers', {
                name: piece.displayName,
              })
        }
        onClick={onOpen}
      >
        <ChevronRight className="text-gray-11" />
      </Button>
    </div>
  );
}

function PieceRowsSkeleton() {
  return (
    <div className="flex flex-col px-4 pb-1">
      <div className="flex h-12 items-center gap-3">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-4 w-20" />
      </div>
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className="flex h-14 items-center gap-3 border-t border-gray-6"
        >
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="size-6 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function filterPieceNames({
  pieces,
  accessByName,
  segment,
  search,
}: {
  pieces: PieceMetadataModelSummary[];
  accessByName: Map<string, PieceAccess>;
  segment: Segment;
  search: string;
}): string[] {
  const query = search.trim().toLowerCase();
  return pieces
    .filter(
      (piece) =>
        (segment === 'all' || accessByName.get(piece.name) === segment) &&
        (query === '' ||
          piece.displayName.toLowerCase().includes(query) ||
          piece.name.toLowerCase().includes(query)),
    )
    .map((piece) => piece.name);
}

function visibilityChange({
  targets,
  visible,
}: {
  targets: PieceMetadataModelSummary[];
  visible: boolean;
}): PieceSetChange {
  return {
    type: 'visibility',
    label: targets.length === 1 ? targets[0].displayName : undefined,
    visible: Object.fromEntries(targets.map((piece) => [piece.name, visible])),
  };
}

function showChange({
  targets,
  scope,
}: {
  targets: PieceMetadataModelSummary[];
  scope: ShowScope;
}): PieceSetChange {
  const all: ComponentSelection = { mode: 'all' };
  const none: ComponentSelection = { mode: 'selected', selected: [] };
  const perPiece = (selection: ComponentSelection) =>
    Object.fromEntries(targets.map((piece) => [piece.name, selection]));
  return {
    type: 'patch',
    visible: Object.fromEntries(targets.map((piece) => [piece.name, true])),
    actions: perPiece(scope === 'triggers' ? none : all),
    triggers: perPiece(scope === 'actions' ? none : all),
  };
}

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
    return t('All actions');
  }
  const total = piece.actions + piece.triggers;
  const count =
    (pieceSet.config.selectedActions[piece.name]?.length ?? piece.actions) +
    (pieceSet.config.selectedTriggers[piece.name]?.length ?? piece.triggers);
  return t('{count} of {total} shown', { count, total });
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

function emptySegmentTitle(segment: Segment): string {
  switch (segment) {
    case 'all':
      return t('No pieces yet');
    case 'allowed':
      return t('No piece is shown');
    case 'limited':
      return t('No piece is limited');
    case 'blocked':
      return t('No piece is hidden');
  }
}

function emptySegmentDescription(segment: Segment): string {
  switch (segment) {
    case 'all':
      return t('Install a piece and it shows up here.');
    case 'allowed':
      return t('Show pieces from the Hidden filter.');
    case 'limited':
      return t('Open a shown piece to limit it to some of its actions.');
    case 'blocked':
      return t('Every piece is shown on this {term}.', pieceSetTerms.get());
  }
}

const SEARCH_PARAM = 'displayName';
const ROW_HEIGHT = 56;
const MAX_LIST_HEIGHT = 576;

type PieceAccess = 'allowed' | 'limited' | 'blocked';
type Segment = PieceAccess | 'all';
type ShowScope = 'everything' | 'actions' | 'triggers';
type PendingBulk = { change: PieceSetChange; reason: ExcludingReason };

type PieceSetPiecesTabProps = {
  pieceSet: PieceSet;
  onChange: ChangePieceSet;
};
