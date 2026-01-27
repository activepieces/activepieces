import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Sparkles, Settings, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  AiCreditsAutoTopUpState,
  ApEdition,
  ApFlagId,
  PlatformBillingInformation,
} from '@activepieces/shared';

import { billingMutations } from '../../lib/billing-hooks';

import { AutoTopUpConfigDialog } from './auto-topup-config-dialog';
import { PurchaseAICreditsDialog } from './purchase-ai-credits-dialog';

interface AiCreditUsageProps {
  platformSubscription: PlatformBillingInformation;
}

export function AICreditUsage({ platformSubscription }: AiCreditUsageProps) {
  const queryClient = useQueryClient();
  const { plan, usage } = platformSubscription;

  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isAutoTopUpDialogOpen, setIsAutoTopUpDialogOpen] = useState(false);
  const [isAutoTopUpEditing, setIsAutoTopUpEditing] = useState(false);

  const planIncludedCredits = plan.includedAiCredits;
  const totalCreditsUsed = usage.totalAiCreditsUsed;
  const creditsRemaining = usage.aiCreditsRemaining;

  const autoTopUpState =
    plan.aiCreditsAutoTopUpState ?? AiCreditsAutoTopUpState.DISABLED;

  const canBuyCredits = flagsHooks.useFlag<ApEdition>(
    ApFlagId.CAN_BUY_AI_CREDITS,
  );
  const isAutoTopUpEnabled = autoTopUpState === AiCreditsAutoTopUpState.ENABLED;

  const { mutate: updateAutoTopUp, isPending: isDisablingAutoTopUp } =
    billingMutations.useUpdateAutoTopUp(queryClient);

  const handleToggleAutoTopUp = (checked: boolean) => {
    if (checked) {
      setIsAutoTopUpEditing(false);
      setIsAutoTopUpDialogOpen(true);
    } else {
      updateAutoTopUp({ state: AiCreditsAutoTopUpState.DISABLED });
    }
  };

  const handleConfigureAutoTopUp = () => {
    setIsAutoTopUpEditing(true);
    setIsAutoTopUpDialogOpen(true);
  };

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
                {t('Manage your AI credits wallet and auto-topup')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canBuyCredits && (
              <Button
                variant="default"
                className="gap-2"
                onClick={() => setIsPurchaseDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                {t('Purchase Credits')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        <div className="space-y-6">
          <div className="p-4 rounded-lg border bg-primary/5 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm font-medium text-primary cursor-help">
                    {t('Wallet Balance')}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {t('You get {credits} free credits monthly', {
                    credits: planIncludedCredits.toLocaleString(),
                  })}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">
                {Math.round(creditsRemaining).toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {t('credits available')}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {t('Total lifetime usage')}:{' '}
                {Math.round(totalCreditsUsed).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-6">
          {canBuyCredits && (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-medium">{t('Auto Top-up')}</h4>
                  {isAutoTopUpEnabled && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleConfigureAutoTopUp}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('Automatically purchase credits when balance is low.')}
                </p>
                {isAutoTopUpEnabled &&
                  plan.aiCreditsAutoTopUpThreshold &&
                  plan.aiCreditsAutoTopUpCreditsToAdd && (
                    <div className="space-y-0.5 mt-1">
                      <p className="text-xs text-primary">
                        {t(
                          'Adds {credits} credits when balance drops below {threshold}',
                          {
                            credits:
                              plan.aiCreditsAutoTopUpCreditsToAdd.toLocaleString(),
                            threshold:
                              plan.aiCreditsAutoTopUpThreshold.toLocaleString(),
                          },
                        )}
                      </p>
                      {plan.maxAutoTopUpCreditsMonthly && (
                        <p className="text-xs text-muted-foreground">
                          {t('Monthly spending limit: {limit} credits', {
                            limit:
                              plan.maxAutoTopUpCreditsMonthly.toLocaleString(),
                          })}
                        </p>
                      )}
                    </div>
                  )}
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={isAutoTopUpEnabled}
                  onCheckedChange={handleToggleAutoTopUp}
                  disabled={isDisablingAutoTopUp}
                />
              </div>
            </div>
          )}
        </div>

        <PurchaseAICreditsDialog
          isOpen={isPurchaseDialogOpen}
          onOpenChange={setIsPurchaseDialogOpen}
        />

        <AutoTopUpConfigDialog
          isOpen={isAutoTopUpDialogOpen}
          onOpenChange={setIsAutoTopUpDialogOpen}
          isEditing={isAutoTopUpEditing}
          currentThreshold={plan.aiCreditsAutoTopUpThreshold}
          currentCreditsToAdd={plan.aiCreditsAutoTopUpCreditsToAdd}
          currentMaxMonthlyLimit={plan.maxAutoTopUpCreditsMonthly}
        />
      </CardContent>
    </Card>
  );
}
