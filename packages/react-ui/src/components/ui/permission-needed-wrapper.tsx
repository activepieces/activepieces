import { t } from 'i18next';
import React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const PermissionNeededWrapper = React.forwardRef(
  (
    {
      children,
      hasPermission,
    }: { children: React.ReactNode; hasPermission: boolean },
    ref,
  ) => {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild disabled={!hasPermission}>
          <div>{children}</div>
        </TooltipTrigger>
        {!hasPermission && (
          <TooltipContent side="bottom">
            {t('Permission needed')}
          </TooltipContent>
        )}
      </Tooltip>
    );
  },
);

PermissionNeededWrapper.displayName = 'PermissionNeededWrapper';
