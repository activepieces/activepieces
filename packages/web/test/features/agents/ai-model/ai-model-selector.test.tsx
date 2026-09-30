// @vitest-environment jsdom
import { AIProviderName } from '@activepieces/core-utils';
import { AIProviderModelType } from '@activepieces/shared';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const state = vi.hoisted(() => ({
  tiersStatus: 'success',
}));

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQuery: () => ({ status: state.tiersStatus }),
}));

vi.mock('@/features/platform-admin/hooks/ai-provider-hooks', () => ({
  aiProviderQueries: {
    modelTiersOptions: () => ({ queryKey: ['model-tiers'] }),
    useModelTiers: () => ({ tiers: [], defaultTierId: 'premium' }),
  },
}));

vi.mock('@/features/agents/ai-model/hooks', () => ({
  aiModelHooks: {
    useListProviders: () => ({
      data: [
        {
          provider: AIProviderName.ACTIVEPIECES,
          name: 'Activepieces',
          keys: [{ id: 'managed-key', name: 'Activepieces' }],
        },
      ],
      isLoading: false,
    }),
    useGetModelsForProvider: () => ({
      data: [
        { id: 'fast', name: 'Fast', type: AIProviderModelType.TEXT },
        { id: 'smart', name: 'Expert', type: AIProviderModelType.TEXT },
        { id: 'premium', name: 'Heavy', type: AIProviderModelType.TEXT },
      ],
      isLoading: false,
    }),
  },
}));

import { AIModelSelector } from '@/features/agents/ai-model';

describe('AIModelSelector on the managed provider', () => {
  beforeEach(() => {
    state.tiersStatus = 'success';
  });

  it('pre-fills the published default tier id, not the first tier in the list', () => {
    const onChange = vi.fn();

    render(<AIModelSelector onChange={onChange} />);

    expect(onChange).toHaveBeenCalledWith({
      provider: AIProviderName.ACTIVEPIECES,
      model: 'premium',
      configId: 'managed-key',
      picked: 'default',
    });
    expect(modelTriggerText()).toBe('Heavy');
  });

  it('waits for the published tiers before pre-filling, so the bundled default never lands first', () => {
    state.tiersStatus = 'pending';
    const onChange = vi.fn();

    render(<AIModelSelector onChange={onChange} />);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('leaves a stored concrete model id alone and shows it as stored', () => {
    const onChange = vi.fn();

    render(
      <AIModelSelector
        defaultProvider={AIProviderName.ACTIVEPIECES}
        defaultConfigId="managed-key"
        defaultModel="anthropic/claude-sonnet-4.6"
        onChange={onChange}
      />,
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(modelTriggerText()).toBe('anthropic/claude-sonnet-4.6');
  });
});

function modelTriggerText(): string | undefined {
  return document
    .querySelectorAll('button[role="combobox"]')[1]
    ?.textContent?.trim();
}
