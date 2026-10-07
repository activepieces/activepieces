import dayjs from 'dayjs';
import { t } from 'i18next';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  ENTERPRISE_TRIAL_DAYS,
  enterpriseTrialHooks,
} from '../hooks/enterprise-trial-hooks';
import { useCreditsUsage } from '../hooks/use-credits-usage';
import { useEnterpriseTrialDialogStore } from '../stores/enterprise-trial-dialog-state';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

export function EnterpriseTrialBillingStatus() {
  const trial = enterpriseTrialHooks.useTrial();
  const { isPaid } = useCreditsUsage();
  const { openDialog } = useEnterpriseTrialDialogStore();

  if (trial.state === 'eligible') {
    return (
      <StatusCallout
        tone="accent"
        title={t('Try Enterprise free for {days} days', {
          days: ENTERPRISE_TRIAL_DAYS,
        })}
        description={t(
          'Every Enterprise feature plus unlimited users and team projects. No card needed, and your credits stay the same.',
        )}
        action={
          <Button onClick={() => openDialog({})}>
            {t('Start free trial')}
          </Button>
        }
      />
    );
  }

  if (trial.state === 'active' && isPaid) {
    return (
      <StatusCallout
        title={t('Enterprise trial · ends {date}', {
          date: dayjs(trial.endsAt).format('MMM D, YYYY'),
        })}
        description={t(
          'Enterprise features are on until then, next to your {plan} plan. Your credits are not affected. To keep Enterprise features, talk to sales.',
          { plan: trial.basePlanName },
        )}
        action={
          <EnterpriseTrialSalesLink
            surface="enterprise_trial_billing"
            label={t('Talk to sales')}
          />
        }
      />
    );
  }

  if (trial.state === 'ended' || trial.state === 'used') {
    return (
      <StatusCallout
        title={
          trial.endsAt
            ? t('Your Enterprise trial ended on {date}', {
                date: dayjs(trial.endsAt).format('MMM D, YYYY'),
              })
            : t('Your Enterprise trial was already used')
        }
        description={t(
          'Enterprise features are switched off. Our team can extend it by 14 days.',
        )}
        action={
          <EnterpriseTrialSalesLink
            surface="enterprise_trial_billing"
            label={t('Talk to sales')}
          />
        }
      />
    );
  }

  return null;
}

function StatusCallout({
  title,
  description,
  action,
  tone = 'neutral',
}: {
  title: string;
  description: string;
  action: ReactNode;
  tone?: 'neutral' | 'accent';
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border px-5 py-5',
        tone === 'accent' ? 'border-accent-6 bg-accent-2' : 'bg-gray-1',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-base font-semibold">{title}</span>
        <span className="max-w-3xl text-sm text-pretty text-gray-11">
          {description}
        </span>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
