import { t } from 'i18next';
import { ChevronRight, Info, Play, Sparkles, Workflow } from 'lucide-react';
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/utils';
import { ApEdition, ApFlagId, isNil, PlatformRole } from '@activepieces/shared';

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
      <div className="flex flex-col w-full p-4 bg-background rounded-md border">
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4" />
                <Skeleton className="w-20 h-4" />
              </div>
              <Skeleton className="w-16 h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full p-4 bg-background rounded-md border">
      <div className="flex flex-col gap-2.5">
        <UsageRow
          name={t('Runs')}
          icon={<Play className="size-4 text-foreground" />}
          isUnlimited={true}
        />
        <UsageRow
          name={t('AI Credits')}
          icon={<Sparkles className="size-4 text-foreground" />}
          value={Math.round(platform.usage?.aiCreditsRemaining ?? 0)}
          suffix={t('remaining')}
          tooltip={t(
            'Used when running AI pieces with Activepieces as the provider instead of your own API keys.',
          )}
        />
        <UsageRow
          name={t('Active Flows')}
          icon={<Workflow className="size-4 text-foreground" />}
          value={platform.usage?.activeFlows ?? 0}
          max={platform?.plan.activeFlowsLimit}
        />
        {isPlatformAdmin && (
          <Link
            to="/platform/setup/billing"
            className="flex items-center gap-1 text-xs text-foreground/80 hover:text-foreground mt-2 w-fit"
          >
            <span>{t('Manage Plan')}</span>
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
});

type UsageRowProps = {
  name: string;
  icon: ReactNode;
  value?: number | null;
  max?: number | null;
  isUnlimited?: boolean;
  suffix?: string;
  tooltip?: string;
};

const UsageRow = ({
  name,
  icon,
  value,
  max,
  isUnlimited,
  suffix,
  tooltip,
}: UsageRowProps) => {
  const hasMax = !isNil(max);

  return (
    <div className="flex items-center justify-between gap-2 w-full text-xs">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span>{name}</span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px]">
              <p className="text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2 text-foreground">
        {isUnlimited ? (
          <span className="text-foreground bg-muted px-2 py-1 rounded-md">
            ∞ {t('Unlimited')}
          </span>
        ) : suffix ? (
          <span>
            {formatUtils.formatNumber(value ?? 0)} {suffix}
          </span>
        ) : (
          <span>
            {formatUtils.formatNumber(value ?? 0)} /{' '}
            {hasMax ? formatUtils.formatNumber(max) : t('Unlimited')}
          </span>
        )}
      </div>
    </div>
  );
};

SidebarUsageLimits.displayName = 'UsageLimitsButton';
export default SidebarUsageLimits;
