import { Info } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

export const InfoTooltip = ({ children }: { children: React.ReactNode }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground " />
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
};

InfoTooltip.displayName = 'InfoTooltip';
