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
        true: 'border border-solid',
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

    const defaultImageUrl =
      'https://cdn.activepieces.com/pieces/empty-trigger.svg';

    let imageUrl = defaultImageUrl;
    let displayName = 'Empty Trigger';

    if (isSuccess && data) {
      imageUrl = data.logoUrl ?? defaultImageUrl;
      displayName = data.displayName ?? displayName;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={pieceIconVariants({ border, size, circle })}>
            <img src={imageUrl} alt={displayName} className="object-contain" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">{displayName}</TooltipContent>
      </Tooltip>
    );
  },
);

PieceIcon.displayName = 'PieceIcon';
export { PieceIcon };
