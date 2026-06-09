/// <reference types="vitest/globals" />
import { httpClient } from '@activepieces/pieces-common';
import { subscriberCreatedTrigger } from './subscriber-created';
import { vi, describe, it, expect } from 'vitest';

describe('subscriberCreatedTrigger', () => {
  it('should register webhook on enable', async () => {
    const sendRequestSpy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      body: {
        id: 'webhook_abc123',
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

    await subscriberCreatedTrigger.onEnable(context);

    expect(sendRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://api.flodesk.com/v1/webhooks',
        body: {
          url: 'https://example.com/webhook',
          events: ['subscriber.created'],
        },
      })
    );

    expect(storePutSpy).toHaveBeenCalledWith('subscriber_created_webhook', 'webhook_abc123');
  });

  it('should delete webhook on disable', async () => {
    const sendRequestSpy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      body: {},
    } as any);

    const storeGetSpy = vi.fn().mockResolvedValue('webhook_abc123');

    const context = {
      auth: {
        secret_text: 'test_api_key',
      },
      store: {
        put: vi.fn(),
        get: storeGetSpy,
        delete: vi.fn(),
      },
    } as any;

    await subscriberCreatedTrigger.onDisable(context);

    expect(storeGetSpy).toHaveBeenCalledWith('subscriber_created_webhook');
    expect(sendRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: 'https://api.flodesk.com/v1/webhooks/webhook_abc123',
      })
    );
  });

  it('should return payload body in run', async () => {
    const payloadBody = {
      id: 'sub_123',
      email: 'john@example.com',
      first_name: 'John',
    };

    const context = {
      payload: {
        body: payloadBody,
      },
    } as any;

    const result = await subscriberCreatedTrigger.run(context);

    expect(result).toEqual([payloadBody]);
  });
});
