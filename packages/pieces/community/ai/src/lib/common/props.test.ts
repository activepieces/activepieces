import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aiProps } from './props';

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

const bundledTierOptions = [
  { label: 'Fast', value: 'fast' },
  { label: 'Expert', value: 'smart' },
  { label: 'Heavy', value: 'premium' },
];

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

function modelOptions({ provider, modelType, saved }: { provider: string; modelType: 'text' | 'image'; saved?: string }) {
  return aiProps({ modelType }).model.options(
    { provider: { provider }, model: saved },
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

describe('the managed text model dropdown', () => {
  it('offers the published flow tiers and stores the tier id', async () => {
    const state = await modelOptions({ provider: 'activepieces', modelType: 'text' });

    expect(state.options).toEqual([
      { label: 'Fast', value: 'fast' },
      { label: 'Deep', value: 'deep' },
    ]);
  });

  it('never asks for the model catalog, because a tier is all a managed text step stores', async () => {
    await modelOptions({ provider: 'activepieces', modelType: 'text' });

    expect(requestedUrls().some((url) => url.includes('v1/ai-providers/tiers'))).toBe(true);
    expect(requestedUrls().some((url) => url.includes('/models'))).toBe(false);
  });

  it('offers the release\'s tiers, still as tier ids, when the server has no tiers route', async () => {
    answer({ tiers: null });
    const state = await modelOptions({ provider: 'activepieces', modelType: 'text' });

    expect(state.options).toEqual(bundledTierOptions);
    expect(requestedUrls().some((url) => url.includes('/models'))).toBe(false);
  });

  it('offers the release\'s tiers when the published flow list is empty', async () => {
    answer({ tiers: { ...publishedTiers, flow: { tiers: [], defaultTierId: '' } } });
    const state = await modelOptions({ provider: 'activepieces', modelType: 'text' });

    expect(state.options).toEqual(bundledTierOptions);
  });
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
  it('lists concrete models and never asks for tiers', async () => {
    const state = await modelOptions({ provider: 'openai', modelType: 'text' });

    expect(state.options).toEqual([
      { label: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4.5' },
      { label: 'Claude Sonnet 4.6', value: 'anthropic/claude-sonnet-4.6' },
    ]);
    expect(requestedUrls().every((url) => !url.includes('/tiers'))).toBe(true);
  });

  it('asks for a provider first when none is picked', async () => {
    const state = await aiProps({ modelType: 'text' }).model.options(
      {},
      createMockActionContext({ propsValue: {} }),
    );

    expect(state.disabled).toBe(true);
    expect(state.placeholder).toBe('Select AI Provider');
  });
});

describe('a step whose saved model is no longer offered', () => {
  it('names the managed model instead of looking empty, so the owner can see what to replace', async () => {
    const state = await modelOptions({ provider: 'activepieces', modelType: 'text', saved: 'openai/gpt-4.1-nano' });

    expect(state.options).toEqual([
      { label: 'Unknown model: openai/gpt-4.1-nano', value: 'openai/gpt-4.1-nano' },
      { label: 'Fast', value: 'fast' },
      { label: 'Deep', value: 'deep' },
    ]);
  });

  it('names a model the customer\'s own provider stopped listing', async () => {
    const state = await modelOptions({ provider: 'openai', modelType: 'text', saved: 'gpt-4-retired' });

    expect(state.options[0]).toEqual({ label: 'Unknown model: gpt-4-retired', value: 'gpt-4-retired' });
  });

  it('adds nothing when the saved model is still offered', async () => {
    const state = await modelOptions({ provider: 'activepieces', modelType: 'text', saved: 'fast' });

    expect(state.options).toEqual([
      { label: 'Fast', value: 'fast' },
      { label: 'Deep', value: 'deep' },
    ]);
  });
});
