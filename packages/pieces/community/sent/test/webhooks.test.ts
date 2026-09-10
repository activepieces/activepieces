import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { StoreScope, TriggerStrategy } from '@activepieces/pieces-framework';
import { newEvent as eventDefinition } from '../src/lib/triggers/new-event';
import { newMessageReceived as receivedDefinition } from '../src/lib/triggers/new-message-received';
import { sentSecurity } from '../src/lib/common/security';
import { STORE_KEY, WebhookState } from '../src/lib/common/webhooks';
import {
  API_KEY,
  SIGNING_SECRET,
  failure,
  respond,
  triggerContext,
} from './helpers';

const newEvent = (() => {
  if (eventDefinition.type !== TriggerStrategy.WEBHOOK)
    throw new Error('Expected webhook trigger');
  return eventDefinition;
})();
const newMessageReceived = (() => {
  if (receivedDefinition.type !== TriggerStrategy.WEBHOOK)
    throw new Error('Expected webhook trigger');
  return receivedDefinition;
})();

function webhookData() {
  return {
    id: 'webhook-test',
    signing_secret: SIGNING_SECRET,
    is_active: true,
    endpoint_url: 'https://activepieces.example/api/v1/webhooks/test-flow',
    event_types: ['message'],
    event_filters: { message: ['received'] },
  };
}

function signedPayload({
  body,
  now = Date.now(),
}: {
  body: unknown;
  now?: number;
}) {
  const rawBody = JSON.stringify(body);
  const timestamp = String(Math.floor(now / 1000));
  const digest = createHmac(
    'sha256',
    Buffer.from(SIGNING_SECRET.slice(6), 'base64')
  )
    .update(`webhook-test.${timestamp}.${rawBody}`)
    .digest('base64');
  return {
    rawBody,
    body,
    queryParams: {},
    headers: {
      'X-Webhook-ID': 'webhook-test',
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Signature': `v1,${digest}`,
      'X-Webhook-Event-Type': 'message.received',
    },
  };
}

