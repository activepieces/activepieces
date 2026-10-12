import { PlatformAdminSurface, TelemetryEventName } from '@activepieces/shared';

import { useTelemetry } from '@/components/providers/telemetry-provider';

import { FeatureKey } from '../components/request-trial';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';
import { FeatureTier } from '../utils/feature-tier';

export function useUpgradeClick() {
  const { capture } = useTelemetry();
  const { openDialog } = useManagePlanDialogStore();

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
