import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleClient } from '../common/client';
import { watchSpecificChannelMessagesTrigger } from './watch-specific-channel-messages';

vi.mock('../common/client', () => ({ whatsscaleClient: vi.fn() }));

const mockClient = vi.mocked(whatsscaleClient);
const MOCK_AUTH = { secret_text: 'ws_test_key' } as any;
const MOCK_AUTH_STRING = 'ws_test_key';
const MOCK_WEBHOOK_URL = 'https://cloud.activepieces.com/api/v1/webhooks/abc123';
const MOCK_CHANNEL_ID = '120363401850139775@newsletter';

function makeContext(propsValue: Record<string, unknown>, webhookUrl = MOCK_WEBHOOK_URL) {
  return { auth: MOCK_AUTH, propsValue, webhookUrl, payload: { body: {} } } as any;
}

beforeEach(() => {
  mockClient.mockClear();
  mockClient.mockResolvedValue({ success: true } as any);
});

describe('watchSpecificChannelMessagesTrigger', () => {
  describe('onEnable', () => {
    it('calls /make/hooks/subscribe with trigger_type channel, filter_id including @newsletter, and platform activepieces', async () => {
      const ctx = makeContext({ session: 'my_session', channel: MOCK_CHANNEL_ID });
      await watchSpecificChannelMessagesTrigger.onEnable(ctx);
      expect(mockClient).toHaveBeenCalledWith(
        MOCK_AUTH_STRING,
        HttpMethod.POST,
        '/make/hooks/subscribe',
        {
          session: 'my_session',
          webhook_url: MOCK_WEBHOOK_URL,
          platform: 'activepieces',
          trigger_type: 'channel',
          filter_id: MOCK_CHANNEL_ID,
        }
      );
    });

    it('passes filter_id as-is without stripping @newsletter suffix', async () => {
      const ctx = makeContext({ session: 'my_session', channel: MOCK_CHANNEL_ID });
      await watchSpecificChannelMessagesTrigger.onEnable(ctx);
      const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
      expect(callBody['filter_id']).toBe(MOCK_CHANNEL_ID);
      expect(String(callBody['filter_id'])).toContain('@newsletter');
    });

    it('passes different channel IDs correctly', async () => {
      const otherChannel = '999999999999999999@newsletter';
      const ctx = makeContext({ session: 'my_session', channel: otherChannel });
      await watchSpecificChannelMessagesTrigger.onEnable(ctx);
      const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
      expect(callBody['filter_id']).toBe(otherChannel);
    });
  });

  describe('onDisable', () => {
    it('calls /make/hooks/unsubscribe with webhook_url only — no filter_id', async () => {
      const ctx = makeContext({ session: 'my_session', channel: MOCK_CHANNEL_ID });
      await watchSpecificChannelMessagesTrigger.onDisable(ctx);
      expect(mockClient).toHaveBeenCalledWith(
        MOCK_AUTH_STRING,
        HttpMethod.POST,
        '/make/hooks/unsubscribe',
        { webhook_url: MOCK_WEBHOOK_URL }
      );
    });

    it('onDisable body does NOT contain filter_id', async () => {
      const ctx = makeContext({ session: 'my_session', channel: MOCK_CHANNEL_ID });
      await watchSpecificChannelMessagesTrigger.onDisable(ctx);
      const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
      expect(callBody).not.toHaveProperty('filter_id');
    });
  });

  describe('run', () => {
    it('returns payload.body wrapped in an array', async () => {
      const body = { channel_id: MOCK_CHANNEL_ID, body: 'Specific channel post' };
      const ctx = makeContext({ session: 'my_session', channel: MOCK_CHANNEL_ID });
      ctx.payload = { body };
      const result = await watchSpecificChannelMessagesTrigger.run(ctx);
      expect(result).toEqual([body]);
    });
  });
});
