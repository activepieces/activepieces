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
  streaming?: boolean;
  onSendPrompt?: (text: string) => void;
}) {
  if (tile == null || typeof tile !== 'object') {
    return null;
  }
  const clickable = Boolean(tile.title) && Boolean(onSendPrompt);
  const isList = layout === 'list';

  const className = cn(
    'flex w-full items-start text-left',
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
        <ArrowRight
          aria-hidden
          className="size-4 shrink-0 translate-x-1 text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        />
      )}
    </>
  );

  const motionProps = {
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

export type ShowcaseLayout = 'grid' | 'list';

export type ShowcaseTileData = {
  title: string;
  description: string;
  app?: string;
  icon?: string;
};
