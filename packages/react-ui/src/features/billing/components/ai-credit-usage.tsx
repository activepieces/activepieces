import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Sparkles, Info, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { ApSubscriptionStatus, PlanName } from '@activepieces/ee-shared';
import {
  AiOverageState,
  PlatformBillingInformation,
} from '@activepieces/shared';

import { billingMutations } from '../lib/billing-hooks';

import { AiCreditsUsageTable } from './ai-credits-usage-table';

interface AiCreditUsageProps {
  platformSubscription: PlatformBillingInformation;
}

export function AICreditUsage({ platformSubscription }: AiCreditUsageProps) {
  const queryClient = useQueryClient();
  const { plan, usage } = platformSubscription;

  const planIncludedCredits = plan.includedAiCredits;
  const overageLimit = plan.aiCreditsOverageLimit;
  const totalCreditsUsed = usage.aiCredits;

  const aiOverrageState =
    plan.aiCreditsOverageState ??
    plan.aiCreditsOverageState ??
    AiOverageState.NOT_ALLOWED;

  const isFreePlan = plan.plan === PlanName.FREE;
  const isTrial =
    plan.stripeSubscriptionStatus === ApSubscriptionStatus.TRIALING;

  const overageConfig = useMemo(() => {
    const isAllowed = aiOverrageState !== AiOverageState.NOT_ALLOWED;
    const isEnabled = aiOverrageState === AiOverageState.ALLOWED_AND_ON;
    return {
      allowed: isAllowed,
      enabled: isEnabled,
      canToggle: !isFreePlan && !isTrial && isAllowed,
    };
  }, [aiOverrageState, isFreePlan, isTrial]);

  const [usageBasedEnabled, setUsageBasedEnabled] = useState(
    overageConfig.enabled,
  );
  const [usageLimit, setUsageLimit] = useState<number>(overageLimit ?? 500);

  const {
    mutate: setAiCreditOverageLimit,
    isPending: settingAiCreditsOverageLimit,
  } = billingMutations.useSetAiCreditOverageLimit(queryClient);

  const {
    mutate: toggleAiCreditsOverageEnabled,
    isPending: togglingAiCreditsOverageEnabled,
  } = billingMutations.useToggleAiCreditOverageEnabled(queryClient);

  const creditMetrics = useMemo(() => {
    const creditsUsedFromPlan = Math.min(totalCreditsUsed, planIncludedCredits);
    const overageCreditsUsed = Math.max(
      0,
      totalCreditsUsed - planIncludedCredits,
    );

    const planUsagePercentage = Math.min(
      100,
      Math.round((creditsUsedFromPlan / planIncludedCredits) * 100),
    );

    const overageUsagePercentage =
      usageBasedEnabled && overageLimit
        ? Math.min(100, Math.round((overageCreditsUsed / overageLimit) * 100))
        : 0;

    return {
      creditsUsedFromPlan,
      overageCreditsUsed,
      planUsagePercentage,
      overageUsagePercentage,
      isPlanLimitApproaching: planUsagePercentage > 80,
      isPlanLimitExceeded: totalCreditsUsed > planIncludedCredits,
      isOverageLimitApproaching: overageUsagePercentage > 80,
    };
  }, [totalCreditsUsed, planIncludedCredits, usageBasedEnabled, overageLimit]);

  const handleSaveAiCreditUsageLimit = useCallback(() => {
    setAiCreditOverageLimit({ limit: usageLimit });
  }, [setAiCreditOverageLimit, usageLimit]);

  const handleToggleAiCreditUsage = useCallback(() => {
    const newState = usageBasedEnabled
      ? AiOverageState.ALLOWED_BUT_OFF
      : AiOverageState.ALLOWED_AND_ON;

    toggleAiCreditsOverageEnabled(
      { state: newState },
      {
        onSuccess: () => {
          setUsageBasedEnabled(!usageBasedEnabled);
        },
      },
    );
  }, [usageBasedEnabled, toggleAiCreditsOverageEnabled]);

  useEffect(() => {
    setUsageBasedEnabled(overageConfig.enabled);
  }, [overageConfig.enabled]);

  useEffect(() => {
    setUsageLimit(overageLimit ?? 500);
  }, [overageLimit]);

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('AI Credits')}</h3>
              <p className="text-sm text-muted-foreground">
                Manage your AI usage and limits
              </p>
            </div>
          </div>
          {overageConfig.canToggle && (
            <div className="flex items-center gap-3 py-2">
              <span className="text-sm font-medium">
                {t('Usage Based Billing')}
              </span>
              <Switch
                checked={usageBasedEnabled}
                disabled={togglingAiCreditsOverageEnabled}
                onCheckedChange={handleToggleAiCreditUsage}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-medium">{t('Plan Credits Usage')}</h4>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                Credits reset monthly with your billing cycle
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="rounded-lg space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {Math.round(creditMetrics.creditsUsedFromPlan)} /{' '}
                {planIncludedCredits}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {t('Plan Included')}
              </span>
            </div>
            <Progress
              value={creditMetrics.planUsagePercentage}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {creditMetrics.planUsagePercentage}% of plan credits used
              </span>
              {creditMetrics.isPlanLimitApproaching &&
                !creditMetrics.isPlanLimitExceeded && (
                  <span className="text-orange-600 font-medium">
                    Approaching limit
                  </span>
                )}
              {creditMetrics.isPlanLimitExceeded && (
                <span className="text-destructive font-medium">
                  Plan limit exceeded
                </span>
              )}
            </div>
          </div>
        </div>

        {usageBasedEnabled && overageConfig.canToggle && (
          <>
            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-medium">
                  {t('Additional Credits Usage')}
                </h4>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Credits used beyond your plan limit ($0.01 each)
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="rounded-lg space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {creditMetrics.overageCreditsUsed} /{' '}
                    {overageLimit ?? 'unknown'}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('Usage Limit')}
                  </span>
                </div>
                <Progress
                  value={creditMetrics.overageUsagePercentage}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {creditMetrics.overageUsagePercentage}% of usage limit used
                  </span>
                  {creditMetrics.isOverageLimitApproaching && (
                    <span className="text-destructive font-medium">
                      Approaching usage limit
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <h5 className="text-base font-medium mb-1">
                  {t('Set Usage Limit')}
                </h5>
                <p className="text-sm text-muted-foreground">
                  Set a maximum number of additional AI credits to prevent
                  unexpected charges
                </p>
              </div>

              <div className="rounded-lg space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1 max-w-xs space-y-2">
                    <Input
                      type="number"
                      placeholder="Enter limit"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(Number(e.target.value))}
                      className="w-full"
                      min="0"
                    />
                  </div>
                  <Button
                    onClick={handleSaveAiCreditUsageLimit}
                    disabled={settingAiCreditsOverageLimit}
                    className="whitespace-nowrap"
                  >
                    {settingAiCreditsOverageLimit && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    {t('Save Limit')}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Recommended: Set 20-50% above your expected monthly overage
                  usage
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              {t('$1 per 1000 additional credits beyond plan limit')}
            </div>
          </>
        )}

        <Separator />
        <AiCreditsUsageTable />
      </CardContent>
    </Card>
  );
}
