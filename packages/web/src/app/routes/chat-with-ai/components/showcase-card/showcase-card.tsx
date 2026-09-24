import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

import {
  ShowcaseLayout,
  ShowcaseTile,
  ShowcaseTileData,
} from './showcase-tile';

const MAX_TILES = 4;

export function ShowcaseCard({
  content,
  onSendPrompt,
  streaming = false,
}: {
  content: ShowcaseContent;
  onSendPrompt?: (text: string) => void;
  streaming?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  const tiles = (Array.isArray(content?.tiles) ? content.tiles : []).slice(
    0,
    MAX_TILES,
  );
  const hasHeadline = content.headline.trim().length > 0;
  if (!streaming && tiles.length === 0) {
    return null;
  }

  const isList = content.layout !== 'grid';

  return (
    <motion.div
      className={cn(
        'overflow-hidden rounded-2xl border bg-background shadow-sm dark:bg-neutral-900',
        !isList && 'p-4 sm:p-5',
      )}
      initial={
        animate && streaming ? { opacity: 0, y: 16, scale: 0.98 } : false
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {!isList && (
        <>
          <h3 className="text-base font-semibold leading-snug text-foreground">
            {content.headline}
            {streaming && !hasHeadline && (
              <span className="inline-block h-4 w-32 animate-pulse rounded bg-muted align-middle" />
            )}
          </h3>
          {content.subhead && (
            <p className="mt-1 text-sm text-muted-foreground">
              {content.subhead}
            </p>
          )}
        </>
      )}

      <div
        className={cn(
          'grid grid-cols-1',
          isList ? 'divide-y divide-border/60' : 'mt-4 gap-2.5 sm:grid-cols-2',
        )}
      >
        {tiles.map((tile, i) => (
          <ShowcaseTile
            key={i}
            tile={tile}
            index={i}
            animate={animate}
            layout={isList ? 'list' : 'grid'}
            streaming={streaming}
            onSendPrompt={onSendPrompt}
          />
        ))}
        {streaming && tiles.length === 0 && (
          <div
            className={cn(
              'flex w-full animate-pulse items-center',
              isList
                ? 'gap-4 px-4 py-4 sm:px-5'
                : 'gap-3 rounded-xl border bg-background p-3',
            )}
          >
            <div
              className={cn(
                'shrink-0 bg-muted',
                isList ? 'size-8 rounded-md' : 'size-10 rounded-lg',
              )}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-3 w-3/5 rounded bg-muted" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export type ShowcaseContent = {
  headline: string;
  subhead?: string;
  layout?: ShowcaseLayout;
  tiles: ShowcaseTileData[];
};
