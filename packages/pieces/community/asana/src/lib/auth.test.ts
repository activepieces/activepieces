import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { asanaAuth } from './auth';

const server = { apiUrl: 'http://127.0.0.1:4200/api/', publicUrl: 'http://127.0.0.1:4200/api/' };

function resolveIdentifier(data: Record<string, unknown>) {
  return asanaAuth.getConnectionIdentifier?.({ auth: { access_token: 'token', data }, server });
}

function mockUsersMe(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

describe('asanaAuth.getConnectionIdentifier', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the email from the user Asana puts in the token response, without calling the API', async () => {
    const sendRequest = mockUsersMe({});

    const identifier = await resolveIdentifier({ data: { gid: '1', name: 'Pat Doe', email: 'pat@example.com' } });

    expect(identifier).toBe('pat@example.com');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('falls back to the user name when the token user has no email', async () => {
    const sendRequest = mockUsersMe({});

    expect(await resolveIdentifier({ data: { gid: '1', name: 'Pat Doe' } })).toBe('Pat Doe');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('asks GET /users/me when the token response carries no user', async () => {
    const sendRequest = mockUsersMe({ data: { email: 'me@example.com', name: 'Me' } });

    expect(await resolveIdentifier({})).toBe('me@example.com');
    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://app.asana.com/api/1.0/users/me',
        headers: { Authorization: 'Bearer token' },
      }),
    );
  });

  it('ignores a token user that is not an object', async () => {
    mockUsersMe({ data: { email: 'me@example.com' } });

    expect(await resolveIdentifier({ data: 'unexpected' })).toBe('me@example.com');
  });

  it('returns undefined instead of throwing when the API call fails', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('401 Unauthorized'));

    expect(await resolveIdentifier({})).toBeUndefined();
  });
});
