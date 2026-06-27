import { Search } from 'lucide-react';
import { memo, useMemo } from 'react';

import { TextShimmer } from '@/components/ui/text-shimmer';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { cn } from '@/lib/utils';

const MAX_LOGOS = 24;
const MS_PER_LOGO = 200;

export const SearchAppsAnimation = memo(function SearchAppsAnimation({
  label,
}: {
  label: string;
}) {
  const { pieces } = piecesHooks.usePieces({});

  const pool = useMemo(() => {
    const logos = (pieces ?? [])
      .filter((piece) => !!piece.logoUrl)
      .map((piece) => ({ name: piece.name, logoUrl: piece.logoUrl! }));
    for (let i = logos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [logos[i], logos[j]] = [logos[j], logos[i]];
    }
    return logos.slice(0, MAX_LOGOS);
  }, [pieces]);

  const rightPool = useMemo(() => {
    const mid = Math.floor(pool.length / 2);
    return [...pool.slice(mid), ...pool.slice(0, mid)];
  }, [pool]);

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-1.5">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <TextShimmer as="span" className="text-sm" duration={2}>
        {label}
      </TextShimmer>
      {pool.length > 0 && (
        <div className="flex items-center gap-0.5">
          <Slot pool={pool} direction="down" />
          <Slot pool={rightPool} direction="up" />
        </div>
      )}
    </div>
  );
});

function Slot({
  pool,
  direction,
}: {
  pool: Array<{ name: string; logoUrl: string }>;
  direction: 'up' | 'down';
}) {
  const strip = [...pool, ...pool];
  return (
    <div className="size-5 overflow-hidden rounded">
      <div
        className={cn(
          'flex flex-col motion-reduce:animate-none',
          direction === 'up'
            ? 'animate-[slot-spin_linear_infinite]'
            : 'animate-[slot-spin_linear_infinite_reverse]',
        )}
        style={{ animationDuration: `${pool.length * MS_PER_LOGO}ms` }}
      >
        {strip.map((piece, index) => (
          <img
            key={`${piece.name}-${index}`}
            src={piece.logoUrl}
            alt=""
            className="size-5 shrink-0 object-contain p-0.5"
          />
        ))}
      </div>
    </div>
  );
}
