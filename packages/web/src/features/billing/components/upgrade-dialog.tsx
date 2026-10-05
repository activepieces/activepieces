import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlatformWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ExternalLink,
  FileJson2,
  Folder,
  Frame,
  KeyRound,
  LayoutGrid,
  LogIn,
  LucideIcon,
  MoreHorizontal,
  Palette,
  Puzzle,
  Radio,
  ShieldCheck,
  Sparkles,
  SquareDashedBottomCode,
  Unplug,
  UserCog,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { billingQueries } from '../hooks/billing-hooks';
import type { PlatformFeature } from '../hooks/use-feature-gate';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';
import { FeatureTier, TIER_LABELS } from '../utils/feature-tier';
import {
  PLATFORM_FEATURES,
  PlatformFeatureId,
} from '../utils/platform-features';

import { PlanBadge } from './plan-badge';
import { planSelectorUtils } from './plan-selector-utils';
import { useContactSales } from './request-trial';

export function UpgradeDialog({
  open,
  onOpenChange,
  feature,
  showContactSales = true,
}: UpgradeDialogProps) {
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { platform } = platformHooks.useCurrentPlatform();
  const contactSales = useContactSales();
  const isCloud = edition === ApEdition.CLOUD;
  const target = upgradeTarget({ edition, tier: feature.tier });
  const offer = useTierOffer({ tier: target, enabled: open && isCloud });
  const cells = gainedFeatures({ feature, target, plan: platform.plan });
  const selfServe = isCloud && target === 'team';
  const salesKey = showContactSales ? feature.featureKey : undefined;
  const docsUrl = feature.documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL;

  const upgrade = () => {
    onOpenChange(false);
    openManagePlanDialog();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="gap-0 overflow-hidden p-0">
        <div className="grid md:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="flex flex-col p-6 sm:p-8">
            <DialogHeader className="gap-2">
              <DialogTitle className="text-lg">{t(feature.title)}</DialogTitle>
              <DialogDescription className="max-w-prose text-pretty">
                {t(feature.description)}
              </DialogDescription>
            </DialogHeader>

            {offer.stats.length > 0 && (
              <dl className="mt-6 grid grid-cols-3 gap-6 border-y py-4">
                {offer.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col-reverse gap-0.5"
                  >
                    <dt className="text-sm text-gray-11">{stat.label}</dt>
                    <dd className="text-base font-semibold tracking-tight text-gray-12 tabular-nums">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {cells.length > 0 && (
              <>
                <p className="mt-6 text-sm font-medium text-gray-12">
                  {t('Everything else the {tier} plan adds', {
                    tier: TIER_LABELS[target],
                  })}
                </p>
                <ul className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {cells.map((cell) => (
                    <li
                      key={cell.label}
                      className="flex min-w-0 items-center gap-3 text-sm text-gray-12"
                    >
                      <cell.icon className="size-4 shrink-0 text-gray-9" />
                      <span className="truncate">{cell.label}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p className="mt-auto flex items-center gap-2 pt-8 text-sm text-gray-11">
              <ShieldCheck className="size-4 shrink-0" />
              {t('Your flows, connections and data stay exactly as they are.')}
            </p>
          </div>

          <aside className="flex flex-col justify-center border-t bg-gray-2 p-6 sm:p-8 md:border-t-0 md:border-l">
            <div>
              <PlanBadge tier={target} variant="secondary" />
            </div>
            <p className="mt-5 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight text-gray-12">
                {offer.price ?? t('Custom')}
              </span>
              {offer.price !== undefined && offer.suffix !== undefined && (
                <span className="text-sm text-gray-11">{offer.suffix}</span>
              )}
            </p>
            <p className="mt-2 text-sm text-pretty text-gray-11">
              {selfServe && offer.price !== undefined
                ? t(TEAM_TAGLINE)
                : t(
                    'Priced for your organization, on our cloud or your own servers.',
                  )}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              {selfServe ? (
                <Button size="lg" className="w-full" onClick={upgrade}>
                  {t('Upgrade to {tier}', { tier: TIER_LABELS[target] })}
                </Button>
              ) : salesKey !== undefined ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => contactSales(salesKey)}
                >
                  {t('Talk to sales')}
                </Button>
              ) : (
                <Button size="lg" className="w-full" asChild>
                  <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                    {t('Read the docs')}
                    <ExternalLink />
                  </a>
                </Button>
              )}
              {isCloud ? (
                <Button
                  variant="link"
                  size="sm"
                  className="w-full"
                  onClick={upgrade}
                >
                  {t('Compare all plans')}
                </Button>
              ) : (
                salesKey !== undefined && (
                  <Button variant="link" size="sm" className="w-full" asChild>
                    <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                      {t('Read the docs')}
                    </a>
                  </Button>
                )
              )}
              <p className="text-center text-sm text-gray-11">
                {selfServe
                  ? t('Cancel any time.')
                  : isCloud
                  ? t('Custom limits, SLA and dedicated support.')
                  : t('A license key unlocks it on your own servers.')}
              </p>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function upgradeTarget({
  edition,
  tier,
}: {
  edition: ApEdition | null | undefined;
  tier: FeatureTier | undefined;
}): FeatureTier {
  if (edition !== ApEdition.CLOUD || tier === undefined) {
    return 'enterprise';
  }
  return tier;
}

function useTierOffer({
  tier,
  enabled,
}: {
  tier: FeatureTier;
  enabled: boolean;
}): TierOffer {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: plans } = billingQueries.useListPlans(
    platform.id,
    enabled && tier === 'team',
  );
  const entry = planSelectorUtils.PLAN_CATALOG.find(
    (candidate) => candidate.key === tier,
  );
  const apiPlan =
    !enabled || isNil(plans) || isNil(entry)
      ? undefined
      : planSelectorUtils.findPurchasablePlan({
          plans,
          key: entry.key,
          cycle: 'month',
        });
  if (isNil(entry) || isNil(apiPlan)) {
    return { stats: [] };
  }
  const pricing = planSelectorUtils.computePricing({
    entry,
    apiPlan,
    monthlySibling: apiPlan,
  });
  const stats: TierStat[] = [
    ...(isNil(apiPlan.includedCredits)
      ? []
      : [
          {
            value: apiPlan.includedCredits.toLocaleString(),
            label: t('credits a month'),
          },
        ]),
    ...(isNil(apiPlan.includedSeats)
      ? []
      : [
          {
            value: apiPlan.includedSeats.toLocaleString(),
            label: t('{count, plural, =1 {seat} other {seats}}', {
              count: apiPlan.includedSeats,
            }),
          },
        ]),
    { value: t('Unlimited'), label: t('team projects') },
  ];
  return {
    price: isNil(pricing) || pricing.amount === '' ? undefined : pricing.amount,
    suffix: pricing?.suffix,
    stats,
  };
}

function gainedFeatures({
  feature,
  target,
  plan,
}: {
  feature: UpgradeDialogFeature;
  target: FeatureTier;
  plan: PlatformWithoutSensitiveData['plan'];
}): FeatureCell[] {
  const gained = FEATURE_IDS.filter((id) => {
    const candidate = PLATFORM_FEATURES[id];
    return (
      candidate.featureKey !== feature.featureKey &&
      TIER_RANK[candidate.tier] <= TIER_RANK[target] &&
      !INCLUDED_IN_PLAN[id](plan)
    );
  })
    .sort(
      (a, b) =>
        TIER_RANK[PLATFORM_FEATURES[b].tier] -
        TIER_RANK[PLATFORM_FEATURES[a].tier],
    )
    .map((id) => ({
      label: t(FEATURE_CELLS[id].label),
      icon: FEATURE_CELLS[id].icon,
    }));
  if (gained.length <= MAX_CELLS) {
    return gained;
  }
  return [
    ...gained.slice(0, MAX_CELLS - 1),
    {
      label: t('+{count} more', { count: gained.length - (MAX_CELLS - 1) }),
      icon: MoreHorizontal,
    },
  ];
}

const MAX_CELLS = 10;

const FEATURE_IDS: PlatformFeatureId[] = [
  'projects',
  'sso',
  'projectRoles',
  'globalConnections',
  'apiKeys',
  'secretManagers',
  'auditLogs',
  'eventStreaming',
  'templates',
  'embedding',
  'branding',
  'pieces',
];

const TIER_RANK: Record<FeatureTier, number> = {
  plus: 0,
  team: 1,
  enterprise: 2,
};

const INCLUDED_IN_PLAN: Record<
  PlatformFeatureId,
  (plan: PlatformWithoutSensitiveData['plan']) => boolean
> = {
  projects: (plan) =>
    isNil(plan.billedTeamProjectsLimit) || plan.billedTeamProjectsLimit > 1,
  sso: (plan) => plan.ssoEnabled,
  projectRoles: (plan) => plan.projectRolesEnabled,
  globalConnections: (plan) => plan.globalConnectionsEnabled,
  apiKeys: (plan) => plan.apiKeysEnabled,
  secretManagers: (plan) => plan.secretManagersEnabled,
  auditLogs: (plan) => plan.auditLogEnabled,
  eventStreaming: (plan) => plan.eventStreamingEnabled,
  templates: (plan) => plan.manageTemplatesEnabled,
  embedding: (plan) => plan.embeddingEnabled,
  branding: (plan) => plan.customAppearanceEnabled,
  pieces: (plan) => plan.managePiecesEnabled,
  aiProviders: (plan) => plan.aiProvidersEnabled,
};

const FEATURE_CELLS: Record<
  PlatformFeatureId,
  { label: string; icon: LucideIcon }
> = {
  projects: { label: 'Team projects', icon: Folder },
  sso: { label: 'Single sign-on', icon: LogIn },
  projectRoles: { label: 'Custom roles', icon: UserCog },
  globalConnections: { label: 'Global connections', icon: Unplug },
  apiKeys: { label: 'API keys', icon: FileJson2 },
  secretManagers: { label: 'Secret managers', icon: KeyRound },
  auditLogs: { label: 'Audit logs', icon: SquareDashedBottomCode },
  eventStreaming: { label: 'Event streaming', icon: Radio },
  templates: { label: 'Templates', icon: LayoutGrid },
  embedding: { label: 'Embedding', icon: Frame },
  branding: { label: 'Branding', icon: Palette },
  pieces: { label: 'Piece management', icon: Puzzle },
  aiProviders: { label: 'AI providers', icon: Sparkles },
};

const TEAM_TAGLINE =
  'For teams that share automations and need control over who does what.';

const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

type TierStat = {
  value: string;
  label: string;
};

type TierOffer = {
  price?: string;
  suffix?: string;
  stats: TierStat[];
};

type FeatureCell = {
  label: string;
  icon: LucideIcon;
};

type UpgradeDialogFeature = Omit<PlatformFeature, 'featureKey'> & {
  featureKey?: PlatformFeature['featureKey'];
};

type UpgradeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: UpgradeDialogFeature;
  showContactSales?: boolean;
};
