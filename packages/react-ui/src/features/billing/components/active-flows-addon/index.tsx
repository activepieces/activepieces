import { t } from 'i18next';
import { CircleHelp, Plus, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TooltipContent,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';
import { PRICE_PER_EXTRA_ACTIVE_FLOWS } from '@activepieces/ee-shared';
import {
  ApEdition,
  ApFlagId,
  isNil,
  PlanName,
  PlatformBillingInformation,
} from '@activepieces/shared';

import { useManagePlanDialogStore } from '../../lib/active-flows-addon-dialog-state';

type BusinessActiveFlowsProps = {
  platformSubscription: PlatformBillingInformation;
};

export function ActiveFlowAddon({
  platformSubscription,
}: BusinessActiveFlowsProps) {
  const { openDialog } = useManagePlanDialogStore();

  const { plan, usage } = platformSubscription;
  const currentActiveFlows = usage.activeFlows || 0;

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const canManageActiveFlowsLimit =
    edition !== ApEdition.COMMUNITY && plan.plan === PlanName.STANDARD;

  const activeFlowsLimit = plan.activeFlowsLimit;
  const usagePercentage =
    !isNil(activeFlowsLimit) && activeFlowsLimit > 0
      ? Math.round((currentActiveFlows / activeFlowsLimit) * 100)
      : 0;

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('Active Flows')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('Monitor your active flows usage')}
              </p>
            </div>
          </div>
          {canManageActiveFlowsLimit && (
            <Button
              variant="default"
              className="gap-2"
              onClick={() => {
                openDialog();
              }}
            >
              <Plus className="w-4 h-4" />
              {t('Manage Active Flows')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-medium">{t('Active Flows Usage')}</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleHelp className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t(
                    `Count of active flows, $${PRICE_PER_EXTRA_ACTIVE_FLOWS} for extra 5 active flows`,
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="rounded-lg space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {currentActiveFlows.toLocaleString()} /{' '}
                {isNil(activeFlowsLimit)
                  ? 'Unlimited'
                  : activeFlowsLimit.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {t('Plan Limit')}
              </span>
            </div>
            <Progress value={usagePercentage} className="w-full" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {usagePercentage}% of plan allocation used
              </span>
              {usagePercentage > 80 && (
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
