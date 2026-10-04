import { t } from 'i18next';
import * as React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlanBadge, PLATFORM_FEATURES, TIER_LABELS } from '@/features/billing';

export function LockedRoleButton({
  locked,
  children,
}: {
  locked: boolean;
  children: React.ReactNode;
}) {
  if (!locked) {
    return <>{children}</>;
  }
  return (
    <div className="flex items-center gap-2">
      <PlanBadge tier={PLATFORM_FEATURES.projectRoles.tier} />
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('Available on the {tier} plan', {
            tier: TIER_LABELS[PLATFORM_FEATURES.projectRoles.tier],
          })}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
