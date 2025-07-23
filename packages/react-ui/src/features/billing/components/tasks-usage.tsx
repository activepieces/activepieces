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
import { cn } from '@/lib/utils';
import { isNil, PlatformBillingInformation } from '@activepieces/shared';

export function TasksUsage({
  platformSubscription,
}: {
  platformSubscription: PlatformBillingInformation;
}) {
  const { plan, usage } = platformSubscription;
  const hasTaskLimit = !isNil(plan.tasksLimit);
  const currentTasks = usage.tasks || 0;
  const includedTasks = plan.tasksLimit;
  const usagePercentage =
    !isNil(includedTasks) && includedTasks > 0
      ? Math.round((currentTasks / includedTasks) * 100)
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
                {isNil(includedTasks)
                  ? '/ Unlimited'
                  : `/ ${includedTasks.toLocaleString()}`}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {hasTaskLimit ? t('Plan Limit') : t('Fair Usage')}
              </span>
            </div>

            <Progress
              value={hasTaskLimit ? usagePercentage : 0}
              className={cn('w-full', !hasTaskLimit && 'bg-primary/40')}
            />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {hasTaskLimit
                  ? `${usagePercentage}% of plan allocation used`
                  : 'Unlimited usage under fair usage policy'}
              </span>
              {hasTaskLimit && usagePercentage > 80 && (
                <span className="text-destructive font-medium">
                  Approaching limit
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
