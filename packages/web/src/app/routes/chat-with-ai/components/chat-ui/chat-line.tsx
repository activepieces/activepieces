import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
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
  wrap = false,
  className,
}: ChatLineProps) {
  const interactive = Boolean(onToggle ?? onClick);
  const content = (
    <>
      {icon && (
        <span
          className={cn(
            'flex size-3.5 shrink-0 items-center justify-center',
            wrap && 'mt-0.75',
          )}
        >
          {icon}
        </span>
      )}
      {live ? (
        <TextShimmer className="min-w-0 truncate text-sm font-normal motion-reduce:animate-none">
          {children}
        </TextShimmer>
      ) : wrap ? (
        <span
          className={cn(
            'min-w-0 text-sm break-words transition-colors',
            TONE_CLASS[tone],
            interactive && tone === 'muted' && 'group-hover/line:text-gray-12',
          )}
        >
          {children}
        </span>
      ) : (
        <TruncatedText
          text={children}
          className={cn(
            'min-w-0 truncate text-sm transition-colors',
            TONE_CLASS[tone],
            interactive && tone === 'muted' && 'group-hover/line:text-gray-12',
          )}
        />
      )}
      {logos && <span className="flex shrink-0 items-center">{logos}</span>}
      {detail &&
        (typeof detail === 'string' ? (
          <TextWithTooltip tooltipMessage={detail}>
            <span className="min-w-0 shrink-[9999] truncate text-sm text-gray-11">
              · {detail}
            </span>
          </TextWithTooltip>
        ) : (
          <span className="min-w-0 shrink-[9999] truncate text-sm text-gray-11">
            · {detail}
          </span>
        ))}
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
  const lineClass = cn(
    'flex min-w-0 gap-2 py-1',
    wrap ? 'items-start' : 'items-center',
    className,
  );

  if (!interactive) {
    return <div className={lineClass}>{content}</div>;
  }
  return (
    <button
      type="button"
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

function TruncatedText({
  text,
  className,
}: {
  text: ReactNode;
  className: string;
}) {
  if (typeof text !== 'string') {
    return <span className={className}>{text}</span>;
  }
  return (
    <TextWithTooltip tooltipMessage={text}>
      <span className={className}>{text}</span>
    </TextWithTooltip>
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
  wrap?: boolean;
  className?: string;
};
