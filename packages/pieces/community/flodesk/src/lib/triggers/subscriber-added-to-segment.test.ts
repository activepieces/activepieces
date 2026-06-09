/// <reference types="vitest/globals" />
import { httpClient } from '@activepieces/pieces-common';
import { subscriberAddedToSegmentTrigger } from './subscriber-added-to-segment';
import { vi, describe, it, expect, afterEach } from 'vitest';

describe('subscriberAddedToSegmentTrigger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should register webhook on enable', async () => {
    const sendRequestSpy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      body: {
        id: 'webhook_seg123',
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

    await subscriberAddedToSegmentTrigger.onEnable(context);

    expect(sendRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://api.flodesk.com/v1/webhooks',
        body: {
          name: 'Activepieces - Subscriber Added to Segment',
          post_url: 'https://example.com/webhook',
          events: ['subscriber.added_to_segment'],
        },
      })
    );

    expect(storePutSpy).toHaveBeenCalledWith('subscriber_added_to_segment_webhook', 'webhook_seg123');
  });

  it('should delete webhook and clear store on disable', async () => {
    const sendRequestSpy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      body: {},
    } as any);

    const storeGetSpy = vi.fn().mockResolvedValue('webhook_seg123');
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

    await subscriberAddedToSegmentTrigger.onDisable(context);

    expect(storeGetSpy).toHaveBeenCalledWith('subscriber_added_to_segment_webhook');
    expect(sendRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: 'https://api.flodesk.com/v1/webhooks/webhook_seg123',
      })
    );
    expect(storeDeleteSpy).toHaveBeenCalledWith('subscriber_added_to_segment_webhook');
  });

  it('should return payload in run if no segment filter is configured', async () => {
    const payloadBody = {
      event: 'subscriber.added_to_segment',
      data: {
        subscriber: { id: 'sub_123' },
        segment: { id: 'seg_123', name: 'Newsletter' },
      },
    };

    const context = {
      propsValue: {
        segment_id: undefined,
      },
      payload: {
        body: payloadBody,
      },
    } as any;

    const result = await subscriberAddedToSegmentTrigger.run(context);

    expect(result).toEqual([payloadBody]);
  });

  it('should return payload in run if segment filter matches', async () => {
    const payloadBody = {
      event: 'subscriber.added_to_segment',
      data: {
        subscriber: { id: 'sub_123' },
        segment: { id: 'seg_123', name: 'Newsletter' },
      },
    };

    const context = {
      propsValue: {
        segment_id: 'seg_123',
      },
      payload: {
        body: payloadBody,
      },
    } as any;

    const result = await subscriberAddedToSegmentTrigger.run(context);

    expect(result).toEqual([payloadBody]);
  });

  it('should return empty list in run if segment filter does not match', async () => {
    const payloadBody = {
      event: 'subscriber.added_to_segment',
      data: {
        subscriber: { id: 'sub_123' },
        segment: { id: 'seg_different', name: 'Other' },
      },
    };

    const context = {
      propsValue: {
        segment_id: 'seg_123',
      },
      payload: {
        body: payloadBody,
      },
    } as any;

    const result = await subscriberAddedToSegmentTrigger.run(context);

    expect(result).toEqual([]);
  });
});
