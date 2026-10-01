import { TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';

import { planSelectorUtils } from './plan-selector-utils';

export function EnterpriseTrialSalesLink({
  surface,
  label,
  size,
  className,
}: EnterpriseTrialSalesLinkProps) {
  const { capture } = useTelemetry();
  return (
    <Button variant="outline" size={size} className={className} asChild>
      <a
        href={planSelectorUtils.SALES_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          capture({
            name: TelemetryEventName.SALES_HANDOFF_CLICKED,
            payload: { plan: 'enterprise', surface },
          })
        }
      >
        {label ?? t('Talk to sales for 14 more days')}
      </a>
    </Button>
  );
}

type EnterpriseTrialSalesLinkProps = {
  surface: string;
  label?: string;
  size?: 'sm' | 'default';
  className?: string;
};
