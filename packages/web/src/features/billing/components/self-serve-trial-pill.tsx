import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { Gem } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import {
  SelfServeTrial,
  selfServeTrialHooks,
  SeatGrace,
} from '../hooks/self-serve-trial-hooks';
import { selfServeTrialCopy } from '../utils/self-serve-trial-copy';
import { planTiers } from '../utils/plan-tiers';

export function SelfServeTrialLine({ trial }: { trial: SelfServeTrial }) {
  const line = (
    <LineBody
      icon={
        <Gem
          className={cn(
            'size-3.5 shrink-0 -translate-y-px',
            trial.endsToday ? 'text-warning-11' : 'text-accent-11',
          )}
        />
      }
      title={t('Enterprise trial')}
      status={selfServeTrialCopy.cardStatus(trial)}
      warn={trial.endsToday}
    />
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {trial.isPlatformAdmin ? (
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
        {selfServeTrialCopy.details(trial)}
      </TooltipContent>
    </Tooltip>
  );
}

export function SeatGraceLine({ grace }: { grace: SeatGrace }) {
  const { openDialog } = billingDialogHooks.useTrialSeatDialogStore();
  const line = (
    <LineBody
      title={t('Enterprise trial ended')}
      status={selfServeTrialCopy.cardStatus(grace)}
      warn
    />
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {grace.isPlatformAdmin ? (
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
        {selfServeTrialCopy.seatGraceTooltip(grace)}
      </TooltipContent>
    </Tooltip>
  );
}

export function EnterprisePlanIndicator() {
  const trial = selfServeTrialHooks.useTrial();
  const grace = selfServeTrialHooks.useSeatGrace();
  const { platform } = platformHooks.useCurrentPlatform();
  const inTrial = trial.state === 'active' && !isNil(trial.endsAt);
  if (!trial.isPlatformAdmin) {
    return null;
  }
  if (!inTrial && !isNil(grace)) {
    return <SeatGraceIndicator grace={grace} />;
  }
  if (!inTrial && !planTiers.isEnterprisePlan(platform.plan.plan)) {
    return null;
  }
  const row = (
    <Link
      to="/platform/billing"
      data-slot="enterprise-plan-indicator"
      className={INDICATOR_ROW_CLASS}
    >
      <IndicatorLabel
        title={inTrial ? t('Enterprise plan trial') : t('Enterprise plan')}
        detail={inTrial ? selfServeTrialCopy.sidebarDetail(trial) : undefined}
        warn={inTrial && trial.endsToday}
      />
    </Link>
  );
  if (!inTrial) {
    return row;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        {selfServeTrialCopy.details(trial)}
      </TooltipContent>
    </Tooltip>
  );
}

function SeatGraceIndicator({ grace }: { grace: SeatGrace }) {
  const { openDialog } = billingDialogHooks.useTrialSeatDialogStore();
  return (
    <button
      {...adminControl(AdminControl.TRIAL_SEATS_OPEN)}
      type="button"
      data-slot="enterprise-plan-indicator"
      onClick={openDialog}
      className={cn(INDICATOR_ROW_CLASS, 'w-full text-left')}
    >
      <IndicatorLabel
        title={t('Enterprise trial ended')}
        detail={selfServeTrialCopy.seatGraceSidebarDetail(grace)}
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
        {!isNil(detail) && (
          <span
            className={cn('text-xs', warn ? 'text-warning-11' : 'text-gray-11')}
          >
            {detail}
          </span>
        )}
      </span>
    </>
  );
}

const INDICATOR_ROW_CLASS =
  'flex min-w-0 items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-gray-4';

type LineBodyProps = {
  icon?: ReactNode;
  title: string;
  status: string;
  warn: boolean;
};

type IndicatorLabelProps = {
  title: string;
  detail?: string;
  warn: boolean;
};
