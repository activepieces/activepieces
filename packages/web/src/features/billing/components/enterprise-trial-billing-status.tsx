import dayjs from 'dayjs';
import { t } from 'i18next';
import { Gem } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import {
  ENTERPRISE_TRIAL_DAYS,
  enterpriseTrialHooks,
} from '../hooks/enterprise-trial-hooks';
import { useCreditsUsage } from '../hooks/use-credits-usage';
import { enterpriseMotion } from '../utils/enterprise-motion';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

export function EnterpriseTrialBillingStatus() {
  const trial = enterpriseTrialHooks.useTrial();
  const { isPaid } = useCreditsUsage();
  const { openDialog } = billingDialogHooks.useEnterpriseTrialDialogStore();

  if (trial.state === 'eligible') {
    return (
      <StatusCallout
        tone="accent"
        title={t('Try the Enterprise plan free for {days} days', {
          days: ENTERPRISE_TRIAL_DAYS,
        })}
        description={t(
          'Single sign-on, audit logs, your own AI providers and more, for everyone on your platform. No credit card, nothing to cancel.',
        )}
        action={
          <Button onClick={() => openDialog({})}>
            <Gem />
            {t('Start free {days}-day trial', { days: ENTERPRISE_TRIAL_DAYS })}
          </Button>
        }
      />
    );
  }

  if (trial.state === 'active' && isPaid) {
    return (
      <StatusCallout
        title={t('Enterprise plan trial · ends {date}', {
          date: dayjs(trial.endsAt).format('MMM D'),
        })}
        description={t(
          'Enterprise plan features run next to your {plan} plan until then. Talk to our team to keep them.',
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
            ? t('Your Enterprise plan trial ended on {date}', {
                date: dayjs(trial.endsAt).format('MMM D'),
              })
            : t('Your Enterprise plan trial was already used')
        }
        description={t(
          'Enterprise plan features are paused and nothing was deleted. Our team can extend your trial or set you up on the Enterprise plan.',
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
        enterpriseMotion.appear,
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-3 text-accent-11">
        <Gem className="size-5" />
      </div>
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
