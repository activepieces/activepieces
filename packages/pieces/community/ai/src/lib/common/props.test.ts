import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aiModel, aiProps } from './props';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    httpClient: { sendRequest: vi.fn() },
  };
});

const sendRequest = vi.mocked(httpClient.sendRequest);

const publishedTiers = {
  flow: {
    tiers: [
      { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5' },
      { id: 'deep', label: 'Deep', modelId: 'anthropic/claude-fable-5.1' },
    ],
    defaultTierId: 'deep',
  },
  chat: {
    tiers: [{ id: 'turbo', label: 'Turbo', modelId: 'openai/gpt-5.5' }],
    defaultTierId: 'turbo',
  },
};

const catalog = [
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', type: 'text' },
  { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', type: 'text' },
  { id: 'google/gemini-3.1-flash-image', name: 'Gemini Flash Image', type: 'image' },
];

function answer({ tiers }: { tiers: unknown }) {
  sendRequest.mockImplementation(async (request: { url: string }) => {
    if (request.url.includes('v1/ai-providers/tiers')) {
      if (tiers === null) {
        throw new Error('this server has no tiers route');
      }
      return { body: tiers } as never;
    }
    return { body: catalog } as never;
  });
}

function modelOptions({ provider, modelType }: { provider: string; modelType: 'text' | 'image' }) {
  return aiProps({ modelType }).model.options(
    { provider: { provider } },
    createMockActionContext({ propsValue: {} }),
  );
}

function requestedUrls(): string[] {
  return sendRequest.mock.calls.map((call) => call[0].url);
}

beforeEach(() => {
  sendRequest.mockReset();
  answer({ tiers: publishedTiers });
});

describe('the managed image model dropdown', () => {
  it('stays on concrete models, because no image tier is published', async () => {
    const state = await modelOptions({ provider: 'activepieces', modelType: 'image' });

    expect(state.options).toEqual([
      { label: 'Expert', value: 'google/gemini-3.1-flash-image' },
    ]);
    expect(requestedUrls().every((url) => !url.includes('/tiers'))).toBe(true);
  });
});

describe('a provider the customer brought their own key for', () => {
  it('lists concrete image models and never asks for tiers', async () => {
    const state = await modelOptions({ provider: 'openai', modelType: 'image' });

    expect(state.options).toEqual([
      { label: 'Gemini Flash Image', value: 'google/gemini-3.1-flash-image' },
    ]);
    expect(requestedUrls().every((url) => !url.includes('/tiers'))).toBe(true);
  });

  it('asks for a provider first when none is picked', async () => {
    const state = await aiProps({ modelType: 'image' }).model.options(
      {},
      createMockActionContext({ propsValue: {} }),
    );

    expect(state.disabled).toBe(true);
    expect(state.placeholder).toBe('Select a provider first');
  });
});

describe('the AI Model pick on text steps', () => {
  it('sends a platform tier as a tier id only', () => {
    expect(aiModel.resolve({ modelTierId: 'tier_1', provider: 'openai', model: 'gpt-5.5' })).toEqual({ modelTierId: 'tier_1' });
  });

  it('sends a model pick with its key', () => {
    expect(aiModel.resolve({ provider: 'openai', model: 'gpt-5.5', configId: 'key_1' })).toEqual({
      provider: 'openai',
      modelId: 'gpt-5.5',
      providerConfigId: 'key_1',
    });
  });

  it('sends a Credits tier slug as the model id', () => {
    expect(aiModel.resolve({ provider: 'activepieces', model: 'smart' })).toEqual({ provider: 'activepieces', modelId: 'smart' });
  });

  it('refuses an empty or unknown pick with a clear message', () => {
    expect(() => aiModel.resolveOrThrow({})).toThrow('Pick a tier or a provider and model for this step');
    expect(() => aiModel.resolveOrThrow({ provider: 'nope', model: 'x' })).toThrow();
    expect(() => aiModel.resolveOrThrow('{{step_1.model}}')).toThrow();
  });
});
