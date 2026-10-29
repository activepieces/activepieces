import {
  PlanName,
  PlatformAdminSurface,
  TelemetryEventName,
} from '@activepieces/shared';

import { useTelemetry } from '@/components/providers/telemetry-provider';

import { FeatureKey } from '../utils/platform-features';

import { billingDialogHooks } from './billing-dialog-hooks';

export function useUpgradeClick() {
  const { capture } = useTelemetry();
  const { openDialog } = billingDialogHooks.useManagePlanDialogStore();

  return ({ feature, plan, surface }: UpgradeClickParams) => {
    capture({
      name: TelemetryEventName.PLATFORM_ADMIN_UPGRADE_CLICKED,
      payload: { feature: feature ?? null, tier: plan ?? null, surface },
    });
    openDialog();
  };
}

type UpgradeClickParams = {
  feature?: FeatureKey;
  plan?: PlanName;
  surface: PlatformAdminSurface;
};
