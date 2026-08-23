import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

import {
  ShowcaseLayout,
  ShowcaseTile,
  ShowcaseTileData,
} from './showcase-tile';

const MAX_TILES = 4;

// A presentational "showcase" card the agent uses to introduce itself / explain what's
// possible (answering "what can you do?", "what is this?") and similar spotlights. Designed
// to be reused for any explainer: a headline plus a grid of up to 4 use-case tiles (each an
// app logo or a Lucide icon; tapping sends the title as a message). Non-blocking —
// nothing resolves back to the tool. Brand accents come from --primary tokens so it
// stays white-label correct.
//
// While the tool input is still streaming (`streaming`), the card renders
// PROGRESSIVELY from the partial input: the headline appears the instant its
// first characters arrive and grows as text streams, and each tile pops in the
// moment it settles — no skeleton wall, the card visibly builds itself. A tile
// counts as settled once its description field has started (which guarantees
// its title is complete, so a tap never sends a half-written title).
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

  // The card renders from raw model tool-input, which can be partial (streaming) or
  // malformed (a validation-errored call). Never assume tiles is an array — a bad shape
  // must degrade to "render nothing", never crash the page. Hard-cap at 4 tiles.
  const tiles = (Array.isArray(content?.tiles) ? content.tiles : []).slice(
    0,
    MAX_TILES,
  );
  const hasHeadline = content.headline.trim().length > 0;
  if (!streaming && tiles.length === 0) {
    return null;
  }

  // "list" (the default) stacks the tiles as full-width rows with larger type.
  // "grid" is the opt-in compact 2-up variant.
  const isList = content.layout !== 'grid';

  return (
    <motion.div
      // overflow-hidden: list rows bleed edge-to-edge, so their hover tint and
      // dividers must clip against the card's rounded corners, never poke out.
      className={cn(
        'overflow-hidden rounded-2xl border bg-background shadow-sm dark:bg-neutral-900',
        // List mode: zero card padding — rows carry their own, so the first and
        // last rows' hover tint reaches the card's very edges (clipped by the
        // rounded corners), with no dead strip above or below.
        !isList && 'p-4 sm:p-5',
      )}
      // Entrance plays ONLY while the card is streaming in. A mount with
      // streaming=false is a re-render of an already-seen card (history load,
      // end-of-stream message reconciliation) — animating there reads as a
      // "look, I rendered again!" flicker.
      initial={
        animate && streaming ? { opacity: 0, y: 16, scale: 0.98 } : false
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* The list layout carries NO headline/subhead — the agent's own chat
          line right above the card is the introduction, and repeating it in
          the card was noise. Grid (standalone spotlight) keeps its header. */}
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
          // Full-bleed rows on hairline dividers spanning the whole card —
          // quieter and cleaner than boxed gaps.
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
          // A single quiet ghost row holding the space; the first real tile
          // replaces it the moment it lands.
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
