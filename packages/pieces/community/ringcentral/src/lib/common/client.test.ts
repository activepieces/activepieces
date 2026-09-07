import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { describeRingCentralError, ringcentralCommon } from './client';
import { httpError, oauth, stubHttp } from './test-support/http-stub';

afterEach(() => vi.restoreAllMocks());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const auth = (overrides: Record<string, unknown> = {}): any => oauth(overrides);

describe('getServerUrl', () => {
  it('uses the environment the connection picked', () => {
    expect(ringcentralCommon.getServerUrl(auth())).toBe(
      'https://platform.devtest.ringcentral.com',
    );
  });

  it('falls back to production when the connection carries no environment', () => {
    expect(ringcentralCommon.getServerUrl(auth({ props: undefined }))).toBe(
      'https://platform.ringcentral.com',
    );
  });
});

describe('sendRequest', () => {
  it('sends the bearer token and a timeout on every call', async () => {
    const stub = stubHttp();
    stub.route('/restapi/v1.0/account', { id: 42 });

    const body = await ringcentralCommon.sendRequest({
      auth: auth(),
      method: HttpMethod.GET,
      resourcePath: '/restapi/v1.0/account/~/extension/~',
    });

    expect(body).toEqual({ id: 42 });
    const sent = stub.calls[0];
    expect(sent.url).toBe(
      'https://platform.devtest.ringcentral.com/restapi/v1.0/account/~/extension/~',
    );
    expect(sent.authentication).toMatchObject({ token: 'RC_TOKEN' });
    expect(sent.timeout).toBeGreaterThan(0);
  });

  it('retries reads but never writes, because a replayed write sends twice', async () => {
    const stub = stubHttp();
    stub.route('/call-log', {});
    stub.route('/sms', {});

    await ringcentralCommon.sendRequest({
      auth: auth(),
      method: HttpMethod.GET,
      resourcePath: '/restapi/v1.0/account/~/extension/~/call-log',
    });
    await ringcentralCommon.sendRequest({
      auth: auth(),
      method: HttpMethod.POST,
      resourcePath: '/restapi/v1.0/account/~/extension/~/sms',
    });

    expect(stub.find('/call-log')?.retries).toBeGreaterThan(0);
    expect(stub.find('/sms')?.retries).toBe(0);
  });

  it('translates an HTTP failure instead of leaking a stringified axios error', async () => {
    const stub = stubHttp();
    stub.route('/sms', () => httpError(403, { errorCode: 'InsufficientPermissions' }));

    await expect(
      ringcentralCommon.sendRequest({
        auth: auth(),
        method: HttpMethod.POST,
        resourcePath: '/restapi/v1.0/account/~/extension/~/sms',
      }),
    ).rejects.toThrow(/Developer Console is missing the permission/);
  });
});

describe('subscriptions', () => {
  it('creates a WebHook subscription with the filters and the flow webhook URL', async () => {
    const stub = stubHttp();
    stub.route('/subscription', { id: 'sub-123' });

    const id = await ringcentralCommon.createSubscription({
      auth: auth(),
      webhookUrl: 'https://example.com/webhook/abc',
      eventFilters: ['/restapi/v1.0/glip/posts'],
    });

    expect(id).toBe('sub-123');
    const sent = stub.find('/subscription');
    expect(sent?.method).toBe('POST');
    expect(sent?.body).toMatchObject({
      eventFilters: ['/restapi/v1.0/glip/posts'],
      deliveryMode: { transportType: 'WebHook', address: 'https://example.com/webhook/abc' },
    });
    expect(sent?.body?.['expiresIn']).toBeGreaterThan(0);
  });

  it('deletes by id, path-encoded', async () => {
    const stub = stubHttp();
    stub.route('/subscription/', {});

    await ringcentralCommon.deleteSubscription({ auth: auth(), subscriptionId: 'sub/9?x' });

    const sent = stub.find('/subscription/');
    expect(sent?.method).toBe('DELETE');
    expect(sent?.url).toMatch(/\/subscription\/sub%2F9%3Fx$/);
  });
});

describe('describeRingCentralError', () => {
  const call = (err: unknown) =>
    describeRingCentralError(err, HttpMethod.POST, '/restapi/v1.0/account/~/extension/~/sms');

  it('tells the user to reconnect on 401', () => {
    expect(call(httpError(401, {}))).toMatch(/Reconnect the RingCentral connection/);
  });

  it('points at app permissions on 403 and carries RingCentral detail', () => {
    const described = call(
      httpError(403, {
        errorCode: 'CMN-408',
        message: 'In order to call this API endpoint, application needs to have [SMS] permission',
      }),
    );
    expect(described).toMatch(/missing the permission/);
    expect(described).toMatch(/SMS/);
  });

  it('names the rate limit on 429', () => {
    expect(call(httpError(429, {}))).toMatch(/rate-limited/);
  });

  it('surfaces the per-field errors array when present', () => {
    const described = call(
      httpError(400, {
        errors: [{ errorCode: 'MSG-347', message: 'Phone number is not SMS enabled' }],
      }),
    );
    expect(described).toMatch(/MSG-347 Phone number is not SMS enabled/);
  });

  it('reports a transport failure as its own thing', () => {
    expect(call(new Error('socket hang up'))).toMatch(/before a response arrived/);
    expect(call(new Error('socket hang up'))).toMatch(/socket hang up/);
  });
});
