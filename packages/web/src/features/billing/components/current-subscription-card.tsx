import { isNil } from '@activepieces/core-utils';
import {
  PlatformBillingInformation,
  SelfServeTrialState,
  isEligibleForSelfServeTrial,
  TelemetryEventName,
  UserWithMetaInformation,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Gem } from 'lucide-react';
import { ReactNode } from 'react';

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
import { useCreditsUsage } from '../hooks/use-credits-usage';
import {
  billingUtils,
  selfServeTrialCopy,
  enterpriseMotion,
} from '../utils/billing-utils';
import { FeatureKey } from '../utils/platform-features';
import { selfServeTrialTime } from '../utils/self-serve-trial-utils';

export const CurrentSubscriptionCard = ({
  info,
  onExplorePlans,
}: CurrentSubscriptionCardProps) => {
  const isPaid = billingUtils.isPaidPlan(info.plan.plan);
  const isYearly = billingUtils.isYearlyPlan(info);
  const trial = selfServeTrialHooks.useTrial();
  const trialEndsAt =
    trial.state === SelfServeTrialState.ACTIVE ? trial.endsAt : null;

  if (!isNil(trialEndsAt)) {
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
              {selfServeTrialCopy.daysLeftLabel(trial)}
            </Badge>
          </span>
          <span className="text-sm text-gray-11">
            {t(
              'Ends {date}, then you are back on the {plan} plan. Your credits are not affected.',
              {
                date: dayjs(trialEndsAt).format('MMM D'),
                plan: trial.basePlanName,
              },
            )}
          </span>
        </div>
        <SelfServeTrialSalesLink
          surface="enterprise_trial_billing"
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
            {planTitle(info)}
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
      <div className="text-2xl font-semibold">{planTitle(info)}</div>
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

function planTitle(info: PlatformBillingInformation): string {
  if (!billingUtils.isPaidPlan(info.plan.plan)) {
    return t('Free plan');
  }
  return t('{plan} plan', { plan: info.autumnPlanName ?? info.plan.plan });
}

export function SelfServeTrialBillingStatus() {
  const trial = selfServeTrialHooks.useTrial();
  const { isPaid } = useCreditsUsage();
  const { platform } = platformHooks.useCurrentPlatform();
  const { openDialog } = billingDialogHooks.useSelfServeTrialDialogStore();

  if (trial.state === SelfServeTrialState.ELIGIBLE) {
    return (
      <StatusCallout
        tone="accent"
        title={t('Try the Enterprise plan free for {days} days', {
          days: SELF_SERVE_TRIAL_DAYS,
        })}
        description={t(
          'Single sign-on, audit logs, your own AI providers and more, for everyone on your platform. No credit card, nothing to cancel.',
        )}
        action={
          <Button
            {...adminControl(AdminControl.TRIAL_START_OPEN)}
            onClick={() => openDialog({})}
          >
            {t('Start free trial')}
          </Button>
        }
      />
    );
  }

  if (
    trial.state === SelfServeTrialState.ENDED &&
    showsTrialAftermath({
      endsAt: trial.endsAt,
      plan: platform.plan.plan,
      isPaid,
    })
  ) {
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
          'Enterprise plan settings are locked and nothing was deleted. Our team can extend your trial or set you up on the Enterprise plan.',
        )}
        action={<SelfServeTrialSalesLink surface="enterprise_trial_billing" />}
      />
    );
  }

  return null;
}

function showsTrialAftermath({
  endsAt,
  plan,
  isPaid,
}: {
  endsAt: Date | null;
  plan: string | null | undefined;
  isPaid: boolean;
}): boolean {
  if (!isEligibleForSelfServeTrial(plan)) {
    return false;
  }
  if (isNil(endsAt)) {
    return !isPaid;
  }
  return (
    selfServeTrialTime.calendarDaysBetween({ from: endsAt, to: Date.now() }) <=
    AFTERMATH_DAYS
  );
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
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <span className="text-base font-semibold">{title}</span>
        <span className="max-w-3xl text-sm text-pretty text-gray-11">
          {description}
        </span>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

const AFTERMATH_DAYS = 30;

export function SelfServeTrialSalesLink({
  surface,
  size,
  variant = 'outline',
  className,
  featureKey,
  onClick,
}: SelfServeTrialSalesLinkProps) {
  const salesLink = useSalesLink({ surface, featureKey, onClick });
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
  surface,
  featureKey,
  onClick,
}: {
  surface: string;
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
        payload: { plan: 'enterprise', surface, featureKey },
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
  surface: string;
  size?: 'xs' | 'sm' | 'default';
  variant?: 'outline' | 'default' | 'link';
  className?: string;
  featureKey?: FeatureKey;
  onClick?: () => void;
};
