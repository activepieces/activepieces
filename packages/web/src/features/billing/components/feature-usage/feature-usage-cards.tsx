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
import { Button } from '@/components/ui/button';
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
    <div className="flex flex-wrap gap-4">
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
  return (
    <Item variant="outline" className="min-w-[260px] flex-1">
      <ItemMedia variant="icon">
        <Icon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{t(display.label)}</ItemTitle>
        <ItemDescription>
          <UsageSummary display={display} resolved={resolved} />
        </ItemDescription>
      </ItemContent>
      {toppable && (
        <ItemActions>
          <TopUpControls
            feature={toppable}
            autoTopUp={autoTopUp}
            includedCredits={includedCredits}
            kind={display.kind}
            purchaseTitle={display.purchaseTitle}
          />
        </ItemActions>
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
    return (
      <>
        <span className="font-medium text-foreground">
          {isNil(resolved.remaining)
            ? t('Unlimited')
            : Math.round(resolved.remaining).toLocaleString()}
        </span>{' '}
        {!isNil(resolved.remaining) && <>{t('available')} </>}
        <span className="ml-2 text-xs">
          ({t('Total used')}: {Math.round(resolved.used).toLocaleString()})
        </span>
      </>
    );
  }
  const limitLabel = isNil(resolved.limit)
    ? t('Unlimited')
    : resolved.limit.toLocaleString();
  const approachingLimit =
    !isNil(resolved.limit) &&
    resolved.limit > 0 &&
    resolved.used / resolved.limit > 0.8;
  return (
    <>
      <span className="font-medium text-foreground">
        {resolved.used.toLocaleString()} / {limitLabel}
      </span>{' '}
      {t('used')}
      {approachingLimit && (
        <span className="ml-2 text-destructive font-medium">
          {t('Approaching limit')}
        </span>
      )}
    </>
  );
}

// Consumable features (credits) are refilled by AUTO top-up only — no manual one-off purchase (product
// decision). Non-consumable/limit features (e.g. extra seats) you buy outright, so they get the MANUAL top-up
// instead — you don't auto-buy seats. Branch on the feature kind.
function TopUpControls({
  feature,
  autoTopUp,
  includedCredits,
  kind,
  purchaseTitle,
}: {
  feature: ToppableFeature;
  autoTopUp?: AutoTopUpConfig;
  includedCredits: number;
  kind: FeatureKind;
  purchaseTitle: string;
}) {
  if (kind === 'consumable') {
    return (
      <AutoTopUpControl
        feature={feature}
        autoTopUp={autoTopUp}
        includedCredits={includedCredits}
      />
    );
  }
  return <ManualTopUpControl feature={feature} purchaseTitle={purchaseTitle} />;
}

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
    <div className="flex items-center gap-2">
      {enabled && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setIsEditing(true);
            setIsAutoTopUpOpen(true);
          }}
        >
          <Settings className={cn('size-4')} />
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
    </div>
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
