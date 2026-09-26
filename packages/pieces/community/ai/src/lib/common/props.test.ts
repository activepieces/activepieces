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
  tiers: [
    { id: 'fast', label: 'Fast', modelId: 'anthropic/claude-haiku-4.5' },
    { id: 'smart', label: 'Expert', modelId: 'anthropic/claude-sonnet-4.6' },
  ],
  defaultTierId: 'smart',
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

beforeEach(() => {
  sendRequest.mockReset();
  answer({ tiers: publishedTiers });
});

describe('the managed model dropdown', () => {
  it('offers the published tiers, and stores the tier id', async () => {
    const state = await modelOptions({ provider: 'activepieces', modelType: 'text' });

    expect(state.options).toEqual([
      { label: 'Fast', value: 'fast' },
      { label: 'Expert', value: 'smart' },
    ]);
  });

  it('does not fetch the model catalog at all, because a tier is all it needs', async () => {
    await modelOptions({ provider: 'activepieces', modelType: 'text' });

    const urls = sendRequest.mock.calls.map((call) => call[0].url);
    expect(urls.some((url) => url.includes('v1/ai-providers/tiers'))).toBe(true);
    expect(urls.some((url) => url.includes('/models'))).toBe(false);
  });

  it('falls back to concrete models when the server has no tiers route, so an older server still works', async () => {
    answer({ tiers: null });
    const state = await modelOptions({ provider: 'activepieces', modelType: 'text' });

    expect(state.options).toEqual([
      { label: 'Fast', value: 'anthropic/claude-haiku-4.5' },
      { label: 'Expert', value: 'anthropic/claude-sonnet-4.6' },
    ]);
  });

  it('falls back to concrete models when the published file carries no tiers', async () => {
    answer({ tiers: { tiers: [], defaultTierId: '' } });
    const state = await modelOptions({ provider: 'activepieces', modelType: 'text' });

    expect(state.options?.every((option) => String(option.value).includes('/'))).toBe(true);
  });

  it('leaves image alone, because image tiers are not published', async () => {
    const state = await modelOptions({ provider: 'activepieces', modelType: 'image' });

    expect(state.options).toEqual([
      { label: 'Expert', value: 'google/gemini-3.1-flash-image' },
    ]);
    expect(sendRequest.mock.calls.every((call) => !call[0].url.includes('/tiers'))).toBe(true);
  });
});

describe('a provider the customer brought their own key for', () => {
  it('lists concrete models and never asks for tiers', async () => {
    const state = await modelOptions({ provider: 'openai', modelType: 'text' });

    expect(state.options).toEqual([
      { label: 'Claude Haiku 4.5', value: 'anthropic/claude-haiku-4.5' },
      { label: 'Claude Sonnet 4.6', value: 'anthropic/claude-sonnet-4.6' },
    ]);
    expect(sendRequest.mock.calls.every((call) => !call[0].url.includes('/tiers'))).toBe(true);
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
