import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleClient } from '../common/client';
import { watchIncomingMessagesTrigger } from './watch-incoming-messages';

vi.mock('../common/client', () => ({ whatsscaleClient: vi.fn() }));

const mockClient = vi.mocked(whatsscaleClient);
const MOCK_AUTH = { secret_text: 'ws_test_key' } as any;
const MOCK_AUTH_STRING = 'ws_test_key';
const MOCK_WEBHOOK_URL = 'https://cloud.activepieces.com/api/v1/webhooks/abc123';

function makeContext(propsValue: Record<string, unknown>, webhookUrl = MOCK_WEBHOOK_URL) {
  return { auth: MOCK_AUTH, propsValue, webhookUrl, payload: { body: {} } } as any;
}

beforeEach(() => {
  mockClient.mockClear();
  mockClient.mockResolvedValue({ success: true } as any);
});

describe('watchIncomingMessagesTrigger', () => {
  describe('onEnable', () => {
    it('calls /make/hooks/subscribe with session, webhook_url, and platform', async () => {
      const ctx = makeContext({ session: 'my_session' });
      await watchIncomingMessagesTrigger.onEnable(ctx);
      expect(mockClient).toHaveBeenCalledWith(
        MOCK_AUTH_STRING,
        HttpMethod.POST,
        '/make/hooks/subscribe',
        { session: 'my_session', webhook_url: MOCK_WEBHOOK_URL, platform: 'activepieces' }
      );
    });

    it('does NOT include trigger_type in subscribe body', async () => {
      const ctx = makeContext({ session: 'my_session' });
      await watchIncomingMessagesTrigger.onEnable(ctx);
      const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
      expect(callBody).not.toHaveProperty('trigger_type');
    });

    it('platform is always activepieces', async () => {
      const ctx = makeContext({ session: 'other_session' });
      await watchIncomingMessagesTrigger.onEnable(ctx);
      const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
      expect(callBody['platform']).toBe('activepieces');
    });
  });

  describe('onDisable', () => {
    it('calls /make/hooks/unsubscribe with webhook_url only', async () => {
      const ctx = makeContext({ session: 'my_session' });
      await watchIncomingMessagesTrigger.onDisable(ctx);
      expect(mockClient).toHaveBeenCalledWith(
        MOCK_AUTH_STRING,
        HttpMethod.POST,
        '/make/hooks/unsubscribe',
        { webhook_url: MOCK_WEBHOOK_URL }
      );
    });
  });

  describe('run', () => {
    it('returns payload.body wrapped in an array', async () => {
      const body = { message_id: 'abc', from_number: '31612345678', body: 'Hi' };
      const ctx = makeContext({ session: 'my_session' });
      ctx.payload = { body };
      const result = await watchIncomingMessagesTrigger.run(ctx);
      expect(result).toEqual([body]);
    });
  });
});
