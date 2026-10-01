import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  isPieceVisible,
  PieceSelection,
  PieceSelectionMode,
  PieceSet,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Ban, CheckCircle2, Package } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Panel } from '@/components/custom/panel';
import { SearchInput } from '@/components/custom/search-input';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pieceSetMutations } from '@/features/piece-sets';
import { PieceIcon, piecesHooks } from '@/features/pieces';

import { PieceComponentVisibilitySheet } from '../piece-component-visibility-sheet';

export const PieceSetPiecesTab = ({ pieceSet }: PieceSetPiecesTabProps) => {
  const { pieces, isLoading, isError, refetch } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<PieceAccess>('allowed');
  const [selected, setSelected] = useState<string[]>([]);
  const [managingPiece, setManagingPiece] =
    useState<PieceMetadataModelSummary | null>(null);

  const allPieces = useMemo(() => pieces ?? [], [pieces]);
  const accessOf = (piece: PieceMetadataModelSummary): PieceAccess =>
    pieceAccess({ pieceSet, piece });
  const counts = useMemo(
    () => ({
      allowed: allPieces.filter(
        (piece) => pieceAccess({ pieceSet, piece }) === 'allowed',
      ).length,
      limited: allPieces.filter(
        (piece) => pieceAccess({ pieceSet, piece }) === 'limited',
      ).length,
      blocked: allPieces.filter(
        (piece) => pieceAccess({ pieceSet, piece }) === 'blocked',
      ).length,
    }),
    [allPieces, pieceSet],
  );
  const visiblePieces = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allPieces.filter(
      (piece) =>
        pieceAccess({ pieceSet, piece }) === segment &&
        (query === '' || piece.displayName.toLowerCase().includes(query)),
    );
  }, [allPieces, pieceSet, search, segment]);

  const visibleNames = visiblePieces.map((piece) => piece.name);
  const selectedVisible = selected.filter((name) =>
    visibleNames.includes(name),
  );
  const allSelected =
    visibleNames.length > 0 && selectedVisible.length === visibleNames.length;

  const setVisibility = ({
    names,
    visible,
  }: {
    names: string[];
    visible: boolean;
  }) =>
    updateSet(
      {
        id: pieceSet.id,
        request: {
          pieces: names.reduce(
            (acc, name) => setPieceVisible({ pieces: acc, name, visible }),
            pieceSet.config.pieces,
          ),
        },
      },
      { onSuccess: () => setSelected([]) },
    );

  const toggleSelected = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  return (
    <Panel
      flush
      title={t('Pieces')}
      description={t(
        'Every piece on the platform, and what this set allows of it.',
      )}
    >
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="w-full max-w-60">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('Search pieces')}
          />
        </div>
        <Tabs
          value={segment}
          onValueChange={(value) => {
            setSegment(toAccess(value));
            setSelected([]);
          }}
        >
          <TabsList>
            {ACCESS_SEGMENTS.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {t(option.label)}
                <span className="text-gray-11 tabular-nums">
                  {counts[option.value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="p-4">
          <SkeletonList numberOfItems={6} className="h-10 rounded-xl" />
        </div>
      ) : isError ? (
        <DataFetchErrorState entity={t('pieces')} onRetry={refetch} />
      ) : visiblePieces.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Package />
            </EmptyMedia>
            <EmptyTitle>{t('No piece matches')}</EmptyTitle>
            <EmptyDescription>
              {t('Try a different search or tab.')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
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
                  variant="outline"
                  size="sm"
                  disabled={isPending || segment !== 'blocked'}
                  onClick={() =>
                    setVisibility({ names: selectedVisible, visible: true })
                  }
                >
                  <CheckCircle2 />
                  {t('Allow')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending || segment === 'blocked'}
                  onClick={() =>
                    setVisibility({ names: selectedVisible, visible: false })
                  }
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
                key={piece.name}
                className="flex h-12 items-center gap-3 border-t border-gray-6 px-3"
              >
                <Checkbox
                  aria-label={t('Select {name}', { name: piece.displayName })}
                  checked={selected.includes(piece.name)}
                  onCheckedChange={() => toggleSelected(piece.name)}
                />
                <PieceIcon
                  size="xs"
                  border
                  displayName={piece.displayName}
                  logoUrl={piece.logoUrl}
                  showTooltip={false}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-12">
                  {piece.displayName}
                </span>
                {allowed && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-gray-11 tabular-nums"
                    onClick={() => setManagingPiece(piece)}
                  >
                    {componentSummary({ pieceSet, piece })}
                  </Button>
                )}
                <Switch
                  aria-label={t('Allow {name}', { name: piece.displayName })}
                  checked={allowed}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    setVisibility({ names: [piece.name], visible: checked })
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      {managingPiece && (
        <PieceComponentVisibilitySheet
          pieceName={managingPiece.name}
          pieceDisplayName={managingPiece.displayName}
          open={true}
          onOpenChange={(open) => {
            if (!open) setManagingPiece(null);
          }}
          pieceSet={pieceSet}
        />
      )}
    </Panel>
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
    return t('All actions');
  }
  const total = piece.actions + piece.triggers;
  const count =
    (pieceSet.config.selectedActions[piece.name]?.length ?? piece.actions) +
    (pieceSet.config.selectedTriggers[piece.name]?.length ?? piece.triggers);
  return t('{count} of {total} actions', { count, total });
}

function setPieceVisible({
  pieces,
  name,
  visible,
}: {
  pieces: PieceSelection;
  name: string;
  visible: boolean;
}): PieceSelection {
  const isException = pieces.exceptions.includes(name);
  const shouldBeException =
    pieces.mode === PieceSelectionMode.INCLUDE_ALL ? !visible : visible;
  if (isException === shouldBeException) {
    return pieces;
  }
  return {
    mode: pieces.mode,
    exceptions: shouldBeException
      ? [...pieces.exceptions, name]
      : pieces.exceptions.filter((n) => n !== name),
  };
}

function toAccess(value: string): PieceAccess {
  return (
    ACCESS_SEGMENTS.find((option) => option.value === value)?.value ?? 'allowed'
  );
}

const ACCESS_SEGMENTS: { value: PieceAccess; label: string }[] = [
  { value: 'allowed', label: 'Allowed' },
  { value: 'limited', label: 'Limited' },
  { value: 'blocked', label: 'Blocked' },
];

type PieceAccess = 'allowed' | 'limited' | 'blocked';

type PieceSetPiecesTabProps = {
  pieceSet: PieceSet;
};
