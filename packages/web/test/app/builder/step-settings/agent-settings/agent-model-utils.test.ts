import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderModelType,
  ModelChoice,
  ModelOptions,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { agentModelUtils } from '@/app/builder/step-settings/agent-settings/agent-model-utils';

describe('agentModelUtils.choiceOf and valueOf', () => {
  it('round-trips a tier pick as the tier id alone', () => {
    const choice = agentModelUtils.choiceOf({
      value: { modelTierId: 'tier-1' },
    });

    expect(choice).toEqual({ type: 'tier', tierId: 'tier-1' });
    expect(agentModelUtils.valueOf({ choice: present(choice) })).toEqual({
      modelTierId: 'tier-1',
    });
  });

  it('round-trips a pinned model pick', () => {
    const value = {
      provider: AIProviderName.OPENAI,
      model: 'gpt-test',
      configId: 'key-1',
    };

    const choice = agentModelUtils.choiceOf({ value });

    expect(choice).toEqual({
      type: 'model',
      provider: AIProviderName.OPENAI,
      providerConfigId: 'key-1',
      modelId: 'gpt-test',
    });
    expect(agentModelUtils.valueOf({ choice: present(choice) })).toEqual(value);
  });

  it('reads a legacy pick without a key id, and drops the old picked flag', () => {
    const choice = agentModelUtils.choiceOf({
      value: {
        provider: AIProviderName.OPENAI,
        model: 'gpt-test',
        picked: 'user',
      },
    });

    expect(choice).toEqual({
      type: 'model',
      provider: AIProviderName.OPENAI,
      providerConfigId: '',
      modelId: 'gpt-test',
    });
    expect(agentModelUtils.valueOf({ choice: present(choice) })).toEqual({
      provider: AIProviderName.OPENAI,
      model: 'gpt-test',
    });
  });

  it('reads an empty or unknown value as no pick', () => {
    expect(agentModelUtils.choiceOf({ value: {} })).toBeNull();
    expect(agentModelUtils.choiceOf({ value: undefined })).toBeNull();
    expect(
      agentModelUtils.choiceOf({ value: { provider: 'nope', model: 'x' } })
    ).toBeNull();
  });
});

describe('agentModelUtils.defaultFor', () => {
  it('uses the server default when tiers are allowed', () => {
    expect(
      agentModelUtils.defaultFor({ options: options(), withTiers: true })
    ).toEqual({ type: 'tier', tierId: 'tier-1' });
  });

  it('falls back to the credits default when the step cannot send a tier', () => {
    expect(
      agentModelUtils.defaultFor({ options: options(), withTiers: false })
    ).toEqual({
      type: 'model',
      provider: AIProviderName.ACTIVEPIECES,
      providerConfigId: 'managed',
      modelId: 'fast',
    });
  });

  it('falls back to the first key model when there are no credits', () => {
    expect(
      agentModelUtils.defaultFor({
        options: { ...options(), credits: null },
        withTiers: false,
      })
    ).toEqual({
      type: 'model',
      provider: AIProviderName.OPENAI,
      providerConfigId: 'key-1',
      modelId: 'gpt-test',
    });
  });

  it('gives nothing when there is nothing to pick', () => {
    expect(
      agentModelUtils.defaultFor({
        options: { ...options(), credits: null, keys: [] },
        withTiers: false,
      })
    ).toBeNull();
  });
});

describe('agentModelUtils.supportsTiers', () => {
  it('needs piece-ai 0.14.1 or newer', () => {
    expect(agentModelUtils.supportsTiers({ pieceVersion: '0.14.0' })).toBe(
      false
    );
    expect(agentModelUtils.supportsTiers({ pieceVersion: '0.14.1' })).toBe(
      true
    );
    expect(agentModelUtils.supportsTiers({ pieceVersion: '0.15.0' })).toBe(
      true
    );
  });

  it('refuses a range or a blank version instead of throwing', () => {
    expect(agentModelUtils.supportsTiers({ pieceVersion: '~0.14.1' })).toBe(
      false
    );
    expect(agentModelUtils.supportsTiers({ pieceVersion: '' })).toBe(false);
  });
});

function present(choice: ModelChoice | null): ModelChoice {
  if (choice === null) {
    throw new Error('expected a choice');
  }
  return choice;
}

function options(): ModelOptions {
  return {
    tiers: [],
    credits: {
      providerConfigId: 'managed',
      defaultTierId: 'fast',
      tiers: [],
    },
    keys: [
      {
        providerConfigId: 'key-1',
        provider: AIProviderName.OPENAI,
        name: 'OpenAI',
        models: [
          { id: 'gpt-test', name: 'GPT test', type: AIProviderModelType.TEXT },
        ],
      },
    ],
    defaultChoice: { type: 'tier', tierId: 'tier-1' },
    movedTiers: {},
    specificModelsHidden: false,
  };
}
