import { PlatformAdminSurface, TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { UserRound } from 'lucide-react';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import { ENTERPRISE_TRIAL_DAYS } from '../hooks/enterprise-trial-hooks';
import { useEnterpriseAccess } from '../hooks/use-enterprise-gate';
import { usePlanTier } from '../hooks/use-plan-tier';
import { useUpgradeClick } from '../hooks/use-upgrade-click';
import { enterpriseDocs } from '../utils/enterprise-docs';
import { planTiers } from '../utils/plan-tiers';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';
import { FeatureKey } from './request-trial';

export function EnterpriseTrialLockedActions({
  featureKey,
  surface,
  onAction,
  compact = false,
  finePrintBelow = false,
  showContactSales = true,
}: EnterpriseTrialLockedActionsProps) {
  const size = compact ? 'sm' : 'default';
  const secondary = compact ? 'link' : 'outline';
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
  const explorePlans = (variant: 'default' | 'outline' | 'link') => (
    <Button
      {...adminControl(AdminControl.TRIAL_PLANS_OPEN)}
      variant={variant}
      size={size}
      className={variant === 'link' ? 'h-auto p-0' : undefined}
      onClick={() => {
        onAction?.();
        upgradeClick({ feature: featureKey, tier: plan.tier, surface });
      }}
    >
      {t('Explore plans')}
    </Button>
  );

  if (access === 'ask_admin') {
    return (
      <p className="flex items-center gap-2 text-sm text-gray-11">
        <UserRound className="size-4 shrink-0" />
        {planTiers.askAdminText(plan.tier)}
      </p>
    );
  }

  if (access === 'trial_available') {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-4 gap-y-3',
          finePrintBelow && '@3xl:flex-col @3xl:items-end @3xl:gap-y-1.5',
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {explorePlans(secondary)}
          <Button
            {...adminControl(AdminControl.TRIAL_START_OPEN)}
            size={size}
            onClick={() => {
              onAction?.();
              openDialog({ featureKey });
            }}
          >
            {t('Start free trial')}
          </Button>
        </div>
        {!compact && (
          <span className="text-xs text-gray-11">
            {t('{days}-day Enterprise plan trial. No credit card.', {
              days: ENTERPRISE_TRIAL_DAYS,
            })}
          </span>
        )}
      </div>
    );
  }

  const salesLink = (variant: 'default' | 'link') => (
    <EnterpriseTrialSalesLink
      surface="locked_feature"
      variant={variant}
      size={size}
      className={variant === 'link' ? 'h-auto p-0' : undefined}
      featureKey={featureKey}
      onClick={contactSales}
    />
  );

  if (access === 'community') {
    if (!showContactSales) {
      return null;
    }
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <a
          href={enterpriseDocs.switchToEnterpriseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-accent-11 hover:underline"
        >
          {t('How to switch to the Enterprise edition')}
        </a>
        {salesLink('default')}
      </div>
    );
  }

  if (plan.tier !== 'enterprise') {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {salesLink('link')}
        {explorePlans('default')}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {explorePlans(secondary)}
      {salesLink('default')}
    </div>
  );
}

type EnterpriseTrialLockedActionsProps = {
  featureKey?: FeatureKey;
  surface: PlatformAdminSurface;
  onAction?: () => void;
  compact?: boolean;
  finePrintBelow?: boolean;
  showContactSales?: boolean;
};
