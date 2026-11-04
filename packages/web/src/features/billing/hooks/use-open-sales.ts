import { isNil } from '@activepieces/core-utils';
import {
  PlatformAdminSurface,
  TelemetryEventName,
  UserWithMetaInformation,
} from '@activepieces/shared';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { userHooks } from '@/hooks/user-hooks';
import { telemetryUtils } from '@/lib/telemetry-utils';

import { FeatureKey } from '../components/request-trial';

export function useOpenSales({ featureKey, surface }: OpenSalesParams) {
  const { data: currentUser } = userHooks.useCurrentUser();
  const { capture } = useTelemetry();

  return () => {
    if (surface !== undefined) {
      capture({
        name: TelemetryEventName.PLATFORM_ADMIN_SALES_CONTACTED,
        payload: { feature: featureKey, surface },
      });
    }
    capture({
      name: TelemetryEventName.SALES_HANDOFF_CLICKED,
      payload: { featureKey, surface: 'locked_feature' },
    });
    window.open(
      buildSalesUrl({ currentUser, featureKey }),
      '_blank',
      'noopener noreferrer',
    );
  };
}

function buildSalesUrl({
  currentUser,
  featureKey,
}: {
  currentUser: UserWithMetaInformation | null | undefined;
  featureKey: FeatureKey;
}): string {
  const url = new URL(SALES_URL);
  url.searchParams.set('email', currentUser?.email ?? '');
  url.searchParams.set('firstName', currentUser?.firstName ?? '');
  url.searchParams.set('lastName', currentUser?.lastName ?? '');
  url.searchParams.set('featureKey', featureKey);
  url.searchParams.set('ap_cta', `app_${featureKey.toLowerCase()}`);
  const sessionId = telemetryUtils.getSessionId();
  if (!isNil(sessionId)) {
    url.searchParams.set('ap_sid', sessionId);
  }
  return url.toString();
}

const SALES_URL = 'https://www.activepieces.com/sales';

export type OpenSalesParams = {
  featureKey: FeatureKey;
  surface?: Exclude<PlatformAdminSurface, PlatformAdminSurface.DIALOG>;
};
