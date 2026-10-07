import { cva, type VariantProps } from 'class-variance-authority';
import { Tabs as TabsPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn('group/tabs', className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit text-gray-11 data-vertical:h-fit data-vertical:flex-col',
  {
    variants: {
      variant: {
        default: 'h-9 items-center justify-center rounded-lg bg-gray-3 p-0.5',
        line: 'gap-1 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type TabsListVariant = NonNullable<
  VariantProps<typeof tabsListVariants>['variant']
>;

function resolveVariant(
  variant: TabsListVariant | 'outline' | null | undefined,
): TabsListVariant {
  return variant === 'outline' ? 'line' : variant ?? 'default';
}

function TabsList({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: TabsListVariant | 'outline' | null;
}) {
  const resolvedVariant = resolveVariant(variant);
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={resolvedVariant}
      className={cn(tabsListVariants({ variant: resolvedVariant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  variant: _legacyVariant,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  variant?: TabsListVariant | 'outline';
}) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-full items-center justify-center gap-1.5 rounded-md border border-transparent px-3 text-sm font-medium whitespace-nowrap text-gray-11 transition-all hover:text-gray-12 focus-visible:border-gray-8 focus-visible:ring-3 focus-visible:ring-gray-8/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-vertical:w-full data-vertical:justify-start [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'group-data-[variant=default]/tabs-list:flex-1 data-active:bg-panel data-active:text-gray-12 data-active:shadow-xs',
        'group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:shadow-none',
        'after:absolute after:bg-gray-12 after:opacity-0 after:transition-opacity data-horizontal:after:inset-x-0 data-horizontal:after:bottom-0 data-horizontal:after:h-0.5 data-vertical:after:inset-y-0 data-vertical:after:right-0 data-vertical:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('mt-4 outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
