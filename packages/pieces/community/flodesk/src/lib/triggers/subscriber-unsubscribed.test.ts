/// <reference types="vitest/globals" />
import { httpClient } from '@activepieces/pieces-common';
import { subscriberUnsubscribedTrigger } from './subscriber-unsubscribed';
import { vi, describe, it, expect, afterEach } from 'vitest';

describe('subscriberUnsubscribedTrigger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register webhook on enable', async () => {
    const sendRequestSpy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      body: {
        id: 'webhook_xyz789',
      },
    } as any);

    const storePutSpy = vi.fn().mockResolvedValue(undefined);

    const context = {
      auth: {
        secret_text: 'test_api_key',
      },
      webhookUrl: 'https://example.com/webhook',
      store: {
        put: storePutSpy,
        get: vi.fn(),
        delete: vi.fn(),
      },
    } as any;

    await subscriberUnsubscribedTrigger.onEnable(context);

    expect(sendRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://api.flodesk.com/v1/webhooks',
        body: {
          name: 'Activepieces - Subscriber Unsubscribed',
          post_url: 'https://example.com/webhook',
          events: ['subscriber.unsubscribed'],
        },
      })
    );

    expect(storePutSpy).toHaveBeenCalledWith('subscriber_unsubscribed_webhook', 'webhook_xyz789');
  });

  it('should delete webhook and clear store on disable', async () => {
    const sendRequestSpy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      body: {},
    } as any);

    const storeGetSpy = vi.fn().mockResolvedValue('webhook_xyz789');
    const storeDeleteSpy = vi.fn().mockResolvedValue(undefined);

    const context = {
      auth: {
        secret_text: 'test_api_key',
      },
      store: {
        put: vi.fn(),
        get: storeGetSpy,
        delete: storeDeleteSpy,
      },
    } as any;

    await subscriberUnsubscribedTrigger.onDisable(context);

    expect(storeGetSpy).toHaveBeenCalledWith('subscriber_unsubscribed_webhook');
    expect(sendRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: 'https://api.flodesk.com/v1/webhooks/webhook_xyz789',
      })
    );
    expect(storeDeleteSpy).toHaveBeenCalledWith('subscriber_unsubscribed_webhook');
  });

  it('should return payload body in run', async () => {
    const payloadBody = {
      id: 'sub_123',
      email: 'john@example.com',
      status: 'unsubscribed',
    };

    const context = {
      payload: {
        body: payloadBody,
      },
    } as any;

    const result = await subscriberUnsubscribedTrigger.run(context);

    expect(result).toEqual([payloadBody]);
  });
});
