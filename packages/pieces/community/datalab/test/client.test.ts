import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { datalabClient, DatalabTiming } from '../src/lib/common/client';

function fakeTiming(): DatalabTiming & { sleeps: number[] } {
  let clock = 0;
  const sleeps: number[] = [];
  return {
    sleeps,
    sleep: async (ms) => {
      sleeps.push(ms);
      clock += ms;
    },
    now: () => clock,
  };
}

function ok(body: unknown) {
  return { status: 200, body };
}

function httpError({ status, body }: { status: number; body: unknown }) {
  return new HttpError(undefined, { status, responseBody: body });
}

function mockResponses(responses: Array<{ status: number; body: unknown } | Error>) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const response of responses) {
    if (response instanceof Error) {
      spy.mockRejectedValueOnce(response);
    } else {
      spy.mockResolvedValueOnce(response);
    }
  }
  return spy;
}

const submitted = ok({ success: true, error: null, request_id: 'req_1', request_check_url: 'https://www.datalab.to/api/v1/convert/req_1' });
const processing = ok({ status: 'processing', progress_percent: 5, success: null, error: null, result_url: null });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('submit', () => {
  it('posts to the operation path with the key header and returns the request id', async () => {
    const spy = mockResponses([submitted]);
    const form = new FormData();
    const requestId = await datalabClient.submit({ apiKey: 'key_1', operation: 'convert', body: form, timing: fakeTiming() });
    expect(requestId).toBe('req_1');
    const request = spy.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe('https://www.datalab.to/api/v1/convert');
    expect(request.headers).toEqual({ 'X-API-Key': 'key_1' });
    expect(request.body).toBe(form);
    expect(request.retries).toBe(0);
  });

  it('waits and retries a rate-limited submit, then succeeds', async () => {
    const timing = fakeTiming();
    const spy = mockResponses([httpError({ status: 429, body: { detail: 'Rate limit exceeded for endpoint marker.' } }), httpError({ status: 503, body: { detail: 'cannot queue' } }), submitted]);
    const requestId = await datalabClient.submit({ apiKey: 'k', operation: 'convert', body: new FormData(), timing });
    expect(requestId).toBe('req_1');
    expect(spy).toHaveBeenCalledTimes(3);
    expect(timing.sleeps).toEqual([5000, 10000]);
  });

  it('gives up on a rate limit after three waits with a clear message', async () => {
    const timing = fakeTiming();
    const limited = httpError({ status: 429, body: { detail: 'Rate limit exceeded for endpoint marker.  You can make 25 requests every 60 seconds.' } });
    const spy = mockResponses([limited, limited, limited, limited]);
    await expect(datalabClient.submit({ apiKey: 'k', operation: 'convert', body: new FormData(), timing })).rejects.toThrow(/rate limiting this API key.*25 requests every 60 seconds/);
    expect(spy).toHaveBeenCalledTimes(4);
    expect(timing.sleeps).toEqual([5000, 10000, 20000]);
  });

  it('never retries a submit that failed for another reason', async () => {
    const timing = fakeTiming();
    const spy = mockResponses([new Error('fetch failed')]);
    await expect(datalabClient.submit({ apiKey: 'k', operation: 'convert', body: new FormData(), timing })).rejects.toThrow('Could not reach Datalab: fetch failed');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(timing.sleeps).toEqual([]);
  });

  it('does not retry a server error on submit, because the job may already be queued', async () => {
    const spy = mockResponses([httpError({ status: 500, body: { detail: 'Database error' } })]);
    await expect(datalabClient.submit({ apiKey: 'k', operation: 'convert', body: new FormData(), timing: fakeTiming() })).rejects.toThrow('Datalab had a problem (HTTP 500): Database error');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('fails when Datalab accepts the request without a request id', async () => {
    mockResponses([ok({ success: true })]);
    await expect(datalabClient.submit({ apiKey: 'k', operation: 'convert', body: new FormData(), timing: fakeTiming() })).rejects.toThrow('did not return a request ID');
  });
});

describe('error messages', () => {
  const cases: Array<{ name: string; status: number; body: unknown; expected: RegExp }> = [
    { name: '401', status: 401, body: { detail: 'Invalid API key or access token.' }, expected: /rejected the API key.*app\/keys/ },
    { name: '402', status: 402, body: { detail: 'API key is at or over the configured 30-day billing limit.' }, expected: /free allowance or this API key's spend limit is used up/ },
    { name: '403', status: 403, body: { detail: 'You need an active, paid subscription to use this API.' }, expected: /denied the request: You need an active, paid subscription/ },
    { name: '400 detail text', status: 400, body: { detail: "mode 'lite' does not support: exact_transcription." }, expected: /rejected the request \(HTTP 400\): mode 'lite' does not support: exact_transcription\./ },
    {
      name: '422 detail list',
      status: 422,
      body: { detail: [{ type: 'missing', loc: ['body', 'field_data'], msg: 'Field required', input: null }, { type: 'bool_parsing', loc: ['body', 'paginate'], msg: 'Input should be a valid boolean' }] },
      expected: /HTTP 422\): field_data: Field required; paginate: Input should be a valid boolean/,
    },
    { name: 'error key', status: 400, body: { error: 'Something else' }, expected: /HTTP 400\): Something else/ },
    { name: 'text body', status: 400, body: 'plain text failure', expected: /HTTP 400\): plain text failure/ },
  ];
  for (const entry of cases) {
    it(`maps ${entry.name}`, async () => {
      mockResponses([httpError({ status: entry.status, body: entry.body })]);
      await expect(datalabClient.submit({ apiKey: 'k', operation: 'extract', body: new FormData(), timing: fakeTiming() })).rejects.toThrow(entry.expected);
    });
  }

  it('never puts the API key in an error message', async () => {
    mockResponses([httpError({ status: 401, body: { detail: 'Invalid API key or access token.' } })]);
    const failure = await datalabClient.submit({ apiKey: 'secret-key-value', operation: 'convert', body: new FormData(), timing: fakeTiming() }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect(String(failure)).not.toContain('secret-key-value');
  });
});

describe('fetchOutcome', () => {
  it('polls the operation path once and reports a job that is still running', async () => {
    const spy = mockResponses([processing]);
    const outcome = await datalabClient.fetchOutcome({ apiKey: 'k', operation: 'fill', requestId: ' req_1 ' });
    expect(outcome).toEqual({ completed: false, requestId: 'req_1', status: 'processing' });
    expect(spy.mock.calls[0][0].url).toBe('https://www.datalab.to/api/v1/fill/req_1');
    expect(spy.mock.calls[0][0].headers).toEqual({ 'X-API-Key': 'k' });
  });

  it('returns the result of a finished job, treating an empty error string as no error', async () => {
    mockResponses([ok({ status: 'complete', success: true, error: '', markdown: '# Hi', result_url: null })]);
    const outcome = await datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: 'req_1' });
    expect(outcome).toMatchObject({ completed: true, requestId: 'req_1', result: { markdown: '# Hi' } });
  });

  it('throws when a job is complete but did not succeed', async () => {
    mockResponses([ok({ status: 'complete', success: false, error: 'Could not parse PDF' })]);
    await expect(datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: 'req_1' })).rejects.toThrow('Datalab could not process the document (request req_1): Could not parse PDF');
  });

  it('throws when the status is failed, even without a success flag', async () => {
    mockResponses([ok({ status: 'failed', success: null, error: 'Worker crashed' })]);
    await expect(datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: 'req_1' })).rejects.toThrow('(request req_1): Worker crashed');
  });

  it('explains the page limit when it arrives as a failed result', async () => {
    mockResponses([ok({ status: 'complete', success: false, error: 'Page rate limit exceeded. Your team has 6000 pages in flight (limit: 5000).' })]);
    await expect(datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: 'req_1' })).rejects.toThrow(/too many pages in progress.*6000 pages in flight/);
  });

  it('explains the page limit when it arrives as a 429 on the poll', async () => {
    mockResponses([httpError({ status: 429, body: { detail: 'Page rate limit exceeded. Your team has 16000 pages in flight (limit: 15000).' } })]);
    await expect(datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: 'req_1' })).rejects.toThrow(/too many pages in progress.*16000 pages in flight/);
  });

  it('says the request was not found on a 404', async () => {
    mockResponses([httpError({ status: 404, body: { detail: 'Request not found.' } })]);
    await expect(datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: 'req_9' })).rejects.toThrow(/could not find request req_9.*about one day/);
  });

  it('maps a 402 on a poll, since a capped key cannot read results either', async () => {
    mockResponses([httpError({ status: 402, body: { detail: 'API key is at or over the configured 30-day billing limit.' } })]);
    await expect(datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: 'req_1' })).rejects.toThrow(/spend limit is used up/);
  });

  it('rejects an empty request id before calling Datalab', async () => {
    const spy = mockResponses([]);
    await expect(datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: '  ' })).rejects.toThrow('Give the Request ID');
    expect(spy).not.toHaveBeenCalled();
  });

  it('downloads an offloaded result without the API key and lets the poll fields win', async () => {
    const spy = mockResponses([
      ok({ status: 'complete', success: true, error: null, markdown: null, page_count: 3, result_url: 'https://storage.example.com/result.json?sig=abc', expires_in: 3600 }),
      ok({ status: 'complete', success: true, markdown: '# Big document', page_count: 1, images: {} }),
    ]);
    const outcome = await datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: 'req_1' });
    expect(outcome).toMatchObject({ completed: true, result: { markdown: '# Big document', page_count: 3, images: {} } });
    const download = spy.mock.calls[1][0];
    expect(download.url).toBe('https://storage.example.com/result.json?sig=abc');
    expect(download.headers).toBeUndefined();
  });

  it('fails an offloaded result that reports no success', async () => {
    mockResponses([ok({ status: 'complete', success: null, result_url: 'https://storage.example.com/result.json' }), ok({ success: false, error: 'Conversion failed' })]);
    await expect(datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: 'req_1' })).rejects.toThrow('(request req_1): Conversion failed');
  });

  it('says so when the offloaded result cannot be downloaded', async () => {
    mockResponses([ok({ status: 'complete', success: true, result_url: 'https://storage.example.com/result.json' }), httpError({ status: 403, body: 'expired' })]);
    await expect(datalabClient.fetchOutcome({ apiKey: 'k', operation: 'convert', requestId: 'req_1' })).rejects.toThrow(/result file could not be downloaded \(HTTP 403\)/);
  });
});

