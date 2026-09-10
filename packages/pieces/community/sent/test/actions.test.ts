import { describe, expect, it, vi } from 'vitest';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { sent } from '../src';
import { sentAuth } from '../src/lib/auth';
import { getAccount } from '../src/lib/actions/get-account';
import { sendMessage } from '../src/lib/actions/send-message';
import { getMessageStatus } from '../src/lib/actions/get-message-status';
import { getMessageActivities } from '../src/lib/actions/get-message-activities';
import { getContact } from '../src/lib/actions/get-contact';
import { getPhoneNumberDetails } from '../src/lib/actions/get-phone-number-details';
import { listContacts } from '../src/lib/actions/list-contacts';
import { customApiCall } from '../src/lib/actions/custom-api-call';
import { sentApi } from '../src/lib/common/api';
import { sentMessage } from '../src/lib/common/message';
import {
  actionContext,
  API_KEY,
  authServer,
  failure,
  respond,
} from './helpers';

describe('metadata and authentication', () => {
  it('registers exactly the requested eight actions and two triggers', () => {
    expect(Object.keys(sent.actions())).toEqual([
      'get_account',
      'send_message',
      'get_message_status',
      'get_message_activities',
      'list_contacts',
      'get_contact',
      'get_phone_number_details',
      'custom_api_call',
    ]);
    expect(Object.keys(sent.triggers())).toEqual([
      'new_event',
      'new_message_received',
    ]);
    expect(sent.auth).toBe(sentAuth);
    expect(sent.minimumSupportedRelease).toBe('0.90.2');
    expect(sent.authors).toEqual(['amari2000']);
    expect(sent.logoUrl).toBe(
      'https://cdn.activepieces.com/pieces/sent.png'
    );
  });
  it('validates through /me without rejecting unfamiliar key formats', async () => {
    const http = respond({
      data: { id: 'account', type: 'user', name: 'Example' },
    });
    expect(
      await sentAuth.validate?.({ auth: API_KEY, server: authServer })
    ).toEqual({ valid: true });
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.sent.dm/v3/me',
        method: HttpMethod.GET,
        headers: expect.objectContaining({ 'x-api-key': API_KEY }),
      })
    );
  });
  it.each([401, 403])(
    'reports authentication HTTP %s without exposing the key',
    async (status) => {
      vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
        failure({ status, message: `Rejected ${API_KEY}`, code: 'AUTH_004' })
      );
      const result = await sentAuth.validate?.({
        auth: API_KEY,
        server: authServer,
      });
      expect(result?.valid).toBe(false);
      expect(JSON.stringify(result)).toContain('AUTH_004');
      expect(JSON.stringify(result)).not.toContain(API_KEY);
    }
  );
  it('uses a safe connection label and tolerates identifier lookup failure', async () => {
    const http = respond({
      data: { email: 'test@example.com', name: 'Example' },
    });
    expect(
      await sentAuth.getConnectionIdentifier?.({
        auth: API_KEY,
        server: authServer,
      })
    ).toBe('test@example.com');
    http.mockRejectedValueOnce(new Error(API_KEY));
    expect(
      await sentAuth.getConnectionIdentifier?.({
        auth: API_KEY,
        server: authServer,
      })
    ).toBeUndefined();
  });
});

