import { isNil } from '@activepieces/core-utils';
import { PlatformUsage } from '@activepieces/shared';

import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { billingUtils, CreditsSeverity } from '../utils/billing-utils';

export function useCreditsUsage(): CreditsUsage {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();

  const usage = platform.usage;
  const creditsRemaining = usage?.creditsRemaining ?? null;
  const isUnlimited = isNil(creditsRemaining);
  const creditsUsed = Math.round(usage?.creditsUsed ?? 0);
  const total = isUnlimited ? 0 : creditsUsed + Math.round(creditsRemaining);
  const percentUsed = billingUtils.percentUsed({ used: creditsUsed, total });

  return {
    platformId: platform.id,
    usage,
    isPlatformAdmin,
    isPaid: billingUtils.isPaidPlan(platform.plan.plan),
    isBillingEnforced: platform.billingEnforced === true,
    creditsRemaining,
    isUnlimited,
    percentUsed,
    severity: billingUtils.creditsSeverity(percentUsed),
  };
}

export type CreditsUsage = {
  platformId: string;
  usage: PlatformUsage | undefined;
  isPlatformAdmin: boolean;
  isPaid: boolean;
  isBillingEnforced: boolean;
  creditsRemaining: number | null;
  isUnlimited: boolean;
  percentUsed: number;
  severity: CreditsSeverity;
};
