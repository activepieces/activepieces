import { t } from 'i18next';
import * as React from 'react';

import { PageHeader } from '@/components/custom/page';

export function HealthHeader({ children }: { children?: React.ReactNode }) {
  return (
    <PageHeader
      title={t('Health')}
      description={t(
        'Whether the platform is set up well, and how its runs, queue and triggers are doing.',
      )}
    >
      {children}
    </PageHeader>
  );
}
