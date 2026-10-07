import { isNil, tryCatchSync } from '@activepieces/core-utils';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';

import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

export function EnterpriseTrialEndedDialog() {
  const { platform } = platformHooks.useCurrentPlatform();
  const trial = enterpriseTrialHooks.useTrial();
  const storageKey = `${SEEN_KEY_PREFIX}${platform.id}-${
    trial.endsAt?.toISOString() ?? 'unknown'
  }`;
  const [seenKey, setSeenKey] = useState<string | null>(null);
  const seen = seenKey === storageKey || readSeen(storageKey);

  const open = trial.state === 'ended' && trial.isPlatformAdmin && !seen;
  const close = () => {
    writeSeen(storageKey);
    setSeenKey(storageKey);
  };
  const rows = [
    { label: t('Enterprise features'), value: t('Switched off') },
    { label: t('Your plan'), value: trial.basePlanName },
    { label: t('Credits'), value: t('Unchanged') },
    { label: t('Flows, connections and data'), value: t('Kept') },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent
        onOpenAutoFocus={focusDialogItself}
        className="gap-5 p-6 sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex flex-col gap-2 pr-6">
          <DialogTitle className="text-base font-semibold">
            {t('Your Enterprise trial has ended')}
          </DialogTitle>
          <DialogDescription>
            {isNil(trial.endsAt)
              ? t('You are back on the {plan} plan.', {
                  plan: trial.basePlanName,
                })
              : t('It ended on {date}. You are back on the {plan} plan.', {
                  date: dayjs(trial.endsAt).format('MMM D'),
                  plan: trial.basePlanName,
                })}
          </DialogDescription>
        </div>
        <dl className="flex flex-col gap-2 rounded-xl border p-4 text-sm">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4"
            >
              <dt className="text-gray-11">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-sm text-gray-11">
          {t('Need more time to evaluate? Our team can extend it by 14 days.')}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild>
            <Link to="/platform/billing" onClick={close}>
              {t('Go to Billing')}
            </Link>
          </Button>
          <EnterpriseTrialSalesLink
            surface="enterprise_trial_ended"
            variant="default"
            label={t('Talk to sales')}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function focusDialogItself(event: Event): void {
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.focus();
  }
}

function readSeen(key: string): boolean {
  const { data } = tryCatchSync(() => window.localStorage.getItem(key));
  return data === 'true';
}

function writeSeen(key: string): void {
  tryCatchSync(() => window.localStorage.setItem(key, 'true'));
}

const SEEN_KEY_PREFIX = 'ap-enterprise-trial-ended-seen-';
