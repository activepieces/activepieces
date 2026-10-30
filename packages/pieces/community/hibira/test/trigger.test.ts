/// <reference types="vitest/globals" />

import { createHmac } from 'crypto';
import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

import '../src/index';
import { newWebhookEvent } from '../src/lib/triggers/new-webhook-event';
import { triggerEvent } from '../src/lib/actions/trigger-event';
import { publishToInterests } from '../src/lib/actions/publish-to-interests';

const props = { appId: '42', key: 'app-key', secret: 'app-secret', pushInstanceId: 'inst', pushSecretKey: 'push-secret', baseUrl: 'https://ws.hibira.io/' };
const auth = { type: 'CUSTOM_AUTH', props };

function webhookContext(rawBody: string, headers: Record<string, string>, propsValue: Record<string, unknown>) {
  return {
    ...createMockActionContext({ propsValue }),
    auth,
    webhookUrl: 'https://cloud.activepieces.com/api/v1/webhooks/abc',
    payload: { body: JSON.parse(rawBody), rawBody: Buffer.from(rawBody), headers, queryParams: {} },
  } as never;
}

const body = JSON.stringify({
  time_ms: 1761811200000,
  events: [
    { name: 'member_added', channel: 'presence-lobby', user_id: 'u1' },
    { name: 'channel_occupied', channel: 'orders' },
    { name: 'member_added', channel: 'private-x', user_id: 'u2' },
  ],
});
const sign = (secret: string) => createHmac('sha256', secret).update(body).digest('hex');

describe('Hibira piece', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({ status: 200, body: {} });
  });

  test('registers and removes its webhook on the app with signed requests', async () => {
    const ctx = webhookContext(body, {}, { events: ['member_added'] });
    await newWebhookEvent.onEnable(ctx);
    const req = sendRequest.mock.calls[0][0];
    expect(req.method).toBe('POST');
    expect(req.url).toBe('https://ws.hibira.io/apps/42/webhooks');
    expect(JSON.parse(req.body)).toEqual({ url: 'https://cloud.activepieces.com/api/v1/webhooks/abc', events: ['member_added'] });
    expect(req.queryParams.auth_key).toBe('app-key');
    expect(req.queryParams.body_md5).toHaveLength(32);

    await newWebhookEvent.onDisable(ctx);
    const del = sendRequest.mock.calls[1][0];
    expect(del.method).toBe('DELETE');
    expect(del.queryParams.url).toBe('https://cloud.activepieces.com/api/v1/webhooks/abc');
  });

  test('ignores a 404 when the webhook was already removed', async () => {
    sendRequest.mockRejectedValue({ response: { status: 404 } });
    await expect(newWebhookEvent.onDisable(webhookContext(body, {}, { events: ['member_added'] }))).resolves.toBeUndefined();
  });

  test('returns the chosen events of verified webhooks, one item each', async () => {
    const headers = { 'X-Pusher-Key': 'app-key', 'X-Pusher-Signature': sign('app-secret') };
    const items = await newWebhookEvent.run(webhookContext(body, headers, { events: ['member_added'], channelPrefix: 'presence-' }));
    expect(items).toEqual([{ name: 'member_added', channel: 'presence-lobby', user_id: 'u1', time_ms: 1761811200000 }]);
  });

  test('accepts the previous secret during a rotation and drops unsigned calls', async () => {
    const rotated = { 'x-pusher-key': 'app-key', 'x-pusher-signature': sign('new-secret'), 'x-hibira-previous-signature': sign('app-secret') };
    expect(await newWebhookEvent.run(webhookContext(body, rotated, { events: ['channel_occupied'] }))).toHaveLength(1);
    const forged = { 'x-pusher-key': 'app-key', 'x-pusher-signature': sign('wrong') };
    expect(await newWebhookEvent.run(webhookContext(body, forged, { events: ['channel_occupied'] }))).toEqual([]);
    const otherApp = { 'x-pusher-key': 'other', 'x-pusher-signature': sign('app-secret') };
    expect(await newWebhookEvent.run(webhookContext(body, otherApp, { events: ['channel_occupied'] }))).toEqual([]);
  });

  test('sends an event to several channels with JSON data', async () => {
    sendRequest.mockResolvedValue({ status: 200, body: { channels: {} } });
    const result = await triggerEvent.run({
      ...createMockActionContext({ propsValue: { channels: 'a, b', eventName: 'update', data: { n: 1 } } }),
      auth,
    } as never);
    const req = sendRequest.mock.calls[0][0];
    expect(JSON.parse(req.body)).toEqual({ name: 'update', channels: ['a', 'b'], data: '{"n":1}' });
    expect(result).toEqual({ channels: ['a', 'b'], channel_info: {} });
  });

  test('sends push notifications with the push secret key', async () => {
    await publishToInterests.run({
      ...createMockActionContext({ propsValue: { interests: 'news', title: 'Hi', body: 'There', platforms: ['web'], deepLink: 'https://example.com' } }),
      auth,
    } as never);
    const req = sendRequest.mock.calls[0][0];
    expect(req.url).toBe('https://ws.hibira.io/publish_api/v1/instances/inst/publishes/interests');
    expect(req.headers.Authorization).toBe('Bearer push-secret');
    expect(JSON.parse(req.body)).toEqual({ web: { notification: { title: 'Hi', body: 'There', deep_link: 'https://example.com' } }, interests: ['news'] });
  });
});
