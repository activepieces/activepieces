import { motion } from 'motion/react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { cn } from '@/lib/utils';

import { OptionIcon } from '../question-inputs/question-icon';

export function ShowcaseTile({
  tile,
  index,
  animate,
  onSendPrompt,
}: {
  tile: ShowcaseTileData;
  index: number;
  animate: boolean;
  onSendPrompt?: (text: string) => void;
}) {
  if (tile == null || typeof tile !== 'object') {
    return null;
  }
  const starter = tile.starter;
  const clickable = Boolean(starter) && Boolean(onSendPrompt);

  const className = cn(
    'flex w-full items-start gap-3 rounded-xl border bg-background p-3 text-left',
    clickable &&
      'group cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/5',
  );

  const body = (
    <>
      <OptionIcon piece={tile.app} icon={tile.icon} variant="grid" />
      <div className="min-w-0 flex-1">
        <TextWithTooltip tooltipMessage={tile.title}>
          <p className="truncate text-sm font-medium text-foreground">
            {tile.title}
          </p>
        </TextWithTooltip>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
          {tile.description}
        </p>
      </div>
    </>
  );

  const motionProps = {
    initial: animate ? { opacity: 0, y: 8 } : false,
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.25,
      delay: index * 0.05,
      ease: 'easeOut' as const,
    },
  };

  if (starter && onSendPrompt) {
    return (
      <motion.button
        type="button"
        onClick={() => onSendPrompt(starter)}
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

export type ShowcaseTileData = {
  title: string;
  description: string;
  app?: string;
  icon?: string;
  starter?: string;
};
