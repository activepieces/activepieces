import { isNil } from '@activepieces/core-utils';
import {
  AIProviderModel,
  AIProviderWithoutSensitiveData,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';
import { ReactNode } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ModelDetail,
  ModelDetailCard,
} from '@/features/agents/ai-model/model-detail-card';
import {
  KeyModelsById,
  modelMeta,
  PickableModel,
  RankedGroup,
  RankedModel,
  TradeOff,
} from '@/features/agents/ai-model/model-meta';
import {
  ModelPickerGroup,
  ModelPickerItem,
  ModelPickerPopover,
} from '@/features/agents/ai-model/model-picker-popover';
import { SectionHeading } from '@/features/agents/ai-model/section-heading';
import { cn } from '@/lib/utils';

import { KeyStatusBadge } from '../providers-tab/key-status';

export function AdminModelPicker({
  configs,
  keyModels,
  exclude,
  main,
  mode,
  onPick,
  open,
  onOpenChange,
  align = 'end',
  anchorOnly = false,
  children,
}: AdminModelPickerProps) {
  const pickable: PickableModel[] = configs.flatMap((config) =>
    (keyModels[config.id]?.models ?? []).map((model) => ({ config, model })),
  );
  const sections: { kind: SectionKind; items: RankedModel[] }[] =
    mode === 'fallback'
      ? modelMeta.rankForFallback({ main, candidates: pickable })
      : [
          {
            kind: 'keys',
            items: pickable.map((item) => ({ ...item, tradeOffs: [] })),
          },
        ];
  const built = sections.flatMap(({ kind, items }) =>
    items.map((item) => ({ kind, ...buildItem({ item, exclude }) })),
  );
  const detailById = new Map(
    built.map(({ item, detail }) => [item.id, detail] as const),
  );
  const groups: ModelPickerGroup<PlatformModelTierEntry>[] = sections.flatMap(
    ({ kind }) =>
      configs.flatMap((config) => {
        const items = built
          .filter(
            (entry) =>
              entry.kind === kind && entry.item.value.configId === config.id,
          )
          .map(({ item }) => item);
        return items.length === 0
          ? []
          : [
              {
                id: `${kind}:${config.id}`,
                section: kind,
                sectionHeading: (
                  <SectionHeading
                    dot={SECTION_DOT[kind]}
                    label={sectionLabel({ kind })}
                  />
                ),
                heading: <KeyHeading config={config} />,
                collapsible: true,
                defaultOpen: configs.length === 1 || kind === 'full',
                items,
              },
            ];
      }),
  );
  const loadingKeys = configs.filter(
    (config) => keyModels[config.id]?.isLoading === true,
  );
  const failedKeys = configs.filter(
    (config) => keyModels[config.id]?.isError === true,
  );

  return (
    <ModelPickerPopover
      groups={groups}
      notices={
        <KeyNotices
          loadingKeys={loadingKeys}
          failedKeys={failedKeys}
          keyModels={keyModels}
        />
      }
      emptyText={emptyTextOf({
        total: configs.length,
        loading: loadingKeys.length,
        failed: failedKeys.length,
        pickable: pickable.length,
      })}
      onPick={onPick}
      open={open}
      onOpenChange={onOpenChange}
      align={align}
      anchorOnly={anchorOnly}
      detail={(item) => {
        const detail = detailById.get(item.id);
        return isNil(detail) ? null : <ModelDetailCard detail={detail} />;
      }}
    >
      {children}
    </ModelPickerPopover>
  );
}

