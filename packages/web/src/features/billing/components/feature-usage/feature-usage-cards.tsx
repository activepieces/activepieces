import {
  AiCreditsAutoTopUpState,
  AutoTopUpConfig,
  AutumnFeatureId,
  isNil,
  PlatformBillingInformation,
  PlatformPlan,
  PlatformUsage,
  ToppableFeature,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Folder,
  LucideIcon,
  Settings,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { billingMutations } from '../../hooks/billing-hooks';

import { AutoTopUpConfigDialog } from './auto-topup-config-dialog';
import { ConsumableProductTopupsDialog } from './consumable-product-topups-dialog';

export function FeatureUsageCards({
  platformSubscription,
}: {
  platformSubscription: PlatformBillingInformation;
}) {
  const { plan, usage, topUpFeatures, autoTopUps } = platformSubscription;

  const cards = NUMERIC_FEATURES.flatMap((display) => {
    const resolved = resolveFeatureUsage({
      featureId: display.featureId,
      usage,
      plan,
    });
    return isNil(resolved) ? [] : [{ display, resolved }];
  });

  return (
    <div className="grid grid-cols-2 items-start gap-4">
      {cards.map(({ display, resolved }) => (
        <FeatureUsageCard
          key={display.featureId}
          display={display}
          resolved={resolved}
          includedCredits={plan.includedCredits}
          toppable={topUpFeatures.find(
            (feature) => feature.featureId === display.featureId,
          )}
          autoTopUp={autoTopUps.find(
            (config) => config.featureId === display.featureId,
          )}
        />
      ))}
    </div>
  );
}

function FeatureUsageCard({
  display,
  resolved,
  includedCredits,
  toppable,
  autoTopUp,
}: {
  display: FeatureDisplay;
  resolved: ResolvedFeatureUsage;
  includedCredits: number;
  toppable?: ToppableFeature;
  autoTopUp?: AutoTopUpConfig;
}) {
  const Icon = display.icon;
  const isUnlimited = display.kind === 'limit' && isNil(resolved.limit);
  return (
    <Item
      variant="outline"
      className={cn('items-start', toppable && 'col-span-2')}
    >
      <ItemMedia variant="icon">
        <Icon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="flex items-center gap-2">
          {t(display.label)}
          {isUnlimited && (
            <Badge variant="secondary" className="rounded-sm font-normal">
              {t('Unlimited')}
            </Badge>
          )}
        </ItemTitle>
        <UsageSummary display={display} resolved={resolved} />
        {display.kind === 'limit' && <LimitUsageBar resolved={resolved} />}
      </ItemContent>
      {toppable && display.kind === 'limit' && (
        <ItemActions>
          <ManualTopUpControl
            feature={toppable}
            purchaseTitle={display.purchaseTitle}
          />
        </ItemActions>
      )}
      {toppable && display.kind === 'consumable' && (
        <div className="mt-1 flex basis-full flex-col border-t pt-3">
          <AutoTopUpControl
            feature={toppable}
            autoTopUp={autoTopUp}
            includedCredits={includedCredits}
          />
        </div>
      )}
    </Item>
  );
}

function UsageSummary({
  display,
  resolved,
}: {
  display: FeatureDisplay;
  resolved: ResolvedFeatureUsage;
}) {
  if (display.kind === 'consumable') {
    const total = isNil(resolved.remaining)
      ? null
      : resolved.used + resolved.remaining;
    const percent =
      isNil(total) || total <= 0
        ? 0
        : Math.min(100, Math.round((resolved.used / total) * 100));
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-foreground">
            {isNil(resolved.remaining)
              ? t('Unlimited')
              : Math.round(resolved.remaining).toLocaleString()}
          </span>
          {!isNil(resolved.remaining) && (
            <span className="text-sm text-muted-foreground">
              {t('available')}
            </span>
          )}
        </div>
        {!isNil(total) && (
          <Progress
            value={percent}
            indicatorClassName={usageIndicatorClass(resolved.used / total)}
          />
        )}
        <span className="text-xs text-muted-foreground">
          {t('Total used')}: {Math.round(resolved.used).toLocaleString()}
        </span>
      </div>
    );
  }
  if (isNil(resolved.limit)) {
    return (
      <ItemDescription>
        <span className="font-medium text-foreground">
          {resolved.used.toLocaleString()}
        </span>{' '}
        {t('used')}
      </ItemDescription>
    );
  }
  return (
    <ItemDescription>
      <span className="font-medium text-foreground">
        {resolved.used.toLocaleString()} / {resolved.limit.toLocaleString()}
      </span>{' '}
      {t('used')}
    </ItemDescription>
  );
}

