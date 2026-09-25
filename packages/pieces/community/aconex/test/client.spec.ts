import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HttpError, httpClient } from '@activepieces/pieces-common';
import { fetchProjectsDocument } from '../src/lib/api';
import { getAccessToken, setAconexClockForTests, setAconexThrottleForTests } from '../src/lib/client';
import { prepareAconexTest, productionAuth } from './helpers';

const throttleXml = readFileSync(join(__dirname, 'fixtures', 'throttle.xml'), 'utf8');

describe('Aconex client', () => {
  beforeEach(() => {
    prepareAconexTest();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('single-flight token mint shares one POST', async () => {
    let release: (value: unknown) => void = () => undefined;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(() =>
      gate.then(() => ({ status: 200, headers: {}, body: { access_token: 'tok', expires_in: 3600 } })),
    );
    const first = getAccessToken(productionAuth);
    const second = getAccessToken(productionAuth);
    expect(spy).toHaveBeenCalledTimes(1);
    release(undefined);
    await expect(first).resolves.toBe('tok');
    await expect(second).resolves.toBe('tok');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('caches the bearer until 60 seconds before expiry and ignores the secret in the key', async () => {
    let now = Date.parse('2026-09-25T00:00:00.000Z');
    setAconexClockForTests(() => now);
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { access_token: 'tok', expires_in: 3600 },
    });
    await getAccessToken(productionAuth);
    await getAccessToken({ ...productionAuth, clientSecret: 'other-secret' });
    expect(spy).toHaveBeenCalledTimes(1);
    now += 3600 * 1000 - 60_000 - 1;
    await getAccessToken(productionAuth);
    expect(spy).toHaveBeenCalledTimes(1);
    now += 1;
    await getAccessToken(productionAuth);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('omits user_id and user_site unless both are set', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { access_token: 'tok', expires_in: 3600 },
    });
    await getAccessToken(productionAuth);
    expect(spy.mock.calls[0][0].body).toEqual({ grant_type: 'client_credentials' });
    expect(JSON.stringify(spy.mock.calls[0][0].body)).not.toContain('client-secret');
    expect(spy.mock.calls[0][0].followRedirects).toBe(false);
    expect(spy.mock.calls[0][0].retries).toBe(0);
    expect(spy.mock.calls[0][0].headers?.['Content-Type']).toBe('application/x-www-form-urlencoded');

    await getAccessToken({ ...productionAuth, userId: '42', userSite: 'https://au1.aconex.com' });
    expect(spy.mock.calls[1][0].body).toEqual({
      grant_type: 'client_credentials',
      user_id: '42',
      user_site: 'https://au1.aconex.com',
    });
  });

  test('list projects stays on the gateway and does not follow redirects', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (String(request.url).includes('/auth/token')) {
        return { status: 200, headers: {}, body: { access_token: 'tok', expires_in: 3600 } };
      }
      return { status: 200, headers: {}, body: '<ProjectResults TotalResults="0"></ProjectResults>' };
    });
    await fetchProjectsDocument(productionAuth);
    const dataCall = spy.mock.calls.map((call) => call[0]).find((request) => String(request.url).includes('api.aconex.com'));
    expect(dataCall?.url).toBe('https://api.aconex.com/api/projects');
    expect(dataCall?.followRedirects).toBe(false);
    expect(dataCall?.retries).toBe(0);
    expect(dataCall?.headers?.['Accept']).toBe('application/xml');
    expect(dataCall?.headers?.['Authorization']).toBe('Bearer tok');
  });

  test.each(['MAX_FREQUENCY_THROTTLE_LIMIT_REACHED', 'CONCURRENCY_THROTTLE_LIMIT_REACHED'])(
    'retries %s four times and not five',
    async (code) => {
      const sleeps: number[] = [];
      setAconexThrottleForTests({ minGapMs: 0, sleep: async (ms) => { sleeps.push(ms); } });
      const body = throttleXml.replace('MAX_FREQUENCY_THROTTLE_LIMIT_REACHED', code);
      const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
        if (String(request.url).includes('/auth/token')) {
          return { status: 200, headers: {}, body: { access_token: 'tok', expires_in: 3600 } };
        }
        throw new HttpError({ leak: 'SECRET_BODY_MARKER' }, { status: 503, responseBody: body });
      });
      await expect(fetchProjectsDocument(productionAuth)).rejects.toMatchObject({ code });
      const dataCalls = spy.mock.calls.filter((call) => String(call[0].url).includes('api.aconex.com'));
      expect(dataCalls).toHaveLength(4);
      expect(sleeps).toEqual([200, 400, 800]);
    },
  );

  test('does not retry a non-throttle 503', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (String(request.url).includes('/auth/token')) {
        return { status: 200, headers: {}, body: { access_token: 'tok', expires_in: 3600 } };
      }
      throw new HttpError({}, { status: 503, responseBody: '<Error><ErrorCode>NOT_A_THROTTLE</ErrorCode><RequestID>abc123</RequestID></Error>' });
    });
    await expect(fetchProjectsDocument(productionAuth)).rejects.toMatchObject({ code: 'NOT_A_THROTTLE' });
    expect(spy.mock.calls.filter((call) => String(call[0].url).includes('api.aconex.com'))).toHaveLength(1);
  });
});
