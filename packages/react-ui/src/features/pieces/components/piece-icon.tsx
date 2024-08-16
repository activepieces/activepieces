import { VariantProps, cva } from 'class-variance-authority';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const pieceIconVariants = cva('flex items-center justify-center  ', {
  variants: {
    circle: {
      true: 'rounded-full bg-accent p-2',
    },
    size: {
      xl: 'size-[64px] p-4',
      lg: 'size-[48px]',
      md: 'size-[36px]',
      sm: 'size-[25px]',
    },
    border: {
      true: 'border border-solid',
      false: '',
    },
  },
  defaultVariants: {},
});

interface PieceIconCircleProps extends VariantProps<typeof pieceIconVariants> {
  displayName?: string;
  logoUrl?: string;
  showTooltip: boolean;
}

const PieceIcon = React.memo(
  ({
    displayName,
    logoUrl,
    border,
    size,
    circle,
    showTooltip,
  }: PieceIconCircleProps) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={pieceIconVariants({ border, size, circle })}>
            {logoUrl ? (
              <img src={logoUrl} className="object-contain" alt={displayName} />
            ) : (
              <Skeleton className="rounded-full w-full h-full" />
            )}
          </div>
        </TooltipTrigger>
        {showTooltip ? (
          <TooltipContent side="bottom">{displayName}</TooltipContent>
        ) : null}
      </Tooltip>
    );
  },
);

PieceIcon.displayName = 'PieceIcon';
export { PieceIcon };