import { t } from 'i18next';
import { Info } from 'lucide-react';

import { BillingPageShell } from '@/app/components/billing-page-shell';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FeatureUsageCards, ProjectsUsageTable } from '@/features/billing';

export default function Usage() {
  return (
    <BillingPageShell
      lockTitle={t('Unlock Usage Page')}
      errorMessage={t('Failed to load usage information')}
    >
      {({ platform, info }) => (
        <div className="flex w-full flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-medium">{t('Usage')}</h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[240px]">
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
      )}
    </BillingPageShell>
  );
}
