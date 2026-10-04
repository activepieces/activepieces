import { t } from 'i18next';
import * as React from 'react';

import { PageHeader } from '@/components/custom/page';

export function BillingHeader({ children }: { children?: React.ReactNode }) {
  return (
    <PageHeader
      title={t('Billing')}
      description={t(
        'Your plan, credits, seats and where the credits go. For billing questions, write to support@activepieces.com.',
      )}
    >
      {children}
    </PageHeader>
  );
}
