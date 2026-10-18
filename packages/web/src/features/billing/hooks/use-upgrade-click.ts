import { PlatformAdminSurface, TelemetryEventName } from '@activepieces/shared';

import { useTelemetry } from '@/components/providers/telemetry-provider';

import { FeatureKey } from '../components/request-trial';
import { FeatureTier } from '../utils/feature-tier';

import { billingDialogHooks } from './billing-dialog-hooks';

export function useUpgradeClick() {
  const { capture } = useTelemetry();
  const { openDialog } = billingDialogHooks.useManagePlanDialogStore();

  return ({ feature, tier, surface }: UpgradeClickParams) => {
    capture({
      name: TelemetryEventName.PLATFORM_ADMIN_UPGRADE_CLICKED,
      payload: { feature: feature ?? null, tier: tier ?? null, surface },
    });
    openDialog();
  };
}

type UpgradeClickParams = {
  feature?: FeatureKey;
  tier?: FeatureTier;
  surface: PlatformAdminSurface;
};
