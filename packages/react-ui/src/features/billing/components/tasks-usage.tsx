import { t } from 'i18next';
import { ClipboardCheck, CircleHelp } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TooltipContent,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlanName } from '@activepieces/ee-shared';
import { PlatformBillingInformation } from '@activepieces/shared';

export function TasksUsage({
  platformSubscription,
}: {
  platformSubscription: PlatformBillingInformation;
}) {
  const { plan, usage } = platformSubscription;
  const isFreePlan = plan.plan === PlanName.FREE;
  const currentTasks = usage.tasks || 0;
  const tasksLimit = plan.tasksLimit ?? 100;
  const usagePercentage =
    isFreePlan && tasksLimit > 0
      ? Math.round((currentTasks / tasksLimit) * 100)
      : 0;

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('Tasks')}</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your task execution usage
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-medium">{t('Current Task Usage')}</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleHelp className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t('Count of executed steps')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="rounded-lg space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {currentTasks.toLocaleString()}{' '}
                {!isFreePlan
                  ? '/ Unlimited'
                  : `/ ${tasksLimit.toLocaleString()}`}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {isFreePlan ? t('Plan Limit') : t('Fair Usage')}
              </span>
            </div>

            <Progress
              value={isFreePlan ? usagePercentage : 100}
              className="w-full"
            />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isFreePlan
                  ? `${usagePercentage}% of plan allocation used`
                  : 'Unlimited usage under fair usage policy'}
              </span>
              {isFreePlan && usagePercentage > 80 && (
                <span className="text-destructive font-medium">
                  Approaching limit
                </span>
              )}
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
            {isFreePlan
              ? `Includes ${(
                  plan?.includedTasks || 1000
                ).toLocaleString()} tasks free with your plan`
              : 'Unlimited tasks under fair usage policy - no hard limits applied'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
