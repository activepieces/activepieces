import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { salesforceAuth } from '../index';

const server = { apiUrl: 'http://127.0.0.1:4200/api/', publicUrl: 'http://127.0.0.1:4200/api/' };
const identityUrl = 'https://login.salesforce.com/id/00Dxx0000001gPL/005xx000001X8Uz';

function resolveIdentifier(data: Record<string, unknown>) {
  return salesforceAuth.getConnectionIdentifier?.({ auth: { access_token: 'token', data }, server });
}

function mockIdentity(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

describe('salesforceAuth.getConnectionIdentifier', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the email from the identity URL in the token response', async () => {
    const sendRequest = mockIdentity({ email: 'admin@acme.test', username: 'admin@acme.test.dev' });

    expect(await resolveIdentifier({ id: identityUrl, instance_url: 'https://acme.my.salesforce.com' })).toBe('admin@acme.test');
    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: identityUrl,
        headers: { Authorization: 'Bearer token', Accept: 'application/json' },
      }),
    );
  });

  it('falls back to the username when the identity has no email', async () => {
    mockIdentity({ username: 'admin@acme.test.dev' });

    expect(await resolveIdentifier({ id: identityUrl })).toBe('admin@acme.test.dev');
  });

  it('makes no request when the token response has no https identity URL', async () => {
    const sendRequest = mockIdentity({});

    expect(await resolveIdentifier({})).toBeUndefined();
    expect(await resolveIdentifier({ id: 'http://example.test/id' })).toBeUndefined();
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('returns undefined instead of throwing when the identity call fails', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('403 Bad_OAuth_Token'));

    expect(await resolveIdentifier({ id: identityUrl })).toBeUndefined();
  });
});
