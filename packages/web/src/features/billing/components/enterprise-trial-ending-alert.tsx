import { tryCatchSync } from '@activepieces/core-utils';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Gem, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';
import { enterpriseMotion } from '../utils/enterprise-motion';

import { trialEndsText } from './enterprise-trial-pill';
import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

export function EnterpriseTrialEndingAlert() {
  const trial = enterpriseTrialHooks.useTrial();
  const { platform } = platformHooks.useCurrentPlatform();
  const { openDialog: openPlans } =
    billingDialogHooks.useManagePlanDialogStore();
  const ending = trial.lastDay;
  const dismissKey = ending
    ? `${ENDING_DISMISS_KEY_PREFIX}${platform.id}-${dayjs().format(
        'YYYY-MM-DD',
      )}`
    : `${STARTED_DISMISS_KEY_PREFIX}${platform.id}`;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const dismissed = dismissedKey === dismissKey || readFlag(dismissKey);

  if (!trial.isPlatformAdmin || trial.state !== 'active' || dismissed) {
    return null;
  }

  const tone =
    ending && dayjs(trial.endsAt).isSame(dayjs(), 'day')
      ? TONE.today
      : TONE.soon;

  return (
    <div className={cn(DASHBOARD_CONTENT_PADDING_X, 'w-full pt-3')}>
      <div
        role="status"
        data-slot="enterprise-trial-banner"
        className={cn(
          'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 text-sm',
          tone.surface,
          enterpriseMotion.appear,
        )}
      >
        <Gem className={cn('size-4 shrink-0', tone.icon)} />
        <p className="min-w-0 flex-1 basis-64 text-gray-12">
          {ending ? (
            <>
              <span className="font-medium">{trialEndsText(trial)}</span>{' '}
              <span className="text-gray-11">
                {t(
                  'Want to keep the Enterprise plan? Talk to our team. Nothing is deleted either way.',
                )}
              </span>
            </>
          ) : (
            <>
              <span className="font-medium">
                {t(
                  'You are on a free trial of the Enterprise plan until {date}.',
                  {
                    date: dayjs(trial.endsAt).format('MMM D'),
                  },
                )}
              </span>{' '}
              <span className="text-gray-11">
                {t(
                  'Single sign-on, audit logs, your own AI providers and every other Enterprise plan feature are on for your whole platform.',
                )}
              </span>
            </>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {ending && (
            <>
              <Button
                variant="outline"
                size="sm"
                className={tone.secondary}
                onClick={openPlans}
              >
                {t('Explore plans')}
              </Button>
              <EnterpriseTrialSalesLink
                surface="enterprise_trial_ending"
                size="sm"
                variant="default"
                className={tone.primary}
                label={t('Talk to sales')}
              />
            </>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={ending ? t('Dismiss for today') : t('Dismiss')}
            className={tone.dismiss}
            onClick={() => {
              writeFlag(dismissKey);
              setDismissedKey(dismissKey);
            }}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function readFlag(key: string): boolean {
  const { data } = tryCatchSync(() => window.localStorage.getItem(key));
  return data === 'true';
}

function writeFlag(key: string): void {
  tryCatchSync(() => window.localStorage.setItem(key, 'true'));
}

const TONE = {
  soon: {
    surface: 'border-accent-7 bg-accent-3',
    icon: 'text-accent-11',
    secondary:
      'border-accent-7 bg-transparent text-accent-11 hover:bg-accent-4',
    primary: '',
    dismiss: 'text-accent-11 hover:bg-accent-4 hover:text-accent-12',
  },
  today: {
    surface: 'border-warning-7 bg-warning-3',
    icon: 'text-warning-11',
    secondary:
      'border-warning-7 bg-transparent text-warning-11 hover:bg-warning-4',
    primary: 'bg-warning-9 text-on-warning hover:bg-warning-10',
    dismiss: 'text-warning-11 hover:bg-warning-4 hover:text-warning-12',
  },
};

const ENDING_DISMISS_KEY_PREFIX = 'ap-enterprise-trial-ending-dismissed-';
const STARTED_DISMISS_KEY_PREFIX = 'ap-enterprise-trial-started-dismissed-';
