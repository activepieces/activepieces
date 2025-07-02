import { t } from 'i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ManagePlanDialog } from '@/features/billing/components/manage-plan-dialog';

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
  | 'CUSTOM_ROLES';

type RequestTrialProps = {
  featureKey: FeatureKey;
  customButton?: React.ReactNode;
  buttonVariant?: 'default' | 'outline-primary';
};

export const RequestTrial = ({
  featureKey,
  buttonVariant = 'default',
}: RequestTrialProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant={buttonVariant} onClick={() => setIsOpen(true)}>
        {t('Upgrade Now')}
      </Button>
      <ManagePlanDialog open={isOpen} setOpen={setIsOpen} />
    </>
  );
};
