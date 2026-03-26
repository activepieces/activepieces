import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const AlertLayoutContext = React.createContext<{ layout: AlertLayout }>({
  layout: 'default',
});

const alertVariants = cva(
  'rounded-lg border text-left text-sm group/alert relative w-full',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        warning:
          'border-warning/50 text-warning-700 dark:border-warning dark:text-warning-300 *:data-[slot=alert-description]:text-warning-700/90 dark:*:data-[slot=alert-description]:text-warning-300/90 *:[svg]:text-warning',
        destructive:
          'text-destructive bg-card *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current',
        primary:
          'border-primary/50 text-primary bg-primary-100/10 dark:border-primary *:data-[slot=alert-description]:text-primary/90 *:[svg]:text-primary',
        success:
          'border-success/50 text-success-700 bg-success-100/10 dark:border-success *:data-[slot=alert-description]:text-success-700/90 *:[svg]:text-success-700',
      },
      layout: {
        default:
          "grid gap-0.5 px-4 py-3 has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
        inlineAction:
          "grid gap-x-3 gap-y-1.5 px-4 py-4 [&:not(:has([data-slot=alert-action]))]:has-[>svg]:grid-cols-[auto_1fr] has-data-[slot=alert-action]:has-[>svg]:grid-cols-[auto_1fr_auto] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
      },
    },
    compoundVariants: [
      {
        layout: 'inlineAction',
        variant: 'warning',
        class:
          'bg-warning-50 dark:bg-warning-950/40 border-warning/50 dark:border-warning/60',
      },
      {
        layout: 'inlineAction',
        variant: 'primary',
        class: 'dark:bg-primary/10',
      },
    ],
    defaultVariants: {
      variant: 'default',
      layout: 'default',
    },
  },
);

function Alert({
  className,
  variant,
  layout = 'default',
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof alertVariants> & { layout?: AlertLayout }) {
  return (
    <AlertLayoutContext.Provider value={{ layout }}>
      <div
        data-slot="alert"
        data-layout={layout}
        role="alert"
        className={cn(alertVariants({ variant, layout }), className)}
        {...props}
      />
    </AlertLayoutContext.Provider>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  const { layout } = React.useContext(AlertLayoutContext);
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground',
        layout === 'inlineAction' && 'group-has-[>svg]/alert:row-start-1',
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
  const { layout } = React.useContext(AlertLayoutContext);
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-sm text-balance md:text-pretty  [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground',
        layout === 'inlineAction' &&
          'group-has-[>svg]/alert:col-start-2 group-has-[[data-slot=alert-title]]/alert:row-start-2',
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  const { layout } = React.useContext(AlertLayoutContext);
  return (
    <div
      data-slot="alert-action"
      className={cn(
        layout === 'default' && 'absolute top-2 right-2',
        layout === 'inlineAction' &&
          'group-has-[>svg]/alert:col-start-3 group-has-[>svg]/alert:row-start-1 group-has-[>svg]/alert:self-start group-has-[>svg]/alert:justify-self-end',
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };

type AlertLayout = 'default' | 'inlineAction';
