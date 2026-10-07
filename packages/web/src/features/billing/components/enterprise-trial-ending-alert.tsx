import { tryCatchSync } from '@activepieces/core-utils';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Hourglass, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';

import { trialEndsText } from './enterprise-trial-pill';
import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

export function EnterpriseTrialEndingAlert() {
  const trial = enterpriseTrialHooks.useTrial();
  const { platform } = platformHooks.useCurrentPlatform();
  const dismissKey = `${DISMISS_KEY_PREFIX}${platform.id}-${dayjs().format(
    'YYYY-MM-DD',
  )}`;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const dismissed = dismissedKey === dismissKey || readFlag(dismissKey);

  if (
    !trial.isPlatformAdmin ||
    trial.state !== 'active' ||
    !trial.lastDay ||
    dismissed
  ) {
    return null;
  }

  return (
    <div className={cn(DASHBOARD_CONTENT_PADDING_X, 'w-full pt-3')}>
      <div
        role="status"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-warning-7 bg-warning-3 px-3 py-2.5 text-sm"
      >
        <Hourglass className="size-4 shrink-0 text-warning-11" />
        <p className="min-w-0 flex-1 text-gray-12">
          <span className="font-medium">{trialEndsText(trial)}</span>{' '}
          <span className="text-gray-11">
            {t(
              'Enterprise features switch off then. Your flows and data stay.',
            )}
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-warning-7 bg-transparent text-warning-11 hover:bg-warning-4"
          >
            <Link to="/platform/billing">{t('Billing')}</Link>
          </Button>
          <EnterpriseTrialSalesLink
            surface="enterprise_trial_ending"
            size="sm"
            variant="default"
            className="bg-warning-9 text-on-warning hover:bg-warning-10"
            label={t('Talk to sales')}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('Dismiss for today')}
            className="text-warning-11 hover:bg-warning-4 hover:text-warning-12"
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

const DISMISS_KEY_PREFIX = 'ap-enterprise-trial-ending-dismissed-';
