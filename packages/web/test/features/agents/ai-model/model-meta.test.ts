import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderModel,
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
  PlatformModelTier,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import {
  KeyModelsById,
  modelMeta,
} from '@/features/agents/ai-model/model-meta';

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string, vars?: Record<string, string | number>) =>
    Object.entries(vars ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      key,
    ),
}));

describe('modelMeta formatting', () => {
  it('formats context windows compactly and prices without noise', () => {
    expect(modelMeta.formatContext({ tokens: 200_000 })).toBe('200K');
    expect(modelMeta.formatContext({ tokens: 1_000_000 })).toBe('1M');
    expect(modelMeta.formatPrice({ perMillion: 0.8 })).toBe('$0.80');
    expect(modelMeta.formatPrice({ perMillion: 4 })).toBe('$4');
    expect(modelMeta.formatPrice({ perMillion: 1.75 })).toBe('$1.75');
  });

  it('builds the meta line only from the metadata that exists', () => {
    expect(modelMeta.metaParts({ model: model('a', {}) })).toEqual([]);
    expect(
      modelMeta.metaParts({
        model: model('a', { contextTokens: 200_000 }),
      }),
    ).toEqual(['200K context']);
    expect(
      modelMeta.metaParts({
        model: model('a', {
          contextTokens: 200_000,
          inputCostPerMillionTokens: 0.8,
          outputCostPerMillionTokens: 4,
        }),
      }),
    ).toEqual(['200K context', '$0.80 / $4 per 1M']);
  });
});

describe('modelMeta.scopedTextModels', () => {
  it('keeps text models the key allows and drops image models', () => {
    const config = key('k1', { modelScope: 'selected', modelIds: ['a'] });
    const models = [
      model('a', {}),
      model('b', {}),
      { ...model('c', {}), type: AIProviderModelType.IMAGE },
    ];
    expect(
      modelMeta.scopedTextModels({ config, models }).map((m) => m.id),
    ).toEqual(['a']);
    expect(
      modelMeta
        .scopedTextModels({ config: key('k2', {}), models })
        .map((m) => m.id),
    ).toEqual(['a', 'b']);
  });
});

describe('modelMeta.rankForFallback', () => {
  const main = model('main', {
    contextTokens: 1_000_000,
    supportsToolCalling: true,
  });
  const candidates = [
    {
      config: key('k1', {}),
      model: model('full', {
        contextTokens: 1_000_000,
        supportsToolCalling: true,
      }),
    },
    {
      config: key('k1', {}),
      model: model('small', {
        contextTokens: 200_000,
        supportsToolCalling: true,
      }),
    },
    {
      config: key('k1', {}),
      model: model('notools', {
        contextTokens: 1_000_000,
        supportsToolCalling: false,
      }),
    },
    { config: key('k1', {}), model: model('unknown', undefined) },
  ];

  it('splits full matches, trade-offs and models without metadata', () => {
    const groups = modelMeta.rankForFallback({ main, candidates });
    expect(groups.map((group) => group.kind)).toEqual([
      'full',
      'tradeOff',
      'other',
    ]);
    expect(groups[0].items.map((item) => item.model.id)).toEqual(['full']);
    expect(groups[1].items.map((item) => item.model.id)).toEqual([
      'small',
      'notools',
    ]);
    expect(groups[1].items[0].tradeOffs).toEqual([
      { code: 'smallerContext', contextTokens: 200_000 },
    ]);
    expect(groups[1].items[1].tradeOffs).toEqual([{ code: 'noToolCalling' }]);
    expect(groups[2].items.map((item) => item.model.id)).toEqual(['unknown']);
  });

  it('falls back to one flat list when the main model has no metadata', () => {
    const groups = modelMeta.rankForFallback({
      main: model('main', undefined),
      candidates,
    });
    expect(groups.map((group) => group.kind)).toEqual(['all']);
    expect(groups[0].items).toHaveLength(4);
  });
});

