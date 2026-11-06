/**
 * @vitest-environment jsdom
 */
import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
  ModelChoice,
  ModelOptions,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, unknown>) =>
    `${key}${values ? JSON.stringify(values) : ''}`,
}));

import { defaultChatModelCardUtils } from '@/app/routes/platform/setup/ai/providers-tab/default-chat-model-card';

const key = (
  projectScope: 'all' | 'selected',
): AIProviderWithoutSensitiveData => ({
  id: 'key-a',
  name: 'Team key',
  provider: AIProviderName.OPENAI,
  config: {},
  enabledForChat: false,
  modelScope: 'all',
  modelIds: [],
  projectScope,
  projectIds: projectScope === 'selected' ? ['p1'] : [],
  status: 'active',
  statusReason: null,
  statusUpdated: null,
});

const options: ModelOptions = {
  tiers: [],
  credits: null,
  keys: [
    {
      providerConfigId: 'key-a',
      provider: AIProviderName.OPENAI,
      name: 'Team key',
      models: [{ id: 'gpt-6', name: 'GPT-6', type: AIProviderModelType.TEXT }],
    },
  ],
  defaultChoice: {
    type: 'model',
    provider: AIProviderName.OPENAI,
    providerConfigId: 'key-a',
    modelId: 'gpt-6',
  },
  movedTiers: {},
  specificModelsHidden: false,
};

const pick: ModelChoice = {
  type: 'model',
  provider: AIProviderName.OPENAI,
  providerConfigId: 'key-a',
  modelId: 'gpt-6',
};

const noteFor = (
  value: ModelChoice | null,
  projectScope: 'all' | 'selected' = 'all',
) =>
  statusText(
    defaultChatModelCardUtils.statusOf({
      value,
      options,
      tiers: [],
      configsById: new Map([['key-a', key(projectScope)]]),
      projectIds: ['p1', 'p2', 'p3'],
      hasEmbeddingsKey: true,
    }),
  );

const statusText = (status: {
  placeholder: string | undefined;
  warnings: string[];
}): string | null =>
  status.placeholder ??
  (status.warnings.length === 0 ? null : status.warnings.join(' '));

describe('the default chat model card note', () => {
  it('names what new chats use when nothing is set', () => {
    expect(noteFor(null)).toContain('GPT-6');
  });

  it('says nothing when the pick runs in every project', () => {
    expect(noteFor(pick)).toBeNull();
  });

  it('counts the projects where the pick cannot run', () => {
    expect(noteFor(pick, 'selected')).toContain('"count":2');
  });

  it('flags a pick that is gone', () => {
    expect(
      noteFor({
        type: 'model',
        provider: AIProviderName.OPENAI,
        providerConfigId: 'deleted',
        modelId: 'old',
      }),
    ).toContain('no longer available');
  });
});

describe('picking the default chat model again', () => {
  it('clears it, and a different pick does not', () => {
    expect(defaultChatModelCardUtils.sameChoice({ a: pick, b: pick })).toBe(
      true,
    );
    expect(
      defaultChatModelCardUtils.sameChoice({
        a: { type: 'tier', tierId: 't1' },
        b: pick,
      }),
    ).toBe(false);
    expect(defaultChatModelCardUtils.sameChoice({ a: pick, b: null })).toBe(
      false,
    );
  });
});

describe('the embeddings warning', () => {
  it('appears when the default key cannot embed and no Embeddings key is set', () => {
    const status = defaultChatModelCardUtils.statusOf({
      value: { ...pick, provider: AIProviderName.ANTHROPIC },
      options: {
        ...options,
        keys: [{ ...options.keys[0], provider: AIProviderName.ANTHROPIC }],
      },
      tiers: [],
      configsById: new Map([['key-a', key('all')]]),
      projectIds: [],
      hasEmbeddingsKey: false,
    });
    expect(status.warnings.join(' ')).toContain('Embeddings key');
  });
});

describe('the embeddings warning with Credits', () => {
  it('stays quiet when Credits can index the files', () => {
    const status = defaultChatModelCardUtils.statusOf({
      value: { ...pick, provider: AIProviderName.ANTHROPIC },
      options: {
        ...options,
        keys: [{ ...options.keys[0], provider: AIProviderName.ANTHROPIC }],
        credits: {
          providerConfigId: 'managed',
          defaultTierId: 'smart',
          tiers: [],
        },
      },
      tiers: [],
      configsById: new Map([['key-a', key('all')]]),
      projectIds: [],
      hasEmbeddingsKey: false,
    });
    expect(status.warnings).toEqual([]);
  });
});
