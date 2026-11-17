import React from 'react';

import { Status, statusColors } from '@/lib/status-colors';
import { cn } from '@/lib/utils';

const StatusBadge = React.memo(
  ({ status, icon: Icon, text }: StatusBadgeProps) => {
    const colors = statusColors.of(status);
    return (
      <span
        data-slot="status-badge"
        className={cn(
          'inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-1.5 text-xs font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3',
          colors.background,
          colors.text,
          colors.border,
        )}
      >
        {Icon && <Icon />}
        <span>{text}</span>
      </span>
    );
  },
);

StatusBadge.displayName = 'StatusBadge';
export { StatusBadge };

type StatusBadgeProps = {
  status: Status;
  icon?: React.ElementType;
  text: string;
};
