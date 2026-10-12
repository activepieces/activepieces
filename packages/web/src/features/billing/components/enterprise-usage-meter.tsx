import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { EnterpriseGate } from '../hooks/use-enterprise-gate';
import { enterpriseMotion } from '../utils/enterprise-motion';

import { LockedGem } from './locked-gem';

export function EnterpriseUsageMeter({
  gate,
  used,
  limit,
  label,
  className,
}: EnterpriseUsageMeterProps) {
  if (isNil(limit) || limit <= 0) {
    return null;
  }
  const atLimit = used >= limit;
  const usage = t('{used} of {limit} {label}', { used, limit, label });
  const ring = <UsageRing used={used} limit={limit} atLimit={atLimit} />;

  if (gate.access === 'ask_admin' || gate.access === 'community') {
    return (
      <span
        className={cn(
          'flex h-9 items-center gap-2 px-1 text-sm tabular-nums text-gray-11',
          enterpriseMotion.appear,
          className,
        )}
      >
        {ring}
        {usage}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'gap-2 tabular-nums text-gray-11',
            enterpriseMotion.appear,
            className,
          )}
          onClick={gate.explain}
        >
          {ring}
          {usage}
          <LockedGem className="text-accent-11" />
          <span className="sr-only">
            {t('Unlimited on the Enterprise plan')}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {t('Unlimited on the Enterprise plan')}
      </TooltipContent>
    </Tooltip>
  );
}

function UsageRing({
  used,
  limit,
  atLimit,
}: {
  used: number;
  limit: number;
  atLimit: boolean;
}) {
  const circumference = 2 * Math.PI * 6;
  const filled = Math.min(1, used / limit) * circumference;
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 -rotate-90" aria-hidden>
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        strokeWidth="2.5"
        className="stroke-gray-5"
      />
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        className={atLimit ? 'stroke-warning-9' : 'stroke-accent-9'}
      />
    </svg>
  );
}

type EnterpriseUsageMeterProps = {
  gate: EnterpriseGate;
  used: number;
  limit: number | null | undefined;
  label: string;
  className?: string;
};
