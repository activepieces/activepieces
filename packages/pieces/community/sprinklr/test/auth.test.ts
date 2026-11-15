import { httpClient, HttpError } from '@activepieces/pieces-common';
import { OAuth2AuthorizationMethod } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sprinklrAuth } from '../src/lib/auth';
import { sprinklrClient } from '../src/lib/common/client';
import { sprinklrEnvironments } from '../src/lib/common/environments';

function resolveTemplate({ template, props }: { template: string; props: Record<string, string> }): string {
  return Object.entries(props).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, () => value), template);
}

function authFor(base: string) {
  return { access_token: 'token-1', client_id: 'key-1', props: { base, callback: sprinklrEnvironments.DEFAULT_CALLBACK_URL }, data: {} };
}

function serverContext() {
  return {
    apiUrl: 'http://localhost:3000/',
    publicUrl: 'http://localhost:4200/',
    mintOidcToken: async () => 'oidc-token',
  };
}

const CALLBACK = 'https://cloud.activepieces.com/redirect';

const EXPECTED_SEGMENTS = [
  'prod',
  'prod0',
  'prod2',
  'prod3',
  'prod4',
  'prod5',
  'prod6',
  'prod8',
  'prod11',
  'prod12',
  'prod15',
  'prod16',
  'prod17',
  'prod18',
  'prod19',
  'prod21',
  'prod25',
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('environment URLs', () => {
  it('offers production with no segment, the /prod alternate, and the 16 numbered environments', () => {
    const values = sprinklrEnvironments.OPTIONS.map((option) => option.value);
    expect(values).toEqual([
      'https://api3.sprinklr.com',
      ...EXPECTED_SEGMENTS.map((segment) => `https://api3.sprinklr.com/${segment}`),
    ]);
    expect(new Set(values).size).toBe(values.length);
    expect(sprinklrEnvironments.OPTIONS[0].label).toBe('Production (app.sprinklr.com)');
    expect(sprinklrEnvironments.OPTIONS[1].label).toBe('Production (alternate URL with /prod)');
  });

  it('wires the dropdown to the same option list', () => {
    const base = sprinklrAuth.props?.['base'];
    expect(base?.type).toBe('STATIC_DROPDOWN');
    expect(base?.required).toBe(true);
    expect(base && 'options' in base ? base.options.options : []).toEqual(sprinklrEnvironments.OPTIONS);
  });

  it.each(sprinklrEnvironments.OPTIONS)('builds the authorize, token and API URLs for $label', ({ value }) => {
    const props = { base: value, callback: CALLBACK };
    expect(resolveTemplate({ template: sprinklrAuth.authUrl, props })).toBe(`${value}/oauth/authorize`);
    expect(resolveTemplate({ template: sprinklrAuth.tokenUrl, props })).toBe(`${value}/oauth/token?redirect_uri=${CALLBACK}`);
    expect(sprinklrEnvironments.apiBaseUrl(value)).toBe(`${value}/api/v3`);
    expect(sprinklrClient.customApiBaseUrl(authFor(value))).toBe(`${value}/api`);
    expect(resolveTemplate({ template: sprinklrAuth.authUrl, props })).not.toContain('//oauth');
  });

  it('puts no segment in the production URLs and one segment in the prod2 URLs', () => {
    const production = { base: 'https://api3.sprinklr.com', callback: CALLBACK };
    const prod2 = { base: 'https://api3.sprinklr.com/prod2', callback: CALLBACK };
    expect(resolveTemplate({ template: sprinklrAuth.authUrl, props: production })).toBe('https://api3.sprinklr.com/oauth/authorize');
    expect(resolveTemplate({ template: sprinklrAuth.tokenUrl, props: production })).toBe(
      'https://api3.sprinklr.com/oauth/token?redirect_uri=https://cloud.activepieces.com/redirect',
    );
    expect(sprinklrEnvironments.apiBaseUrl(production.base)).toBe('https://api3.sprinklr.com/api/v3');
    expect(resolveTemplate({ template: sprinklrAuth.authUrl, props: prod2 })).toBe('https://api3.sprinklr.com/prod2/oauth/authorize');
    expect(resolveTemplate({ template: sprinklrAuth.tokenUrl, props: prod2 })).toBe(
      'https://api3.sprinklr.com/prod2/oauth/token?redirect_uri=https://cloud.activepieces.com/redirect',
    );
    expect(sprinklrEnvironments.apiBaseUrl(prod2.base)).toBe('https://api3.sprinklr.com/prod2/api/v3');
  });

  it('drops a trailing slash from a base URL', () => {
    expect(sprinklrEnvironments.apiBaseUrl('https://api3.sprinklr.com/prod2/')).toBe('https://api3.sprinklr.com/prod2/api/v3');
  });
});

describe('OAuth2 settings', () => {
  it('uses no scopes, no prompt, no access_type, body client auth and no PKCE', () => {
    expect(sprinklrAuth.type).toBe('OAUTH2');
    expect(sprinklrAuth.scope).toEqual([]);
    expect(sprinklrAuth.prompt).toBe('omit');
    expect(sprinklrAuth.extra).toEqual({ access_type: '' });
    expect(sprinklrAuth.authorizationMethod).toBe(OAuth2AuthorizationMethod.BODY);
    expect(sprinklrAuth.pkce).toBe(false);
  });

  it('asks for a required Callback URL that defaults to the Cloud redirect URL', () => {
    const callback = sprinklrAuth.props?.['callback'];
    expect(callback?.type).toBe('SHORT_TEXT');
    expect(callback?.required).toBe(true);
    expect(callback?.defaultValue).toBe('https://cloud.activepieces.com/redirect');
  });

  it('tells the user the Client ID is the API key and shows the redirect URL placeholder', () => {
    expect(sprinklrAuth.description).toContain('Paste the API key into **Client ID**');
    expect(sprinklrAuth.description).toContain('{{redirectUrl}}');
    expect(sprinklrAuth.description).toContain('One connection per API key');
  });
});

describe('validate', () => {
  it('accepts a connection whose /me call succeeds and sends both headers', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({
      status: 200,
      body: { data: [{ id: 1, name: 'Jane Doe', email: 'jane@example.com' }], errors: [] },
    });
    const result = await sprinklrAuth.validate?.({ auth: authFor('https://api3.sprinklr.com/prod2'), server: serverContext() });
    expect(result).toEqual({ valid: true });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://api3.sprinklr.com/prod2/api/v3/me');
    expect(request.headers).toMatchObject({ Authorization: 'Bearer token-1', Key: 'key-1' });
  });

  it.each([401, 404, 421])('tells the user to check the Environment on a %s', async (status) => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(
      new HttpError(undefined, { status, responseBody: { data: null, errors: [{ id: 'x', code: status, message: 'unauthorized' }] } }),
    );
    const result = await sprinklrAuth.validate?.({ auth: authFor('https://api3.sprinklr.com'), server: serverContext() });
    expect(result?.valid).toBe(false);
    expect(result && !result.valid ? result.error : '').toMatch(/Check the Environment/);
    expect(result && !result.valid ? result.error : '').toContain(`(${status})`);
  });

  it('reports other failures with the mapped message', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(
      new HttpError(undefined, { status: 400, responseBody: { errors: [{ id: 'x', code: 400, message: 'bad.header' }] } }),
    );
    const result = await sprinklrAuth.validate?.({ auth: authFor('https://api3.sprinklr.com'), server: serverContext() });
    expect(result).toEqual({ valid: false, error: expect.stringContaining('bad.header') });
  });
});

describe('getConnectionIdentifier', () => {
  it('returns the email of the /me user', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({
      status: 200,
      body: { data: [{ id: 1, name: 'Jane Doe', email: 'jane@example.com' }], errors: [] },
    });
    const identifier = await sprinklrAuth.getConnectionIdentifier?.({ auth: authFor('https://api3.sprinklr.com'), server: serverContext() });
    expect(identifier).toBe('jane@example.com');
  });

  it('falls back to the name when there is no email, and to undefined on failure', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, body: { id: 1, name: 'Jane Doe' } })
      .mockRejectedValueOnce(new HttpError(undefined, { status: 401, responseBody: {} }));
    const auth = authFor('https://api3.sprinklr.com');
    expect(await sprinklrAuth.getConnectionIdentifier?.({ auth, server: serverContext() })).toBe('Jane Doe');
    expect(await sprinklrAuth.getConnectionIdentifier?.({ auth, server: serverContext() })).toBeUndefined();
  });
});
