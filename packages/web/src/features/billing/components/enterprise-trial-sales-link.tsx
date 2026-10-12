import { TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { FeatureKey, useSalesUrl } from './request-trial';

export function EnterpriseTrialSalesLink({
  surface,
  label,
  size,
  variant = 'outline',
  className,
  featureKey,
  onClick,
}: EnterpriseTrialSalesLinkProps) {
  const { capture } = useTelemetry();
  const salesUrl = useSalesUrl(featureKey);
  return (
    <Button variant={variant} size={size} className={className} asChild>
      <a
        {...adminControl(AdminControl.TRIAL_SALES_LINK)}
        href={salesUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          onClick?.();
          capture({
            name: TelemetryEventName.SALES_HANDOFF_CLICKED,
            payload: { plan: 'enterprise', surface, featureKey },
          });
        }}
      >
        {label ?? t('Talk to sales for 14 more days')}
        <span className="sr-only"> {t('(opens in a new tab)')}</span>
      </a>
    </Button>
  );
}

type EnterpriseTrialSalesLinkProps = {
  surface: string;
  label?: string;
  size?: 'xs' | 'sm' | 'default';
  variant?: 'outline' | 'default' | 'link';
  className?: string;
  featureKey?: FeatureKey;
  onClick?: () => void;
};
