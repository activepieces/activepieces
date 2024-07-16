import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

const statusCodeVariants = cva(
  'inline-flex gap-1 rounded px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        success: 'bg-success text-success-foreground',
        error: 'bg-destructive text-destructive-foreground',
        default: 'bg-accent text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
interface StatusIconWithTextProps
  extends VariantProps<typeof statusCodeVariants> {
  icon: any;
  text: string;
}

const StatusIconWithText = React.memo(
  ({ icon: Icon, text, variant }: StatusIconWithTextProps) => {
    return (
      <span className={statusCodeVariants({ variant })}>
        <Icon className="size-4" />
        <span>{text}</span>
      </span>
    );
  },
);

StatusIconWithText.displayName = 'StatusIconWithText';
export { StatusIconWithText };