function usageIndicatorClass(ratio: number): string {
  if (ratio >= 1) {
    return 'bg-destructive';
  }
  if (ratio > 0.8) {
    return 'bg-amber-500';
  }
  return 'bg-primary';
}

function LimitUsageBar({ resolved }: { resolved: ResolvedFeatureUsage }) {
  if (isNil(resolved.limit) || resolved.limit <= 0) {
    return (
      <div className="mt-2">
        <Progress value={100} indicatorClassName="bg-muted-foreground/20" />
      </div>
    );
  }
  const ratio = resolved.used / resolved.limit;
  const percent = Math.min(100, Math.round(ratio * 100));
  const reached = ratio >= 1;
  const approaching = !reached && ratio > 0.8;
  const indicatorClassName = usageIndicatorClass(ratio);
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <Progress value={percent} indicatorClassName={indicatorClassName} />
      {(reached || approaching) && (
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-xs font-medium',
              reached ? 'text-destructive' : 'text-amber-600',
            )}
          >
            {reached ? t('Limit reached') : t('Approaching limit')}
          </span>
        </div>
      )}
    </div>
  );
}

// Consumable features (credits) are refilled by AUTO top-up only — no manual one-off purchase (product
// decision), rendered as a full-width row beneath the balance. Non-consumable/limit features (e.g. extra
// seats) you buy outright, so they get the MANUAL top-up button in the card actions — you don't auto-buy seats.
function ManualTopUpControl({
  feature,
  purchaseTitle,
}: {
  feature: ToppableFeature;
  purchaseTitle: string;
}) {
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsPurchaseOpen(true)}
      >
        {t('Top up')}
      </Button>
      <ConsumableProductTopupsDialog
        key={isPurchaseOpen ? 'open' : 'closed'}
        isOpen={isPurchaseOpen}
        onOpenChange={setIsPurchaseOpen}
        feature={feature}
        title={t(purchaseTitle)}
      />
    </div>
  );
}

function AutoTopUpControl({
  feature,
  autoTopUp,
  includedCredits,
}: {
  feature: ToppableFeature;
  autoTopUp?: AutoTopUpConfig;
  includedCredits: number;
}) {
  const queryClient = useQueryClient();
  const [isAutoTopUpOpen, setIsAutoTopUpOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateAutoTopUp, isPending } =
    billingMutations.useUpdateAutoTopUp(queryClient);

  const enabled = autoTopUp?.enabled ?? false;
  const maxMonthlyLimit =
    autoTopUp && !isNil(autoTopUp.maxMonthlyTopUps) && autoTopUp.quantity
      ? autoTopUp.maxMonthlyTopUps * autoTopUp.quantity
      : null;

  return (
    <>
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {t('Auto top-up')}
          </span>
          <span className="text-xs text-muted-foreground">
            {enabled && autoTopUp
              ? t('Adds {credits} credits when below {threshold}', {
                  credits: autoTopUp.quantity.toLocaleString(),
                  threshold: autoTopUp.threshold.toLocaleString(),
                })
              : t('Automatically buy credits when your balance runs low')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {enabled && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setIsEditing(true);
                setIsAutoTopUpOpen(true);
              }}
            >
              <Settings className="size-4" />
            </Button>
          )}
          <Switch
            checked={enabled}
            disabled={isPending}
            onCheckedChange={(checked) => {
              if (checked) {
                setIsEditing(false);
                setIsAutoTopUpOpen(true);
              } else {
                updateAutoTopUp({
                  state: AiCreditsAutoTopUpState.DISABLED,
                  featureId: feature.featureId,
                });
              }
            }}
          />
        </div>
      </div>
      <AutoTopUpConfigDialog
        key={isAutoTopUpOpen ? 'auto-open' : 'auto-closed'}
        isOpen={isAutoTopUpOpen}
        onOpenChange={setIsAutoTopUpOpen}
        feature={feature}
        includedCredits={includedCredits}
        isEditing={isEditing}
        currentThreshold={enabled ? autoTopUp?.threshold : undefined}
        currentCreditsToAdd={enabled ? autoTopUp?.quantity : undefined}
        currentMaxMonthlyLimit={enabled ? maxMonthlyLimit : undefined}
      />
    </>
  );
}

