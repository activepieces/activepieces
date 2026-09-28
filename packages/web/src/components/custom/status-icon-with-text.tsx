import React from 'react';

import {
  HugeiconsIcon,
  type IconSvgElement,
} from '@/components/custom/hugeicons-icon';
import { Badge } from '@/components/ui/badge';

const variantBadgeMap: Record<
  StatusVariant,
  React.ComponentProps<typeof Badge>['variant']
> = {
  success: 'success',
  warning: 'warning',
  error: 'destructive',
  primary: 'info',
  neutral: 'neutral',
  default: 'accent',
  secondary: 'secondary',
};

const StatusIconWithText = React.memo(
  ({ icon: Icon, text, variant = 'default' }: StatusIconWithTextProps) => {
    return (
      <Badge variant={variantBadgeMap[variant]}>
        <HugeiconsIcon icon={Icon} className="size-4" />
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
  icon: IconSvgElement;
  text: string;
  variant?: StatusVariant;
}
