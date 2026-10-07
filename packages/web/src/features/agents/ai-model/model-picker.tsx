import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  ModelChoice,
  ModelOptions,
  ModelOptionsSurface,
  OptionModel,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ChevronDown,
  Equal,
  Lightbulb,
  Rocket,
  Sparkles,
  Star,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { aiModelHooks } from './hooks';
import { ModelDetail, ModelDetailCard } from './model-detail-card';
import { modelMeta } from './model-meta';
import { ModelPickerGroup, ModelPickerPopover } from './model-picker-popover';

export function ModelPicker({
  projectId,
  surface,
  value,
  onChange,
  disabled = false,
  className,
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = aiModelHooks.useModelOptions({
    projectId,
    surface,
  });
  const view = useMemo(
    () =>
      isNil(data) ? null : modelPickerView({ options: data, shown: value }),
    [data, value],
  );

  if (isLoading) {
    return <Skeleton className={cn('h-9 w-full', className)} />;
  }

  return (
    <ModelPickerPopover
      groups={view?.groups ?? []}
      notices={
        isError ? (
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2 text-xs text-gray-11">
            {t('Trouble loading models')}
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => refetch()}
            >
              {t('Retry')}
            </Button>
          </div>
        ) : undefined
      }
      emptyText={t(
        'No models available — ask your platform admin to add a provider.',
      )}
      onPick={(choice) => onChange(choice)}
      open={open}
      onOpenChange={setOpen}
      align="start"
      detail={(item) => {
        const detail = view?.detailById.get(item.id);
        return isNil(detail) ? null : <ModelDetailCard detail={detail} />;
      }}
    >
      <button
        type="button"
        disabled={disabled}
        data-testid="model-picker-trigger"
        className={cn(
          'flex h-9 w-full min-w-0 items-center gap-2 rounded-md border bg-panel px-2.5 text-left text-sm transition-colors hover:bg-gray-2 disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
      >
        <TriggerContent current={view?.current ?? emptyPick()} />
        <ChevronDown className="ml-auto size-4 shrink-0 text-gray-10" />
      </button>
    </ModelPickerPopover>
  );
}

export function modelPickerView({
  options,
  shown,
}: {
  options: ModelOptions;
  shown: ModelChoice | null;
}): PickerView {
  const current = resolveCurrent({ options, shown });
  const tierItems = options.tiers.map((tier) => {
    const isSelected = current.kind === 'tier' && current.id === tier.id;
    return {
      item: {
        id: `tier:${tier.id}`,
        value: { type: 'tier', tierId: tier.id } satisfies ModelChoice,
        name: tier.name,
        description: tier.description ?? tier.main.name,
        trailing: contextOf({ model: tier.main }),
        leading: <TierTile emoji={tier.emoji} />,
        badges: <TierBadges isDefault={tier.isDefault} isFast={tier.isFast} />,
        searchText: [
          tier.name,
          tier.description ?? '',
          tier.main.name,
          tier.main.modelId,
          ...tier.fallbacks.map((fallback) => fallback.name),
        ].join(' '),
        selected: isSelected,
      },
      detail: {
        title: tier.name,
        leading: <TierTile emoji={tier.emoji} />,
        badges: <TierBadges isDefault={tier.isDefault} isFast={tier.isFast} />,
        description: tier.description ?? undefined,
        model: tier.main,
        runsOn: tier.main.keyName,
        fallbacks: tier.fallbacks.map((fallback) => ({
          name: fallback.name,
          keyName: fallback.keyName,
        })),
        showPrices: true,
      },
    };
  });
  const credits = options.credits;
  const creditItems = isNil(credits)
    ? []
    : credits.tiers.map((tier) => ({
        item: {
          id: `credits:${tier.id}`,
          value: {
            type: 'model',
            provider: AIProviderName.ACTIVEPIECES,
            providerConfigId: credits.providerConfigId,
            modelId: tier.id,
          } satisfies ModelChoice,
          name: tier.label,
          description: creditDescriptionOf({ tierId: tier.id }),
          leading: <CreditTile tierId={tier.id} />,
          searchText: `${tier.label} ${tier.model.modelId}`,
          selected: current.kind === 'credits' && current.id === tier.id,
        },
        detail: {
          title: tier.label,
          leading: <CreditTile tierId={tier.id} />,
          description: creditDescriptionOf({ tierId: tier.id }),
          model: tier.model,
          runsOn: t('Credits'),
          fallbacks: [],
          showPrices: false,
        },
      }));
  const keyGroups = options.keys.map((key) => {
    const info = modelMeta.providerInfoOf({ provider: key.provider });
    const models = key.models.map((model) => {
      const optionModel: OptionModel = {
        provider: key.provider,
        modelId: model.id,
        name: model.name,
        keyName: key.name,
        ...(isNil(model.metadata) ? {} : { metadata: model.metadata }),
      };
      return {
        item: {
          id: `model:${key.providerConfigId}:${model.id}`,
          value: {
            type: 'model',
            provider: key.provider,
            providerConfigId: key.providerConfigId,
            modelId: model.id,
          } satisfies ModelChoice,
          name: model.name,
          trailing: contextOf({ model: optionModel }),
          searchText: `${model.name} ${model.id} ${key.name} ${info.name}`,
          selected:
            current.kind === 'model' &&
            current.configId === key.providerConfigId &&
            current.id === model.id,
        },
        detail: {
          title: model.name,
          leading: <KeyLogo logoUrl={info.logoUrl} name={info.name} />,
          model: optionModel,
          runsOn: key.name,
          fallbacks: [],
          showPrices: true,
        },
      };
    });
    return { key, info, models };
  });

  const groups: ModelPickerGroup<ModelChoice>[] = [
    ...(tierItems.length === 0
      ? []
      : [
          {
            id: 'tiers',
            section: 'tiers',
            sectionHeading: (
              <SectionHeading dot="bg-swatch-12-mark" label={t('Your tiers')} />
            ),
            heading: t('Your tiers'),
            items: tierItems.map(({ item }) => item),
          },
        ]),
    ...(creditItems.length === 0
      ? []
      : [
          {
            id: 'credits',
            section: 'credits',
            sectionHeading: (
              <SectionHeading dot="bg-accent-10" label={t('Credits')} />
            ),
            heading: t('Credits'),
            items: creditItems.map(({ item }) => item),
          },
        ]),
    ...keyGroups.map(({ key, info, models }) => ({
      id: `key:${key.providerConfigId}`,
      section: 'keys',
      sectionHeading: (
        <SectionHeading dot="bg-gray-10" label={t('Your keys')} />
      ),
      heading: (
        <>
          <KeyLogo logoUrl={info.logoUrl} name={info.name} />
          <span className="truncate font-semibold text-gray-12">
            {key.name}
          </span>
          <span className="truncate text-xs text-gray-10">{info.name}</span>
        </>
      ),
      collapsible: true,
      defaultOpen:
        keyGroups.length === 1 ||
        (current.kind === 'model' && current.configId === key.providerConfigId),
      items: models.map(({ item }) => item),
    })),
  ];

  const detailById = new Map<string, ModelDetail>([
    ...tierItems.map(({ item, detail }) => [item.id, detail] as const),
    ...creditItems.map(({ item, detail }) => [item.id, detail] as const),
    ...keyGroups.flatMap(({ models }) =>
      models.map(({ item, detail }) => [item.id, detail] as const),
    ),
  ]);

  return { groups, detailById, current };
}

function resolveCurrent({
  options,
  shown,
}: {
  options: ModelOptions;
  shown: ModelChoice | null;
}): CurrentPick {
  if (isNil(shown)) {
    return emptyPick();
  }
  if (shown.type === 'tier') {
    const movedTo = options.movedTiers[shown.tierId];
    const tier = options.tiers.find(
      (candidate) => candidate.id === (movedTo ?? shown.tierId),
    );
    return isNil(tier)
      ? unavailablePick({ label: t('Unavailable model') })
      : {
          kind: 'tier',
          id: tier.id,
          label: tier.name,
          leading: <TierTile emoji={tier.emoji} size="sm" />,
          source: isNil(movedTo) ? t('Tier') : t('Moved'),
        };
  }
  if (shown.provider === AIProviderName.ACTIVEPIECES) {
    const tier = options.credits?.tiers.find(
      (candidate) => candidate.id === shown.modelId,
    );
    return isNil(tier)
      ? unavailablePick({ label: shown.modelId })
      : {
          kind: 'credits',
          id: tier.id,
          label: tier.label,
          leading: <CreditTile tierId={tier.id} size="sm" />,
          source: t('Credits'),
        };
  }
  const key =
    options.keys.find(
      (candidate) =>
        candidate.providerConfigId === shown.providerConfigId &&
        candidate.models.some((model) => model.id === shown.modelId),
    ) ??
    options.keys.find(
      (candidate) =>
        candidate.provider === shown.provider &&
        candidate.models.some((model) => model.id === shown.modelId),
    );
  const model = key?.models.find((candidate) => candidate.id === shown.modelId);
  if (isNil(key) || isNil(model)) {
    return options.specificModelsHidden
      ? {
          kind: 'hidden',
          id: shown.modelId,
          label: shown.modelId,
          leading: (
            <TriangleAlert className="size-4 shrink-0 text-warning-11" />
          ),
          source: t('Hidden by admin'),
        }
      : unavailablePick({ label: shown.modelId });
  }
  const info = modelMeta.providerInfoOf({ provider: key.provider });
  return {
    kind: 'model',
    id: model.id,
    configId: key.providerConfigId,
    label: model.name,
    leading: <KeyLogo logoUrl={info.logoUrl} name={info.name} size="xxs" />,
    source: key.name,
  };
}

function emptyPick(): CurrentPick {
  return {
    kind: 'empty',
    id: '',
    label: t('Pick a model'),
    leading: null,
    source: '',
  };
}

function unavailablePick({ label }: { label: string }): CurrentPick {
  return {
    kind: 'unavailable',
    id: '',
    label,
    leading: <TriangleAlert className="size-4 shrink-0 text-warning-11" />,
    source: t('Unavailable'),
  };
}

function TriggerContent({ current }: { current: CurrentPick }) {
  const warn = current.kind === 'unavailable' || current.kind === 'hidden';
  return (
    <>
      {current.leading}
      <span className="truncate font-medium text-gray-12">{current.label}</span>
      {current.source !== '' &&
        (warn ? (
          <span className="shrink-0 rounded-full bg-warning-3 px-1.5 py-0.5 text-xss leading-none text-warning-11">
            {current.source}
          </span>
        ) : (
          <span className="min-w-0 shrink truncate rounded-full bg-gray-3 px-1.5 py-0.5 text-xss leading-none text-gray-11">
            {current.source}
          </span>
        ))}
    </>
  );
}

function SectionHeading({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-2 text-xss font-semibold tracking-wider text-gray-11 uppercase">
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}

function TierTile({ emoji, size = 'md' }: { emoji: string; size?: TileSize }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md bg-gray-3',
        TILE_SIZE[size],
      )}
    >
      {emoji}
    </span>
  );
}

