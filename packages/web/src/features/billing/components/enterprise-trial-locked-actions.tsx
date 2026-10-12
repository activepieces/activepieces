import { PlatformAdminSurface, TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { Gem, UserRound } from 'lucide-react';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import { ENTERPRISE_TRIAL_DAYS } from '../hooks/enterprise-trial-hooks';
import { useEnterpriseAccess } from '../hooks/use-enterprise-gate';
import { usePlanTier } from '../hooks/use-plan-tier';
import { useUpgradeClick } from '../hooks/use-upgrade-click';
import { planTiers } from '../utils/plan-tiers';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';
import { FeatureKey } from './request-trial';

export function EnterpriseTrialLockedActions({
  featureKey,
  surface,
  onAction,
  compact = false,
}: EnterpriseTrialLockedActionsProps) {
  const access = useEnterpriseAccess({ unlocked: false });
  const plan = usePlanTier(featureKey);
  const { openDialog } = billingDialogHooks.useEnterpriseTrialDialogStore();
  const { capture } = useTelemetry();
  const upgradeClick = useUpgradeClick();
  const contactSales = () => {
    onAction?.();
    if (featureKey !== undefined && surface !== PlatformAdminSurface.DIALOG) {
      capture({
        name: TelemetryEventName.PLATFORM_ADMIN_SALES_CONTACTED,
        payload: { feature: featureKey, surface },
      });
    }
  };
  const explorePlans = (variant: 'default' | 'outline') => (
    <Button
      {...adminControl(AdminControl.TRIAL_PLANS_OPEN)}
      variant={variant}
      onClick={() => {
        onAction?.();
        upgradeClick({ feature: featureKey, tier: plan.tier, surface });
      }}
    >
      {t('Explore plans')}
    </Button>
  );

  if (access === 'ask_admin') {
    return compact ? null : (
      <p className="flex items-center gap-2 text-sm text-gray-11">
        <UserRound className="size-4 shrink-0" />
        {planTiers.askAdminText(plan.tier)}
      </p>
    );
  }

  if (access === 'trial_available') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            {...adminControl(AdminControl.TRIAL_START_OPEN)}
            onClick={() => {
              onAction?.();
              openDialog({ featureKey });
            }}
          >
            <Gem />
            {t('Start free {days}-day Enterprise plan trial', {
              days: ENTERPRISE_TRIAL_DAYS,
            })}
          </Button>
          {explorePlans('outline')}
        </div>
        {!compact && (
          <span className="text-xs text-gray-11">
            {t('No credit card. One click to start. Nothing is deleted.')}
          </span>
        )}
      </div>
    );
  }

  const salesLink = (variant: 'default' | 'link') => (
    <EnterpriseTrialSalesLink
      surface="enterprise_locked"
      variant={variant}
      className={variant === 'link' ? 'h-auto p-0' : undefined}
      label={t('Talk to sales')}
      featureKey={featureKey}
      onClick={contactSales}
    />
  );

  if (plan.isCommunity) {
    return salesLink('default');
  }

  if (plan.tier !== 'enterprise') {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {explorePlans('default')}
        {salesLink('link')}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {salesLink('default')}
      {explorePlans('outline')}
    </div>
  );
}

type EnterpriseTrialLockedActionsProps = {
  featureKey?: FeatureKey;
  surface: PlatformAdminSurface;
  onAction?: () => void;
  compact?: boolean;
};