describe('waitForResult', () => {
  it('polls after 1 s, then with growing gaps capped at 5 s, until the job is done', async () => {
    const timing = fakeTiming();
    mockResponses([processing, processing, processing, processing, processing, processing, ok({ status: 'complete', success: true, markdown: 'done' })]);
    const outcome = await datalabClient.waitForResult({ apiKey: 'k', operation: 'convert', requestId: 'req_1', timing });
    expect(outcome).toMatchObject({ completed: true, result: { markdown: 'done' } });
    expect(timing.sleeps).toEqual([1000, 1500, 2250, 3375, 5000, 5000, 5000]);
  });

  it('hands back the request id when the deadline passes', async () => {
    const timing = fakeTiming();
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(processing);
    const outcome = await datalabClient.waitForResult({ apiKey: 'k', operation: 'fill', requestId: 'req_1', timing, maxWaitMs: 20_000 });
    expect(outcome).toEqual({ completed: false, requestId: 'req_1', status: 'processing' });
    expect(spy.mock.calls.length).toBe(7);
    expect(timing.sleeps.reduce((sum, ms) => sum + ms, 0)).toBe(20_000);
  });

  it('keeps polling through a 429 and a network error on a poll', async () => {
    const timing = fakeTiming();
    const spy = mockResponses([httpError({ status: 429, body: { detail: 'Rate limit exceeded for endpoint marker.' } }), new Error('socket hang up'), ok({ status: 'complete', success: true, markdown: 'ok' })]);
    const outcome = await datalabClient.waitForResult({ apiKey: 'k', operation: 'convert', requestId: 'req_1', timing });
    expect(outcome.completed).toBe(true);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('stops after five failed polls in a row', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    await expect(datalabClient.waitForResult({ apiKey: 'k', operation: 'convert', requestId: 'req_1', timing: fakeTiming() })).rejects.toThrow('Could not reach Datalab: socket hang up');
    expect(spy).toHaveBeenCalledTimes(5);
  });

  it('stops at once on a failed job, a page-limit 429 or a rejected key', async () => {
    for (const response of [
      ok({ status: 'complete', success: false, error: 'Could not parse PDF' }),
      httpError({ status: 429, body: { detail: 'Page rate limit exceeded. Your team has 16000 pages in flight.' } }),
      httpError({ status: 401, body: { detail: 'Invalid API key or access token.' } }),
    ]) {
      const spy = mockResponses([response]);
      await expect(datalabClient.waitForResult({ apiKey: 'k', operation: 'convert', requestId: 'req_1', timing: fakeTiming() })).rejects.toThrow();
      expect(spy).toHaveBeenCalledTimes(1);
      vi.restoreAllMocks();
    }
  });
});

describe('runJob', () => {
  it('submits, then polls the same operation with the returned request id', async () => {
    const spy = mockResponses([submitted, ok({ status: 'complete', success: true, markdown: 'x' })]);
    const outcome = await datalabClient.runJob({ apiKey: 'k', operation: 'convert', body: new FormData(), timing: fakeTiming() });
    expect(outcome).toMatchObject({ completed: true, requestId: 'req_1' });
    expect(spy.mock.calls[1][0].url).toBe('https://www.datalab.to/api/v1/convert/req_1');
  });
});

describe('finish', () => {
  it('wraps a finished result in the common envelope', async () => {
    const output = await datalabClient.finish({
      outcome: { completed: true, requestId: 'req_1', result: { markdown: '# Hi' } },
      operation: 'convert',
      audience: 'human',
      shape: (result) => ({ markdown: result['markdown'] }),
    });
    expect(output).toEqual({ completed: true, status: 'complete', request_id: 'req_1', markdown: '# Hi' });
  });

  it('throws for a human action that ran out of time, naming Get Result and the request id', async () => {
    await expect(
      datalabClient.finish({ outcome: { completed: false, requestId: 'req_7', status: 'processing' }, operation: 'fill', audience: 'human', shape: () => ({}) }),
    ).rejects.toThrow('Datalab is still processing request req_7. Run the Get Result action with Operation "Fill Form"');
  });

  it('returns completed false for an AI action that ran out of time', async () => {
    const output = await datalabClient.finish({ outcome: { completed: false, requestId: 'req_7', status: 'processing' }, operation: 'extract', audience: 'ai', shape: () => ({}) });
    expect(output).toMatchObject({ completed: false, status: 'processing', request_id: 'req_7' });
    expect(output).toHaveProperty('message');
  });
});

describe('appendFields', () => {
  it('encodes booleans, numbers and JSON as strings and skips empty values', () => {
    const form = new FormData();
    datalabClient.appendFields({
      form,
      fields: { mode: 'balanced', paginate: true, skip_cache: false, max_pages: 3, page_schema: { type: 'object', properties: {} }, extras: '', page_range: undefined, context: null, blank: '   ' },
    });
    expect(Object.fromEntries(form.entries())).toEqual({ mode: 'balanced', paginate: 'true', skip_cache: 'false', max_pages: '3', page_schema: '{"type":"object","properties":{}}' });
  });
});

describe('checkKey', () => {
  it('tells a valid key, a rejected key and a key with no allowance apart', async () => {
    mockResponses([ok({ status: 'ok' }), httpError({ status: 401, body: { detail: 'Invalid API key provided.' } }), httpError({ status: 402, body: { detail: 'API key is at or over the configured 30-day billing limit.' } })]);
    expect(await datalabClient.checkKey({ apiKey: 'k' })).toBe('valid');
    expect(await datalabClient.checkKey({ apiKey: 'k' })).toBe('rejected');
    expect(await datalabClient.checkKey({ apiKey: 'k' })).toBe('no_allowance');
  });

  it('lets a network failure through so the connection form can say Datalab was unreachable', async () => {
    mockResponses([new Error('getaddrinfo ENOTFOUND www.datalab.to')]);
    await expect(datalabClient.checkKey({ apiKey: 'k' })).rejects.toThrow('ENOTFOUND');
  });
});
