import { isNil } from '@activepieces/core-utils';
import {
  TelemetryEventName,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { t } from 'i18next';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { SendIcon } from '@/components/icons/send';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { userHooks } from '@/hooks/user-hooks';
import { telemetryUtils } from '@/lib/telemetry-utils';

export const RequestTrial = ({
  featureKey,
  plan,
  buttonVariant = 'default',
  buttonSize = 'default',
}: RequestTrialProps) => {
  const { data: currentUser } = userHooks.useCurrentUser();
  const { capture } = useTelemetry();

  const handleClick = () => {
    capture({
      name: TelemetryEventName.SALES_HANDOFF_CLICKED,
      payload: { featureKey, plan, surface: 'locked_feature' },
    });
    window.open(
      buildSalesUrl({ currentUser, featureKey, plan }),
      '_blank',
      'noopener noreferrer',
    );
  };

  return (
    <AnimatedIconButton
      variant={buttonVariant}
      size={buttonSize}
      onClick={handleClick}
      icon={SendIcon}
      iconSize={14}
    >
      {t('Contact Sales')}
    </AnimatedIconButton>
  );
};

function buildSalesUrl({
  currentUser,
  featureKey,
  plan,
}: {
  currentUser: UserWithMetaInformation | null | undefined;
  featureKey: FeatureKey;
  plan: string | undefined;
}): string {
  const url = new URL(SALES_URL);
  url.searchParams.set('email', currentUser?.email ?? '');
  url.searchParams.set('firstName', currentUser?.firstName ?? '');
  url.searchParams.set('lastName', currentUser?.lastName ?? '');
  url.searchParams.set('featureKey', featureKey);
  if (!isNil(plan)) {
    url.searchParams.set('plan', plan);
  }
  url.searchParams.set('ap_cta', `app_${featureKey.toLowerCase()}`);
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

type RequestTrialProps = {
  featureKey: FeatureKey;
  plan?: string;
  customButton?: React.ReactNode;
  buttonVariant?: 'default' | 'basic';
  buttonSize?: 'default' | 'sm' | 'xs';
};
