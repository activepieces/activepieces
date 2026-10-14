import { AIProviderName } from '@activepieces/core-utils';
import { AIProviderModelType, ModelOptions } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { chatUtils } from '@/features/chat/lib/chat-utils';

const options: ModelOptions = {
  tiers: [],
  credits: { providerConfigId: 'managed', defaultTierId: 'smart', tiers: [] },
  keys: [
    {
      providerConfigId: 'key-a',
      provider: AIProviderName.OPENAI,
      name: 'Team key',
      models: [{ id: 'gpt-6', name: 'GPT-6', type: AIProviderModelType.TEXT }],
    },
  ],
  defaultChoice: null,
  movedTiers: {},
  specificModelsHidden: false,
};

describe('a chat model pick', () => {
  it('round-trips a tier, a key model and a credits tier', () => {
    const choices = [
      { type: 'tier', tierId: 'tier-1' },
      {
        type: 'model',
        provider: AIProviderName.OPENAI,
        providerConfigId: 'key-a',
        modelId: 'gpt-6',
      },
      {
        type: 'model',
        provider: AIProviderName.ACTIVEPIECES,
        providerConfigId: 'managed',
        modelId: 'smart',
      },
    ] as const;

    for (const choice of choices) {
      const pick = chatUtils.pickOf({ choice });
      expect(chatUtils.choiceOf({ pick, options })).toEqual(choice);
    }
  });

  it('clears the other side of the pick so the server drops it', () => {
    expect(
      chatUtils.pickOf({ choice: { type: 'tier', tierId: 'tier-1' } }),
    ).toEqual({
      modelTierId: 'tier-1',
      providerConfigId: null,
      modelName: null,
    });
  });

  it('keeps a pick on a deleted key so the picker can show it as unavailable', () => {
    expect(
      chatUtils.choiceOf({
        pick: { modelTierId: null, providerConfigId: 'gone', modelName: 'x' },
        options,
      }),
    ).toMatchObject({ type: 'model', providerConfigId: 'gone', modelId: 'x' });
  });

  it('shows the default for a legacy chat that stores only a model name', () => {
    expect(
      chatUtils.choiceOf({
        pick: { modelTierId: null, providerConfigId: null, modelName: 'smart' },
        options,
      }),
    ).toBeNull();
  });
});
