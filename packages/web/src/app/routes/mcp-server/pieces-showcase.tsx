import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { useMemo } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { PageSection } from '@/components/custom/page';
import { Skeleton } from '@/components/ui/skeleton';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { pieceSearchUtils } from '@/features/pieces/utils/piece-search-utils';
import { cn } from '@/lib/utils';

export function PiecesShowcase() {
  const { pieces, isLoading } = piecesHooks.usePieces({
    skipProjectFilter: true,
  });
  const tiles = useMemo(() => popularFirst(pieces ?? []), [pieces]);

  if (!isLoading && tiles.length === 0) {
    return null;
  }

  return (
    <PageSection
      title={t('Your AI gets all of this')}
      description={
        isLoading
          ? t('Every piece you can use, in every project MCP reaches.')
          : t('{count} pieces, ready to run in every project MCP reaches.', {
              count: tiles.length,
            })
      }
    >
      <div className="flex flex-col gap-2 overflow-hidden [mask-image:linear-gradient(to_right,#000_88%,transparent)]">
        {isLoading ? (
          <>
            <TileRowSkeleton />
            <TileRowSkeleton className="pl-6" />
          </>
        ) : (
          <>
            <TileRow tiles={tiles.filter((_, index) => index % 2 === 0)} />
            <TileRow
              tiles={tiles.filter((_, index) => index % 2 === 1)}
              className="pl-6"
            />
          </>
        )}
      </div>
    </PageSection>
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
    <div className={cn('flex gap-2', className)}>
      {tiles.map((tile) => (
        <LogoPlate
          key={tile.name}
          src={tile.logoUrl}
          alt={tile.displayName}
          title={tile.displayName}
          border
          className="size-12 shrink-0 rounded-xl p-3"
        />
      ))}
    </div>
  );
}

function TileRowSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex gap-2', className)}>
      {Array.from({ length: SKELETON_TILE_COUNT }).map((_, index) => (
        <Skeleton key={index} className="size-12 shrink-0 rounded-xl" />
      ))}
    </div>
  );
}

const SKELETON_TILE_COUNT = 24;
