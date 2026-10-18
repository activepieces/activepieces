import { isNil } from '@activepieces/core-utils';
import { UserWithMetaInformation } from '@activepieces/shared';

import { userHooks } from '@/hooks/user-hooks';
import { telemetryUtils } from '@/lib/telemetry-utils';

export function useSalesUrl(featureKey?: FeatureKey): string {
  const { data: currentUser } = userHooks.useCurrentUser();
  return buildSalesUrl({ currentUser, featureKey });
}

function buildSalesUrl({
  currentUser,
  featureKey,
}: {
  currentUser: UserWithMetaInformation | null | undefined;
  featureKey: FeatureKey | undefined;
}): string {
  const url = new URL(SALES_URL);
  url.searchParams.set('email', currentUser?.email ?? '');
  url.searchParams.set('firstName', currentUser?.firstName ?? '');
  url.searchParams.set('lastName', currentUser?.lastName ?? '');
  if (!isNil(featureKey)) {
    url.searchParams.set('featureKey', featureKey);
  }
  url.searchParams.set(
    'ap_cta',
    isNil(featureKey)
      ? 'app_enterprise_trial'
      : `app_${featureKey.toLowerCase()}`,
  );
  const sessionId = telemetryUtils.getSessionId();
  if (!isNil(sessionId)) {
    url.searchParams.set('ap_sid', sessionId);
  }
  return url.toString();
}

const SALES_URL = 'https://www.activepieces.com/sales';

export type FeatureKey =
  | 'PROJECTS'
  | 'BRANDING'
  | 'PIECES'
  | 'TEMPLATES'
  | 'TEAM'
  | 'GLOBAL_CONNECTIONS'
  | 'USERS'
  | 'EVENT_DESTINATIONS'
  | 'API'
  | 'SSO'
  | 'AUDIT_LOGS'
  | 'ENVIRONMENT'
  | 'ISSUES'
  | 'ANALYTICS'
  | 'ALERTS'
  | 'ENTERPRISE_PIECES'
  | 'UNIVERSAL_AI'
  | 'SIGNING_KEYS'
  | 'CUSTOM_ROLES'
  | 'AGENTS'
  | 'TABLES'
  | 'TODOS'
  | 'BILLING'
  | 'MCPS'
  | 'SECRET_MANAGERS'
  | 'DEDICATED_WORKERS';
