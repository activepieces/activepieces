import { describe, expect, it } from 'vitest';
import { AppConnectionType } from '@activepieces/pieces-framework';
import {
  getZendeskAuthHeader,
  getZendeskHttpClientAuth,
  getZendeskSubdomain,
  zendeskAuth,
  ZendeskAuthValue,
} from './auth';

describe('zendeskAuth multi-auth configuration', () => {
  it('defines OAuth2 as first auth and CustomAuth as second', () => {
    expect(Array.isArray(zendeskAuth)).toBe(true);
    expect(zendeskAuth.length).toBe(2);

    const [oauth2, customAuth] = zendeskAuth;
    expect(oauth2.type).toBe('OAUTH2');
    expect(customAuth.type).toBe('CUSTOM_AUTH');
  });

  it('declares subdomain property and authorizaton/token endpoints on OAuth2', () => {
    const oauth2 = zendeskAuth[0];
    expect(oauth2.authUrl).toBe('https://{subdomain}.zendesk.com/oauth/authorizations/new');
    expect(oauth2.tokenUrl).toBe('https://{subdomain}.zendesk.com/oauth/tokens');
    expect(oauth2.scope).toEqual(['read', 'write']);
    expect(oauth2.props).toHaveProperty('subdomain');
  });

  it('correctly resolves subdomain for both OAuth2 and CustomAuth', () => {
    const customAuthVal: ZendeskAuthValue = {
      type: AppConnectionType.CUSTOM_AUTH,
      props: {
        email: 'agent@acme.com',
        token: 'secret123',
        subdomain: 'acme-help',
      },
    };

    const oauth2Val: ZendeskAuthValue = {
      type: AppConnectionType.OAUTH2,
      access_token: 'bearer_token_xyz',
      data: {},
      props: {
        subdomain: 'acme-oauth',
      },
    };

    expect(getZendeskSubdomain(customAuthVal)).toBe('acme-help');
    expect(getZendeskSubdomain(oauth2Val)).toBe('acme-oauth');
  });

  it('generates Basic auth header for CustomAuth and Bearer header for OAuth2', () => {
    const customAuthVal: ZendeskAuthValue = {
      type: AppConnectionType.CUSTOM_AUTH,
      props: {
        email: 'agent@acme.com',
        token: 'secret123',
        subdomain: 'acme-help',
      },
    };

    const oauth2Val: ZendeskAuthValue = {
      type: AppConnectionType.OAUTH2,
      access_token: 'bearer_token_xyz',
      data: {},
      props: {
        subdomain: 'acme-oauth',
      },
    };

    const expectedBasic = `Basic ${Buffer.from('agent@acme.com/token:secret123').toString('base64')}`;
    expect(getZendeskAuthHeader(customAuthVal)).toEqual({
      Authorization: expectedBasic,
    });

    expect(getZendeskAuthHeader(oauth2Val)).toEqual({
      Authorization: 'Bearer bearer_token_xyz',
    });
  });

  it('produces correct httpClient authentication configuration', () => {
    const customAuthVal: ZendeskAuthValue = {
      type: AppConnectionType.CUSTOM_AUTH,
      props: {
        email: 'agent@acme.com',
        token: 'secret123',
        subdomain: 'acme-help',
      },
    };

    const oauth2Val: ZendeskAuthValue = {
      type: AppConnectionType.OAUTH2,
      access_token: 'bearer_token_xyz',
      data: {},
      props: {
        subdomain: 'acme-oauth',
      },
    };

    expect(getZendeskHttpClientAuth(customAuthVal)).toEqual({
      type: 'BASIC',
      username: 'agent@acme.com/token',
      password: 'secret123',
    });

    expect(getZendeskHttpClientAuth(oauth2Val)).toEqual({
      type: 'BEARER_TOKEN',
      token: 'bearer_token_xyz',
    });
  });
});
