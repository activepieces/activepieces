import { AIProviderName, isNil } from '@activepieces/core-utils';
import { DEFAULT_BRAND_LOGOS } from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Cpu,
  KeyRound,
  LayoutGrid,
  LucideIcon,
  User,
  Workflow,
} from 'lucide-react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { cn } from '@/lib/utils';

import { ProviderLogo } from '../providers-tab/provider-logo';

import { UsageDimension, UsageItem } from './usage-dummy-data';
import { usageFormat } from './usage-format';

export function DeltaChip({
  value,
  size = 'sm',
}: {
  value: number;
  size?: 'sm' | 'xs';
}) {
  const flat = Math.abs(value) < FLAT_CHANGE;
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-md font-medium tabular-nums',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'text-xs',
        flat
          ? 'text-gray-11'
          : value > 0
          ? 'text-warning-11'
          : 'text-success-11',
        size === 'sm' &&
          (flat ? 'bg-gray-3' : value > 0 ? 'bg-warning-3' : 'bg-success-3'),
      )}
    >
      {!flat && <Icon className="size-3" />}
      {flat ? '0%' : usageFormat.signedPercent(value)}
    </span>
  );
}

export function ItemIcon({ item }: { item: UsageItem }) {
  const info = SUPPORTED_AI_PROVIDERS.find(
    (provider) => provider.provider === item.provider,
  );
  if (
    (item.dimension === 'key' || item.dimension === 'model') &&
    !isNil(info)
  ) {
    return <ProviderLogo info={info} size="sm" />;
  }
  if (item.provider === AIProviderName.ACTIVEPIECES) {
    return (
      <LogoPlate
        src={DEFAULT_BRAND_LOGOS.logoIconUrl}
        alt={t('Activepieces')}
        className="size-4"
      />
    );
  }
  const Icon = dimensionIcon({ dimension: item.dimension });
  return (
    <span className="flex size-4 shrink-0 items-center justify-center text-gray-11">
      <Icon className="size-4" />
    </span>
  );
}

export function UsageEmptyState({
  dimension,
  label,
}: {
  dimension: UsageDimension;
  label?: string;
}) {
  const Icon = DIMENSION_ICONS[dimension];
  return (
    <div className="flex min-h-36 flex-1 flex-col items-center justify-center gap-2 text-center">
      <span className="flex size-9 items-center justify-center rounded-lg bg-gray-3 text-gray-11">
        <Icon className="size-4" />
      </span>
      <p className="text-sm font-medium text-gray-12">
        {t('No usage from {items}', {
          items: (
            label ?? usageFormat.dimensionLabel({ dimension })
          ).toLowerCase(),
        })}
      </p>
      <p className="max-w-56 text-xs text-gray-11">
        {t('Nothing ran in this period. Try a longer period or All.')}
      </p>
    </div>
  );
}

export function itemSubtitle({ item }: { item: UsageItem }): string {
  if (item.provider === AIProviderName.ACTIVEPIECES) {
    return t('Billed on your plan');
  }
  if (item.dimension === 'project') {
    return t(
      '{flows, plural, =1 {1 flow} other {# flows}} · {agents, plural, =1 {1 agent} other {# agents}}',
      { flows: item.flowCount ?? 0, agents: item.agentCount ?? 0 },
    );
  }
  return item.parent ?? '';
}

export function dimensionIcon({
  dimension,
}: {
  dimension: UsageDimension;
}): LucideIcon {
  return DIMENSION_ICONS[dimension];
}

const FLAT_CHANGE = 0.005;

const DIMENSION_ICONS: Record<UsageDimension, LucideIcon> = {
  project: LayoutGrid,
  flow: Workflow,
  agent: Bot,
  user: User,
  key: KeyRound,
  model: Cpu,
};
