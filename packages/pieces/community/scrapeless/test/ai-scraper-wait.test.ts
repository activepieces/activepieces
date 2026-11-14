import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { aiScraperAction } from '../src/lib/actions/ai-scraper';
import { aiScraper } from '../src/lib/common/ai-scraper';
import { aiScraperWait } from '../src/lib/common/ai-scraper-wait';
import { aiScraperProps } from '../src/lib/common/ai-scraper-props';

function task({ status = 'running', answer = null, id = 'wait-task' }: { status?: 'pending' | 'running' | 'success'; answer?: string | null; id?: string } = {}): Task {
  return { task_id: id, status, completed: status === 'success', result_text: answer, answer_field: answer ? 'result_text' : null, has_answer: Boolean(answer), citations: [], web_results: [], web_search_results: [], x_search_results: [], source: [], web_source: [], references: [], sources: [], share_url: null, links: [], search_result: [], content_references: [], task_result: status === 'success' ? { result_text: answer } : null };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: Error) => void = () => undefined;
  const promise = new Promise<T>((...[resolvePromise, rejectPromise]) => { resolve = resolvePromise; reject = rejectPromise; });
  return { promise, resolve, reject };
}

function limits(input: Record<string, unknown> = {}) {
  return aiScraperWait.settings(input);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Bounded wait controller', () => {
  it('returns an already-complete creation without querying', async () => {
    const create = vi.fn(async () => task({ status: 'success', answer: 'Done' }));
    const query = vi.fn(async () => task());
    const result = await aiScraperWait.run({ create, query, settings: limits() });
    expect(result.poll_attempts).toBe(0);
    expect(result.task.has_answer).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('queries immediately, then waits only between unfinished results', async () => {
    const create = vi.fn(async () => task());
    const query = vi.fn<(id: string) => Promise<Task>>()
      .mockResolvedValueOnce(task()).mockResolvedValueOnce(task({ status: 'success', answer: 'Done' }));
    const resultPromise = aiScraperWait.run({ create, query, settings: limits() });
    await vi.advanceTimersByTimeAsync(0);
    expect(query).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(9999);
    expect(query).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    const result = await resultPromise;
    expect(result).toMatchObject({ poll_attempts: 2, elapsed_seconds: 10 });
    expect(query.mock.calls).toEqual([['wait-task'], ['wait-task']]);
    expect(create).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('allows the last permitted query to succeed with an empty answer', async () => {
    const result = await aiScraperWait.run({ create: async () => task(), query: async () => task({ status: 'success' }), settings: limits({ max_queries: 1 }) });
    expect(result).toMatchObject({ poll_attempts: 1, task: { completed: true, has_answer: false } });
  });

  it('stops immediately at the query limit with the original ID and no extra wait', async () => {
    const create = vi.fn(async () => task());
    const query = vi.fn(async () => task());
    await expect(aiScraperWait.run({ create, query, settings: limits({ max_queries: 1 }) })).rejects.toMatchObject({ code: 'QUERY_LIMIT', task_id: 'wait-task', poll_attempts: 1, elapsed_seconds: 0 });
    expect(create).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('includes creation latency in the total deadline and never resubmits it', async () => {
    const pending = deferred<Task>();
    const create = vi.fn(() => pending.promise);
    const query = vi.fn(async () => task());
    const request = aiScraperWait.run({ create, query, settings: limits({ wait_timeout_seconds: 30 }) });
    const assertion = expect(request).rejects.toMatchObject({ code: 'WAIT_TIMEOUT', task_id: null, poll_attempts: 0 });
    await vi.advanceTimersByTimeAsync(30000);
    await assertion;
    pending.resolve(task({ status: 'success', answer: 'Too late' }));
    await vi.advanceTimersByTimeAsync(60000);
    expect(create).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('bounds a stalled result request and ignores its late rejection', async () => {
    const pending = deferred<Task>();
    const query = vi.fn(() => pending.promise);
    const request = aiScraperWait.run({ create: async () => task(), query, settings: limits({ wait_timeout_seconds: 30 }) });
    const assertion = expect(request).rejects.toMatchObject({ code: 'WAIT_TIMEOUT', task_id: 'wait-task', poll_attempts: 1 });
    await vi.advanceTimersByTimeAsync(30000);
    await assertion;
    pending.reject(new Error('Late transport failure'));
    await vi.advanceTimersByTimeAsync(60000);
    expect(query).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not restart polling when a timed-out query succeeds late', async () => {
    const pending = deferred<Task>();
    const query = vi.fn(() => pending.promise);
    const request = aiScraperWait.run({ create: async () => task(), query, settings: limits({ wait_timeout_seconds: 30 }) });
    const assertion = expect(request).rejects.toMatchObject({ code: 'WAIT_TIMEOUT' });
    await vi.advanceTimersByTimeAsync(30000);
    await assertion;
    pending.resolve(task({ status: 'success', answer: 'Late' }));
    await vi.advanceTimersByTimeAsync(60000);
    expect(query).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('includes creation time and caps the final interval at the deadline', async () => {
    const pending = deferred<Task>();
    const query = vi.fn(async () => task());
    const request = aiScraperWait.run({ create: () => pending.promise, query, settings: limits({ wait_timeout_seconds: 30, poll_interval_seconds: 10 }) });
    const assertion = expect(request).rejects.toMatchObject({ code: 'WAIT_TIMEOUT', task_id: 'wait-task', poll_attempts: 2, elapsed_seconds: 30 });
    await vi.advanceTimersByTimeAsync(12000);
    pending.resolve(task());
    await vi.advanceTimersByTimeAsync(18000);
    await assertion;
    expect(query).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not accept success returned exactly at the deadline', async () => {
    const query = vi.fn(async () => { vi.advanceTimersByTime(30000); return task({ status: 'success', answer: 'Late' }); });
    await expect(aiScraperWait.run({ create: async () => task(), query, settings: limits({ wait_timeout_seconds: 30 }) })).rejects.toMatchObject({ code: 'WAIT_TIMEOUT' });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('does not lose the ID when best-effort progress fails', async () => {
    const report = vi.fn(async () => { throw new Error('Progress unavailable'); });
    const result = await aiScraperWait.run({ create: async () => task(), query: async () => task({ status: 'success' }), settings: limits(), report });
    expect(result.task.task_id).toBe('wait-task');
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('also bounds a stalled progress update', async () => {
    const query = vi.fn(async () => task());
    const request = aiScraperWait.run({ create: async () => task(), query, settings: limits({ wait_timeout_seconds: 30 }), report: () => new Promise(() => undefined) });
    const assertion = expect(request).rejects.toMatchObject({ code: 'WAIT_TIMEOUT', task_id: 'wait-task', poll_attempts: 0 });
    await vi.advanceTimersByTimeAsync(30000);
    await assertion;
    expect(query).not.toHaveBeenCalled();
  });

  it.each(['HTTP 401', 'HTTP 403', 'HTTP 429', 'HTTP 503', 'task expired', 'task failed', 'network error'])(
    'fails on %s without recreating or issuing a second query', async (message) => {
      const create = vi.fn(async () => task());
      const query = vi.fn(async () => { throw new Error(message); });
      await expect(aiScraperWait.run({ create, query, settings: limits() })).rejects.toMatchObject({ code: 'WAIT_FAILED', task_id: 'wait-task', poll_attempts: 1 });
      expect(create).toHaveBeenCalledTimes(1);
      expect(query).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it('fails an uncertain creation without a replacement POST', async () => {
    const create = vi.fn(async () => { throw new Error('Network timeout'); });
    const query = vi.fn(async () => task());
    await expect(aiScraperWait.run({ create, query, settings: limits() })).rejects.toThrow('A task may have been created');
    expect(create).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects an unrelated result ID', async () => {
    await expect(aiScraperWait.run({ create: async () => task(), query: async () => task({ id: 'unrelated' }), settings: limits() })).rejects.toMatchObject({ code: 'WAIT_FAILED', task_id: 'wait-task' });
  });

  it('redacts credentials from errors, error fields, and progress data', async () => {
    const key = 'synthetic-wait-key';
    const report = vi.fn(async () => undefined);
    const sanitize = (value: string) => value.split(key).join('[redacted]');
    const failure: unknown = await aiScraperWait.run({ create: async () => task({ id: key }), query: async () => { throw new Error(key); }, settings: limits(), report, sanitize }).catch((error: unknown) => error);
    expect(JSON.stringify(failure)).not.toContain(key);
    expect(failure instanceof Error ? failure.message : '').not.toContain(key);
    expect(JSON.stringify(report.mock.calls)).not.toContain(key);
  });

  it('keeps concurrent invocations isolated', async () => {
    const calls: string[] = [];
    const first = aiScraperWait.run({ create: async () => task({ id: 'first' }), query: async id => { calls.push(id); return task({ id, status: 'success' }); }, settings: limits() });
    const second = aiScraperWait.run({ create: async () => task({ id: 'second' }), query: async id => { calls.push(id); return task({ id, status: 'success' }); }, settings: limits() });
    const results = await Promise.all([first, second]);
    expect(results.map(value => value.task.task_id)).toEqual(['first', 'second']);
    expect(calls).toEqual(['first', 'second']);
  });
});

describe('Wait parameter validation and dynamic controls', () => {
  it.each([
    { wait_timeout_seconds: 29 }, { wait_timeout_seconds: 301 }, { wait_timeout_seconds: 30.5 },
    { wait_timeout_seconds: NaN }, { wait_timeout_seconds: Infinity }, { wait_timeout_seconds: '180' },
    { poll_interval_seconds: 4 }, { poll_interval_seconds: 61 }, { poll_interval_seconds: null },
    { max_queries: 0 }, { max_queries: 61 }, { max_queries: 1.5 },
    { wait_timeout_seconds: 30, poll_interval_seconds: 60 },
  ])('rejects invalid settings %# before a billable action request', async (wait_settings) => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    const context = createMockActionContext<typeof aiScraperAction.props>({ propsValue: { operation: 'create_and_wait', output_format: 'table', website: { engine: 'chatgpt' }, parameters: { prompt: 'Test' }, wait_settings } });
    await expect(aiScraperAction.run({ ...context, auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'test-wait-key' } })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('exposes defaults and hides inactive wait settings', async () => {
    expect(limits()).toEqual({ waitTimeoutSeconds: 180, pollIntervalSeconds: 10, maxQueries: 20 });
    expect(await aiScraperProps.waitProperties({ operation: 'create_and_wait' })).toMatchObject({ wait_timeout_seconds: { defaultValue: 180 }, poll_interval_seconds: { defaultValue: 10 }, max_queries: { defaultValue: 20 } });
    expect(await aiScraperProps.waitProperties({ operation: 'create_task' })).toEqual({});
    expect(await aiScraperProps.waitProperties({ operation: 'get_task_result' })).toEqual({});
    expect(await aiScraperProps.websiteProperties({ operation: 'create_and_wait' })).toHaveProperty('engine');
    expect(await aiScraperProps.requestProperties({ operation: 'create_and_wait', website: { engine: 'alexa' } })).toHaveProperty('prompt');
  });
});

describe('Registered create-and-wait action', () => {
  it.each(['chatgpt', 'perplexity', 'copilot', 'gemini', 'aimode', 'overview', 'grok', 'alexa'])(
    'creates %s once and returns its first successful query', async (engine) => {
      const fetchMock = vi.fn<typeof fetch>()
        .mockResolvedValueOnce(new Response(JSON.stringify({ task_id: 'registered-wait' }), { status: 201 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ task_id: 'registered-wait', status: 'success', task_result: { result_text: 'Done', citations: [{ url: 'https://example.com' }] } })));
      vi.stubGlobal('fetch', fetchMock);
      const context = createMockActionContext<typeof aiScraperAction.props>({ propsValue: { operation: 'create_and_wait', output_format: 'table', website: { engine }, parameters: { prompt: 'Test', country: 'US' }, wait_settings: { max_queries: 1 } } });
      const output = await aiScraperAction.run({ ...context, auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'registered-key' } });
      expect(output).toMatchObject({ task_id: 'registered-wait', completed: true, has_answer: true, poll_attempts: 1, elapsed_seconds: 0, citations: '[{"url":"https://example.com"}]' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const payload = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
      expect(payload.actor).toBe('scraper.' + engine);
      expect(payload.input).not.toHaveProperty('max_queries');
      expect(payload.input).not.toHaveProperty('wait_timeout_seconds');
      if ('shopping' in payload.input) expect(payload.input.shopping).toBe(false);
      expect(fetchMock.mock.calls[1][0]).toBe('https://api.scrapeless.com/api/v2/scraper/result/registered-wait');
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it('returns raw native objects in automatic mode', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{"task_id":"raw-wait"}', { status: 201 }))
      .mockResolvedValueOnce(new Response('{"task_id":"raw-wait","status":"success","task_result":{"result_text":"Done","products":[{"price":1}]}}')));
    const context = createMockActionContext<typeof aiScraperAction.props>({ propsValue: { operation: 'create_and_wait', output_format: 'raw', website: { engine: 'chatgpt' }, parameters: { prompt: 'Test' }, wait_settings: undefined } });
    await expect(aiScraperAction.run({ ...context, auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'raw-key' } })).resolves.toMatchObject({ task_result: { products: [{ price: 1 }] }, poll_attempts: 1 });
  });

  it.each([
    { website: { engine: 'unknown' }, parameters: { prompt: 'Test' } },
    { website: { engine: 'chatgpt' }, parameters: { prompt: '' } },
    { website: { engine: 'chatgpt' }, parameters: { prompt: 'Test', country: 'USA' } },
    { website: { engine: 'copilot' }, parameters: { prompt: 'Test', mode: 'invalid' } },
    { website: { engine: 'aimode' }, parameters: { prompt: 'Test', location: 'NY', uule: 'encoded' } },
  ])('validates creation before entering the polling controller: %#', async ({ website, parameters }) => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    const context = createMockActionContext<typeof aiScraperAction.props>({ propsValue: { operation: 'create_and_wait', output_format: 'raw', website, parameters, wait_settings: undefined } });
    const error: unknown = await aiScraperAction.run({ ...context, auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'validation-key' } }).catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(Error);
    expect(error instanceof Error ? error.message : '').not.toContain('may have been created');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps a strict N-query cap across multiple pending responses', async () => {
    const create = vi.fn(async () => task());
    const query = vi.fn(async () => task());
    const request = aiScraperWait.run({ create, query, settings: limits({ max_queries: 3 }) });
    const assertion = expect(request).rejects.toMatchObject({ code: 'QUERY_LIMIT', poll_attempts: 3, elapsed_seconds: 20 });
    await vi.advanceTimersByTimeAsync(20000);
    await assertion;
    await vi.advanceTimersByTimeAsync(60000);
    expect(create).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });
});


describe('Transport and compatibility boundaries', () => {
  it('ends the logical wait while a response body remains stalled', async () => {
    let finishBody: () => void = () => undefined;
    const body = new ReadableStream<Uint8Array>({ start(controller) { finishBody = () => controller.close(); } });
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{"task_id":"stalled-body"}', { status: 201 }))
      .mockResolvedValueOnce(new Response(body, { headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const context = createMockActionContext<typeof aiScraperAction.props>({ propsValue: { operation: 'create_and_wait', output_format: 'table', website: { engine: 'chatgpt' }, parameters: { prompt: 'Test' }, wait_settings: { wait_timeout_seconds: 30 } } });
    const request = aiScraperAction.run({ ...context, auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'stalled-key' } });
    const assertion = expect(request).rejects.toMatchObject({ code: 'WAIT_TIMEOUT', task_id: 'stalled-body', poll_attempts: 1, elapsed_seconds: 30 });
    await vi.advanceTimersByTimeAsync(30000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(body.locked).toBe(true);
    finishBody();
    await vi.advanceTimersByTimeAsync(60000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['create_task', 'get_task_result'])('ignores inactive wait settings for %s', async (operation) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"task_id":"legacy-mode","status":"success","task_result":{"result_text":"Done"}}'));
    vi.stubGlobal('fetch', fetchMock);
    const context = createMockActionContext<typeof aiScraperAction.props>({ propsValue: { operation, output_format: 'table', website: { engine: 'chatgpt' }, parameters: operation === 'create_task' ? { prompt: 'Test' } : { task_id: 'legacy-mode' }, wait_settings: { max_queries: -1, poll_interval_seconds: 'invalid' } } });
    await expect(aiScraperAction.run({ ...context, auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'compatibility-key' } })).resolves.toMatchObject({ completed: true, poll_attempts: operation === 'create_task' ? 0 : 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([null, 'invalid', []])('rejects malformed wait groups: %#', value => {
    expect(() => aiScraperWait.settings(value)).toThrow('Wait Settings must be an object.');
  });
});

type Task = Awaited<ReturnType<typeof aiScraper.createTask>>;
