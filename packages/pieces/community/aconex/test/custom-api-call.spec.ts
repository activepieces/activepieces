import { HttpError, httpClient } from '@activepieces/pieces-common';
import { customApiCallAction } from '../src/lib/actions/custom-api-call';
import { setAconexThrottleForTests } from '../src/lib/client';
import { connection, prepareAconexTest, productionAuth } from './helpers';

function run(props: Record<string, unknown>) {
  return customApiCallAction.run({
    auth: connection(productionAuth),
    propsValue: { method: 'GET', path: '/projects', ...props },
  } as never);
}

describe('custom_api_call', () => {
  beforeEach(() => {
    prepareAconexTest();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each(['https://evil.example/api/projects', '//evil.example/projects', '/projects/../secret'])(
    'rejects path %s',
    async (path) => {
      const spy = vi.spyOn(httpClient, 'sendRequest');
      await expect(run({ path })).rejects.toMatchObject({ code: 'UNSAFE_PATH' });
      expect(spy).not.toHaveBeenCalled();
    },
  );

  test('sends a path on the gateway without following redirects', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (String(request.url).includes('/auth/token')) {
        return { status: 200, headers: {}, body: { access_token: 'tok', expires_in: 3600 } };
      }
      return { status: 200, headers: {}, body: '<ProjectResults TotalResults="0"></ProjectResults>' };
    });
    await run({
      path: '/projects',
      headers: { Authorization: 'Bearer attacker', Accept: 'application/json' },
      body: 'ignored-on-get',
    });
    const dataCall = spy.mock.calls.map((call) => call[0]).find((request) => String(request.url).includes('api.aconex.com'));
    expect(dataCall?.url).toBe('https://api.aconex.com/api/projects');
    expect(dataCall?.followRedirects).toBe(false);
    expect(dataCall?.retries).toBe(0);
    expect(dataCall?.headers?.['Authorization']).toBe('Bearer tok');
    expect(dataCall?.headers?.['Accept']).toBe('application/json');
    expect(dataCall?.body).toBeUndefined();
  });

  test('retries a custom call throttle four times', async () => {
    const sleeps: number[] = [];
    setAconexThrottleForTests({ minGapMs: 0, sleep: async (ms) => { sleeps.push(ms); } });
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (String(request.url).includes('/auth/token')) {
        return { status: 200, headers: {}, body: { access_token: 'tok', expires_in: 3600 } };
      }
      throw new HttpError({ body: 'SECRET_POST' }, {
        status: 429,
        responseBody: 'slow down',
      });
    });
    await expect(run({ method: 'POST', path: '/projects', body: 'SECRET_POST' })).rejects.toMatchObject({ code: 'REQUEST_FAILED' });
    expect(spy.mock.calls.filter((call) => String(call[0].url).includes('api.aconex.com'))).toHaveLength(4);
    expect(sleeps).toEqual([200, 400, 800]);
  });
});
