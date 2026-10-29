import { isNil } from '@activepieces/core-utils';
import {
  PlanName,
  PlatformAdminSurface,
  TelemetryEventName,
} from '@activepieces/shared';
import { t } from 'i18next';
import { UserRound, Check, Gem } from 'lucide-react';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usageIndicatorClass } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import { usePlanThatHasFeature } from '../hooks/billing-hooks';
import {
  SELF_SERVE_TRIAL_DAYS,
  useEnterpriseAccess,
  useEnterpriseGate,
  EnterpriseGate,
} from '../hooks/self-serve-trial-hooks';
import { useUpgradeClick } from '../hooks/use-upgrade-click';
import { enterpriseDocs, enterpriseMotion } from '../utils/billing-utils';
import { platformFeatures, FeatureKey } from '../utils/platform-features';
import { selfServeTrialFeatures } from '../utils/self-serve-trial-utils';

import { SelfServeTrialSalesLink } from './current-subscription-card';

export function SelfServeTrialLockedActions({
  featureKey,
  surface,
  onAction,
  compact = false,
  finePrintBelow = false,
  showContactSales = true,
}: SelfServeTrialLockedActionsProps) {
  const size = compact ? 'sm' : 'default';
  const secondary = compact ? 'link' : 'outline';
  const access = useEnterpriseAccess({ unlocked: false });
  const plan = usePlanThatHasFeature(featureKey);
  const { openDialog } = billingDialogHooks.useSelfServeTrialDialogStore();
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
        upgradeClick({
          feature: featureKey,
          plan: plan.planThatHasFeature,
          surface,
        });
      }}
    >
      {t('Explore plans')}
    </Button>
  );

  if (access === 'ask_admin') {
    return (
      <p className="flex items-center gap-2 text-sm text-gray-11">
        <UserRound className="size-4 shrink-0" />
        {platformFeatures.askAdminToUpgradeText(plan.planThatHasFeature)}
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
              days: SELF_SERVE_TRIAL_DAYS,
            })}
          </span>
        )}
      </div>
    );
  }

  const salesLink = (variant: 'default' | 'link') => (
    <SelfServeTrialSalesLink
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

  if (plan.planThatHasFeature !== PlanName.ENTERPRISE) {
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

export function EnterpriseLockedRow({
  unlocked,
  featureKey,
  line,
}: EnterpriseLockedRowProps) {
  const gate = useEnterpriseGate({ unlocked, featureKey });
  if (!gate.locked) {
    return null;
  }
  return (
    <div
      role="status"
      data-slot="enterprise-locked-row"
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-lg border bg-gray-1 px-4 py-3',
        enterpriseMotion.appear,
      )}
    >
      <div className="flex min-w-0 flex-1 basis-64 items-center gap-2.5">
        <PlanBadge featureKey={featureKey} />
        <p className="min-w-0 text-sm text-gray-12">{line}</p>
      </div>
      <SelfServeTrialLockedActions
        featureKey={featureKey}
        surface={PlatformAdminSurface.TEASER}
        compact
      />
    </div>
  );
}

export function EnterpriseLockedCard({
  featureKey,
  fallbackHeadline,
  fallbackDescription,
  showBenefits = false,
  showContactSales = true,
  surface,
}: EnterpriseLockedCardProps) {
  const copy = selfServeTrialFeatures.lockedCopy(featureKey);
  const headline =
    copy?.headline ??
    fallbackHeadline ??
    selfServeTrialFeatures.name(featureKey);
  const description = copy?.description ?? fallbackDescription;
  const benefits = showBenefits ? copy?.benefits ?? [] : [];

  return (
    <Card
      role="status"
      data-slot="enterprise-locked-card"
      className={cn('@container shrink-0 p-5', enterpriseMotion.appear)}
    >
      <div className="flex flex-col gap-4 @3xl:flex-row @3xl:items-center @3xl:gap-8">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {headline && (
              <h2 className="text-base font-semibold tracking-tight text-pretty text-gray-12">
                {headline}
              </h2>
            )}
            <PlanBadge featureKey={featureKey} />
          </div>
          {description && (
            <p className="max-w-2xl text-sm text-pretty text-gray-11">
              {description}
            </p>
          )}
          {benefits.length > 0 && (
            <ul className="flex flex-col gap-1.5 pt-2">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-2 text-sm text-gray-12"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-success-11" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="shrink-0">
          <SelfServeTrialLockedActions
            featureKey={featureKey}
            surface={surface}
            finePrintBelow
            showContactSales={showContactSales}
          />
        </div>
      </div>
    </Card>
  );
}

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
          onClick={gate.showLockedDialog}
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

export function PlanBadge({
  featureKey,
}: {
  featureKey: FeatureKey | undefined;
}) {
  const plan = usePlanThatHasFeature(featureKey);
  return (
    <Badge variant="info" data-slot="plan-badge" className="shrink-0">
      <Gem />
      {plan.badge}
    </Badge>
  );
}

export function LockedGem({ className }: LockedGemProps) {
  return <Gem aria-hidden className={cn('size-3.5 shrink-0', className)} />;
}

type SelfServeTrialLockedActionsProps = {
  featureKey?: FeatureKey;
  surface: PlatformAdminSurface;
  onAction?: () => void;
  compact?: boolean;
  finePrintBelow?: boolean;
  showContactSales?: boolean;
};

type EnterpriseLockedRowProps = {
  unlocked: boolean;
  featureKey: FeatureKey;
  line: string;
};

type EnterpriseLockedCardProps = {
  featureKey: FeatureKey;
  fallbackHeadline?: string;
  fallbackDescription?: string;
  showBenefits?: boolean;
  showContactSales?: boolean;
  surface: PlatformAdminSurface;
};

type EnterpriseUsageMeterProps = {
  gate: EnterpriseGate;
  used: number;
  limit: number | null | undefined;
  label: string;
};

type LockedGemProps = {
  className?: string;
};
