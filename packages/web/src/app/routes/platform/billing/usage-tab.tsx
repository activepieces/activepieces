import { PlatformBillingInformation } from '@activepieces/shared';
import { t } from 'i18next';
import { Info } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FeatureUsageCards, ProjectsUsageTable } from '@/features/billing';
import { platformHooks } from '@/hooks/platform-hooks';

export function UsageTab({ platform, info }: UsageTabProps) {
  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-medium">{t('Usage')}</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-60">
              <p className="text-sm">
                {t('Usage figures may be a few minutes out of date.')}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-sm text-muted-foreground">
          {t('Track your workspace usage across your plan limits.')}
        </div>
      </div>
      <Separator />
      <FeatureUsageCards platformSubscription={info} />
      <Separator />
      <ProjectsUsageTable platformId={platform.id} />
    </div>
  );
}

type UsageTabProps = {
  platform: ReturnType<typeof platformHooks.useCurrentPlatform>['platform'];
  info: PlatformBillingInformation;
};