function resolveFeatureUsage({
  featureId,
  usage,
  plan,
}: {
  featureId: AutumnFeatureId;
  usage: PlatformUsage;
  plan: PlatformPlan;
}): ResolvedFeatureUsage | null {
  switch (featureId) {
    case AutumnFeatureId.AP_CREDITS:
      return {
        used: usage.creditsUsed,
        limit: null,
        remaining: usage.creditsRemaining ?? null,
      };
    case AutumnFeatureId.APP_SUMO_AI_CREDITS:
      if (isNil(usage.appSumoAiCredits)) {
        return null;
      }
      return {
        used: usage.appSumoAiCredits,
        limit: null,
        remaining: usage.appSumoAiCreditsRemaining ?? null,
      };
    case AutumnFeatureId.ACTIVE_FLOWS_LIMIT:
      return {
        used: usage.activeFlows,
        limit: plan.activeFlowsLimit ?? null,
        remaining: null,
      };
    case AutumnFeatureId.TEAM_PROJECTS_LIMIT:
      return {
        used: usage.teamProjects,
        limit: plan.teamProjectsLimit ?? null,
        remaining: null,
      };
    case AutumnFeatureId.USERS_LIMIT:
      return {
        used: usage.users,
        limit: plan.usersLimit ?? null,
        remaining: null,
      };
    default:
      return null;
  }
}

type FeatureKind = 'consumable' | 'limit';

type FeatureDisplay = {
  featureId: AutumnFeatureId;
  kind: FeatureKind;
  label: string;
  icon: LucideIcon;
  // Title for the manual top-up dialog (only used for non-consumable/limit features that you buy outright).
  purchaseTitle: string;
};

type ResolvedFeatureUsage = {
  used: number;
  limit: number | null;
  remaining: number | null;
};

const NUMERIC_FEATURES: FeatureDisplay[] = [
  {
    featureId: AutumnFeatureId.AP_CREDITS,
    kind: 'consumable',
    label: 'Credits',
    icon: Sparkles,
    purchaseTitle: 'Purchase Credits',
  },
  {
    featureId: AutumnFeatureId.APP_SUMO_AI_CREDITS,
    kind: 'consumable',
    label: 'AppSumo AI Credits',
    icon: Sparkles,
    purchaseTitle: 'Purchase AppSumo AI Credits',
  },
  {
    featureId: AutumnFeatureId.ACTIVE_FLOWS_LIMIT,
    kind: 'limit',
    label: 'Active Flows',
    icon: Zap,
    purchaseTitle: 'Purchase Active Flows',
  },
  {
    featureId: AutumnFeatureId.TEAM_PROJECTS_LIMIT,
    kind: 'limit',
    label: 'Team Projects',
    icon: Folder,
    purchaseTitle: 'Purchase Team Projects',
  },
  {
    featureId: AutumnFeatureId.USERS_LIMIT,
    kind: 'limit',
    label: 'Users',
    icon: Users,
    purchaseTitle: 'Purchase Users',
  },
];
