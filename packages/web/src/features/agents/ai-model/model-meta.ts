import { AIProviderName } from '@activepieces/core-utils';
import {
  AiProviderKeyStatus,
  AIProviderModel,
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
  PlatformModelTier,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { t } from 'i18next';

import {
  AiProviderInfo,
  SUPPORTED_AI_PROVIDERS,
} from '@/features/agents/ai-providers';
import { formatUtils } from '@/lib/format-utils';

function isOwnKey(config: AIProviderWithoutSensitiveData): boolean {
  return config.provider !== AIProviderName.ACTIVEPIECES;
}

function providerInfoOf({
  provider,
}: {
  provider: AIProviderName;
}): AiProviderInfo {
  return (
    SUPPORTED_AI_PROVIDERS.find((info) => info.provider === provider) ?? {
      provider,
      name: provider,
      markdown: '',
      logoUrl: '',
    }
  );
}

function scopedTextModels({
  config,
  models,
}: {
  config: AIProviderWithoutSensitiveData;
  models: AIProviderModel[];
}): AIProviderModel[] {
  return models.filter(
    (model) =>
      model.type === AIProviderModelType.TEXT &&
      (config.modelScope !== 'selected' || config.modelIds.includes(model.id)),
  );
}

function formatContext({ tokens }: { tokens: number }): string {
  return formatUtils.formatNumberCompact(tokens);
}

function formatPrice({ perMillion }: { perMillion: number }): string {
  return Number.isInteger(perMillion)
    ? `$${perMillion}`
    : `$${perMillion.toFixed(2)}`;
}

function metaParts({ model }: { model: AIProviderModel }): string[] {
  const metadata = model.metadata;
  if (metadata === undefined) {
    return [];
  }
  const context =
    metadata.contextTokens === undefined
      ? []
      : [
          t('{context} context', {
            context: formatContext({ tokens: metadata.contextTokens }),
          }),
        ];
  const price =
    metadata.inputCostPerMillionTokens === undefined ||
    metadata.outputCostPerMillionTokens === undefined
      ? []
      : [
          t('{input} / {output} per 1M', {
            input: formatPrice({
              perMillion: metadata.inputCostPerMillionTokens,
            }),
            output: formatPrice({
              perMillion: metadata.outputCostPerMillionTokens,
            }),
          }),
        ];
  return [...context, ...price];
}

function entryKey({ entry }: { entry: PlatformModelTierEntry }): string {
  return `${entry.configId}:${entry.modelId}`;
}

function sameEntry(
  a: PlatformModelTierEntry,
  b: PlatformModelTierEntry,
): boolean {
  return a.configId === b.configId && a.modelId === b.modelId;
}

function catalogModel({
  keyModels,
  entry,
}: {
  keyModels: KeyModelsById;
  entry: PlatformModelTierEntry;
}): AIProviderModel | undefined {
  return keyModels[entry.configId]?.models?.find(
    (model) => model.id === entry.modelId,
  );
}

function rankForFallback({
  main,
  candidates,
}: {
  main: AIProviderModel | undefined;
  candidates: PickableModel[];
}): RankedGroup[] {
  const mainMetadata = main?.metadata;
  if (mainMetadata === undefined) {
    return [
      {
        kind: 'all',
        items: candidates.map((item) => ({ ...item, tradeOffs: [] })),
      },
    ];
  }
  const ranked = candidates.map((item) => ({
    ...item,
    tradeOffs: tradeOffsAgainst({ main: mainMetadata, candidate: item.model }),
  }));
  const withMetadata = ranked.filter(
    (item) => item.model.metadata !== undefined,
  );
  const groups: RankedGroup[] = [
    {
      kind: 'full',
      items: withMetadata.filter((item) => item.tradeOffs.length === 0),
    },
    {
      kind: 'tradeOff',
      items: withMetadata.filter((item) => item.tradeOffs.length > 0),
    },
    {
      kind: 'other',
      items: ranked.filter((item) => item.model.metadata === undefined),
    },
  ];
  return groups.filter((group) => group.items.length > 0);
}

function warningsFor({
  entry,
  isMain,
  config,
  keyModels,
  mainModel,
}: {
  entry: PlatformModelTierEntry;
  isMain: boolean;
  config: AIProviderWithoutSensitiveData | undefined;
  keyModels: KeyModelsById;
  mainModel: AIProviderModel | undefined;
}): EntryWarning[] {
  if (config === undefined) {
    return [{ code: 'keyMissing' }];
  }
  const loaded = keyModels[config.id]?.models;
  const model = catalogModel({ keyModels, entry });
  const gone =
    loaded !== undefined && model === undefined
      ? [{ code: 'modelGone' as const, keyName: config.name }]
      : [];
  const smaller =
    !isMain &&
    model?.metadata?.contextTokens !== undefined &&
    mainModel?.metadata?.contextTokens !== undefined &&
    model.metadata.contextTokens < mainModel.metadata.contextTokens
      ? [
          {
            code: 'smallerContext' as const,
            contextTokens: model.metadata.contextTokens,
            mainContextTokens: mainModel.metadata.contextTokens,
          },
        ]
      : [];
  const status =
    config.status === 'active'
      ? []
      : [{ code: 'keyStatus' as const, status: config.status }];
  return [...gone, ...smaller, ...status];
}

function specificModelsOf({
  configs,
  keyModels,
  tiers,
}: {
  configs: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
  tiers: PlatformModelTier[];
}): PickableModel[] {
  const mains = tiers.flatMap((tier) => tier.entries.slice(0, 1));
  return configs
    .filter(isOwnKey)
    .flatMap((config) =>
      (keyModels[config.id]?.models ?? [])
        .filter(
          (model) =>
            !mains.some((main) =>
              sameEntry(main, { configId: config.id, modelId: model.id }),
            ),
        )
        .map((model) => ({ config, model })),
    );
}

function replaceMain({
  entries,
  entry,
}: {
  entries: PlatformModelTierEntry[];
  entry: PlatformModelTierEntry;
}): PlatformModelTierEntry[] {
  return [
    entry,
    ...entries.slice(1).filter((other) => !sameEntry(other, entry)),
  ];
}

function addFallback({
  entries,
  entry,
}: {
  entries: PlatformModelTierEntry[];
  entry: PlatformModelTierEntry;
}): PlatformModelTierEntry[] {
  return entries.some((other) => sameEntry(other, entry))
    ? entries
    : [...entries, entry];
}

function removeAt({
  entries,
  index,
}: {
  entries: PlatformModelTierEntry[];
  index: number;
}): PlatformModelTierEntry[] {
  return entries.filter((_, position) => position !== index);
}

function moveEntry({
  entries,
  from,
  to,
}: {
  entries: PlatformModelTierEntry[];
  from: number;
  to: number;
}): PlatformModelTierEntry[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= entries.length ||
    to >= entries.length
  ) {
    return entries;
  }
  const without = entries.filter((_, position) => position !== from);
  return [...without.slice(0, to), entries[from], ...without.slice(to)];
}

