import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assistantUpdater } from '../src/lib/actions/update-assistant';

afterEach(() => {
  vi.restoreAllMocks();
});

const existing = {
  id: 'a1',
  model: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.3,
    toolIds: ['t1', 't2'],
    messages: [
      { role: 'system', content: 'old prompt' },
      { role: 'assistant', content: 'example' },
    ],
  },
};

describe('assistantUpdater.mergeModel', () => {
  it('replaces only the system message and keeps tools and temperature', () => {
    const merged = assistantUpdater.mergeModel({ existingModel: existing.model, systemPrompt: 'new prompt' });
    expect(merged).toEqual({
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.3,
      toolIds: ['t1', 't2'],
      messages: [
        { role: 'system', content: 'new prompt' },
        { role: 'assistant', content: 'example' },
      ],
    });
  });

  it('returns undefined when no model field is touched', () => {
    expect(assistantUpdater.mergeModel({ existingModel: existing.model })).toBeUndefined();
  });

  it('refuses a system prompt when the assistant has no model', () => {
    expect(() => assistantUpdater.mergeModel({ existingModel: undefined, systemPrompt: 'x' })).toThrow(
      'no model configured'
    );
  });
});

describe('assistantUpdater.update', () => {
  it('GETs the assistant and PATCHes a merged model', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: existing })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 'a1', server: { url: 'u', secret: 's' } } });
    const result = await assistantUpdater.update({
      apiKey: 'k',
      assistantId: 'a1',
      fields: { name: 'New' },
      overrides: { name: 'ignored', voice: { provider: 'vapi', voiceId: 'Elliot' } },
      provider: 'openai',
      model: 'gpt-4o-mini',
      systemPrompt: 'p',
    });
    expect(spy).toHaveBeenNthCalledWith(1, expect.objectContaining({ method: 'GET', url: 'https://api.vapi.ai/assistant/a1' }));
    const patch = spy.mock.calls[1][0];
    expect(patch.method).toBe('PATCH');
    expect(patch.body).toEqual({
      name: 'New',
      voice: { provider: 'vapi', voiceId: 'Elliot' },
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.3,
        toolIds: ['t1', 't2'],
        messages: [
          { role: 'system', content: 'p' },
          { role: 'assistant', content: 'example' },
        ],
      },
    });
    expect(result).toEqual({ id: 'a1', server: { url: 'u' } });
  });

  it('skips the GET when no model field changes', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { id: 'a1' } });
    await assistantUpdater.update({ apiKey: 'k', assistantId: 'a1', fields: { firstMessage: 'Hi' } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'PATCH', body: { firstMessage: 'Hi' } });
  });

  it('refuses an empty update', async () => {
    await expect(assistantUpdater.update({ apiKey: 'k', assistantId: 'a1', fields: {} })).rejects.toThrow(
      'Provide at least one field'
    );
  });
});
