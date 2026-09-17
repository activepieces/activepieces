import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { useMemo } from 'react';

import ImageWithFallback from '@/components/custom/image-with-fallback';
import { Skeleton } from '@/components/ui/skeleton';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { pieceSearchUtils } from '@/features/pieces/utils/piece-search-utils';
import { cn } from '@/lib/utils';

import { PageBand } from './page-band';

export function PiecesShowcase() {
  const { pieces, isLoading } = piecesHooks.usePieces({
    skipProjectFilter: true,
  });
  const tiles = useMemo(() => popularFirst(pieces ?? []), [pieces]);

  if (!isLoading && tiles.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 border-t bg-muted/30 pb-9 pt-8">
      <PageBand className="flex flex-col gap-6 px-0 lg:px-0">
        <div className="flex flex-col gap-1.5 px-6 lg:px-14">
          <h2 className="text-xl font-bold leading-7 tracking-tight">
            {t('Your AI gets all of this')}
          </h2>
          <p className="max-w-[560px] text-sm text-muted-foreground">
            {isLoading
              ? t('Every piece you can use, plus every flow you’ve built.')
              : t(
                  '{count} pieces, plus every flow you’ve built — ready to run.',
                  { count: tiles.length },
                )}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 overflow-hidden pl-6 [mask-image:linear-gradient(to_right,#000_88%,transparent)] lg:pl-14">
          {isLoading ? (
            <>
              <TileRowSkeleton />
              <TileRowSkeleton className="pl-8" />
            </>
          ) : (
            <>
              <TileRow tiles={tiles.filter((_, index) => index % 2 === 0)} />
              <TileRow
                tiles={tiles.filter((_, index) => index % 2 === 1)}
                className="pl-8"
              />
            </>
          )}
        </div>
      </PageBand>
    </div>
  );
}

function popularFirst(
  pieces: PieceMetadataModelSummary[],
): PieceMetadataModelSummary[] {
  const rank = (piece: PieceMetadataModelSummary) => {
    const index = pieceSearchUtils.POPULAR_PIECES_NAMES.indexOf(piece.name);
    return index === -1 ? pieceSearchUtils.POPULAR_PIECES_NAMES.length : index;
  };
  return [...pieces].sort((a, b) => rank(a) - rank(b));
}

function TileRow({
  tiles,
  className = '',
}: {
  tiles: PieceMetadataModelSummary[];
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2.5', className)}>
      {tiles.map((tile) => (
        <span
          key={tile.name}
          title={tile.displayName}
          className="flex size-16 shrink-0 items-center justify-center rounded-lg border bg-background"
        >
          <ImageWithFallback
            src={tile.logoUrl}
            alt={tile.displayName}
            className="size-8"
          />
        </span>
      ))}
    </div>
  );
}

function TileRowSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex gap-2.5', className)}>
      {Array.from({ length: SKELETON_TILE_COUNT }).map((_, index) => (
        <Skeleton key={index} className="size-16 shrink-0 rounded-lg" />
      ))}
    </div>
  );
}

const SKELETON_TILE_COUNT = 24;
