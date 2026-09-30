import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { useMemo } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
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
    <div className="flex-1 border-t bg-gray-3/30 pb-9 pt-8">
      <PageBand className="flex flex-col gap-6 px-0 lg:px-0">
        <div className="flex flex-col gap-1.5 px-6 lg:px-14">
          <h2 className="text-lg font-semibold leading-7 tracking-tight">
            {t('Your AI gets all of this')}
          </h2>
          <p className="max-w-[560px] text-sm text-gray-11">
            {isLoading
              ? t('Every piece you can use, in every project MCP reaches.')
              : t(
                  '{count} pieces, ready to run in every project MCP reaches.',
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
        <LogoPlate
          key={tile.name}
          src={tile.logoUrl}
          alt={tile.displayName}
          title={tile.displayName}
          border
          className="size-16 rounded-lg p-4"
        />
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
