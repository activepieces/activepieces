import { isNil, tryCatchSync } from '@activepieces/core-utils';
import { PlatformAdminSurface } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { authenticationSession } from '@/lib/authentication-session';

import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';
import { useUpgradeClick } from '../hooks/use-upgrade-click';
import { enterpriseTrialFeatures } from '../utils/enterprise-trial-features';
import { enterpriseTrialTime } from '../utils/enterprise-trial-time';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';
import { EnterpriseTrialSeatDialog } from './enterprise-trial-seat-dialog';

export function EnterpriseTrialEndedDialog() {
  const { platform } = platformHooks.useCurrentPlatform();
  const trial = enterpriseTrialHooks.useTrial();
  const upgradeClick = useUpgradeClick();
  const storageKey = `${SEEN_KEY_PREFIX}${platform.id}-${
    authenticationSession.getCurrentUserId() ?? 'unknown'
  }-${trial.endsAt?.toISOString() ?? 'unknown'}`;
  const [seenKey, setSeenKey] = useState<string | null>(null);
  const seen = seenKey === storageKey || readSeen(storageKey);

  const recent =
    !isNil(trial.endsAt) &&
    enterpriseTrialTime.calendarDaysBetween({
      from: trial.endsAt,
      to: Date.now(),
    }) <= SHOW_FOR_DAYS;
  const open =
    trial.state === 'ended' && trial.isPlatformAdmin && recent && !seen;
  const close = () => {
    writeSeen(storageKey);
    setSeenKey(storageKey);
  };
  const paused = enterpriseTrialFeatures.pausedAfterTrial(platform.plan.plan);
  const kept = [t('Flows, connections and data'), t('Your credits')];

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent
          onOpenAutoFocus={focusDialogItself}
          className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto p-7 sm:max-w-lg sm:rounded-2xl"
        >
          <div className="flex flex-col gap-2 pr-6">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {t('Thanks for trying the Enterprise plan')}
            </DialogTitle>
            <DialogDescription className="text-base text-pretty">
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
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-gray-12">
              {t('Everything you built is still here')}
            </span>
            <ul className="flex flex-col gap-2.5">
              {kept.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm text-gray-12"
                >
                  <Check className="size-4 shrink-0 text-success-11" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {paused.length > 0 && (
            <div className="flex flex-col gap-3 border-t pt-5">
              <span className="text-sm text-gray-11">{t('Paused for now')}</span>
              <ul className="flex flex-wrap gap-2">
                {paused.map((feature) => (
                  <li
                    key={feature.title}
                    className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-gray-11"
                  >
                    <feature.icon className="size-3.5 shrink-0 text-gray-9" />
                    {feature.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-sm text-gray-11">
            {t(
              'Our team can extend your trial or set you up on the Enterprise plan.',
            )}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              {...adminControl(AdminControl.TRIAL_PLANS_OPEN)}
              variant="outline"
              onClick={() => {
                close();
                upgradeClick({ surface: PlatformAdminSurface.DIALOG });
              }}
            >
              {t('Explore plans')}
            </Button>
            <EnterpriseTrialSalesLink
              surface="enterprise_trial_ended"
              variant="default"
              label={t('Talk to sales')}
            />
          </div>
        </DialogContent>
      </Dialog>
      {!open && <EnterpriseTrialSeatDialog />}
    </>
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
const SHOW_FOR_DAYS = 14;
