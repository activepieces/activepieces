import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generatePresentations } from '../src/lib/actions/generate-presentations';

const AUTH = { secret_text: 'key123' };

function run({ propsValue }: { propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = generatePresentations.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, generatePresentations, [{ ...base, propsValue, auth: AUTH }]));
}

function mockResponses({ bodies }: { bodies: unknown[] }) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) {
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  }
  return spy;
}

function postBody({ spy }: { spy: ReturnType<typeof mockResponses> }): Record<string, unknown> {
  const body = spy.mock.calls[0][0].body;
  if (typeof body !== 'object' || body === null) {
    throw new Error('POST body missing');
  }
  return Object.fromEntries(Object.entries(body));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('generatePresentations', () => {
  it('stops polling immediately when the status is error', async () => {
    const spy = mockResponses({ bodies: [{ id: 't1' }, { id: 't1', status: 'error' }] });
    await expect(run({ propsValue: { content: 'Topic' } })).rejects.toThrow('Presentation generation failed');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0][0].method).toBe('POST');
    expect(spy.mock.calls[0][0].url.endsWith('/api/v1/ppt/presentation/generate/async')).toBe(true);
    expect(spy.mock.calls[1][0].method).toBe('GET');
    expect(spy.mock.calls[1][0].url.endsWith('/api/v1/ppt/presentation/status/t1')).toBe(true);
  });

  it('omits empty slides_markdown and files from the request body', async () => {
    const spy = mockResponses({ bodies: [{ id: 't1' }, { id: 't1', status: 'completed' }] });
    await run({ propsValue: { content: 'Topic', slides_markdown: [], files: [] } });
    const body = postBody({ spy });
    expect(body).not.toHaveProperty('slides_markdown');
    expect(body).not.toHaveProperty('files');
  });

  it('sends non-empty slides_markdown and files as given', async () => {
    const spy = mockResponses({ bodies: [{ id: 't1' }, { id: 't1', status: 'completed' }] });
    await run({ propsValue: { slides_markdown: ['# One'], files: ['f1'] } });
    const body = postBody({ spy });
    expect(body['slides_markdown']).toEqual(['# One']);
    expect(body['files']).toEqual(['f1']);
  });

  it('returns the completed status response unchanged', async () => {
    const completed = { id: 't1', status: 'completed', data: { presentation_id: 'p1', path: '/deck.pptx' } };
    const spy = mockResponses({ bodies: [{ id: 't1' }, completed] });
    const result = await run({ propsValue: { content: 'Topic' } });
    expect(result).toEqual(completed);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('keeps polling while pending and returns the completed response', async () => {
    vi.useFakeTimers();
    const completed = { id: 't1', status: 'completed' };
    const spy = mockResponses({ bodies: [{ id: 't1' }, { id: 't1', status: 'pending' }, completed] });
    const pending = run({ propsValue: { content: 'Topic' } });
    await vi.advanceTimersByTimeAsync(5000);
    await expect(pending).resolves.toEqual(completed);
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
