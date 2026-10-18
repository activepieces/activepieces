import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { usageIndicatorClass } from '@/components/ui/progress';
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
}: EnterpriseUsageMeterProps) {
  if (isNil(limit) || limit <= 0) {
    return null;
  }
  const usage = t('{used} of {limit} {label}', { used, limit, label });
  const meter = <UsageBar used={used} limit={limit} />;

  if (gate.access === 'ask_admin' || gate.access === 'community') {
    return (
      <span
        className={cn(
          'flex h-9 items-center gap-2 px-1 text-sm tabular-nums text-gray-11',
          enterpriseMotion.appear,
        )}
      >
        {meter}
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
          )}
          onClick={gate.explain}
        >
          {meter}
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

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const percent = Math.round(Math.min(1, used / limit) * 100);
  return (
    <span
      aria-hidden
      className="relative h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-gray-5"
    >
      <span
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          usageIndicatorClass(used / limit),
        )}
        style={{ width: `${Math.max(percent, 8)}%` }}
      />
    </span>
  );
}

type EnterpriseUsageMeterProps = {
  gate: EnterpriseGate;
  used: number;
  limit: number | null | undefined;
  label: string;
};