function buildItem({
  item,
  exclude,
}: {
  item: RankedModel;
  exclude: PlatformModelTierEntry[];
}): {
  item: ModelPickerItem<PlatformModelTierEntry>;
  detail: ModelDetail;
} {
  const entry = { configId: item.config.id, modelId: item.model.id };
  const taken = exclude.some((other) => modelMeta.sameEntry(other, entry));
  const info = modelMeta.providerInfoOf({ provider: item.config.provider });
  const note =
    item.tradeOffs.length === 0
      ? undefined
      : item.tradeOffs.map(tradeOffText).join(' · ');
  const contextTokens = item.model.metadata?.contextTokens;
  return {
    item: {
      id: modelMeta.entryKey({ entry }),
      value: entry,
      name: item.model.name,
      searchText: `${item.model.name} ${item.model.id} ${item.config.name} ${item.config.provider}`,
      trailing: isNil(contextTokens)
        ? undefined
        : modelMeta.formatContext({ tokens: contextTokens }),
      note,
      disabled: taken,
      selected: taken,
    },
    detail: {
      title: item.model.name,
      leading:
        info.logoUrl === '' ? undefined : (
          <LogoPlate src={info.logoUrl} alt={info.name} size="xs" tint />
        ),
      description: note,
      model: {
        provider: item.config.provider,
        modelId: item.model.id,
        name: item.model.name,
        keyName: item.config.name,
        ...(isNil(item.model.metadata)
          ? {}
          : { metadata: item.model.metadata }),
      },
      runsOn: item.config.name,
      fallbacks: [],
      showPrices: true,
    },
  };
}

function KeyHeading({ config }: { config: AIProviderWithoutSensitiveData }) {
  const info = modelMeta.providerInfoOf({ provider: config.provider });
  return (
    <>
      {info.logoUrl !== '' && (
        <LogoPlate src={info.logoUrl} alt={info.name} size="xs" tint />
      )}
      <span className="truncate font-semibold text-gray-12">{config.name}</span>
      <span className="truncate text-xs text-gray-10">{info.name}</span>
      {config.status !== 'active' && <KeyStatusBadge status={config.status} />}
    </>
  );
}

function KeyNotices({
  loadingKeys,
  failedKeys,
  keyModels,
}: {
  loadingKeys: AIProviderWithoutSensitiveData[];
  failedKeys: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
}) {
  if (loadingKeys.length === 0 && failedKeys.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1.5 border-b border-gray-6/60 px-3 py-2">
      {loadingKeys.map((config) => (
        <div key={config.id} className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
      {failedKeys.map((config) => (
        <div
          key={config.id}
          className="flex items-center justify-between gap-2 text-xs text-gray-11"
        >
          <span>{t("Couldn't load {key} models", { key: config.name })}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t('Retry')}
            disabled={keyModels[config.id]?.isFetching === true}
            onClick={() => keyModels[config.id]?.refetch()}
          >
            <RefreshCw
              className={cn(
                'size-3',
                keyModels[config.id]?.isFetching === true && 'animate-spin',
              )}
            />
          </Button>
        </div>
      ))}
    </div>
  );
}

function emptyTextOf({
  total,
  loading,
  failed,
  pickable,
}: {
  total: number;
  loading: number;
  failed: number;
  pickable: number;
}): string {
  if (total > 0 && loading === total) {
    return t('Loading models…');
  }
  if (total > 0 && failed === total) {
    return t("Couldn't load models");
  }
  return pickable === 0
    ? t('No text models on your keys yet')
    : t('No models match');
}

function sectionLabel({ kind }: { kind: SectionKind }): string {
  switch (kind) {
    case 'keys':
    case 'all':
      return t('Your keys');
    case 'full':
      return t('Full matches');
    case 'tradeOff':
      return t('With trade-offs');
    case 'other':
      return t('Other models');
  }
}

function tradeOffText(tradeOff: TradeOff): string {
  switch (tradeOff.code) {
    case 'smallerContext':
      return t('Smaller context ({context})', {
        context: modelMeta.formatContext({ tokens: tradeOff.contextTokens }),
      });
    case 'noToolCalling':
      return t('No tool calling');
  }
}

const SECTION_DOT: Record<SectionKind, string> = {
  keys: 'bg-gray-10',
  full: 'bg-success-10',
  tradeOff: 'bg-warning-10',
  other: 'bg-gray-10',
  all: 'bg-gray-10',
};

type SectionKind = RankedGroup['kind'] | 'keys';

type AdminModelPickerProps = {
  configs: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
  exclude: PlatformModelTierEntry[];
  main?: AIProviderModel;
  mode: 'main' | 'fallback';
  onPick: (entry: PlatformModelTierEntry) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'start' | 'end';
  anchorOnly?: boolean;
  children: ReactNode;
};
