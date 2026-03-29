import { ApEdition, ApFlagId, isNil, PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronRight, Info, Play, Sparkles, Workflow } from 'lucide-react';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { useSidebar } from '@/components/ui/sidebar-shadcn';
import { formatUtils } from '@/lib/format-utils';

const SidebarUsageLimits = React.memo(() => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const currentUser = userHooks.useCurrentUser();
  const isPlatformAdmin = currentUser.data?.platformRole === PlatformRole.ADMIN;
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { state } = useSidebar();
  const [showValues, setShowValues] = useState(state === 'expanded');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (state === 'expanded') {
      timerRef.current = setTimeout(() => setShowValues(true), 150);
    } else {
      setShowValues(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [state]);

  if (edition !== ApEdition.CLOUD) {
    return null;
  }

  if (isNil(project)) {
    return (
      <div className="flex flex-col w-full p-2.5 bg-background rounded-md border">
        <div className="flex flex-col gap-2">
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
    <div className="flex flex-col w-full p-2.5 mb-1.5 bg-background rounded-md border overflow-hidden">
      <div className={'flex flex-col gap-2'}>
        <UsageRow
          name={t('Runs')}
          icon={<span className="size-1 shrink-0 rounded-full bg-foreground" />}
          isUnlimited={true}
          showValues={showValues}
        />
        <UsageRow
          name={t('AI Credits')}
          icon={<span className="size-1 shrink-0 rounded-full bg-foreground" />}
          value={Math.round(platform.usage?.aiCreditsRemaining ?? 0)}
          suffix={t('remaining')}
          tooltip={t(
            'Used when running AI pieces with Activepieces as the provider instead of your own API keys.',
          )}
          showValues={showValues}
        />
        <UsageRow
          name={t('Active Flows')}
          icon={<span className="size-1 shrink-0 rounded-full bg-foreground" />}
          value={platform.usage?.activeFlows ?? 0}
          max={platform?.plan.activeFlowsLimit}
          showValues={showValues}
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
  showValues: boolean;
};

const UsageRow = ({
  name,
  icon,
  value,
  max,
  isUnlimited,
  suffix,
  tooltip,
  showValues,
}: UsageRowProps) => {
  const hasMax = !isNil(max);

  return (
    <div className="flex items-center justify-between gap-2 w-full text-xs whitespace-nowrap h-5">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="truncate font-medium">{name}:</span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3 -ml-1 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[180px]">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className={`flex items-center gap-2 text-foreground shrink-0 transition-opacity duration-150 ${showValues ? 'opacity-100' : 'opacity-0'}`}>
        {isUnlimited ? (
          <span>∞ {t('Unlimited')}</span>
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
