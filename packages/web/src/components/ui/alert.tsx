import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  "group/alert relative grid w-full gap-1 rounded-2xl border px-4 py-3.5 text-left text-base has-data-[slot=alert-action]:pr-20 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:h-lh *:[svg]:text-current *:[svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          'bg-panel text-gray-12 *:data-[slot=alert-description]:text-gray-11',
        warning:
          'border-warning-7 bg-warning-3 text-warning-11 *:data-[slot=alert-description]:text-warning-11 *:[svg]:text-warning-11',
        destructive:
          'border-danger-7 bg-danger-3 text-danger-11 *:data-[slot=alert-description]:text-danger-11 *:[svg]:text-current',
        info: 'border-accent-7 text-accent-11 bg-accent-3 *:data-[slot=alert-description]:text-accent-11 *:[svg]:text-accent-11',
        success:
          'border-success-7 text-success-11 bg-success-3 *:data-[slot=alert-description]:text-success-11 *:[svg]:text-success-11',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-gray-12',
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-base text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-gray-12',
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-action"
      className={cn('absolute top-2.5 right-3', className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
