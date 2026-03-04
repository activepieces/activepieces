import { cva, type VariantProps } from 'class-variance-authority';
import { PackageOpen } from 'lucide-react';
import React, { forwardRef } from 'react';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { Skeleton } from '../ui/skeleton';

const CardList = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { listClassName?: string }
>(({ children, className, listClassName, ...props }, ref) => (
  <ScrollArea
    className={`h-full overflow-auto ${className}`}
    viewPortClassName="[&>div]:h-full"
  >
    <div
      ref={ref}
      className={cn('flex flex-col h-full w-full', listClassName)}
      {...props}
    >
      {children}
    </div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
));
CardList.displayName = 'CardList';
export { CardList };

const cardItemListVariants = cva('flex items-center gap-4 w-full py-4 px-2 ', {
  variants: {
    interactive: {
      true: 'cursor-pointer transition-all hover:bg-accent hover:text-accent-foreground',
      false: 'cursor-default text-accent-foreground/50 font-semibold',
    },
    selected: {
      true: 'bg-accent text-accent-foreground',
      false: '',
    },
  },
  defaultVariants: {
    interactive: true,
    selected: false,
  },
});

type CardListItemProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardItemListVariants> & {
    children: React.ReactNode;
  };

const CardListItem = React.forwardRef<HTMLDivElement, CardListItemProps>(
  ({ children, onClick, className, interactive, selected, ...props }, ref) => {
    return (
      <div
        onClick={onClick}
        ref={ref}
        className={cn(
          cardItemListVariants({ interactive, selected }),
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

CardListItem.displayName = 'CardListItem';
export { CardListItem };

type CardListItemSkeletonProps = {
  numberOfCards?: number;
  withCircle?: boolean;
};

const CardListItemSkeleton: React.FC<CardListItemSkeletonProps> = React.memo(
  ({ numberOfCards = 3, withCircle = true }) => {
    return (
      <>
        {[...Array(numberOfCards)].map((_, index) => (
          <div key={index} className="flex items-center gap-4 w-full py-4 px-5">
            {withCircle && <Skeleton className="h-8 w-8 rounded-full" />}
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </>
    );
  },
);

CardListItemSkeleton.displayName = 'CardListItemSkeleton';
export { CardListItemSkeleton };

type CardListEmptyProps = React.HTMLAttributes<HTMLDivElement> & {
  message: string;
};
const CardListEmpty = React.memo(({ message }: CardListEmptyProps) => {
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 flex-col text-muted-foreground">
      <PackageOpen className="w-10 h-10" />
      <div className="text-center tracking-tight">{message}</div>
    </div>
  );
});

CardListEmpty.displayName = 'CardListEmpty';
export { CardListEmpty };
