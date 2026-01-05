import { VariantProps, cva } from 'class-variance-authority';
import React from 'react';

import { ImageWithColorBackground } from '@/components/ui/image-with-color-background';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const pieceIconVariants = cva('flex items-center justify-center   ', {
  variants: {
    circle: {
      true: 'rounded-full p-2',
      false: '',
    },
    size: {
      xxl: 'size-[64px] p-4',
      xl: 'size-[48px]',
      lg: 'size-[40px]',
      md: 'size-[36px] p-1.5',
      sm: 'size-[25px]',
      xs: 'size-[18px]',
    },
    border: {
      true: 'border border-solid',
    },
  },
  defaultVariants: {},
});

interface PieceIconCircleProps extends VariantProps<typeof pieceIconVariants> {
  displayName?: string;
  logoUrl?: string;
  showTooltip: boolean;
  background?: string;
}

const PieceIcon = React.memo(
  ({
    displayName,
    logoUrl,
    border,
    size,
    circle = false,
    showTooltip,
    background,
  }: PieceIconCircleProps) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(pieceIconVariants({ border, size, circle }))}
            style={background ? { backgroundColor: background } : undefined}
          >
            {logoUrl ? (
              <ImageWithColorBackground
                src={logoUrl}
                alt={displayName}
                className="object-contain w-full h-full"
                key={logoUrl}
                fallback={<Skeleton className="rounded-full w-full h-full" />}
              />
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
