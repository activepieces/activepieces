import { t } from 'i18next';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { SendIcon } from '@/components/icons/send';

import { OpenSalesParams, useOpenSales } from '../hooks/use-open-sales';

export const RequestTrial = ({
  featureKey,
  surface,
  buttonVariant = 'default',
  buttonSize = 'default',
}: RequestTrialProps) => {
  const openSales = useOpenSales({ featureKey, surface });

  return (
    <AnimatedIconButton
      variant={buttonVariant}
      size={buttonSize}
      onClick={openSales}
      icon={SendIcon}
      iconSize={14}
    >
      {t('Contact Sales')}
    </AnimatedIconButton>
  );
};

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

type RequestTrialProps = OpenSalesParams & {
  customButton?: React.ReactNode;
  buttonVariant?: 'default' | 'basic';
  buttonSize?: 'default' | 'sm' | 'xs';
};
