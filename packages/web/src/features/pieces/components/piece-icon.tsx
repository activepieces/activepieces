import React from 'react';

import { LogoPlate, LogoPlateProps } from '@/components/custom/logo-plate';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const PieceIcon = React.memo(
  ({ displayName, logoUrl, border, size, showTooltip }: PieceIconProps) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex shrink-0">
          <LogoPlate
            src={logoUrl}
            alt={displayName}
            size={size}
            border={border}
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

export { PieceIcon };

export type PieceIconProps = Pick<LogoPlateProps, 'size' | 'border'> & {
  displayName?: string;
  logoUrl?: string;
  showTooltip: boolean;
};
