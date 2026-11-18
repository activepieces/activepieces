import { PlatformBillingInformation } from '@activepieces/shared';
import { t } from 'i18next';
import { Info } from 'lucide-react';

import {
  AdminPage,
  AdminPageHeader,
  adminPageResources,
  adminSurface,
} from '@/app/components/admin';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FeatureUsageCards, ProjectsUsageTable } from '@/features/billing';
import { platformHooks } from '@/hooks/platform-hooks';

export function UsageTab({ platform, info }: UsageTabProps) {
  return (
    <AdminPage>
      <AdminPageHeader
        title={t('Usage')}
        description={t('Track your workspace usage across your plan limits.')}
        resources={adminPageResources.usage}
        badge={
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-4 cursor-help text-gray-11" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-60">
              <p className="text-sm">
                {t('Usage figures may be a few minutes out of date.')}
              </p>
            </TooltipContent>
          </Tooltip>
        }
      />
      <FeatureUsageCards
        platformSubscription={info}
        cardClassName={adminSurface.card}
      />
      <ProjectsUsageTable
        platformId={platform.id}
        frameClassName={adminSurface.listFrame}
      />
    </AdminPage>
  );
}

type UsageTabProps = {
  platform: ReturnType<typeof platformHooks.useCurrentPlatform>['platform'];
  info: PlatformBillingInformation;
};
