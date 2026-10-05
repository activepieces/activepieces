import { isNil } from '@activepieces/core-utils';
import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import * as React from 'react';

import { Panel } from '@/components/custom/panel';
import { Meter } from '@/components/custom/stats';

import { billingUtils, CreditsResetLine } from '../../utils/billing-utils';

import { CreditsInfoDialog } from './credits-info-dialog';

export const CreditsCard = ({ info, children }: CreditsCardProps) => {
  const { plan, usage } = info;
  const total = plan.includedCredits;
  const isUnlimited = isNil(usage.creditsRemaining) || total <= 0;
  const used = isUnlimited
    ? usage.creditsUsed
    : Math.max(0, total - (usage.creditsRemaining ?? 0));
  const footer = resolveFooter(info);
  const switchesToPlanName =
    info.scheduledPlanName ??
    (info.billingPortalAvailable ? info.autumnPlanName : t('Free'));

  return (
    <Panel
      title={t('Credits')}
      description={t('What you spend to run flows, AI steps and chat.')}
      action={<CreditsInfoDialog />}
      flush
    >
      <div className="flex flex-col gap-2 p-4">
        <Meter
          value={isUnlimited ? 0 : used}
          max={isUnlimited ? 1 : total}
          label={t('{amount} credits used', {
            amount: Math.round(used).toLocaleString(),
          })}
          limit={
            isUnlimited
              ? t('No credit limit on this plan')
              : t('of {total}', { total: total.toLocaleString() })
          }
        />
        {!isNil(footer) && (
          <span className="text-xs text-gray-11">
            {footer.label} {footer.value}
            {!isNil(info.trialEndsAt) &&
              !isNil(switchesToPlanName) &&
              ` · ${t('Then switches to the {plan} plan', {
                plan: switchesToPlanName,
              })}`}
          </span>
        )}
      </div>
      {children}
    </Panel>
  );
};

function resolveFooter(
  info: PlatformBillingInformation,
): CreditsResetLine | null {
  if (!isNil(info.trialEndsAt)) {
    return {
      label: t('Trial ends'),
      value: dayjs(info.trialEndsAt).format(CARD_DATE_FORMAT),
    };
  }
  return billingUtils.resolveCreditsReset({
    creditsNextResetAt: info.usage.creditsNextResetAt,
    creditsResetInterval: info.creditsResetInterval,
    nextBillingDate: info.nextBillingDate,
    dateFormat: CARD_DATE_FORMAT,
  });
}

const CARD_DATE_FORMAT = 'D MMM YYYY';

type CreditsCardProps = {
  info: PlatformBillingInformation;
  children?: React.ReactNode;
};
