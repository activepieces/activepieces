import { AIProviderName } from '@activepieces/core-utils';
import {
  AiProviderKeyStatus,
  AIProviderModel,
  AIProviderModelType,
  aiProviderUtils,
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

function keyServesProject({
  config,
  projectId,
}: {
  config: Pick<AIProviderWithoutSensitiveData, 'projectScope' | 'projectIds'>;
  projectId: string;
}): boolean {
  switch (config.projectScope) {
    case 'selected':
      return config.projectIds.includes(projectId);
    case 'except':
      return !config.projectIds.includes(projectId);
    default:
      return true;
  }
}

function entryRunsIn({
  entry,
  config,
  projectId,
}: {
  entry: PlatformModelTierEntry;
  config: AIProviderWithoutSensitiveData | undefined;
  projectId: string;
}): boolean {
  return (
    config !== undefined &&
    keyServesProject({ config, projectId }) &&
    (config.modelScope !== 'selected' || config.modelIds.includes(entry.modelId))
  );
}

function tierReach({
  tier,
  configsById,
  projectIds,
}: {
  tier: PlatformModelTier;
  configsById: Map<string, AIProviderWithoutSensitiveData>;
  projectIds: string[];
}): TierReach {
  const [main, ...fallbacks] = tier.entries;
  const runsIn = (entry: PlatformModelTierEntry, projectId: string) =>
    entryRunsIn({ entry, config: configsById.get(entry.configId), projectId });
  const available =
    main === undefined
      ? []
      : projectIds.filter((projectId) => runsIn(main, projectId));
  const skippedFallbacks = fallbacks.flatMap((entry) => {
    const projectCount = available.filter(
      (projectId) => !runsIn(entry, projectId),
    ).length;
    return projectCount === 0 ? [] : [{ entry, projectCount }];
  });
  return {
    unavailableCount: projectIds.length - available.length,
    skippedFallbacks,
  };
}

function projectsWithoutTier({
  tiers,
  configsById,
  projectIds,
}: {
  tiers: PlatformModelTier[];
  configsById: Map<string, AIProviderWithoutSensitiveData>;
  projectIds: string[];
}): number {
  return projectIds.filter(
    (projectId) =>
      !tiers.some(
        (tier) =>
          tier.entries[0] !== undefined &&
          entryRunsIn({
            entry: tier.entries[0],
            config: configsById.get(tier.entries[0].configId),
            projectId,
          }),
      ),
  ).length;
}

function keyScopeImpact({
  tiers,
  configsById,
  config,
  projectIds,
}: {
  tiers: PlatformModelTier[];
  configsById: Map<string, AIProviderWithoutSensitiveData>;
  config: AIProviderWithoutSensitiveData;
  projectIds: string[];
}): KeyScopeImpact[] {
  const nextConfigs = new Map(configsById).set(config.id, config);
  const skippedOnKey = (reach: TierReach) =>
    reach.skippedFallbacks
      .filter(({ entry }) => entry.configId === config.id)
      .reduce((sum, { projectCount }) => sum + projectCount, 0);
  return tiers.flatMap((tier) => {
    if (!tier.entries.some((entry) => entry.configId === config.id)) {
      return [];
    }
    const before = tierReach({ tier, configsById, projectIds });
    const after = tierReach({ tier, configsById: nextConfigs, projectIds });
    const lostProjects = after.unavailableCount - before.unavailableCount;
    const skippedProjects = skippedOnKey(after) - skippedOnKey(before);
    return lostProjects > 0 || skippedProjects > 0
      ? [{ tierName: tier.name, lostProjects, skippedProjects }]
      : [];
  });
}

function toolsVerdict({
  config,
  entry,
  model,
}: {
  config: AIProviderWithoutSensitiveData | undefined;
  entry: PlatformModelTierEntry | undefined;
  model: AIProviderModel | undefined;
}): ToolsVerdict {
  if (model?.metadata?.supportsToolCalling === false) {
    return 'noTools';
  }
  const curated =
    config === undefined
      ? undefined
      : aiProviderUtils.getCuratedChatModels({ provider: config.provider });
  return entry !== undefined &&
    curated?.some((curatedModel) => curatedModel.id === entry.modelId) === true
    ? 'recommended'
    : null;
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
  keyServesProject,
  entryRunsIn,
  tierReach,
  projectsWithoutTier,
  keyScopeImpact,
  toolsVerdict,
};

export type KeyModelsById = Record<
  string,
  {
    models: AIProviderModel[] | undefined;
    isLoading: boolean;
    isFetching: boolean;
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

export type TierReach = {
  unavailableCount: number;
  skippedFallbacks: { entry: PlatformModelTierEntry; projectCount: number }[];
};

export type KeyScopeImpact = {
  tierName: string;
  lostProjects: number;
  skippedProjects: number;
};

export type ToolsVerdict = 'noTools' | 'recommended' | null;
