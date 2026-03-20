import {
  AiCreditsAutoTopUpState,
  ApEdition,
  ApFlagId,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Sparkles, Settings } from 'lucide-react';
import { useState } from 'react';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { flagsHooks } from '@/hooks/flags-hooks';
import { isRunningCloudInDevMode } from '@/lib/api';

import { billingMutations } from '../../hooks/billing-hooks';

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

  const totalCreditsUsed = usage.totalAiCreditsUsed;
  const creditsRemaining = usage.aiCreditsRemaining;
  const isCloud = window.location.hostname.includes('cloud.activepieces.com');
  const autoTopUpState =
    plan.aiCreditsAutoTopUpState ?? AiCreditsAutoTopUpState.DISABLED;

  const canBuyCredits = flagsHooks.useFlag<ApEdition>(
    ApFlagId.CAN_BUY_AI_CREDITS,
  );
  const isAutoTopUpEnabled = autoTopUpState === AiCreditsAutoTopUpState.ENABLED;

  const { mutate: updateAutoTopUp, isPending: isDisablingAutoTopUp } =
    billingMutations.useUpdateAutoTopUp(queryClient);

  if (!isCloud && !isRunningCloudInDevMode) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Sparkles />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('AI Credits')}</ItemTitle>
          <ItemDescription>
            {Math.round(creditsRemaining).toLocaleString()}{' '}
            {t('credits available')}
            <span className="ml-2 text-xs">
              ({t('Total used')}:{' '}
              {Math.round(totalCreditsUsed).toLocaleString()})
            </span>
          </ItemDescription>
        </ItemContent>
        {canBuyCredits && (
          <ItemActions>
            <Button
              variant="basic"
              size="sm"
              onClick={() => setIsPurchaseDialogOpen(true)}
            >
              {t('Purchase Credits')}
            </Button>
          </ItemActions>
        )}
      </Item>

      {canBuyCredits && (
        <Item variant="outline">
          <ItemMedia variant="icon">
            <Settings />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{t('Auto Top-up')}</ItemTitle>
            <ItemDescription>
              {isAutoTopUpEnabled
                ? buildAutoTopUpSummary(plan)
                : t('Automatically purchase credits when balance is low.')}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            {isAutoTopUpEnabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsAutoTopUpEditing(true);
                  setIsAutoTopUpDialogOpen(true);
                }}
              >
                <Settings className="size-4" />
              </Button>
            )}
            <Switch
              checked={isAutoTopUpEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  setIsAutoTopUpEditing(false);
                  setIsAutoTopUpDialogOpen(true);
                } else {
                  updateAutoTopUp({ state: AiCreditsAutoTopUpState.DISABLED });
                }
              }}
              disabled={isDisablingAutoTopUp}
            />
          </ItemActions>
        </Item>
      )}

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
    </div>
  );
}

function buildAutoTopUpSummary(plan: PlatformBillingInformation['plan']) {
  if (plan.aiCreditsAutoTopUpThreshold && plan.aiCreditsAutoTopUpCreditsToAdd) {
    return t('Adds {credits} credits when below {threshold}', {
      credits: plan.aiCreditsAutoTopUpCreditsToAdd.toLocaleString(),
      threshold: plan.aiCreditsAutoTopUpThreshold.toLocaleString(),
    });
  }
  return t('Enabled');
}