describe('Sent API transport and errors', () => {
  it('sends profile and idempotency headers once, without retries or redirects', async () => {
    const http = respond({
      data: { status: 'QUEUED', recipients: [{ message_id: 'message' }] },
      status: 202,
    });
    const result = await sendMessage.run(
      actionContext<typeof sendMessage.props>({
        profile_id: 'profile',
        to: ['+12025550123'],
        channel: ['sms', 'rcs'],
        message_type: 'text',
        content: { text: '  Hello\nworld  ', template_id: 'stale' },
        sandbox: true,
        idempotency_key: 'order_123',
      })
    );
    expect(result).toMatchObject({
      data: { status: 'QUEUED', recipients: [{ message_id: 'message' }] },
    });
    expect(http).toHaveBeenCalledTimes(1);
    expect(http).toHaveBeenCalledWith(
      expect.objectContaining({
        method: HttpMethod.POST,
        url: 'https://api.sent.dm/v3/messages',
        headers: {
          'x-api-key': API_KEY,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-profile-id': 'profile',
          'Idempotency-Key': 'order_123',
        },
        body: {
          to: ['+12025550123'],
          channel: ['sms', 'rcs'],
          text: '  Hello\nworld  ',
          sandbox: true,
        },
        retries: 0,
        followRedirects: false,
      })
    );
  });
  it('does not deduplicate intentional identical sends when no key is supplied', async () => {
    const http = respond({ data: {}, status: 202 });
    const ctx = actionContext<typeof sendMessage.props>({
      profile_id: undefined,
      to: ['+12025550123'],
      channel: undefined,
      message_type: 'template',
      content: {
        template_id: 'template',
        parameters: { name: 'Alex' },
        text: 'stale text',
      },
      sandbox: false,
      idempotency_key: undefined,
    });
    await sendMessage.run(ctx);
    await sendMessage.run(ctx);
    expect(http).toHaveBeenCalledTimes(2);
    for (const [request] of http.mock.calls) {
      expect(request.headers).not.toHaveProperty('Idempotency-Key');
      expect(request.headers).not.toHaveProperty('x-profile-id');
      expect(request.body).toEqual({
        to: ['+12025550123'],
        template: { id: 'template', parameters: { name: 'Alex' } },
        sandbox: false,
      });
    }
  });
  it.each([400, 401, 403, 404, 429, 500, 503])(
    'preserves code and request ID for HTTP %s',
    async (status) => {
      vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
        failure({ status, code: 'VALIDATION_001', message: `Error ${API_KEY}` })
      );
      await expect(
        sentApi.request({ apiKey: API_KEY, path: '/me' })
      ).rejects.toMatchObject({
        status,
        code: 'VALIDATION_001',
        requestId: 'req_test',
      });
      await expect(
        sentApi.request({ apiKey: API_KEY, path: '/me' })
      ).rejects.not.toThrow(API_KEY);
    }
  );
  it('rejects an error envelope even when HTTP is successful', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: {
        success: false,
        error: { code: 'BUSINESS_003', message: 'Insufficient balance' },
        meta: { request_id: 'req_envelope' },
      },
    });
    await expect(
      sentApi.request({ apiKey: API_KEY, path: '/me' })
    ).rejects.toMatchObject({
      code: 'BUSINESS_003',
      requestId: 'req_envelope',
    });
  });
  it('does not expose arbitrary network errors or retry mutations', async () => {
    const http = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValue(new Error(`Failed with ${API_KEY}`));
    await expect(
      sentApi.request({
        apiKey: API_KEY,
        path: '/messages',
        method: HttpMethod.POST,
      })
    ).rejects.toThrow('may have been accepted');
    expect(http).toHaveBeenCalledTimes(1);
  });
  it.each([302, 307])(
    'rejects redirects returned by the SDK (%s)',
    async (status) => {
      respond({ status, data: {} });
      await expect(
        sentApi.request({ apiKey: API_KEY, path: '/me' })
      ).rejects.toMatchObject({ status });
    }
  );
});

