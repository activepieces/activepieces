import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { useSearchParams } from 'react-router-dom';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { CURSOR_QUERY_PARAM } from '@/components/custom/data-table';
import { DateTimePickerWithRange } from '@/components/custom/date-time-picker-range';
import { Page, PageSection } from '@/components/custom/page';
import { FeatureUsageCards, ProjectsUsageTable } from '@/features/billing';
import { platformHooks } from '@/hooks/platform-hooks';

export function UsageTab({ platform, info }: UsageTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const range = rangeFromParams(searchParams);
  return (
    <Page width="narrow">
      <AdminPageHeader page="usage" />
      <PageSection
        title={t('This billing period')}
        description={t(
          'What this platform has used of its plan. Figures can be a few minutes behind.',
        )}
      >
        <FeatureUsageCards platformSubscription={info} />
      </PageSection>
      <ProjectsUsageTable
        platformId={platform.id}
        range={range}
        rangePicker={
          <DateTimePickerWithRange
            presetType="past"
            from={range.from.toISOString()}
            to={range.to.toISOString()}
            onChange={(selected) => {
              if (selected?.from && selected?.to) {
                const { from, to } = selected;
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('from', from.toISOString());
                    next.set('to', to.toISOString());
                    next.delete(CURSOR_QUERY_PARAM);
                    return next;
                  },
                  { replace: true },
                );
              }
            }}
          />
        }
      />
    </Page>
  );
}

function rangeFromParams(params: URLSearchParams): { from: Date; to: Date } {
  const from = dayjs(params.get('from'));
  const to = dayjs(params.get('to'));
  if (
    params.has('from') &&
    params.has('to') &&
    from.isValid() &&
    to.isValid() &&
    !from.isAfter(to)
  ) {
    return { from: from.toDate(), to: to.toDate() };
  }
  return {
    from: dayjs().subtract(30, 'day').startOf('day').toDate(),
    to: dayjs().endOf('day').toDate(),
  };
}

type UsageTabProps = {
  platform: ReturnType<typeof platformHooks.useCurrentPlatform>['platform'];
  info: PlatformBillingInformation;
};
