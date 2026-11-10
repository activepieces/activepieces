import { PlanName, SalesLinkLocationInWebApp } from '@activepieces/shared';
import { t } from 'i18next';
import { Gem } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import {
  selfServeTrialCopy,
  selfServeTrialTime,
} from '../utils/self-serve-trial-utils';

import { useSalesLink } from './current-subscription-card';

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

export function EnterprisePlanIndicator() {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const salesLink = useSalesLink({
    locationInWebApp: SalesLinkLocationInWebApp.ENTERPRISE_PLAN_INDICATOR,
  });
  const trial = platform.selfServeTrial;
  if (!isPlatformAdmin) {
    return null;
  }
  if (selfServeTrialTime.isRunning(trial)) {
    return <TrialIndicator endsAt={trial.endsAt} />;
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
