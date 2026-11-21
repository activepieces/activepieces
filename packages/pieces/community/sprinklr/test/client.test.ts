import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sprinklrClient, sprinklrTiming } from '../src/lib/common/client';
import { sprinklrEndpoints } from '../src/lib/common/endpoints';
import { SprinklrApiError, sprinklrErrors } from '../src/lib/common/errors';

const AUTH = {
  access_token: 'token-1',
  client_id: 'key-1',
  props: { base: 'https://api3.sprinklr.com/prod2', callback: 'https://cloud.activepieces.com/redirect' },
};

const MOCK_HTML_500 =
  '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Service Unavailable</title>\n  </head><body>down</body></html>';

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

function fakeSleep() {
  const sleeps: number[] = [];
  return {
    sleeps,
    sleep: async (ms: number) => {
      sleeps.push(ms);
    },
  };
}

async function captureError(promise: Promise<unknown>): Promise<SprinklrApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof SprinklrApiError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected the call to fail');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('request building', () => {
  it('builds the v3 URL from the Environment and sends Authorization and Key on every call', async () => {
    const spy = mockResponses([ok([{ id: 'c1' }]), ok({ id: 'm1' })]);
    await sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: sprinklrEndpoints.CASE, query: { caseNumber: 42, id: undefined } });
    await sprinklrClient.request({ auth: AUTH, method: HttpMethod.POST, path: sprinklrEndpoints.COMMENT, body: { text: 'hi' } });
    const [first, second] = spy.mock.calls.map((call) => call[0]);
    expect(first.url).toBe('https://api3.sprinklr.com/prod2/api/v3/case?caseNumber=42');
    expect(first.method).toBe(HttpMethod.GET);
    expect(second.url).toBe('https://api3.sprinklr.com/prod2/api/v3/comment');
    expect(second.body).toEqual({ text: 'hi' });
    for (const request of [first, second]) {
      expect(request.headers).toMatchObject({ Authorization: 'Bearer token-1', Key: 'key-1' });
      expect(request.retries).toBe(0);
    }
  });

  it('uses the client ID as the Key header and production has no segment', async () => {
    const spy = mockResponses([ok({})]);
    await sprinklrClient.request({
      auth: { access_token: 't', client_id: 'the-api-key', props: { base: 'https://api3.sprinklr.com' } },
      method: HttpMethod.GET,
      path: '/me',
    });
    expect(spy.mock.calls[0][0].url).toBe('https://api3.sprinklr.com/api/v3/me');
    expect(spy.mock.calls[0][0].headers).toMatchObject({ Key: 'the-api-key' });
  });

  it('URL-encodes the tilde in a channel lookup value', () => {
    const url = sprinklrClient.buildUrl({
      apiBaseUrl: 'https://api3.sprinklr.com/api/v3',
      path: '/profile',
      query: { channelTypeChannelId: 'EMAIL~a@b.com' },
    });
    expect(url).toBe('https://api3.sprinklr.com/api/v3/profile?channelTypeChannelId=EMAIL%7Ea%40b.com');
  });

  it('refuses a connection without an Environment or an API key', () => {
    expect(() => sprinklrClient.connectionFrom({ access_token: 't', client_id: 'k', props: {} })).toThrow(/no Environment/);
    expect(() => sprinklrClient.connectionFrom({ access_token: 't', props: { base: 'https://api3.sprinklr.com' } })).toThrow(/no API key/);
  });

  it('returns both headers for Custom API Call and roots it at /api', async () => {
    expect(await sprinklrClient.customApiAuthMapping(AUTH)).toEqual({ Authorization: 'Bearer token-1', Key: 'key-1' });
    expect(sprinklrClient.customApiBaseUrl(AUTH)).toBe('https://api3.sprinklr.com/prod2/api');
    expect(sprinklrClient.customApiBaseUrl(undefined)).toBe('');
  });
});

