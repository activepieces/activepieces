import { t } from 'i18next';
import React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const PublishedNeededTooltip = React.forwardRef<
  HTMLButtonElement,
  { children: React.ReactNode; allowPush: boolean }
>(({ children, allowPush }, ref) => {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger ref={ref} asChild disabled={!allowPush}>
        <div>{children}</div>
      </TooltipTrigger>
      {!allowPush && (
        <TooltipContent side="top">
          {t('Only published flows can be pushed to Git')}
        </TooltipContent>
      )}
    </Tooltip>
  );
});

PublishedNeededTooltip.displayName = 'PublishedNeededWrapper';
