import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

import { TextShimmer } from '@/components/ui/text-shimmer';
import { cn } from '@/lib/utils';

export function ChatLine({
  icon,
  children,
  detail,
  logos,
  live,
  open,
  onToggle,
  onClick,
  tone = 'muted',
  title,
  className,
}: ChatLineProps) {
  const interactive = Boolean(onToggle ?? onClick);
  const content = (
    <>
      {icon && (
        <span className="flex size-3.5 shrink-0 items-center justify-center">
          {icon}
        </span>
      )}
      {live ? (
        <TextShimmer className="min-w-0 truncate text-sm">
          {children}
        </TextShimmer>
      ) : (
        <span
          className={cn(
            'min-w-0 truncate text-sm transition-colors',
            TONE_CLASS[tone],
            interactive && tone === 'muted' && 'group-hover/line:text-gray-12',
          )}
        >
          {children}
        </span>
      )}
      {logos && <span className="flex shrink-0 items-center">{logos}</span>}
      {detail && (
        <span className="min-w-0 shrink truncate text-sm text-gray-11">
          · {detail}
        </span>
      )}
      {onToggle && (
        <ChevronRight
          aria-hidden
          className={cn(
            'size-3 shrink-0 text-gray-9 transition-transform',
            open && 'rotate-90',
          )}
        />
      )}
    </>
  );
  const lineClass = cn('flex min-w-0 items-center gap-2 py-1', className);

  if (!interactive) {
    return (
      <div title={title} className={lineClass}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      title={title}
      aria-expanded={onToggle ? open : undefined}
      onClick={onToggle ?? onClick}
      className={cn(
        lineClass,
        'group/line w-fit max-w-full cursor-pointer rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-gray-8',
      )}
    >
      {content}
    </button>
  );
}

const TONE_CLASS: Record<ChatLineTone, string> = {
  muted: 'text-gray-11',
  danger: 'text-danger-11',
  accent: 'text-accent-11',
};

type ChatLineTone = 'muted' | 'danger' | 'accent';

type ChatLineProps = {
  icon?: ReactNode;
  children: ReactNode;
  detail?: ReactNode;
  logos?: ReactNode;
  live?: boolean;
  open?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  tone?: ChatLineTone;
  title?: string;
  className?: string;
};
