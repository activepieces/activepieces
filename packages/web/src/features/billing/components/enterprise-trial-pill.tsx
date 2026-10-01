import { isNil } from '@activepieces/core-utils';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { cn } from '@/lib/utils';

import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';

export function EnterpriseTrialPill() {
  const endsAt = enterpriseTrialHooks.useLiveTrialEndsAt();
  const isPlatformAdmin = useIsPlatformAdmin();
  if (isNil(endsAt)) {
    return null;
  }
  const hoursLeft = Math.max(0, dayjs(endsAt).diff(dayjs(), 'hour'));
  const daysLeft = Math.ceil(hoursLeft / 24);
  const endingSoon = daysLeft <= 1;
  const elapsedPercent = Math.min(
    100,
    Math.max(0, 100 - (hoursLeft / (TRIAL_DAYS * 24)) * 100),
  );
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-md border p-2.5',
        endingSoon ? 'border-warning/50 bg-warning/5' : 'bg-background',
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <Sparkles className="size-3.5 shrink-0 text-primary" />
        {t('Enterprise Trial')}
        <span className="ml-auto font-normal text-muted-foreground">
          {endingSoon
            ? t('Ends tomorrow')
            : t('{count, plural, =1 {1 day left} other {# days left}}', {
                count: daysLeft,
              })}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full',
            endingSoon ? 'bg-warning' : 'bg-primary',
          )}
          style={{ width: `${elapsedPercent}%` }}
        />
      </div>
      {isPlatformAdmin && (
        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
          <Link to={BILLING_ROUTE}>{t('Upgrade')}</Link>
        </Button>
      )}
    </div>
  );
}

const TRIAL_DAYS = 7;

const BILLING_ROUTE = '/platform/billing';
