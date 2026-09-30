import React from 'react';

import { Badge } from '@/components/ui/badge';

const variantBadgeMap: Record<
  StatusVariant,
  React.ComponentProps<typeof Badge>['variant']
> = {
  success: 'success',
  warning: 'warning',
  error: 'destructive',
  primary: 'info',
  neutral: 'secondary',
  default: 'outline',
  secondary: 'secondary',
};

const StatusIconWithText = React.memo(
  ({ icon: Icon, text, variant = 'default' }: StatusIconWithTextProps) => {
    return (
      <Badge variant={variantBadgeMap[variant]}>
        <Icon />
        <span>{text}</span>
      </Badge>
    );
  },
);

StatusIconWithText.displayName = 'StatusIconWithText';
export { StatusIconWithText };

export type StatusVariant =
  | 'default'
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'secondary';

interface StatusIconWithTextProps {
  icon: React.ElementType;
  text: string;
  variant?: StatusVariant;
}