describe('modelMeta.warningsFor', () => {
  const keyModels: KeyModelsById = {
    k1: {
      models: [
        model('main', { contextTokens: 1_000_000 }),
        model('small', { contextTokens: 200_000 }),
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: () => undefined,
    },
    k2: {
      models: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
      refetch: () => undefined,
    },
  };
  const mainModel = model('main', { contextTokens: 1_000_000 });

  it('warns when the model left the key, the context is smaller, or the key is unhealthy', () => {
    expect(
      modelMeta.warningsFor({
        entry: { configId: 'k1', modelId: 'gone' },
        isMain: false,
        config: key('k1', { status: 'out_of_credits' }),
        keyModels,
        mainModel,
      }),
    ).toEqual([
      { code: 'modelGone', keyName: 'Key k1' },
      { code: 'keyStatus', status: 'out_of_credits' },
    ]);
    expect(
      modelMeta.warningsFor({
        entry: { configId: 'k1', modelId: 'small' },
        isMain: false,
        config: key('k1', {}),
        keyModels,
        mainModel,
      }),
    ).toEqual([
      {
        code: 'smallerContext',
        contextTokens: 200_000,
        mainContextTokens: 1_000_000,
      },
    ]);
  });

  it('stays quiet while the key list is loading and flags a missing key', () => {
    expect(
      modelMeta.warningsFor({
        entry: { configId: 'k2', modelId: 'anything' },
        isMain: false,
        config: key('k2', {}),
        keyModels,
        mainModel,
      }),
    ).toEqual([]);
    expect(
      modelMeta.warningsFor({
        entry: { configId: 'missing', modelId: 'x' },
        isMain: true,
        config: undefined,
        keyModels,
        mainModel,
      }),
    ).toEqual([{ code: 'keyMissing' }]);
  });
});

describe('modelMeta.specificModelsOf', () => {
  it('lists scoped text models that are not a tier main model, skipping the credits key', () => {
    const configs = [
      key('k1', {}),
      key('ap', { provider: AIProviderName.ACTIVEPIECES }),
    ];
    const keyModels: KeyModelsById = {
      k1: {
        models: [model('a', {}), model('b', {})],
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch: () => undefined,
      },
      ap: {
        models: [model('z', {})],
        isLoading: false,
        isFetching: false,
        isError: false,
        refetch: () => undefined,
      },
    };
    const tiers = [
      tier('t1', [
        { configId: 'k1', modelId: 'a' },
        { configId: 'k1', modelId: 'b' },
      ]),
    ];
    expect(
      modelMeta
        .specificModelsOf({ configs, keyModels, tiers })
        .map(({ model }) => model.id),
    ).toEqual(['b']);
  });
});

describe('modelMeta entry operations', () => {
  const entries = [
    { configId: 'k', modelId: 'm0' },
    { configId: 'k', modelId: 'm1' },
    { configId: 'k', modelId: 'm2' },
  ];

  it('replaces the main model and drops it from the fallbacks if it was one', () => {
    expect(
      modelMeta.replaceMain({
        entries,
        entry: { configId: 'k', modelId: 'm1' },
      }),
    ).toEqual([
      { configId: 'k', modelId: 'm1' },
      { configId: 'k', modelId: 'm2' },
    ]);
  });

  it('moves a fallback to the top so it becomes the main model', () => {
    expect(
      modelMeta.moveEntry({ entries, from: 2, to: 0 }).map((e) => e.modelId),
    ).toEqual(['m2', 'm0', 'm1']);
    expect(modelMeta.moveEntry({ entries, from: 0, to: 5 })).toBe(entries);
  });

  it('removes by index and never adds a duplicate fallback', () => {
    expect(
      modelMeta.removeAt({ entries, index: 1 }).map((e) => e.modelId),
    ).toEqual(['m0', 'm2']);
    expect(
      modelMeta.addFallback({
        entries,
        entry: { configId: 'k', modelId: 'm1' },
      }),
    ).toBe(entries);
    expect(
      modelMeta.addFallback({
        entries,
        entry: { configId: 'k', modelId: 'm3' },
      }),
    ).toHaveLength(4);
  });
});

describe('modelMeta project scope', () => {
  const open = key('open', {});
  const onlyA = key('onlyA', { projectScope: 'selected', projectIds: ['A'] });
  const notA = key('notA', { projectScope: 'except', projectIds: ['A'] });
  const configsById = new Map([open, onlyA, notA].map((config) => [config.id, config]));
  const projectIds = ['A', 'B', 'C'];

  it('mirrors the server rule for which projects a key serves', () => {
    expect(projectIds.filter((projectId) => modelMeta.keyServesProject({ config: onlyA, projectId }))).toEqual(['A']);
    expect(projectIds.filter((projectId) => modelMeta.keyServesProject({ config: notA, projectId }))).toEqual(['B', 'C']);
    expect(projectIds.filter((projectId) => modelMeta.keyServesProject({ config: open, projectId }))).toEqual(projectIds);
  });

  it('counts the projects a tier is missing from and the fallbacks skipped where it runs', () => {
    const reach = modelMeta.tierReach({
      tier: tier('t', [
        { configId: notA.id, modelId: 'main' },
        { configId: onlyA.id, modelId: 'fallback' },
      ]),
      configsById,
      projectIds,
    });

    expect(reach.unavailableCount).toBe(1);
    expect(reach.skippedFallbacks).toEqual([
      { entry: { configId: onlyA.id, modelId: 'fallback' }, projectCount: 2 },
    ]);
  });

  it('counts projects left with no tier at all', () => {
    expect(
      modelMeta.projectsWithoutTier({
        tiers: [tier('t', [{ configId: onlyA.id, modelId: 'main' }])],
        configsById,
        projectIds,
      }),
    ).toBe(2);
  });

  it('reports what narrowing a key does to the tiers that use it', () => {
    const tiers = [
      { ...tier('Expert', [{ configId: open.id, modelId: 'main' }]), name: 'Expert' },
      {
        ...tier('Fast', [
          { configId: notA.id, modelId: 'main' },
          { configId: open.id, modelId: 'fallback' },
        ]),
        name: 'Fast',
      },
      { ...tier('Other', [{ configId: notA.id, modelId: 'main' }]), name: 'Other' },
    ];

    const impact = modelMeta.keyScopeImpact({
      tiers,
      configsById,
      config: { ...open, projectScope: 'selected', projectIds: ['A'] },
      projectIds,
    });

    expect(impact).toEqual([
      { tierName: 'Expert', lostProjects: 2, skippedProjects: 0 },
      { tierName: 'Fast', lostProjects: 0, skippedProjects: 2 },
    ]);
  });

  it('flags a main model that cannot call tools and recommends a curated one', () => {
    const openAi = key('k', { provider: AIProviderName.OPENAI });
    expect(
      modelMeta.toolsVerdict({
        config: openAi,
        entry: { configId: 'k', modelId: 'x' },
        model: model('x', { supportsToolCalling: false }),
      }),
    ).toBe('noTools');
    expect(
      modelMeta.toolsVerdict({
        config: openAi,
        entry: { configId: 'k', modelId: 'gpt-4.1' },
        model: model('gpt-4.1', {}),
      }),
    ).toBe('recommended');
    expect(
      modelMeta.toolsVerdict({
        config: openAi,
        entry: { configId: 'k', modelId: 'some-model' },
        model: undefined,
      }),
    ).toBeNull();
  });
});

function model(
  id: string,
  metadata: AIProviderModel['metadata'] | Record<string, never>,
): AIProviderModel {
  return {
    id,
    name: id,
    type: AIProviderModelType.TEXT,
    ...(metadata === undefined ? {} : { metadata }),
  };
}

function key(
  id: string,
  overrides: Partial<AIProviderWithoutSensitiveData>,
): AIProviderWithoutSensitiveData {
  return {
    id,
    name: `Key ${id}`,
    provider: AIProviderName.OPENAI,
    config: {},
    enabledForChat: false,
    modelScope: 'all',
    modelIds: [],
    projectScope: 'all',
    projectIds: [],
    status: 'active',
    statusReason: null,
    statusUpdated: null,
    ...overrides,
  };
}

function tier(
  id: string,
  entries: PlatformModelTier['entries'],
): PlatformModelTier {
  return {
    id,
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    platformId: 'p',
    name: id,
    emoji: '⚡',
    description: null,
    position: 0,
    entries,
    isDefault: true,
    isFast: true,
    thinkingBudget: null,
    deleted: null,
    replacedBy: null,
  };
}
