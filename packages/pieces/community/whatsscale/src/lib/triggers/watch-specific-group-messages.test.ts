import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleClient } from '../common/client';
import { watchSpecificGroupMessagesTrigger } from './watch-specific-group-messages';

vi.mock('../common/client', () => ({ whatsscaleClient: vi.fn() }));

const mockClient = vi.mocked(whatsscaleClient);
const MOCK_AUTH = { secret_text: 'ws_test_key' } as any;
const MOCK_AUTH_STRING = 'ws_test_key';
const MOCK_WEBHOOK_URL = 'https://cloud.activepieces.com/api/v1/webhooks/abc123';
const MOCK_GROUP_ID = '120363423663126276@g.us';

function makeContext(propsValue: Record<string, unknown>, webhookUrl = MOCK_WEBHOOK_URL) {
  return { auth: MOCK_AUTH, propsValue, webhookUrl, payload: { body: {} } } as any;
}

beforeEach(() => {
  mockClient.mockClear();
  mockClient.mockResolvedValue({ success: true } as any);
});

describe('watchSpecificGroupMessagesTrigger', () => {
  describe('onEnable', () => {
    it('calls /make/hooks/subscribe with trigger_type group, filter_id including @g.us, and platform activepieces', async () => {
      const ctx = makeContext({ session: 'my_session', group: MOCK_GROUP_ID });
      await watchSpecificGroupMessagesTrigger.onEnable(ctx);
      expect(mockClient).toHaveBeenCalledWith(
        MOCK_AUTH_STRING,
        HttpMethod.POST,
        '/make/hooks/subscribe',
        {
          session: 'my_session',
          webhook_url: MOCK_WEBHOOK_URL,
          platform: 'activepieces',
          trigger_type: 'group',
          filter_id: MOCK_GROUP_ID,
        }
      );
    });

    it('passes filter_id as-is without stripping @g.us suffix', async () => {
      const ctx = makeContext({ session: 'my_session', group: MOCK_GROUP_ID });
      await watchSpecificGroupMessagesTrigger.onEnable(ctx);
      const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
      expect(callBody['filter_id']).toBe(MOCK_GROUP_ID);
      expect(String(callBody['filter_id'])).toContain('@g.us');
    });

    it('passes different group IDs correctly', async () => {
      const otherGroup = '999999999999999999@g.us';
      const ctx = makeContext({ session: 'my_session', group: otherGroup });
      await watchSpecificGroupMessagesTrigger.onEnable(ctx);
      const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
      expect(callBody['filter_id']).toBe(otherGroup);
    });
  });

  describe('onDisable', () => {
    it('calls /make/hooks/unsubscribe with webhook_url only — no filter_id', async () => {
      const ctx = makeContext({ session: 'my_session', group: MOCK_GROUP_ID });
      await watchSpecificGroupMessagesTrigger.onDisable(ctx);
      expect(mockClient).toHaveBeenCalledWith(
        MOCK_AUTH_STRING,
        HttpMethod.POST,
        '/make/hooks/unsubscribe',
        { webhook_url: MOCK_WEBHOOK_URL }
      );
    });

    it('onDisable body does NOT contain filter_id', async () => {
      const ctx = makeContext({ session: 'my_session', group: MOCK_GROUP_ID });
      await watchSpecificGroupMessagesTrigger.onDisable(ctx);
      const callBody = mockClient.mock.calls[0][3] as Record<string, unknown>;
      expect(callBody).not.toHaveProperty('filter_id');
    });
  });

  describe('run', () => {
    it('returns payload.body wrapped in an array', async () => {
      const body = { group_id: MOCK_GROUP_ID, body: 'Specific group message' };
      const ctx = makeContext({ session: 'my_session', group: MOCK_GROUP_ID });
      ctx.payload = { body };
      const result = await watchSpecificGroupMessagesTrigger.run(ctx);
      expect(result).toEqual([body]);
    });
  });
});
