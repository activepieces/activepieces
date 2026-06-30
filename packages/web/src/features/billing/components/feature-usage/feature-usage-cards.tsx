import {
  AutumnFeatureId,
  isNil,
  PlatformBillingInformation,
  PlatformPlan,
  PlatformUsage,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Folder, LucideIcon, Sparkles, Users, Zap } from 'lucide-react';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
} from '@/components/custom/item';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function FeatureUsageCards({
  platformSubscription,
}: {
  platformSubscription: PlatformBillingInformation;
}) {
  const { plan, usage } = platformSubscription;

  const cards = NUMERIC_FEATURES.flatMap((display) => {
    const resolved = resolveFeatureUsage({
      featureId: display.featureId,
      usage,
      plan,
    });
    return isNil(resolved) ? [] : [{ display, resolved }];
  });

  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
      {cards.map(({ display, resolved }) => (
        <FeatureUsageCard
          key={display.featureId}
          display={display}
          resolved={resolved}
        />
      ))}
    </div>
  );
}

function FeatureUsageCard({
  display,
  resolved,
}: {
  display: FeatureDisplay;
  resolved: ResolvedFeatureUsage;
}) {
  const Icon = display.icon;
  const isUnlimited = display.kind === 'limit' && isNil(resolved.limit);
  return (
    <Item variant="outline" className="items-start">
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
};

type ResolvedFeatureUsage = {
  used: number;
  limit: number | null;
  remaining: number | null;
};

const NUMERIC_FEATURES: FeatureDisplay[] = [
  {
    featureId: AutumnFeatureId.APP_SUMO_AI_CREDITS,
    kind: 'consumable',
    label: 'AppSumo AI Credits',
    icon: Sparkles,
  },
  {
    featureId: AutumnFeatureId.ACTIVE_FLOWS_LIMIT,
    kind: 'limit',
    label: 'Active Flows',
    icon: Zap,
  },
  {
    featureId: AutumnFeatureId.TEAM_PROJECTS_LIMIT,
    kind: 'limit',
    label: 'Team Projects',
    icon: Folder,
  },
  {
    featureId: AutumnFeatureId.USERS_LIMIT,
    kind: 'limit',
    label: 'Users',
    icon: Users,
  },
];
