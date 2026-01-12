import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';

export type FeatureKey =
  | 'PROJECTS'
  | 'BRANDING'
  | 'PIECES'
  | 'TEMPLATES'
  | 'TEAM'
  | 'GLOBAL_CONNECTIONS'
  | 'USERS'
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
  | 'MCPS';

type RequestTrialProps = {
  featureKey: FeatureKey;
  customButton?: React.ReactNode;
  buttonVariant?: 'default' | 'outline-primary';
};

export const RequestTrial = ({
  featureKey,
  buttonVariant = 'default',
}: RequestTrialProps) => {
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: flags } = flagsHooks.useFlags();

  const createQueryParams = () => {
    const params = {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      featureKey,
      flags: btoa(JSON.stringify(flags)),
    };

    return Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  };

  const handleClick = () =>
    window.open(
      `https://www.activepieces.com/sales?${createQueryParams()}`,
      '_blank',
      'noopener noreferrer',
    );

  return (
    <Button variant={buttonVariant} onClick={handleClick}>
      {t('Contact Sales')}
    </Button>
  );
};
