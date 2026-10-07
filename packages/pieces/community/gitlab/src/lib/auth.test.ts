import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { gitlabAuth } from './auth';

const server = { apiUrl: 'http://127.0.0.1:4200/api/', publicUrl: 'http://127.0.0.1:4200/api/' };

function resolveIdentifier() {
  return gitlabAuth.getConnectionIdentifier?.({ auth: { access_token: 'token', data: {} }, server });
}

function mockCurrentUser(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

describe('gitlabAuth.getConnectionIdentifier', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the email of the user GitLab says the token belongs to', async () => {
    const sendRequest = mockCurrentUser({ email: 'dev@example.com', username: 'dev' });

    expect(await resolveIdentifier()).toBe('dev@example.com');
    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://gitlab.com/api/v4/user',
        headers: { Authorization: 'Bearer token' },
      }),
    );
  });

  it('falls back to the username when GitLab returns no email', async () => {
    mockCurrentUser({ email: '', username: 'dev' });

    expect(await resolveIdentifier()).toBe('dev');
  });

  it('returns undefined instead of throwing when the API call fails', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('401 Unauthorized'));

    expect(await resolveIdentifier()).toBeUndefined();
  });
});
