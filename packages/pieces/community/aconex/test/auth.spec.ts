import { httpClient } from '@activepieces/pieces-common';
import { EA_LOBBY, EA_SITE, PRODUCTION_LOBBY } from '../src/lib/auth-props';
import { aconexAuth } from '../src/lib/auth';
import { authServer, prepareAconexTest } from './helpers';

const secret = 'super-secret-value';

describe('aconexAuth.validate', () => {
  beforeEach(() => {
    prepareAconexTest();
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('network should not be called'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([
    { name: 'production lobby with ea1', lobby: PRODUCTION_LOBBY, userId: '12', userSite: EA_SITE },
    { name: 'EA lobby with a commercial site', lobby: EA_LOBBY, userId: '12', userSite: 'https://au1.aconex.com' },
    { name: 'user id without instance', lobby: PRODUCTION_LOBBY, userId: '12', userSite: '' },
    { name: 'instance without user id', lobby: PRODUCTION_LOBBY, userId: '', userSite: 'https://au1.aconex.com' },
    { name: 'non-digit user id', lobby: PRODUCTION_LOBBY, userId: '12a', userSite: 'https://au1.aconex.com' },
    { name: 'lobby outside the allowlist', lobby: 'https://evil.example', userId: '', userSite: '' },
  ])('rejects $name', async ({ lobby, userId, userSite }) => {
    const result = await aconexAuth.validate!({
      auth: { lobby, clientId: 'client-id', clientSecret: secret, userId, userSite },
      server: authServer,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).not.toContain(secret);
      expect(result.error).not.toContain('network should not be called');
    }
    expect(httpClient.sendRequest).not.toHaveBeenCalled();
  });

  test('accepts one linked account after list projects succeeds', async () => {
    vi.mocked(httpClient.sendRequest).mockImplementation(async (request) => {
      if (String(request.url).includes('/auth/token')) {
        return { status: 200, headers: {}, body: { access_token: 'tok', expires_in: 3600 } };
      }
      return { status: 200, headers: {}, body: '<ProjectResults TotalResults="0"></ProjectResults>' };
    });
    const result = await aconexAuth.validate!({
      auth: { lobby: PRODUCTION_LOBBY, clientId: 'client-id', clientSecret: secret, userId: '', userSite: '' },
      server: authServer,
    });
    expect(result).toEqual({ valid: true });
  });
});
