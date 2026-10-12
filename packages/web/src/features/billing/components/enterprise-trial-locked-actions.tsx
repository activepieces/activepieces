import { PlatformAdminSurface, TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { Gem, UserRound } from 'lucide-react';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import { ENTERPRISE_TRIAL_DAYS } from '../hooks/enterprise-trial-hooks';
import { useEnterpriseAccess } from '../hooks/use-enterprise-gate';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';
import { FeatureKey } from './request-trial';

export function EnterpriseTrialLockedActions({
  featureKey,
  surface,
  onAction,
  compact = false,
}: EnterpriseTrialLockedActionsProps) {
  const access = useEnterpriseAccess({ unlocked: false });
  const { openDialog } = billingDialogHooks.useEnterpriseTrialDialogStore();
  const { capture } = useTelemetry();
  const contactSales = () => {
    onAction?.();
    if (featureKey !== undefined && surface !== PlatformAdminSurface.DIALOG) {
      capture({
        name: TelemetryEventName.PLATFORM_ADMIN_SALES_CONTACTED,
        payload: { feature: featureKey, surface },
      });
    }
  };

  if (access === 'ask_admin') {
    return compact ? null : (
      <p className="flex items-center gap-2 text-sm text-gray-11">
        <UserRound className="size-4 shrink-0" />
        {t('Ask your admin to turn on the Enterprise plan for your team.')}
      </p>
    );
  }

  if (access !== 'trial_available') {
    return (
      <EnterpriseTrialSalesLink
        surface="enterprise_locked"
        variant="default"
        label={t('Talk to sales')}
        featureKey={featureKey}
        onClick={contactSales}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <EnterpriseTrialSalesLink
          surface="enterprise_locked"
          variant="link"
          className="h-auto p-0"
          label={t('Talk to sales')}
          featureKey={featureKey}
          onClick={contactSales}
        />
        <Button
          onClick={() => {
            onAction?.();
            openDialog({ featureKey });
          }}
        >
          <Gem />
          {t('Start free {days}-day trial', { days: ENTERPRISE_TRIAL_DAYS })}
        </Button>
      </div>
      {!compact && (
        <span className="text-xs text-gray-11">
          {t('No credit card. One click to start. Nothing is deleted.')}
        </span>
      )}
    </div>
  );
}

type EnterpriseTrialLockedActionsProps = {
  featureKey?: FeatureKey;
  surface: PlatformAdminSurface;
  onAction?: () => void;
  compact?: boolean;
};
