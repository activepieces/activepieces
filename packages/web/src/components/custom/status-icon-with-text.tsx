import React from 'react';

import { Badge } from '@/components/ui/badge';

const variantBadgeMap: Record<
  StatusVariant,
  React.ComponentProps<typeof Badge>['variant']
> = {
  success: 'success',
  error: 'destructive',
  default: 'accent',
  secondary: 'secondary',
};

const StatusIconWithText = React.memo(
  ({ icon: Icon, text, variant = 'default' }: StatusIconWithTextProps) => {
    return (
      <Badge variant={variantBadgeMap[variant]}>
        <Icon className="size-4" />
        <span>{text}</span>
      </Badge>
    );
  },
);

StatusIconWithText.displayName = 'StatusIconWithText';
export { StatusIconWithText };

type StatusVariant = 'success' | 'error' | 'default' | 'secondary';

interface StatusIconWithTextProps {
  icon: React.ElementType;
  text: string;
  variant?: StatusVariant;
}
