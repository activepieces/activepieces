import { isNil, tryCatch } from '@activepieces/core-utils';
import {
  PlanName,
  UpgradeLocationInWebApp,
  SalesLinkLocationInWebApp,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Gem } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { platformBillingApi } from '../api/billing-plans-api';
import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import { billingQueries, refreshBillingCaches } from '../hooks/billing-hooks';
import { useUpgradeClick } from '../hooks/use-upgrade-click';
import {
  selfServeTrialCopy,
  selfServeTrialTime,
} from '../utils/self-serve-trial-utils';

import { useSalesLink } from './current-subscription-card';
import { DeactivateUsersDialog } from './feature-usage/deactivate-users-dialog';

export function SelfServeTrialLine({ endsAt }: { endsAt: string }) {
  const isPlatformAdmin = useIsPlatformAdmin();
  const endsToday = selfServeTrialTime.daysLeft(endsAt) === 0;
  const line = (
    <LineBody
      icon={
        <Gem
          className={cn(
            'size-3.5 shrink-0 -translate-y-px',
            endsToday ? 'text-warning-11' : 'text-accent-11',
          )}
        />
      }
      title={t('Enterprise trial')}
      status={selfServeTrialCopy.daysLeftCopy(endsAt)}
      warn={endsToday}
    />
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {isPlatformAdmin ? (
          <Link
            to="/platform/billing"
            className="max-w-full min-w-0 self-start hover:underline"
          >
            {line}
          </Link>
        ) : (
          <span tabIndex={0} className="max-w-full min-w-0 self-start">
            {line}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        {selfServeTrialCopy.trialEndSummary(endsAt)}
      </TooltipContent>
    </Tooltip>
  );
}

export function SeatGraceLine({ endsAt }: { endsAt: string }) {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const { openDialog } = billingDialogHooks.useTrialSeatDialogStore();
  const params = {
    seats: platform.plan.usersLimit,
    date: selfServeTrialTime.whenItEnds(endsAt).date,
  };
  const line = (
    <LineBody
      title={t('Enterprise trial ended')}
      status={selfServeTrialCopy.daysLeftCopy(endsAt)}
      warn
    />
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {isPlatformAdmin ? (
          <button
            {...adminControl(AdminControl.TRIAL_SEATS_OPEN)}
            type="button"
            onClick={openDialog}
            className="max-w-full min-w-0 self-start hover:underline"
          >
            {line}
          </button>
        ) : (
          <span tabIndex={0} className="max-w-full min-w-0 self-start">
            {line}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        {isPlatformAdmin
          ? t(
              "Users added during the trial beyond the plan's {seats, plural, =1 {1 seat} other {# seats}} will be deactivated on {date}. Manage seats, or upgrade to keep them.",
              params,
            )
          : t(
              "Your Enterprise trial has ended. Users added during it beyond the plan's {seats, plural, =1 {1 seat} other {# seats}} lose access on {date} unless an admin upgrades.",
              params,
            )}
      </TooltipContent>
    </Tooltip>
  );
}

export function EnterprisePlanIndicator() {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const salesLink = useSalesLink({
    locationInWebApp: SalesLinkLocationInWebApp.ENTERPRISE_PLAN_INDICATOR,
  });
  const trial = platform.selfServeTrial;
  const graceEndsAt = trial?.seatGraceEndsAt;
  if (!isPlatformAdmin) {
    return null;
  }
  if (selfServeTrialTime.isRunning(trial)) {
    return <TrialIndicator endsAt={trial.endsAt} />;
  }
  if (!isNil(graceEndsAt)) {
    return <SeatGraceIndicator endsAt={graceEndsAt} />;
  }
  if (!platform.plan.plan?.startsWith(PlanName.ENTERPRISE)) {
    return null;
  }
  return (
    <a
      {...salesLink}
      data-slot="enterprise-plan-indicator"
      className={ROW_CLASS}
    >
      <IndicatorLabel
        title={t('Enterprise plan')}
        detail={t('Talk to sales')}
        warn={false}
      />
    </a>
  );
}

export function SelfServeTrialSeatDialog() {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const graceEndsAt = platform.selfServeTrial?.seatGraceEndsAt;
  const {
    data: info,
    isError,
    refetch,
  } = billingQueries.usePlatformSubscription(
    platform.id,
    isPlatformAdmin && !isNil(graceEndsAt),
  );
  const { isOpen, closeDialog } = billingDialogHooks.useTrialSeatDialogStore();
  const upgradeClick = useUpgradeClick();

  const settleGrace = async () => {
    await tryCatch(() => platformBillingApi.refreshSubscriptionInfo());
    refreshBillingCaches(queryClient);
  };

  if (isNil(graceEndsAt)) {
    return null;
  }
  if (isNil(info) && isError) {
    return (
      <Dialog open={isOpen} onOpenChange={(next) => !next && closeDialog()}>
        <DialogContent className="max-w-[480px] gap-4">
          <DialogHeader>
            <DialogTitle>{t('Manage seats')}</DialogTitle>
          </DialogHeader>
          <DataFetchErrorState entity={t('users')} onRetry={refetch} />
        </DialogContent>
      </Dialog>
    );
  }
  const seatGrace = info?.seatGrace;
  if (isNil(info) || isNil(seatGrace)) {
    return null;
  }
  const seatLimit = seatGrace.seatLimit;
  const date = selfServeTrialTime.whenItEnds(graceEndsAt).date;

  return (
    <DeactivateUsersDialog
      open={isOpen}
      onOpenChange={(next) => !next && closeDialog()}
      targetSeats={seatLimit}
      currentUsers={seatGrace.usedSeats}
      description={t(
        'Your Enterprise trial has ended and {plan} includes {target, plural, =1 {1 seat} other {# seats}}. The users ticked below will be deactivated on {date}. Change who goes, or upgrade to keep everyone.',
        {
          plan: info.autumnPlanName,
          target: seatLimit,
          date,
        },
      )}
      preselectedUserIds={seatGrace.userIds}
      preselectedLabel={t('Leaves {date}', { date })}
      hideEmbeddedUsers
      actions={
        <Button
          {...adminControl(AdminControl.TRIAL_PLANS_OPEN)}
          type="button"
          variant="link"
          className="sm:mr-auto"
          onClick={() => {
            closeDialog();
            upgradeClick({ locationInWebApp: UpgradeLocationInWebApp.DIALOG });
          }}
        >
          {t('Explore plans')}
        </Button>
      }
      onConfirmed={() => void settleGrace()}
    />
  );
}

function TrialIndicator({ endsAt }: { endsAt: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/platform/billing"
          data-slot="enterprise-plan-indicator"
          className={ROW_CLASS}
        >
          <IndicatorLabel
            title={t('Enterprise plan trial')}
            detail={t(
              '{day, select, today {Ends today at {time}} tomorrow {Ends tomorrow at {time}} other {{count, plural, =1 {1 day left} other {# days left}}, ends {date}}}',
              {
                ...selfServeTrialTime.whenItEnds(endsAt),
                count: selfServeTrialTime.daysLeft(endsAt),
              },
            )}
            warn={selfServeTrialTime.daysLeft(endsAt) === 0}
          />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        {selfServeTrialCopy.trialEndSummary(endsAt)}
      </TooltipContent>
    </Tooltip>
  );
}

function SeatGraceIndicator({ endsAt }: { endsAt: string }) {
  const { openDialog } = billingDialogHooks.useTrialSeatDialogStore();
  return (
    <button
      {...adminControl(AdminControl.TRIAL_SEATS_OPEN)}
      type="button"
      data-slot="enterprise-plan-indicator"
      onClick={openDialog}
      className={cn(ROW_CLASS, 'w-full text-left')}
    >
      <IndicatorLabel
        title={t('Enterprise trial ended')}
        detail={t('Extra users lose access {date}', {
          date: selfServeTrialTime.whenItEnds(endsAt).date,
        })}
        warn
      />
    </button>
  );
}

function LineBody({ icon, title, status, warn }: LineBodyProps) {
  return (
    <span
      className={cn(
        'flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap',
        warn ? 'text-warning-11' : 'text-gray-11',
      )}
    >
      {icon}
      <span className="min-w-0 truncate font-medium">{title}</span>
      <span className="shrink-0">· {status}</span>
    </span>
  );
}

function IndicatorLabel({ title, detail, warn }: IndicatorLabelProps) {
  return (
    <>
      <Gem className="mt-0.5 size-4 shrink-0 text-accent-11" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-12">{title}</span>
        <span
          className={cn('text-xs', warn ? 'text-warning-11' : 'text-gray-11')}
        >
          {detail}
        </span>
      </span>
    </>
  );
}

const ROW_CLASS =
  'flex min-w-0 items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-gray-4';

type LineBodyProps = {
  icon?: ReactNode;
  title: string;
  status: string;
  warn: boolean;
};

type IndicatorLabelProps = {
  title: string;
  detail: string;
  warn: boolean;
};
