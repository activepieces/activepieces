import { t } from 'i18next';

import { PLATFORM_FEATURES, TIER_LABELS } from '@/features/billing';
import { usePlanTarget } from '@/features/billing/components/plan-locked-panel';
import { platformHooks } from '@/hooks/platform-hooks';

export function useCustomRolesLock(): CustomRolesLock {
  const { platform } = platformHooks.useCurrentPlatform();
  const tier = usePlanTarget(PLATFORM_FEATURES.projectRoles);
  return {
    locked: !platform.plan.customRolesEnabled,
    tierLabel: TIER_LABELS[tier],
    reason: t('Available on the {tier} plan', { tier: TIER_LABELS[tier] }),
  };
}

export type CustomRolesLock = {
  locked: boolean;
  tierLabel: string;
  reason: string;
};
