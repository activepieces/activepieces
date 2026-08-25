import { t } from 'i18next';
import { Repeat } from 'lucide-react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

import {
  DoodleArrow,
  UseCaseDoodle,
  useCaseCardArt,
} from './use-case-card-art';

export function UseCaseCard({
  card,
  delay,
  onSelect,
  className,
}: UseCaseCardProps) {
  const theme = useCaseCardArt.resolveTheme(card.imageId);
  const interactive = !isNil(onSelect);

  return (
    <motion.button
      type="button"
      disabled={!interactive}
      aria-hidden={!interactive}
      tabIndex={interactive ? undefined : -1}
      className={cn(
        'group relative flex min-h-[148px] flex-col justify-between rounded-2xl p-4 text-left ring-1 transition-shadow duration-300',
        interactive ? 'cursor-pointer' : 'cursor-default',
        useCaseCardArt.CARD_SURFACE,
        theme.ring,
        className,
      )}
      onClick={interactive ? () => onSelect(card.prompt) : undefined}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={interactive ? { scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 26, delay }}
    >
      <div className="flex items-start justify-between">
        <UseCaseDoodle
          id={card.imageId}
          delayMs={Math.round(delay * 1000) + 150}
          className={cn('size-12', theme.ink)}
        />
        {card.kind === 'routine' && (
          <Repeat
            className="size-3.5 text-muted-foreground/60"
            aria-label={t('Runs on autopilot')}
          />
        )}
      </div>
      <h3 className="mt-3 pr-7 font-sentient text-[17px] font-medium leading-snug text-foreground">
        {card.title}
      </h3>
      {interactive && (
        <DoodleArrow
          className={cn(
            'absolute bottom-4 right-4 size-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 motion-safe:translate-x-1.5',
            theme.ink,
          )}
        />
      )}
    </motion.button>
  );
}

function isNil<T>(value: T | undefined | null): value is undefined | null {
  return value === undefined || value === null;
}

export type ResolvedUseCase = {
  key: string;
  imageId: string;
  title: string;
  prompt: string;
  kind?: 'mission' | 'routine';
};

type UseCaseCardProps = {
  className?: string;
  card: ResolvedUseCase;
  delay: number;
  onSelect?: (prompt: string) => void;
};
