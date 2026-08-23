import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { cn } from '@/lib/utils';

import { OptionIcon } from '../question-inputs/question-icon';

export function ShowcaseTile({
  tile,
  index,
  animate,
  layout = 'grid',
  streaming = false,
  onSendPrompt,
}: {
  tile: ShowcaseTileData;
  index: number;
  animate: boolean;
  layout?: ShowcaseLayout;
  // While the tool input is still streaming, a tile's `app`/`icon` fields may
  // simply not have arrived yet — show a quiet pulse chip instead of flashing
  // the generic fallback icon and then swapping it for the real logo.
  streaming?: boolean;
  onSendPrompt?: (text: string) => void;
}) {
  if (tile == null || typeof tile !== 'object') {
    return null;
  }
  // The title IS the message sent verbatim on tap — what you see is exactly what
  // gets sent, so the example and the chat stay perfectly consistent.
  const clickable = Boolean(tile.title) && Boolean(onSendPrompt);
  const isList = layout === 'list';
  // List rows are editorial: a naked colored glyph beside strong type. Grid
  // tiles keep the soft duotone chip.

  const className = cn(
    'flex w-full items-start text-left',
    // Elegant list rows: full-bleed to the card edges (the card clips them at
    // its rounded corners), no box, no elevation — typography and the hairline
    // dividers do the work; hover is a whisper of tint across the whole row.
    isList
      ? 'items-center gap-4 px-4 py-4 sm:px-5'
      : 'gap-3 rounded-xl border bg-background p-3',
    clickable &&
      cn(
        'group cursor-pointer transition-colors duration-150',
        isList
          ? 'hover:bg-muted/50'
          : 'hover:border-primary/35 hover:bg-primary/5',
      ),
  );

  const iconPending = streaming && !tile.app && !tile.icon;

  const body = (
    <>
      {iconPending ? (
        <span
          className={cn(
            'shrink-0 animate-pulse bg-muted',
            isList ? 'size-8 rounded-md' : 'size-10 rounded-lg',
          )}
        />
      ) : (
        <OptionIcon
          piece={tile.app}
          icon={tile.icon ?? 'sparkles'}
          variant={isList ? 'list' : 'grid'}
        />
      )}
      <div className="min-w-0 flex-1">
        <TextWithTooltip tooltipMessage={tile.title}>
          <p
            className={cn(
              'truncate text-foreground',
              // Strong, bold messaging: the title is the row — big brand serif,
              // the description is the quiet footnote under it.
              isList
                ? 'font-sentient text-lg font-bold leading-snug'
                : 'text-sm font-medium',
            )}
          >
            {tile.title}
          </p>
        </TextWithTooltip>
        <p
          className={cn(
            'mt-0.5 leading-snug text-muted-foreground',
            isList ? 'text-sm line-clamp-1' : 'text-xs line-clamp-2',
          )}
        >
          {tile.description}
        </p>
      </div>
      {clickable && isList && (
        // "press to send" affordance: slides in from the left on hover.
        <ArrowRight
          aria-hidden
          className="size-4 shrink-0 translate-x-1 text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        />
      )}
    </>
  );

  const motionProps = {
    // Pop-in only while the card is streaming (each tile arriving live). A
    // mount with streaming=false is a re-render of a finished card — replaying
    // the stagger there is the flicker.
    initial: animate && streaming ? { opacity: 0, y: 8 } : false,
    animate: { opacity: 1, y: 0 },
    ...(clickable ? { whileTap: { scale: 0.995 } } : {}),
    transition: {
      duration: 0.25,
      delay: index * 0.05,
      ease: 'easeOut' as const,
    },
  };

  if (clickable && onSendPrompt) {
    return (
      <motion.button
        type="button"
        onClick={() => onSendPrompt(tile.title)}
        className={className}
        {...motionProps}
      >
        {body}
      </motion.button>
    );
  }

  return (
    <motion.div className={className} {...motionProps}>
      {body}
    </motion.div>
  );
}

// Soft duotone chips — a calm pastel field with a deep same-hue glyph (the
// Linear/iOS-tag look): flat, quiet, modern. No gradients, shadows or rings.
// Applies only to non-piece tiles; app tiles keep their real logo.

// Text-only tones for the bare (list) glyphs — no chip behind them.

export type ShowcaseLayout = 'grid' | 'list';

export type ShowcaseTileData = {
  title: string;
  description: string;
  app?: string;
  icon?: string;
};
