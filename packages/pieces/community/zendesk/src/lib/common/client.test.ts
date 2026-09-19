import { describe, expect, it, vi } from 'vitest';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { sendZendeskRequest } from './client';
import { ZendeskAuthValue } from '../auth';

describe('sendZendeskRequest helper', () => {
  it('dispatches request with Basic auth and subdomain for CustomAuth', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: { ok: true },
    });

    const customAuthVal: ZendeskAuthValue = {
      type: AppConnectionType.CUSTOM_AUTH,
      props: {
        email: 'user@example.com',
        token: 'token123',
        subdomain: 'myhelpdesk',
      },
    };

    const res = await sendZendeskRequest({
      auth: customAuthVal,
      urlPath: '/api/v2/tickets.json',
      method: HttpMethod.GET,
    });

    expect(res.body).toEqual({ ok: true });
    expect(spy).toHaveBeenCalledTimes(1);

    const callArg = spy.mock.calls[0][0];
    expect(callArg.url).toBe('https://myhelpdesk.zendesk.com/api/v2/tickets.json');
    expect(callArg.headers?.Authorization).toMatch(/^Basic /);
    expect(callArg.authentication).toEqual({
      type: 'BASIC',
      username: 'user@example.com/token',
      password: 'token123',
    });
  });

  it('dispatches request with Bearer auth and subdomain for OAuth2', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: { ok: true },
    });

    const oauth2Val: ZendeskAuthValue = {
      type: AppConnectionType.OAUTH2,
      access_token: 'oauth_token_abc',
      data: {},
      props: {
        subdomain: 'oauth-company',
      },
    };

    const res = await sendZendeskRequest({
      auth: oauth2Val,
      urlPath: '/api/v2/tickets.json',
      method: HttpMethod.GET,
    });

    expect(res.body).toEqual({ ok: true });
    expect(spy).toHaveBeenCalledTimes(1);

    const callArg = spy.mock.calls[0][0];
    expect(callArg.url).toBe('https://oauth-company.zendesk.com/api/v2/tickets.json');
    expect(callArg.headers?.Authorization).toBe('Bearer oauth_token_abc');
    expect(callArg.authentication).toEqual({
      type: 'BEARER_TOKEN',
      token: 'oauth_token_abc',
    });
  });
});