describe('response envelope', () => {
  it('returns a bare array as is', async () => {
    mockResponses([ok([{ id: 'c1' }])]);
    expect(await sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/case' })).toEqual([{ id: 'c1' }]);
  });

  it('returns a bare object as is', async () => {
    mockResponses([ok({ results: [], cursor: 'c', count: 0 })]);
    expect(await sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/x' })).toEqual({ results: [], cursor: 'c', count: 0 });
  });

  it('unwraps data from a {data, errors} envelope', async () => {
    mockResponses([ok({ data: { id: 'c1' }, errors: [] })]);
    expect(await sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/x' })).toEqual({ id: 'c1' });
  });

  it('unwraps data when data is an array', async () => {
    mockResponses([ok({ data: [{ id: 1, email: 'jane@example.com' }], errors: [] })]);
    expect(await sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/me' })).toEqual([{ id: 1, email: 'jane@example.com' }]);
  });

  it('keeps partial data when errors come with it', async () => {
    mockResponses([ok({ data: [{ id: 1 }], errors: [{ id: 'e', code: 404, message: 'one.not.found' }] })]);
    expect(await sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/x' })).toEqual([{ id: 1 }]);
  });

  it.each([
    ['null data', { data: null, errors: [{ id: 'e', code: 1, message: 'comment.not.found' }] }],
    ['empty object data', { data: {}, errors: [{ id: 'e', code: 1, message: 'comment.not.found' }], metadata: {} }],
    ['no data key', { success: false, errors: [{ code: 'NOT_FOUND', message: 'comment.not.found' }] }],
  ])('throws the first error message on a 200 with %s', async (_label, body) => {
    mockResponses([ok(body)]);
    const error = await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/comment' }));
    expect(error.message).toBe('Sprinklr returned an error for GET /comment: comment.not.found.');
    expect(error.status).toBe(200);
  });

  it('exposes the status and the raw body through send', async () => {
    mockResponses([{ status: 201, body: { data: { id: 'c1' }, errors: [] } }]);
    const response = await sprinklrClient.send({ auth: AUTH, method: HttpMethod.POST, path: '/case', body: {} });
    expect(response).toEqual({ status: 201, data: { id: 'c1' }, raw: { data: { id: 'c1' }, errors: [] } });
  });

  it('reads the /me user from a data array or a bare object', async () => {
    mockResponses([ok({ data: [{ id: 6, name: 'Jane', email: 'jane@example.com' }], errors: [] }), ok({ id: 7, name: 'Joe' }), ok('string')]);
    expect(await sprinklrClient.getMe({ auth: AUTH })).toMatchObject({ id: 6, name: 'Jane', email: 'jane@example.com' });
    expect(await sprinklrClient.getMe({ auth: AUTH })).toMatchObject({ id: 7, name: 'Joe', email: undefined });
    expect(await sprinklrClient.getMe({ auth: AUTH })).toBeUndefined();
  });
});

describe('error mapping', () => {
  it('turns a 401 into the reconnect message', async () => {
    mockResponses([httpError({ status: 401, body: { data: null, errors: [{ id: 'x', code: 401, message: 'Unauthorized' }] } })]);
    const error = await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/me' }));
    expect(error.message).toBe(sprinklrErrors.MESSAGES.RECONNECT);
    expect(error.message).toMatch(/Reconnect it\. This happens when the same API key is used elsewhere or the user's password changed\./);
    expect(error.kind).toBe('auth');
  });

  it("turns the mock's 404 {message} body into a not-found message", async () => {
    mockResponses([httpError({ status: 404, body: { message: 'Path /nope not found' } })]);
    const error = await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/nope' }));
    expect(error.message).toBe(
      "Sprinklr found nothing for GET /nope (404): Path /nope not found. Check the ID you entered and the connection's Environment.",
    );
    expect(error.kind).toBe('not_found');
  });

  it('turns a 400 with v3 errors[] into its first message', async () => {
    mockResponses([
      httpError({
        status: 400,
        body: { data: null, errors: [{ id: 'a', code: 400, message: 'subject.required' }, { id: 'b', code: 400, message: 'second' }] },
      }),
    ]);
    const error = await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.POST, path: '/case', body: {} }));
    expect(error.message).toBe('Sprinklr rejected POST /case (400): subject.required. Check the values you entered.');
    expect(error.kind).toBe('bad_request');
  });

  it('turns an HTML 500 into a server-error message with the page title', async () => {
    const sleep = fakeSleep();
    mockResponses([httpError({ status: 500, body: MOCK_HTML_500 }), httpError({ status: 500, body: MOCK_HTML_500 }), httpError({ status: 500, body: MOCK_HTML_500 })]);
    const error = await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/case', sleep: sleep.sleep }));
    expect(error.message).toBe('Sprinklr had a server error on GET /case (500): an HTML error page (Service Unavailable). Try again in a few minutes.');
    expect(error.message).not.toContain('<');
    expect(error.kind).toBe('server');
  });

  it('turns a non-rate-limit 403 into a permission message', async () => {
    mockResponses([httpError({ status: 403, body: { errors: [{ id: 'x', code: 403, message: 'access.denied' }] } })]);
    const error = await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/case' }));
    expect(error.message).toBe('Sprinklr refused GET /case (403): access.denied. Check that the Sprinklr user of this connection has permission for it.');
    expect(error.kind).toBe('forbidden');
  });

  it('turns a 421 into a wrong-environment message', async () => {
    mockResponses([httpError({ status: 421, body: '' })]);
    const error = await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/me' }));
    expect(error.message).toMatch(/wrong environment \(421\).*check the Environment/);
  });

  it.each([
    ['429', 429, { errors: [{ message: 'Too Many Requests' }] }],
    ['403 Developer Over Rate', 403, '<h1>Developer Over Rate</h1>'],
    ['403 Account Over Queries Per Second Limit', 403, { errors: [{ id: 'x', code: 403, message: 'Account Over Queries Per Second Limit' }] }],
    ['403 Account Over Rate Limit', 403, { message: 'Account Over Rate Limit' }],
  ])('treats %s as a rate limit and gives the hourly message when it persists', async (_label, status, body) => {
    const sleep = fakeSleep();
    const spy = mockResponses([
      httpError({ status, body }),
      httpError({ status, body }),
      httpError({ status, body }),
      httpError({ status, body }),
    ]);
    const error = await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/case', sleep: sleep.sleep }));
    expect(error.message).toBe("Sprinklr's API limit was reached (1,000 requests per hour by default). Try again later.");
    expect(error.kind).toBe('rate_limit');
    expect(spy).toHaveBeenCalledTimes(4);
    expect(sleep.sleeps).toEqual([1000, 2000, 4000]);
  });

  it('turns a timeout on a no-retry call into a check-before-retrying message', async () => {
    mockResponses([new Error('The operation was aborted')]);
    const error = await captureError(
      sprinklrClient.request({ auth: AUTH, method: HttpMethod.POST, path: '/case', body: {}, retryOn5xx: false }),
    );
    expect(error.message).toBe(
      'Sprinklr did not answer POST /case (The operation was aborted). It may still have gone through, so check Sprinklr before you run it again.',
    );
    expect(error.kind).toBe('network');
  });
});

describe('retries', () => {
  it('retries a per-second rate limit and then succeeds', async () => {
    const sleep = fakeSleep();
    const spy = mockResponses([httpError({ status: 429, body: {} }), httpError({ status: 403, body: 'Developer Over Rate' }), ok([{ id: 'c1' }])]);
    const result = await sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/case', sleep: sleep.sleep });
    expect(result).toEqual([{ id: 'c1' }]);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(sleep.sleeps).toEqual([1000, 2000]);
  });

  it('retries a rate limit even when 5xx retries are off', async () => {
    const sleep = fakeSleep();
    const spy = mockResponses([httpError({ status: 429, body: {} }), ok({ id: 'case-1' })]);
    const result = await sprinklrClient.request({ auth: AUTH, method: HttpMethod.POST, path: '/case', body: {}, retryOn5xx: false, sleep: sleep.sleep });
    expect(result).toEqual({ id: 'case-1' });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('retries a GET twice on 5xx and then succeeds', async () => {
    const sleep = fakeSleep();
    const spy = mockResponses([httpError({ status: 502, body: '' }), httpError({ status: 503, body: '' }), ok([{ id: 'c1' }])]);
    expect(await sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/case', sleep: sleep.sleep })).toEqual([{ id: 'c1' }]);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(sleep.sleeps).toEqual([1000, 2000]);
  });

  it('gives up on a GET after two 5xx retries', async () => {
    const sleep = fakeSleep();
    const spy = mockResponses([httpError({ status: 500, body: '' }), httpError({ status: 500, body: '' }), httpError({ status: 500, body: '' })]);
    const error = await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/case', sleep: sleep.sleep }));
    expect(error.status).toBe(500);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('retries a network error on a GET', async () => {
    const sleep = fakeSleep();
    const spy = mockResponses([new TypeError('fetch failed'), ok([])]);
    expect(await sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/case', sleep: sleep.sleep })).toEqual([]);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('never retries a no-retry call on a 5xx and says it may have gone through', async () => {
    const sleep = fakeSleep();
    const spy = mockResponses([httpError({ status: 500, body: MOCK_HTML_500 }), ok({ id: 'never' })]);
    const error = await captureError(
      sprinklrClient.request({ auth: AUTH, method: HttpMethod.POST, path: '/case', body: {}, retryOn5xx: false, sleep: sleep.sleep }),
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(sleep.sleeps).toEqual([]);
    expect(error.message).toBe(
      'Sprinklr had a server error on POST /case (500): an HTML error page (Service Unavailable). It may still have gone through, so check Sprinklr before you run it again.',
    );
  });

  it('never retries a no-retry call on a timeout', async () => {
    const sleep = fakeSleep();
    const spy = mockResponses([new Error('aborted'), ok({ id: 'never' })]);
    await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.POST, path: '/comment', body: {}, retryOn5xx: false, sleep: sleep.sleep }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('never retries a 4xx', async () => {
    const spy = mockResponses([httpError({ status: 400, body: {} }), ok({})]);
    await captureError(sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/case' }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('uses the shared sleep when none is passed, so tests can stub it', async () => {
    const sleepSpy = vi.spyOn(sprinklrTiming, 'sleep').mockResolvedValue(undefined);
    mockResponses([httpError({ status: 429, body: {} }), ok([])]);
    await sprinklrClient.request({ auth: AUTH, method: HttpMethod.GET, path: '/case' });
    expect(sleepSpy).toHaveBeenCalledWith(1000);
  });
});

describe('search paging', () => {
  const body = { filter: { type: 'AND', filters: [] }, page: { size: 2 } };

  it('posts the body, then follows the cursor with GET ?id= until it is absent', async () => {
    const spy = mockResponses([
      ok({ results: [{ id: 1 }, { id: 2 }], cursor: 'cur-1', count: 5 }),
      ok({ data: { results: [{ id: 3 }, { id: 4 }], cursor: 'cur-2' }, errors: [] }),
      ok({ results: [{ id: 5 }] }),
    ]);
    const result = await sprinklrClient.search({ auth: AUTH, entity: 'case', body, maxResults: 50 });
    expect(result).toEqual({ results: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }], count: 5, pages: 3 });
    const calls = spy.mock.calls.map((call) => call[0]);
    expect(calls[0].method).toBe(HttpMethod.POST);
    expect(calls[0].url).toBe('https://api3.sprinklr.com/prod2/api/v3/search/case');
    expect(calls[0].body).toEqual(body);
    expect(calls[1].method).toBe(HttpMethod.GET);
    expect(calls[1].url).toBe('https://api3.sprinklr.com/prod2/api/v3/search/case?id=cur-1');
    expect(calls[2].url).toBe('https://api3.sprinklr.com/prod2/api/v3/search/case?id=cur-2');
  });

  it('strips a leading id= from the cursor', async () => {
    const spy = mockResponses([ok({ results: [{ id: 1 }], cursor: 'id=abc123' }), ok({ results: [{ id: 2 }] })]);
    await sprinklrClient.search({ auth: AUTH, entity: 'case', body });
    expect(spy.mock.calls[1][0].url).toBe('https://api3.sprinklr.com/prod2/api/v3/search/case?id=abc123');
  });

  it('stops at max results and trims the last page', async () => {
    const spy = mockResponses([
      ok({ results: [{ id: 1 }, { id: 2 }], cursor: 'c1' }),
      ok({ results: [{ id: 3 }, { id: 4 }], cursor: 'c2' }),
      ok({ results: [{ id: 5 }, { id: 6 }], cursor: 'c3' }),
    ]);
    const result = await sprinklrClient.search({ auth: AUTH, entity: 'case', body, maxResults: 3 });
    expect(result.results).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('makes no follow-up call when the first page already holds max results', async () => {
    const spy = mockResponses([ok({ results: [{ id: 1 }, { id: 2 }], cursor: 'c1' })]);
    const result = await sprinklrClient.search({ auth: AUTH, entity: 'case', body, maxResults: 2 });
    expect(result.results).toHaveLength(2);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('falls back to ?cursor= when ?id= answers 400, and keeps using it', async () => {
    const spy = mockResponses([
      ok({ results: [{ id: 1 }], cursor: 'c1' }),
      httpError({ status: 400, body: { errors: [{ message: 'id.unknown' }] } }),
      ok({ results: [{ id: 2 }], cursor: 'c2' }),
      ok({ results: [{ id: 3 }] }),
    ]);
    const result = await sprinklrClient.search({ auth: AUTH, entity: 'case', body });
    expect(result.results).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const urls = spy.mock.calls.map((call) => call[0].url);
    expect(urls.slice(1)).toEqual([
      'https://api3.sprinklr.com/prod2/api/v3/search/case?id=c1',
      'https://api3.sprinklr.com/prod2/api/v3/search/case?cursor=c1',
      'https://api3.sprinklr.com/prod2/api/v3/search/case?cursor=c2',
    ]);
  });

  it('throws when both cursor parameter names answer 400', async () => {
    mockResponses([
      ok({ results: [{ id: 1 }], cursor: 'c1' }),
      httpError({ status: 400, body: { errors: [{ message: 'bad' }] } }),
      httpError({ status: 400, body: { errors: [{ message: 'still.bad' }] } }),
    ]);
    const error = await captureError(sprinklrClient.search({ auth: AUTH, entity: 'case', body }));
    expect(error.message).toContain('still.bad');
  });

  it('stops on an empty page even when a cursor comes back', async () => {
    const spy = mockResponses([ok({ results: [{ id: 1 }], cursor: 'c1' }), ok({ results: [], cursor: 'c2' })]);
    const result = await sprinklrClient.search({ auth: AUTH, entity: 'case', body });
    expect(result.results).toEqual([{ id: 1 }]);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('defaults to 20 results and uses the entity constant in the path', async () => {
    const page = (start: number) => Array.from({ length: 15 }, (_, index) => ({ id: start + index }));
    const spy = mockResponses([ok({ results: page(0), cursor: 'c1' }), ok({ results: page(15), cursor: 'c2' })]);
    const result = await sprinklrClient.search({ auth: AUTH, entity: sprinklrEndpoints.SEARCH_ENTITY.PROFILE, body });
    expect(result.results).toHaveLength(sprinklrClient.DEFAULT_MAX_RESULTS);
    expect(spy.mock.calls[0][0].url).toBe('https://api3.sprinklr.com/prod2/api/v3/search/profile');
    expect(sprinklrEndpoints.SEARCH_ENTITY.CASE).toBe('case');
  });
});
