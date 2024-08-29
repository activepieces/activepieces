import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { t } from 'i18next';
import React from 'react';

export const PermissionNeededWrapper = React.forwardRef(
  (
    {
      children,
      hasPermission,
    }: { children: React.ReactNode; hasPermission: boolean },
    ref,
  ) => {
    return (
      <Tooltip>
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
