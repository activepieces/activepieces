import { motion, useReducedMotion } from 'motion/react';

import { ShowcaseTile, ShowcaseTileData } from './showcase-tile';

const MAX_TILES = 4;

// A presentational "showcase" card the agent uses to introduce itself / explain what's
// possible (answering "what can you do?", "what is this?") and similar spotlights. Designed
// to be reused for any explainer: a headline plus a grid of up to 4 use-case tiles (each an
// app logo or a Lucide icon, with a clickable starter prompt). Non-blocking — clicking a tile
// sends a fresh message via onSendPrompt; nothing resolves back to the tool. Brand accents
// come from --primary tokens so it stays white-label correct.
export function ShowcaseCard({
  content,
  onSendPrompt,
}: {
  content: ShowcaseContent;
  onSendPrompt?: (text: string) => void;
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
  if (tiles.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="rounded-2xl border bg-background p-4 shadow-sm sm:p-5 dark:bg-neutral-900"
      initial={animate ? { opacity: 0, y: 16, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <h3 className="text-base font-semibold leading-snug text-foreground">
        {content.headline}
      </h3>
      {content.subhead && (
        <p className="mt-1 text-sm text-muted-foreground">{content.subhead}</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {tiles.map((tile, i) => (
          <ShowcaseTile
            key={i}
            tile={tile}
            index={i}
            animate={animate}
            onSendPrompt={onSendPrompt}
          />
        ))}
      </div>
    </motion.div>
  );
}

export type ShowcaseContent = {
  headline: string;
  subhead?: string;
  tiles: ShowcaseTileData[];
};
