import { PuzzleIcon } from '@hugeicons/core-free-icons';
import React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { LogoPlate, LogoPlateProps } from '@/components/custom/logo-plate';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const PieceIcon = React.memo(
  ({
    displayName,
    logoUrl,
    border,
    size,
    showTooltip,
    fallback,
  }: PieceIconProps) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex shrink-0">
          <LogoPlate
            src={logoUrl}
            alt={displayName}
            size={size}
            border={border}
            tint
            fallback={fallback}
          />
        </div>
      </TooltipTrigger>
      {showTooltip ? (
        <TooltipContent side="bottom">{displayName}</TooltipContent>
      ) : null}
    </Tooltip>
  ),
);

PieceIcon.displayName = 'PieceIcon';

const MissingPieceGlyph = () => (
  <HugeiconsIcon
    icon={PuzzleIcon}
    aria-hidden
    className="size-3/5 text-gray-11"
  />
);

export { MissingPieceGlyph, PieceIcon };

export type PieceIconProps = Pick<
  LogoPlateProps,
  'size' | 'border' | 'fallback'
> & {
  displayName?: string;
  logoUrl?: string;
  showTooltip: boolean;
};