describe('webhook registration and cleanup', () => {
  it('New Event creates and stores exactly the requested filters and callback', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newEvent.props>({
      profile_id: 'profile',
      events: ['message.delivered', 'templates'],
    });
    await newEvent.onEnable(ctx);
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.POST,
      url: 'https://api.sent.dm/v3/webhooks',
      headers: { 'x-api-key': API_KEY, 'x-profile-id': 'profile' },
      body: {
        endpoint_url: ctx.webhookUrl,
        event_types: ['message', 'templates'],
        event_filters: { message: ['delivered'] },
        retry_count: 3,
        timeout_seconds: 30,
      },
    });
    const state = await ctx.store.get<WebhookState>(STORE_KEY, StoreScope.FLOW);
    expect(state).toMatchObject({
      kind: 'active',
      id: 'webhook-test',
      profileId: 'profile',
    });
    expect(JSON.stringify(state)).not.toContain(SIGNING_SECRET);
    expect(JSON.stringify(state)).not.toContain(API_KEY);
  });
  it('New Message Received subscribes server-side only to message/received', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    await newMessageReceived.onEnable(ctx);
    expect(http.mock.calls[0][0].body).toMatchObject({
      event_types: ['message'],
      event_filters: { message: ['received'] },
    });
  });
  it('repeated enable reuses the existing subscription', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    await newMessageReceived.onEnable(ctx);
    await newMessageReceived.onEnable(ctx);
    expect(http.mock.calls.map(([r]) => r.method)).toEqual([
      HttpMethod.POST,
      HttpMethod.GET,
    ]);
  });
  it('retries an uncertain create with the persisted idempotency key', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    http.mockRejectedValueOnce(new Error('timeout'));
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    await expect(newMessageReceived.onEnable(ctx)).rejects.toThrow(
      'Could not reach Sent'
    );
    expect(await ctx.store.get(STORE_KEY, StoreScope.FLOW)).toMatchObject({
      kind: 'pending',
    });
    await newMessageReceived.onEnable(ctx);
    expect(http.mock.calls[0][0].headers?.['Idempotency-Key']).toBe(
      http.mock.calls[1][0].headers?.['Idempotency-Key']
    );
    expect(http.mock.calls[0][0].body).toEqual(http.mock.calls[1][0].body);
  });
  it('deletes using the stored profile even if the current property changed', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: 'original-profile',
    });
    await newMessageReceived.onEnable(ctx);
    ctx.propsValue.profile_id = 'different-profile';
    http.mockResolvedValueOnce({ status: 204, headers: {}, body: undefined });
    await newMessageReceived.onDisable(ctx);
    expect(http.mock.calls[1][0]).toMatchObject({
      method: HttpMethod.DELETE,
      url: 'https://api.sent.dm/v3/webhooks/webhook-test',
      headers: { 'x-profile-id': 'original-profile' },
    });
    expect(await ctx.store.get(STORE_KEY, StoreScope.FLOW)).toBeNull();
  });
  it('handles an already-deleted webhook and repeated disable', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    await newMessageReceived.onEnable(ctx);
    http.mockRejectedValueOnce(failure({ status: 404 }));
    await newMessageReceived.onDisable(ctx);
    await newMessageReceived.onDisable(ctx);
    expect(http).toHaveBeenCalledTimes(2);
    expect(await ctx.store.get(STORE_KEY, StoreScope.FLOW)).toBeNull();
  });
  it('does not create a replacement when checking the existing webhook is denied', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    await newMessageReceived.onEnable(ctx);
    http.mockRejectedValueOnce(failure({ status: 403 }));
    await expect(newMessageReceived.onEnable(ctx)).rejects.toThrow('HTTP 403');
    expect(http.mock.calls.map(([request]) => request.method)).toEqual([
      HttpMethod.POST,
      HttpMethod.GET,
    ]);
    expect(await ctx.store.get(STORE_KEY, StoreScope.FLOW)).toMatchObject({
      kind: 'active',
      id: 'webhook-test',
    });
  });
  it('rejects an HTTP callback before writing state or calling Sent', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    ctx.webhookUrl = 'http://activepieces.example/api/v1/webhooks/test-flow';
    await expect(newMessageReceived.onEnable(ctx)).rejects.toThrow('HTTPS');
    expect(http).not.toHaveBeenCalled();
    expect(await ctx.store.get(STORE_KEY, StoreScope.FLOW)).toBeNull();
  });
  it('retains the subscription ID when deletion fails so cleanup can be retried', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    await newMessageReceived.onEnable(ctx);
    http.mockRejectedValueOnce(failure({ status: 500 }));
    await expect(newMessageReceived.onDisable(ctx)).rejects.toThrow('HTTP 500');
    expect(await ctx.store.get(STORE_KEY, StoreScope.FLOW)).toMatchObject({
      id: 'webhook-test',
    });
  });
  it('compensates a failed secret-store write by deleting the created webhook', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    const originalPut = ctx.store.put.bind(ctx.store);
    const put = vi.spyOn(ctx.store, 'put');
    put
      .mockImplementationOnce(originalPut)
      .mockRejectedValueOnce(new Error('storage unavailable'));
    http
      .mockResolvedValueOnce({
        status: 201,
        headers: {},
        body: { success: true, data: webhookData() },
      })
      .mockResolvedValueOnce({ status: 204, headers: {}, body: undefined });
    await expect(newMessageReceived.onEnable(ctx)).rejects.toThrow(
      'external webhook was removed'
    );
    expect(http.mock.calls[1][0].method).toBe(HttpMethod.DELETE);
  });
  it('reconciles a lost creation response when the flow is disabled', async () => {
    const http = respond({ data: webhookData(), status: 201 });
    http.mockRejectedValueOnce(new Error('timeout'));
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    await expect(newMessageReceived.onEnable(ctx)).rejects.toThrow();
    const state = await ctx.store.get<WebhookState>(STORE_KEY, StoreScope.FLOW);
    if (!state) throw new Error('Missing pending state');
    http.mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: {
        success: true,
        data: {
          webhooks: [
            { ...webhookData(), display_name: state.request.display_name },
          ],
          pagination: { has_more: false },
        },
      },
    });
    http.mockResolvedValueOnce({ status: 204, headers: {}, body: undefined });
    await newMessageReceived.onDisable(ctx);
    expect(http.mock.calls.map(([r]) => r.method)).toEqual([
      HttpMethod.POST,
      HttpMethod.GET,
      HttpMethod.DELETE,
    ]);
    expect(await ctx.store.get(STORE_KEY, StoreScope.FLOW)).toBeNull();
  });
});