describe('GET actions', () => {
  it('gets the account with no inputs', async () => {
    const http = respond({ data: { type: 'organization' } });
    await getAccount.run(actionContext<typeof getAccount.props>({}));
    expect(http.mock.calls[0][0].url).toBe('https://api.sent.dm/v3/me');
  });
  it('encodes IDs and propagates the profile for status, activities, and contacts', async () => {
    const http = respond({ data: {} });
    await getMessageStatus.run(
      actionContext<typeof getMessageStatus.props>({
        message_id: 'message/id',
        profile_id: 'profile',
      })
    );
    await getMessageActivities.run(
      actionContext<typeof getMessageActivities.props>({
        message_id: 'message/id',
        profile_id: 'profile',
      })
    );
    await getContact.run(
      actionContext<typeof getContact.props>({
        contact_id: 'contact/id',
        profile_id: 'profile',
      })
    );
    expect(http.mock.calls.map(([r]) => r.url)).toEqual([
      'https://api.sent.dm/v3/messages/message%2Fid',
      'https://api.sent.dm/v3/messages/message%2Fid/activities',
      'https://api.sent.dm/v3/contacts/contact%2Fid',
    ]);
    expect(
      http.mock.calls.every(([r]) => r.headers?.['x-profile-id'] === 'profile')
    ).toBe(true);
  });
  it('preserves the plus sign in the phone lookup path', async () => {
    const http = respond({ data: {} });
    await getPhoneNumberDetails.run(
      actionContext<typeof getPhoneNumberDetails.props>({
        phone_number: '+12025550123',
        profile_id: 'profile',
      })
    );
    expect(http.mock.calls[0][0].url).toBe(
      'https://api.sent.dm/v3/numbers/lookup/%2B12025550123'
    );
  });
  it('returns one contacts page with pagination and sends the documented filters', async () => {
    const data = { contacts: [], pagination: { page: 2, has_more: true } };
    const http = respond({ data });
    const output = await listContacts.run(
      actionContext<typeof listContacts.props>({
        profile_id: 'profile',
        page: 2,
        page_size: 20,
        search: 'Alex',
        channel: 'sms',
        phone: '+12025550123',
      })
    );
    expect(output).toMatchObject({ data });
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0].queryParams).toEqual({
      page: '2',
      page_size: '20',
      search: 'Alex',
      channel: 'sms',
      phone: '+12025550123',
    });
  });
});

describe('payload validation', () => {
  it.each([
    { recipients: [], content: { text: 'Hello' } },
    { recipients: [''], content: { text: 'Hello' } },
    { recipients: ['+12025550123'], content: { text: '  ' } },
  ])('refuses invalid recipients or empty text', (input) => {
    expect(() =>
      sentMessage.build({ ...input, messageType: 'text' })
    ).toThrow();
  });
  it('refuses non-text template parameters', () => {
    expect(() =>
      sentMessage.build({
        recipients: ['+12025550123'],
        messageType: 'template',
        content: { template_id: 'template', parameters: { count: 4 } },
      })
    ).toThrow('text values');
  });
});

describe('standard custom API call', () => {
  function context(url: string) {
    return actionContext<typeof customApiCall.props>({
      url: { url },
      method: HttpMethod.GET,
      headers: {},
      queryParams: {},
      body_type: 'none',
      body: undefined,
      response_is_binary: false,
      failsafe: false,
      timeout: undefined,
      followRedirects: false,
    });
  }
  it('injects the connection key and accepts custom profile headers', async () => {
    const http = respond({ data: {} });
    const ctx = context('/contacts');
    ctx.propsValue.headers = { 'x-profile-id': 'profile' };
    await customApiCall.run(ctx);
    expect(http.mock.calls[0][0]).toMatchObject({
      url: 'https://api.sent.dm/v3/contacts',
      headers: { 'x-api-key': API_KEY, 'x-profile-id': 'profile' },
    });
  });
  it.each([
    'https://evil.example/v3/me',
    'https://api.sent.dm/v2/me',
    '/../v2/me',
    'https://user:pass@api.sent.dm/v3/me',
  ])('refuses unsafe URL %s before a request', async (url) => {
    const http = respond({ data: {} });
    await expect(customApiCall.run(context(url))).rejects.toThrow(
      'must stay within'
    );
    expect(http).not.toHaveBeenCalled();
  });
  it('refuses redirects and user-supplied auth headers', async () => {
    respond({ data: {} });
    const ctx = context('/me');
    ctx.propsValue.followRedirects = true;
    await expect(customApiCall.run(ctx)).rejects.toThrow(
      'Disable Follow redirects'
    );
    ctx.propsValue.followRedirects = false;
    ctx.propsValue.headers = { 'X-API-KEY': 'replacement' };
    await expect(customApiCall.run(ctx)).rejects.toThrow('Remove x-api-key');
  });
});
