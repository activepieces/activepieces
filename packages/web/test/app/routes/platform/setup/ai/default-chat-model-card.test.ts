/**
 * @vitest-environment jsdom
 */
import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
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

const pick = {
  type: 'model',
  provider: AIProviderName.OPENAI,
  providerConfigId: 'key-a',
  modelId: 'gpt-6',
} as const;

const noteFor = (
  value: typeof pick | null,
  projectScope: 'all' | 'selected' = 'all',
) =>
  defaultChatModelCardUtils.noteOf({
    value,
    options,
    tiers: [],
    configsById: new Map([['key-a', key(projectScope)]]),
    projectIds: ['p1', 'p2', 'p3'],
  });

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
      noteFor({ ...pick, providerConfigId: 'deleted', modelId: 'old' }),
    ).toContain('Unavailable');
  });
});
