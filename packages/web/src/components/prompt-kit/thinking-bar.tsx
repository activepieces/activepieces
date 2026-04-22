import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

import { TextShimmer } from './text-shimmer';

type ThinkingBarProps = {
  className?: string;
  text?: string;
  onStop?: () => void;
  stopLabel?: string;
  onClick?: () => void;
};

export function ThinkingBar({
  className,
  text = 'Thinking',
  onStop,
  stopLabel = 'Answer now',
  onClick,
}: ThinkingBarProps) {
  return (
    <div className={cn('flex w-full items-center justify-between', className)}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-1 text-sm transition-opacity hover:opacity-80"
        >
          <TextShimmer className="font-medium">{text}</TextShimmer>
          <ChevronRight className="text-muted-foreground size-4" />
        </button>
      ) : (
        <TextShimmer className="cursor-default font-medium">{text}</TextShimmer>
      )}
      {onStop ? (
        <button
          onClick={onStop}
          type="button"
          className="text-muted-foreground hover:text-foreground border-muted-foreground/50 hover:border-foreground border-b border-dotted text-sm transition-colors"
        >
          {stopLabel}
        </button>
      ) : null}
    </div>
  );
}
