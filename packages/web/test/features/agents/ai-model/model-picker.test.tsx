/**
 * @vitest-environment jsdom
 */
import { AIProviderName } from '@activepieces/core-utils';
import { AIProviderModelType, ModelOptions } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  default: { language: 'en' },
  t: (key: string) => key,
}));

import { modelPickerView } from '@/features/agents/ai-model/model-picker';

const optionModel = (modelId: string) => ({
  provider: AIProviderName.OPENAI,
  modelId,
  name: `${modelId} name`,
  keyName: 'Team key',
});

const options: ModelOptions = {
  tiers: [
    {
      id: 'tier-expert',
      name: 'Expert',
      emoji: '🧠',
      description: 'Hard tasks',
      isDefault: true,
      isFast: false,
      main: optionModel('gpt-6'),
      fallbacks: [optionModel('gpt-6-mini')],
    },
  ],
  credits: {
    providerConfigId: 'managed',
    defaultTierId: 'smart',
    tiers: [
      {
        id: 'smart',
        label: 'Smart',
        model: { ...optionModel('anthropic/claude'), keyName: 'Managed' },
      },
    ],
  },
  keys: [
    {
      providerConfigId: 'key-a',
      provider: AIProviderName.OPENAI,
      name: 'Team key',
      models: [
        { id: 'gpt-6', name: 'GPT-6', type: AIProviderModelType.TEXT },
        {
          id: 'gpt-6-mini',
          name: 'GPT-6 mini',
          type: AIProviderModelType.TEXT,
        },
      ],
    },
    {
      providerConfigId: 'key-b',
      provider: AIProviderName.ANTHROPIC,
      name: 'Prod key',
      models: [
        { id: 'claude', name: 'Claude', type: AIProviderModelType.TEXT },
      ],
    },
  ],
  defaultChoice: { type: 'tier', tierId: 'tier-expert' },
  movedTiers: { 'tier-old': 'tier-expert' },
  specificModelsHidden: false,
};

describe('modelPickerView', () => {
  it('builds tiers, credits and one collapsible group per key, opening only the picked key', () => {
    const { groups } = modelPickerView({
      options,
      shown: {
        type: 'model',
        provider: AIProviderName.ANTHROPIC,
        providerConfigId: 'key-b',
        modelId: 'claude',
      },
    });

    expect(groups.map((group) => [group.id, group.section])).toEqual([
      ['tiers', 'tiers'],
      ['credits', 'credits'],
      ['key:key-a', 'keys'],
      ['key:key-b', 'keys'],
    ]);
    expect(groups[2]).toMatchObject({ collapsible: true, defaultOpen: false });
    expect(groups[3]).toMatchObject({ collapsible: true, defaultOpen: true });
    expect(groups[3].items[0].selected).toBe(true);
    expect(groups[0].items[0].searchText).toContain('gpt-6-mini name');
  });

  it('shows a deleted tier as its replacement', () => {
    const { current, groups } = modelPickerView({
      options,
      shown: { type: 'tier', tierId: 'tier-old' },
    });

    expect(current).toMatchObject({
      kind: 'tier',
      label: 'Expert',
      source: 'Moved',
    });
    expect(groups[0].items[0].selected).toBe(true);
  });

  it('marks a pick that is gone as unavailable, and one hidden by the admin as hidden', () => {
    const gone = modelPickerView({
      options,
      shown: { type: 'tier', tierId: 'tier-unknown' },
    });
    expect(gone.current).toMatchObject({
      kind: 'unavailable',
      source: 'Unavailable',
    });

    const hidden = modelPickerView({
      options: { ...options, keys: [], specificModelsHidden: true },
      shown: {
        type: 'model',
        provider: AIProviderName.OPENAI,
        providerConfigId: 'key-a',
        modelId: 'gpt-6',
      },
    });
    expect(hidden.current).toMatchObject({ kind: 'hidden', label: 'gpt-6' });
  });

  it('finds a legacy model pick without a key id by its provider', () => {
    const { current } = modelPickerView({
      options,
      shown: {
        type: 'model',
        provider: AIProviderName.OPENAI,
        providerConfigId: '',
        modelId: 'gpt-6-mini',
      },
    });

    expect(current).toMatchObject({
      kind: 'model',
      configId: 'key-a',
      label: 'GPT-6 mini',
    });
  });

  it('shows a pick on a key that is gone as unavailable, even when another key has the model', () => {
    const { current } = modelPickerView({
      options,
      shown: {
        type: 'model',
        provider: AIProviderName.OPENAI,
        providerConfigId: 'deleted-key',
        modelId: 'gpt-6',
      },
    });

    expect(current).toMatchObject({ kind: 'unavailable', label: 'gpt-6' });
  });

  it('picks a credits tier with the managed key and keeps details for every row', () => {
    const { groups, detailById, current } = modelPickerView({
      options,
      shown: {
        type: 'model',
        provider: AIProviderName.ACTIVEPIECES,
        providerConfigId: 'managed',
        modelId: 'smart',
      },
    });

    expect(current).toMatchObject({ kind: 'credits', label: 'Smart' });
    expect(groups[1].items[0].value).toEqual({
      type: 'model',
      provider: AIProviderName.ACTIVEPIECES,
      providerConfigId: 'managed',
      modelId: 'smart',
    });
    expect(detailById.get('tier:tier-expert')?.fallbacks).toEqual([
      { name: 'gpt-6-mini name', keyName: 'Team key' },
    ]);
    expect(detailById.get('credits:smart')?.showPrices).toBe(false);
    expect(detailById.size).toBe(5);
  });
});
