import { cva, type VariantProps } from 'class-variance-authority';
import { PackageOpen } from 'lucide-react';
import React, { forwardRef } from 'react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { Skeleton } from '../ui/skeleton';

const CardList = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { listClassName?: string }
>(({ children, className, listClassName, ...props }, ref) => (
  <ScrollArea
    className={cn('h-full overflow-auto', className)}
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

const cardItemListVariants = cva('flex items-center gap-3 w-full py-3 px-2 ', {
  variants: {
    interactive: {
      true: 'cursor-pointer transition-all hover:bg-gray-4 hover:text-gray-12',
      false: 'cursor-default text-gray-12/50 font-semibold',
    },
    selected: {
      true: 'bg-gray-5 text-gray-12',
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
          <div key={index} className="flex w-full items-center gap-3 px-4 py-3">
            {withCircle && <Skeleton className="size-8 rounded-full" />}
            <div className="flex flex-col gap-2">
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
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageOpen />
        </EmptyMedia>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
});

CardListEmpty.displayName = 'CardListEmpty';
export { CardListEmpty };
