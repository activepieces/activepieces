import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderWithoutSensitiveData,
  AiToolCapability,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import {
  AI_TOOL_CATALOG,
  aiCapabilitySources,
} from '@/app/routes/platform/setup/ai-capabilities/catalog';

const key = ({
  provider,
  projectScope,
}: {
  provider: AIProviderName;
  projectScope: 'all' | 'selected';
}): AIProviderWithoutSensitiveData => ({
  id: `${provider}-${projectScope}`,
  name: provider,
  provider,
  config: {},
  enabledForChat: true,
  modelScope: 'all',
  modelIds: [],
  projectScope,
  projectIds: [],
  status: 'active',
  statusReason: null,
  statusUpdated: null,
});

describe('the Embeddings capability', () => {
  it('is listed as AI-key only', () => {
    const row = AI_TOOL_CATALOG.find(
      (info) => info.capability === AiToolCapability.EMBEDDINGS,
    );
    expect(row?.providers).toEqual([]);
  });

  it('can be set to an all-projects key that embeds, not to one that cannot', () => {
    const eligible = aiCapabilitySources.eligibleProviders({
      capability: AiToolCapability.EMBEDDINGS,
      providers: [
        key({ provider: AIProviderName.OPENAI, projectScope: 'all' }),
        key({ provider: AIProviderName.ANTHROPIC, projectScope: 'all' }),
        key({ provider: AIProviderName.GOOGLE, projectScope: 'selected' }),
      ],
    });
    expect(eligible.map((provider) => provider.id)).toEqual(['openai-all']);
  });

  it('falls back to a Default AI key that embeds, even one limited to some projects, like the server', () => {
    expect(
      aiCapabilitySources.servesByDefault({
        capability: AiToolCapability.EMBEDDINGS,
        provider: key({
          provider: AIProviderName.OPENAI,
          projectScope: 'selected',
        }),
      }),
    ).toBe(true);
    expect(
      aiCapabilitySources.servesByDefault({
        capability: AiToolCapability.EMBEDDINGS,
        provider: key({
          provider: AIProviderName.ANTHROPIC,
          projectScope: 'all',
        }),
      }),
    ).toBe(false);
  });
});
