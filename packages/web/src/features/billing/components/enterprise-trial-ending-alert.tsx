import { tryCatchSync } from '@activepieces/core-utils';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Hourglass, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';
import { useEnterpriseTrialDesignStore } from '../stores/enterprise-trial-design-state';

import { enterpriseTrialEndsWhen } from './enterprise-trial-pill';
import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

export function EnterpriseTrialEndingAlert() {
  const trial = enterpriseTrialHooks.useTrial();
  const { endedBanner } = useEnterpriseTrialDesignStore();
  const dismissKey = `${DISMISS_KEY_PREFIX}${dayjs().format('YYYY-MM-DD')}`;
  const [dismissed, setDismissed] = useState(() => readFlag(dismissKey));

  const ending = trial.state === 'active' && trial.lastDay;
  const ended = trial.state === 'ended' && endedBanner;
  if (!trial.isPlatformAdmin || (!ending && !ended)) {
    return null;
  }
  if (ending && dismissed) {
    return null;
  }

  return (
    <div className={cn(DASHBOARD_CONTENT_PADDING_X, 'w-full pt-3')}>
      <div
        role="status"
        className={cn(
          'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 text-sm',
          ended
            ? 'border-danger-7 bg-danger-3'
            : 'border-warning-7 bg-warning-3',
        )}
      >
        <Hourglass
          className={cn(
            'size-4 shrink-0',
            ended ? 'text-danger-11' : 'text-warning-11',
          )}
        />
        <p className="min-w-0 flex-1 text-gray-12">
          <span className="font-medium">
            {ended
              ? t('Your Enterprise trial has ended.')
              : t('Your Enterprise trial ends {when}.', {
                  when: enterpriseTrialEndsWhen(trial),
                })}
          </span>{' '}
          <span className="text-gray-11">
            {ended
              ? t('Enterprise features are off. Your flows and data are kept.')
              : t(
                  'Enterprise features switch off then. Your flows and data stay.',
                )}
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className={
              ended
                ? 'border-danger-7 bg-transparent text-danger-11 hover:bg-danger-4'
                : 'border-warning-7 bg-transparent text-warning-11 hover:bg-warning-4'
            }
          >
            <Link to="/platform/billing">{t('Billing')}</Link>
          </Button>
          <EnterpriseTrialSalesLink
            surface={
              ended ? 'enterprise_trial_ended' : 'enterprise_trial_ending'
            }
            size="sm"
            variant="default"
            className={
              ended
                ? 'bg-danger-9 text-on-danger hover:bg-danger-10'
                : 'bg-warning-9 text-on-warning hover:bg-warning-10'
            }
            label={t('Talk to sales')}
          />
          {ending && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('Dismiss for today')}
              className="text-warning-11 hover:bg-warning-4 hover:text-warning-12"
              onClick={() => {
                writeFlag(dismissKey);
                setDismissed(true);
              }}
            >
              <X className="size-3.5" />
            </Button>
          )}
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

const DISMISS_KEY_PREFIX = 'ap-enterprise-trial-ending-dismissed-';
