import { VariantProps, cva } from 'class-variance-authority';
import React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { piecesHooks } from '../lib/pieces-hook';

const pieceIconVariants = cva(
  'flex items-center justify-center bg-accent p-2',
  {
    variants: {
      circle: {
        true: 'rounded-full',
      },
      size: {
        md: 'size-[36px]',
      },
      border: {
        true: 'border-dividers border border-solid',
        false: '',
      },
    },
    defaultVariants: {},
  },
);

interface PieceIconCircleProps extends VariantProps<typeof pieceIconVariants> {
  pieceName: string;
}

const PieceIcon = React.memo(
  ({ pieceName, border, size, circle }: PieceIconCircleProps) => {
    const { data, isSuccess } = piecesHooks.usePiece({
      name: pieceName,
      version: undefined,
    });

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={pieceIconVariants({ border, size, circle })}>
            {isSuccess && data ? (
              <img src={data?.logoUrl} className="object-contain" />
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isSuccess && data ? data?.displayName : null}
        </TooltipContent>
      </Tooltip>
    );
  },
);

PieceIcon.displayName = 'PieceIcon';
export { PieceIcon };
