import { ThumbsDown, ThumbsUp, X } from 'lucide-react';

import { cn } from '@/lib/utils';

type FeedbackBarProps = {
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  onHelpful?: () => void;
  onNotHelpful?: () => void;
  onClose?: () => void;
};

export function FeedbackBar({
  className,
  title,
  icon,
  onHelpful,
  onNotHelpful,
  onClose,
}: FeedbackBarProps) {
  return (
    <div
      className={cn(
        'bg-background border-border inline-flex rounded-[12px] border text-sm',
        className,
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-1 items-center justify-start gap-4 py-3 pl-4">
          {icon}
          <span className="text-foreground font-medium">{title}</span>
        </div>
        <div className="flex items-center justify-center gap-0.5 px-3 py-0">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md transition-colors"
            aria-label="Helpful"
            onClick={onHelpful}
          >
            <ThumbsUp className="size-4" />
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md transition-colors"
            aria-label="Not helpful"
            onClick={onNotHelpful}
          >
            <ThumbsDown className="size-4" />
          </button>
        </div>
        <div className="border-border flex items-center justify-center border-l">
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground flex items-center justify-center rounded-md p-3"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
