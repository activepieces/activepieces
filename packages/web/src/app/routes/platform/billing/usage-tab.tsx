import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { useState } from 'react';

import { AdminTabs } from '@/app/routes/platform/admin-tabs';
import { DateTimePickerWithRange } from '@/components/custom/date-time-picker-range';
import { Page, PageSection } from '@/components/custom/page';
import { FeatureUsageCards, ProjectsUsageTable } from '@/features/billing';
import { platformHooks } from '@/hooks/platform-hooks';

import { BillingHeader } from './billing-header';

export function UsageTab({ platform, info }: UsageTabProps) {
  const [range, setRange] = useState<{ from: Date; to: Date }>(() => ({
    from: dayjs().subtract(30, 'day').startOf('day').toDate(),
    to: dayjs().endOf('day').toDate(),
  }));
  return (
    <Page width="narrow">
      <BillingHeader>
        <DateTimePickerWithRange
          presetType="past"
          from={range.from.toISOString()}
          to={range.to.toISOString()}
          onChange={(selected) => {
            if (selected?.from && selected?.to) {
              setRange({ from: selected.from, to: selected.to });
            }
          }}
        />
      </BillingHeader>
      <AdminTabs section="billing" />
      <PageSection
        title={t('This billing period')}
        description={t(
          'What this platform has used of its plan. Figures can be a few minutes behind.',
        )}
      >
        <FeatureUsageCards platformSubscription={info} />
      </PageSection>
      <ProjectsUsageTable platformId={platform.id} range={range} />
    </Page>
  );
}

type UsageTabProps = {
  platform: ReturnType<typeof platformHooks.useCurrentPlatform>['platform'];
  info: PlatformBillingInformation;
};
