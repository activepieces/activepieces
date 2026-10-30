import { isNil } from '@activepieces/core-utils';
import {
  PlatformBillingInformation,
  TelemetryEventName,
  UserWithMetaInformation,
  SalesLinkLocationInWebApp,
  PlanName,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Gem } from 'lucide-react';

import nonFreePlanBg from '@/assets/img/custom/non-free-plan-bg.jpg';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { telemetryUtils } from '@/lib/telemetry-utils';
import { cn } from '@/lib/utils';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import {
  selfServeTrialHooks,
  SELF_SERVE_TRIAL_DAYS,
} from '../hooks/self-serve-trial-hooks';
import { billingUtils, enterpriseMotion } from '../utils/billing-utils';
import { FeatureKey } from '../utils/platform-features';
import {
  selfServeTrialCopy,
  selfServeTrialTime,
} from '../utils/self-serve-trial-utils';

export const CurrentSubscriptionCard = ({
  info,
  onExplorePlans,
}: CurrentSubscriptionCardProps) => {
  const isPaid = billingUtils.isPaidPlan(info.plan.plan);
  const isYearly = billingUtils.isYearlyPlan(info);
  const { platform } = platformHooks.useCurrentPlatform();
  const trial = platform.selfServeTrial;
  if (selfServeTrialTime.isRunning(trial)) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border bg-panel p-5">
        <div className="flex items-center gap-2 text-sm text-gray-11">
          <Gem className="size-4 text-accent-11" />
          {t('Current plan')}
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="text-2xl font-semibold">
              {t('Enterprise plan trial')}
            </span>
            <Badge variant="outline" className="rounded-full">
              {selfServeTrialCopy.daysLeftCopy(trial.endsAt)}
            </Badge>
          </span>
          <span className="text-sm text-gray-11">
            {selfServeTrialCopy.trialEndSummary(trial.endsAt)}{' '}
            {t('After that, you are back on {plan}.', {
              plan: info.autumnPlanName,
            })}
          </span>
        </div>
        <SelfServeTrialSalesLink
          locationInWebApp={SalesLinkLocationInWebApp.ENTERPRISE_TRIAL_BILLING}
          variant="default"
        />
      </div>
    );
  }

  if (isPaid) {
    return (
      <div
        data-theme="light"
        className="flex flex-col gap-6 rounded-xl bg-cover bg-center p-5"
        style={{ backgroundImage: `url(${nonFreePlanBg})` }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-2xl font-semibold text-gray-12">
            {info.autumnPlanName}
          </span>
          <Badge className="border-0 bg-panel text-accent-11 shadow-edge">
            {isYearly ? t('Yearly') : t('Monthly')}
          </Badge>
        </div>
        <Button
          {...adminControl(AdminControl.BILLING_UPGRADE_OPEN)}
          className="w-full text-gray-12 shadow-edge"
          onClick={onExplorePlans}
          variant={'outline'}
        >
          {t('Upgrade')}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-accent-6 p-5',
        'bg-accent-3',
      )}
    >
      <span className="text-sm text-gray-11">{t('Current plan')}</span>
      <div className="text-2xl font-semibold">{info.autumnPlanName}</div>
      <Button
        {...adminControl(AdminControl.BILLING_UPGRADE_OPEN)}
        className="w-full"
        onClick={onExplorePlans}
      >
        {t('Upgrade')}
      </Button>
    </div>
  );
};

export function SelfServeTrialBillingStatus() {
  const shouldOfferTrial = selfServeTrialHooks.useShouldOfferTrial();
  const { openDialog } = billingDialogHooks.useSelfServeTrialDialogStore();

  if (!shouldOfferTrial) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-accent-6 bg-accent-2 px-5 py-5',
        enterpriseMotion.appear,
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-3 text-accent-11">
        <Gem className="size-5" />
      </div>
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <span className="text-base font-semibold">
          {t('Try the Enterprise plan free for {days} days', {
            days: SELF_SERVE_TRIAL_DAYS,
          })}
        </span>
        <span className="max-w-3xl text-sm text-pretty text-gray-11">
          {t(
            'Single sign-on, audit logs, your own AI providers and more, for everyone on your platform. No credit card, nothing to cancel.',
          )}
        </span>
      </div>
      <Button
        {...adminControl(AdminControl.TRIAL_START_OPEN)}
        className="shrink-0"
        onClick={() => openDialog({})}
      >
        {t('Start free trial')}
      </Button>
    </div>
  );
}

export function SelfServeTrialSalesLink({
  locationInWebApp,
  size,
  variant = 'outline',
  className,
  featureKey,
  onClick,
}: SelfServeTrialSalesLinkProps) {
  const salesLink = useSalesLink({ locationInWebApp, featureKey, onClick });
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a {...salesLink}>
        {t('Talk to sales')}
        <span className="sr-only"> {t('(opens in a new tab)')}</span>
      </a>
    </Button>
  );
}

export function useSalesLink({
  locationInWebApp,
  featureKey,
  onClick,
}: {
  locationInWebApp: SalesLinkLocationInWebApp;
  featureKey?: FeatureKey;
  onClick?: () => void;
}) {
  const { capture } = useTelemetry();
  const { data: currentUser } = userHooks.useCurrentUser();
  return {
    ...adminControl(AdminControl.TRIAL_SALES_LINK),
    href: buildSalesUrl({ currentUser, featureKey }),
    target: '_blank',
    rel: 'noopener noreferrer',
    onClick: () => {
      onClick?.();
      capture({
        name: TelemetryEventName.SALES_HANDOFF_CLICKED,
        payload: {
          plan: PlanName.ENTERPRISE,
          surface: locationInWebApp,
          featureKey,
        },
      });
    },
  };
}

function buildSalesUrl({
  currentUser,
  featureKey,
}: {
  currentUser: UserWithMetaInformation | null | undefined;
  featureKey: FeatureKey | undefined;
}): string {
  const url = new URL(SALES_URL);
  url.searchParams.set('email', currentUser?.email ?? '');
  url.searchParams.set('firstName', currentUser?.firstName ?? '');
  url.searchParams.set('lastName', currentUser?.lastName ?? '');
  if (!isNil(featureKey)) {
    url.searchParams.set('featureKey', featureKey);
  }
  url.searchParams.set(
    'ap_cta',
    isNil(featureKey)
      ? 'app_enterprise_trial'
      : `app_${featureKey.toLowerCase()}`,
  );
  const sessionId = telemetryUtils.getSessionId();
  if (!isNil(sessionId)) {
    url.searchParams.set('ap_sid', sessionId);
  }
  return url.toString();
}

const SALES_URL = 'https://www.activepieces.com/sales';

type CurrentSubscriptionCardProps = {
  info: PlatformBillingInformation;
  onExplorePlans: () => void;
};

type SelfServeTrialSalesLinkProps = {
  locationInWebApp: SalesLinkLocationInWebApp;
  size?: 'xs' | 'sm' | 'default';
  variant?: 'outline' | 'default' | 'link';
  className?: string;
  featureKey?: FeatureKey;
  onClick?: () => void;
};
