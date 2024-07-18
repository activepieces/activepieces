import { PackageOpen } from 'lucide-react';
import React from 'react';

import { Skeleton } from './skeleton';

type CardListProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

const CardList = React.forwardRef<HTMLDivElement, CardListProps>(
  ({ children, ...props }, ref) => {
    return (
      <div ref={ref} className="flex flex-col gap-4 h-full" {...props}>
        {children}
      </div>
    );
  },
);

CardList.displayName = 'CardList';
export { CardList };

type CardListItemProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

const CardListItem = React.forwardRef<HTMLDivElement, CardListItemProps>(
  ({ children, onClick, ...props }, ref) => {
    return (
      <div
        onClick={onClick}
        ref={ref}
        className="flex items-center gap-4 w-full py-4 px-5 cursor-pointer hover:bg-accent hover:text-accent-foreground"
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
};

const CardListItemSkeleton: React.FC<CardListItemSkeletonProps> = React.memo(
  ({ numberOfCards = 3 }) => {
    return (
      <>
        {[...Array(numberOfCards)].map((_, index) => (
          <div key={index} className="flex items-center gap-4 w-full py-4 px-5">
            <Skeleton className="h-8 w-8 rounded-full" />
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
      <PackageOpen className="w-14 h-14" />
      <div className="text-center  text-lg tracking-tight">{message}</div>
    </div>
  );
});

CardListEmpty.displayName = 'CardListEmpty';
export { CardListEmpty };
