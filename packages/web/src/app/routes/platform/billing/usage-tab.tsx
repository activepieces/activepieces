import { PlatformBillingInformation } from '@activepieces/shared';
import { t } from 'i18next';
import { Info } from 'lucide-react';

import { Page, PageHeader } from '@/components/custom/page';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FeatureUsageCards, ProjectsUsageTable } from '@/features/billing';
import { platformHooks } from '@/hooks/platform-hooks';

export function UsageTab({ platform, info }: UsageTabProps) {
  return (
    <Page>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {t('Usage')}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-5 cursor-help text-gray-11" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-60">
                <p className="text-sm">
                  {t('Usage figures may be a few minutes out of date.')}
                </p>
              </TooltipContent>
            </Tooltip>
          </span>
        }
        description={t('Track your workspace usage across your plan limits.')}
      />
      <FeatureUsageCards platformSubscription={info} />
      <ProjectsUsageTable platformId={platform.id} />
    </Page>
  );
}

type UsageTabProps = {
  platform: ReturnType<typeof platformHooks.useCurrentPlatform>['platform'];
  info: PlatformBillingInformation;
};