function CreditTile({
  tierId,
  size = 'md',
}: {
  tierId: string;
  size?: TileSize;
}) {
  const Icon = CREDIT_TIERS[tierId]?.icon ?? Sparkles;
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md bg-accent-3',
        TILE_SIZE[size],
      )}
    >
      <Icon className="size-3.5 text-accent-11" />
    </span>
  );
}

function KeyLogo({
  logoUrl,
  name,
  size = 'xs',
}: {
  logoUrl: string;
  name: string;
  size?: 'xxs' | 'xs';
}) {
  return <LogoPlate src={logoUrl} alt={name} size={size} tint />;
}

function TierBadges({
  isDefault,
  isFast,
}: {
  isDefault: boolean;
  isFast: boolean;
}) {
  return (
    <>
      {isDefault && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-3 px-1.5 py-0.5 text-xss leading-none text-accent-11">
          <Star className="size-3 text-accent-11" />
          {t('Default')}
        </span>
      )}
      {isFast && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning-3 px-1.5 py-0.5 text-xss leading-none text-warning-11">
          <Zap className="size-3 text-warning-11" />
          {t('Fast')}
        </span>
      )}
    </>
  );
}

function contextOf({ model }: { model: OptionModel }): string | undefined {
  const tokens = model.metadata?.contextTokens;
  return isNil(tokens) ? undefined : modelMeta.formatContext({ tokens });
}

