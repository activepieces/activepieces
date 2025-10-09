import { t } from 'i18next';
import { CircleHelp, LayoutDashboard } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TooltipContent,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BillingCycle,
  PRICE_PER_EXTRA_PROJECT_MAP,
} from '@activepieces/ee-shared';
import { PlatformBillingInformation } from '@activepieces/shared';

import { useManagePlanDialogStore } from './upgrade-dialog/store';

type BusinessProjectsProps = {
  platformSubscription: PlatformBillingInformation;
};

export function ProjectAddon({ platformSubscription }: BusinessProjectsProps) {
  const openDialog = useManagePlanDialogStore((state) => state.openDialog);
  const PRICE_PER_EXTRA_PROJECT =
    PRICE_PER_EXTRA_PROJECT_MAP[
      platformSubscription.plan.stripeBillingCycle as BillingCycle
    ];
  const { plan, usage } = platformSubscription;
  const currentProjects = usage.projects || 0;
  const projectsLimit = plan.projectsLimit ?? 1;
  const usagePercentage =
    projectsLimit > 0 ? Math.round((currentProjects / projectsLimit) * 100) : 0;

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('Projects')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('Monitor your projects usage')}
              </p>
            </div>
          </div>
          <Button variant="link" onClick={() => openDialog({ step: 2 })}>
            {t('Extra Projects?')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-medium">{t('Projects Usage')}</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleHelp className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t(
                    `Count of projects $${PRICE_PER_EXTRA_PROJECT} for extra 1 project`,
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="rounded-lg space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {currentProjects.toLocaleString()}{' '}
                {`/ ${projectsLimit.toLocaleString()}`}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {t('Plan Limit')}
              </span>
            </div>
            <Progress value={usagePercentage} className="w-full" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {`${usagePercentage}% of plan allocation used`}
              </span>
              {usagePercentage > 80 && (
                <span className="text-destructive font-medium">
                  {t('Approaching limit')}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