describe('verified trigger output', () => {
  it.each(['message.delivered', ''])(
    'rejects an event header that differs from the signed body: %s',
    async (eventHeader) => {
      respond({ data: webhookData(), status: 201 });
      const ctx = triggerContext<typeof newMessageReceived.props>({
        profile_id: undefined,
      });
      await newMessageReceived.onEnable(ctx);
      const signed = signedPayload({ body: newMessageReceived.sampleData });
      signed.headers['X-Webhook-Event-Type'] = eventHeader;
      ctx.payload = signed;
      await expect(newMessageReceived.run(ctx)).rejects.toThrow(
        'event header does not match'
      );
    }
  );
  it('returns the signed native envelope rather than trusting the parsed body', async () => {
    respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    await newMessageReceived.onEnable(ctx);
    const body = newMessageReceived.sampleData;
    const signed = signedPayload({ body });
    ctx.payload = { ...signed, body: { altered: true } };
    expect(await newMessageReceived.run(ctx)).toEqual([body]);
  });
  it('rejects forged or missing raw bodies and ignores unrelated signed events', async () => {
    respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newMessageReceived.props>({
      profile_id: undefined,
    });
    await newMessageReceived.onEnable(ctx);
    ctx.payload = signedPayload({ body: newMessageReceived.sampleData });
    ctx.payload.rawBody = undefined;
    await expect(newMessageReceived.run(ctx)).rejects.toThrow(
      'signature verification failed'
    );
    ctx.payload = signedPayload({
      body: {
        field: 'message',
        event: 'message.delivered',
        timestamp: '2026-01-15T10:30:00Z',
        payload: {},
      },
    });
    expect(await newMessageReceived.run(ctx)).toEqual([]);
  });
  it('matches native template envelopes that omit event', async () => {
    respond({ data: webhookData(), status: 201 });
    const ctx = triggerContext<typeof newEvent.props>({
      profile_id: undefined,
      events: ['templates'],
    });
    await newEvent.onEnable(ctx);
    const body = {
      field: 'templates',
      timestamp: '2026-01-15T10:30:00Z',
      payload: { status: 'APPROVED', template_id: 'fake-template' },
    };
    const signed = signedPayload({ body });
    signed.headers['X-Webhook-Event-Type'] = 'templates';
    ctx.payload = signed;
    expect(await newEvent.run(ctx)).toEqual([body]);
  });
});

describe('secret encryption', () => {
  it('uses fresh nonces, round-trips, and binds ciphertext to the API key and webhook ID', () => {
    const first = sentSecurity.encrypt({
      secret: SIGNING_SECRET,
      apiKey: API_KEY,
      webhookId: 'w1',
    });
    const second = sentSecurity.encrypt({
      secret: SIGNING_SECRET,
      apiKey: API_KEY,
      webhookId: 'w1',
    });
    expect(first.iv).not.toBe(second.iv);
    expect(
      sentSecurity.decrypt({
        encrypted: first,
        apiKey: API_KEY,
        webhookId: 'w1',
      })
    ).toBe(SIGNING_SECRET);
    expect(() =>
      sentSecurity.decrypt({
        encrypted: first,
        apiKey: 'wrong',
        webhookId: 'w1',
      })
    ).toThrow('cannot be unlocked');
    expect(() =>
      sentSecurity.decrypt({
        encrypted: first,
        apiKey: API_KEY,
        webhookId: 'w2',
      })
    ).toThrow('cannot be unlocked');
  });
});