function creditDescriptionOf({
  tierId,
}: {
  tierId: string;
}): string | undefined {
  const description = CREDIT_TIERS[tierId]?.description;
  return isNil(description) ? undefined : t(description);
}

const CREDIT_TIERS: Partial<
  Record<string, { icon: typeof Sparkles; description: string }>
> = {
  fast: { icon: Equal, description: 'Quick replies for simple tasks' },
  smart: { icon: Lightbulb, description: 'Best for everyday use' },
  premium: { icon: Rocket, description: 'Highest quality, a bit slower' },
};

type CurrentPick = {
  kind: 'tier' | 'credits' | 'model' | 'hidden' | 'unavailable' | 'empty';
  id: string;
  configId?: string;
  label: string;
  leading: ReactNode;
  source: string;
};

type TileSize = 'sm' | 'md';

const TILE_SIZE: Record<TileSize, string> = {
  sm: 'size-5 text-xs',
  md: 'size-6 text-sm',
};

type PickerView = {
  groups: ModelPickerGroup<ModelChoice>[];
  detailById: Map<string, ModelDetail>;
  current: CurrentPick;
};

type ModelPickerProps = {
  projectId: string;
  surface: ModelOptionsSurface;
  value: ModelChoice | null;
  onChange: (choice: ModelChoice) => void;
  disabled?: boolean;
  className?: string;
};
