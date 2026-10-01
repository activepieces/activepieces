import { isNil } from '@activepieces/core-utils';
import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import * as React from 'react';

import { Panel } from '@/components/custom/panel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatUtils } from '@/lib/format-utils';

import { billingUtils } from '../utils/billing-utils';

export const CurrentSubscriptionCard = ({
  info,
  hasLicenseKey = false,
  showNextInvoice = false,
  onExplorePlans,
  secondaryAction,
  onKeepPlan,
}: CurrentSubscriptionCardProps) => {
  const planName = planDisplayName({ info, hasLicenseKey });
  const summary = planSummary({ info, hasLicenseKey, planName });

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm text-gray-11">
            {showNextInvoice
              ? t('Next invoice · {date}', {
                  date: dayjs(info.nextBillingDate).format(DATE_FORMAT),
                })
              : t('Current plan')}
          </span>
          <span className="text-2xl font-semibold text-gray-12 tabular-nums">
            {showNextInvoice
              ? formatCurrency(info.nextBillingAmount)
              : planName}
          </span>
          {summary && <span className="text-sm text-gray-11">{summary}</span>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Button onClick={onExplorePlans}>{t('Change plan')}</Button>
          {secondaryAction}
        </div>
      </div>
      {!isNil(info.cancelAt) && (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span>
              {!isNil(info.scheduledPlanName)
                ? t('Switches to {plan} on {date}', {
                    plan: info.scheduledPlanName,
                    date: dayjs(info.cancelAt).format(DATE_FORMAT),
                  })
                : t(
                    'Your plan ends on {date}. Everything above Free stops then.',
                    { date: dayjs(info.cancelAt).format(DATE_FORMAT) },
                  )}
            </span>
            {onKeepPlan && (
              <Button size="sm" onClick={onKeepPlan}>
                {t('Keep my plan')}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </Panel>
  );
};

function planDisplayName({
  info,
  hasLicenseKey,
}: {
  info: PlatformBillingInformation;
  hasLicenseKey: boolean;
}): string {
  if (!isNil(info.autumnPlanName)) {
    return t('{plan} plan', { plan: info.autumnPlanName });
  }
  if (!billingUtils.isPaidPlan(info.plan.plan)) {
    return t('Free plan');
  }
  if (hasLicenseKey) {
    return t('Custom plan');
  }
  return t('{plan} plan', {
    plan: formatUtils.convertEnumToReadable(info.plan.plan),
  });
}

function planSummary({
  info,
  hasLicenseKey,
  planName,
}: {
  info: PlatformBillingInformation;
  hasLicenseKey: boolean;
  planName: string;
}): string | null {
  if (!isNil(info.trialEndsAt)) {
    return t('Trial ends {date}', {
      date: dayjs(info.trialEndsAt).format(DATE_FORMAT),
    });
  }
  if (!isNil(info.planInterval) && billingUtils.isPaidPlan(info.plan.plan)) {
    return billingUtils.isYearlyPlan(info)
      ? t('{plan} · billed yearly', { plan: planName })
      : t('{plan} · billed monthly', { plan: planName });
  }
  if (hasLicenseKey) {
    return t('Activated with a license key.');
  }
  return null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

const DATE_FORMAT = 'D MMM YYYY';

type CurrentSubscriptionCardProps = {
  info: PlatformBillingInformation;
  hasLicenseKey?: boolean;
  showNextInvoice?: boolean;
  onExplorePlans: () => void;
  secondaryAction?: React.ReactNode;
  onKeepPlan?: () => void;
};