function tradeOffsAgainst({
  main,
  candidate,
}: {
  main: NonNullable<AIProviderModel['metadata']>;
  candidate: AIProviderModel;
}): TradeOff[] {
  const metadata = candidate.metadata;
  if (metadata === undefined) {
    return [];
  }
  const smaller =
    metadata.contextTokens !== undefined &&
    main.contextTokens !== undefined &&
    metadata.contextTokens < main.contextTokens
      ? [
          {
            code: 'smallerContext' as const,
            contextTokens: metadata.contextTokens,
          },
        ]
      : [];
  const noTools =
    main.supportsToolCalling === true && metadata.supportsToolCalling === false
      ? [{ code: 'noToolCalling' as const }]
      : [];
  return [...smaller, ...noTools];
}

export const modelMeta = {
  isOwnKey,
  providerInfoOf,
  scopedTextModels,
  formatContext,
  formatPrice,
  metaParts,
  entryKey,
  sameEntry,
  catalogModel,
  rankForFallback,
  warningsFor,
  specificModelsOf,
  replaceMain,
  addFallback,
  removeAt,
  moveEntry,
};

export type KeyModelsById = Record<
  string,
  {
    models: AIProviderModel[] | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => unknown;
  }
>;

export type PickableModel = {
  config: AIProviderWithoutSensitiveData;
  model: AIProviderModel;
};

export type TradeOff =
  | { code: 'smallerContext'; contextTokens: number }
  | { code: 'noToolCalling' };

export type RankedModel = PickableModel & { tradeOffs: TradeOff[] };

export type RankedGroup = {
  kind: 'all' | 'full' | 'tradeOff' | 'other';
  items: RankedModel[];
};

export type EntryWarning =
  | { code: 'keyMissing' }
  | { code: 'modelGone'; keyName: string }
  | { code: 'smallerContext'; contextTokens: number; mainContextTokens: number }
  | { code: 'keyStatus'; status: AiProviderKeyStatus };
