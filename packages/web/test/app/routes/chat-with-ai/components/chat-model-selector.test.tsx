// @vitest-environment jsdom
import { AIProviderName } from '@activepieces/core-utils';
import { aiProviderUtils } from '@activepieces/shared';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const state = vi.hoisted(() => ({
  provider: '',
  useModelTiers: vi.fn(),
}));

vi.mock('@/features/platform-admin', () => ({
  aiProviderQueries: {
    useChatProvider: () => ({ data: { provider: state.provider } }),
    useModelTiers: (surface: string) => state.useModelTiers(surface),
  },
}));

import { ChatModelSelector } from '@/app/routes/chat-with-ai/components/chat-model-selector';

describe('ChatModelSelector', () => {
  beforeEach(() => {
    state.provider = AIProviderName.ACTIVEPIECES;
    state.useModelTiers.mockReset();
    state.useModelTiers.mockReturnValue(CHAT_TIERS);
  });

  it('reads the chat tiers and shows the published default when nothing is picked', () => {
    render(<ChatModelSelector selectedModel={null} onModelChange={noop} />);

    expect(state.useModelTiers).toHaveBeenCalledWith('chat');
    expect(triggerText()).toBe('Turbo');
  });

  it('shows the picked tier by its published label', () => {
    render(<ChatModelSelector selectedModel="smart" onModelChange={noop} />);

    expect(triggerText()).toBe('Expert');
  });

  it('falls back to the published default for a tier that is no longer listed', () => {
    render(<ChatModelSelector selectedModel="gone" onModelChange={noop} />);

    expect(triggerText()).toBe('Turbo');
  });

  it('shows the first curated model on an own-key provider with a curated list', () => {
    state.provider = AIProviderName.OPENAI;
    const curated = aiProviderUtils.getCuratedChatModels({
      provider: AIProviderName.OPENAI,
    });

    render(<ChatModelSelector selectedModel={null} onModelChange={noop} />);

    expect(triggerText()).toBe(curated?.[0].label);
  });
});

function triggerText(): string | undefined {
  return document.querySelector('button[role="combobox"]')?.textContent?.trim();
}

function noop(): void {
  return undefined;
}

const CHAT_TIERS = {
  tiers: [
    { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5' },
    { id: 'smart', label: 'Expert', modelId: 'google/gemini-3.7-flash' },
    { id: 'turbo', label: 'Turbo', modelId: 'openai/gpt-5.5' },
  ],
  defaultTierId: 'turbo',
};
