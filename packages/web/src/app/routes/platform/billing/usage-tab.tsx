import { PlatformBillingInformation } from '@activepieces/shared';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
              <HugeiconsIcon
                icon={InformationCircleIcon}
                className="size-3.5 text-gray-11 cursor-help"
              />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-60">
              <p className="text-sm">
                {t('Usage figures may be a few minutes out of date.')}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-sm text-gray-11">
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
