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

const pieceIconVariants = cva(
  'flex rounded-md items-center justify-center bg-background  ',
  {
    variants: {
      circle: {
        true: 'rounded-full p-1.25',
        false: '',
      },
      size: {
        xxl: 'size-[64px]',
        xl: 'size-[48px]',
        lg: 'size-[40px]',
        md: 'size-[36px]',
        sm: 'size-[30px]',
        xs: 'size-[18px]',
      },
      border: {
        true: 'border border-solid',
      },
    },
    defaultVariants: {},
  },
);

const pieceIconVariantsWithPadding = cva('', {
  variants: {
    size: {
      xxl: 'p-4',
      xl: 'p-3',
      lg: 'p-2',
      md: 'p-0.75',
      sm: 'p-1.25',
      xs: '',
    },
  },
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
                className={cn(
                  pieceIconVariantsWithPadding({ size }),
                  'object-contain w-full h-full',
                )}
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
