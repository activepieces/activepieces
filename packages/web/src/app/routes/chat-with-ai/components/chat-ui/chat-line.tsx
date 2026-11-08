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
  className,
}: ChatLineProps) {
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
        <span className="min-w-0 truncate text-sm text-gray-11">
          {children}
        </span>
      )}
      {logos && <span className="flex shrink-0 items-center">{logos}</span>}
      {detail && (
        <span className="shrink-0 text-sm text-gray-11">· {detail}</span>
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

  if (!onToggle) {
    return <div className={lineClass}>{content}</div>;
  }
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      className={cn(
        lineClass,
        'w-fit max-w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-gray-8',
      )}
    >
      {content}
    </button>
  );
}

type ChatLineProps = {
  icon?: ReactNode;
  children: ReactNode;
  detail?: ReactNode;
  logos?: ReactNode;
  live?: boolean;
  open?: boolean;
  onToggle?: () => void;
  className?: string;
};
