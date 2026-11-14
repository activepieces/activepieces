import { ReactNode } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Status, statusColors } from '@/lib/status-colors';
import { cn } from '@/lib/utils';

export function StatusDot({
  status,
  pulse = false,
  className,
  children,
}: StatusDotProps) {
  return (
    <span
      data-slot="status-dot"
      className={cn(
        'inline-flex min-w-0 items-center gap-2 text-sm text-gray-12',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-2 shrink-0 rounded-full',
          statusColors.of(status).dot,
          pulse && 'animate-pulse',
        )}
      />
      {typeof children === 'string' ? (
        <TextWithTooltip tooltipMessage={children}>
          <span className="truncate">{children}</span>
        </TextWithTooltip>
      ) : (
        children !== undefined && <span className="truncate">{children}</span>
      )}
    </span>
  );
}

type StatusDotProps = {
  status: Status;
  pulse?: boolean;
  className?: string;
  children?: ReactNode;
};
