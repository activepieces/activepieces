import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId, PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/format-utils';

const SidebarUsageLimits = React.memo(() => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const currentUser = userHooks.useCurrentUser();
  const isPlatformAdmin = currentUser.data?.platformRole === PlatformRole.ADMIN;
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (edition !== ApEdition.CLOUD) {
    return null;
  }

  if (isNil(project)) {
    return (
      <div className="flex w-full items-center justify-between rounded-md border bg-background p-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-16" />
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between rounded-md border bg-background p-2">
      <div className="flex items-end gap-0.5 min-w-0">
        <span className="truncate text-sm font-semibold leading-none text-primary">
          {formatUtils.formatNumber(
            Math.round(platform.usage?.aiCreditsRemaining ?? 0),
          )}
        </span>
        <span className="truncate text-xs font-medium leading-none text-muted-foreground">
          {t('credits')}
        </span>
      </div>
      {isPlatformAdmin && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 shrink-0 px-2.5 text-xs"
        >
          <Link to="/platform/setup/billing">{t('Increase')}</Link>
        </Button>
      )}
    </div>
  );
});

SidebarUsageLimits.displayName = 'UsageLimitsButton';
export default SidebarUsageLimits;
