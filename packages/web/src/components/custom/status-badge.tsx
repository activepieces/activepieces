import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Status, statusColors } from '@/lib/status-colors';
import { cn } from '@/lib/utils';

const StatusBadge = React.memo(
  ({ status, icon: Icon, text }: StatusBadgeProps) => {
    const colors = statusColors.of(status);
    return (
      <Badge
        variant={null}
        className={cn(colors.background, colors.text, colors.border)}
      >
        <Icon className="size-4" />
        <span>{text}</span>
      </Badge>
    );
  },
);

StatusBadge.displayName = 'StatusBadge';
export { StatusBadge };

type StatusBadgeProps = {
  status: Status;
  icon: React.ElementType;
  text: string;
};
