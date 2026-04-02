import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChannelInfoAction } from './get-channel-info';
import { whatsscaleClient } from '../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));

const mockClient = vi.mocked(whatsscaleClient);

const MOCK_AUTH = { secret_text: 'ws_test_key' } as any;
const MOCK_AUTH_STRING = 'ws_test_key';

const MOCK_CHANNEL_BODY = {
  channel_id: 'abc',
  name: 'My Channel',
  description: '',
  subscriber_count: 1000,
  verified: true,
  role: 'admin',
  invite_link: '',
  picture: '',
};

function makeContext(propsValue: Record<string, unknown>) {
  return {
    auth: MOCK_AUTH,
    propsValue,
  } as any;
}

describe('getChannelInfoAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns channel info on success', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CHANNEL_BODY, status: 200 } as any);

    const result = await getChannelInfoAction.run(makeContext({
      session: 'user_abc123',
      channel_id: 'abc',
    }));

    expect(result).toEqual(MOCK_CHANNEL_BODY);
    expect(result.name).toBe('My Channel');
    expect(result.subscriber_count).toBe(1000);
    expect(result.verified).toBe(true);
  });

  it('calls correct endpoint with session as queryParam (not encoded)', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CHANNEL_BODY, status: 200 } as any);

    await getChannelInfoAction.run(makeContext({
      session: 'user_abc123',
      channel_id: 'abc123',
    }));

    expect(mockClient).toHaveBeenCalledWith(
      MOCK_AUTH_STRING,
      HttpMethod.GET,
      '/make/channels/abc123/info',
      undefined,
      { session: 'user_abc123' }
    );
  });

  it('trims whitespace from channel_id', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CHANNEL_BODY, status: 200 } as any);

    await getChannelInfoAction.run(makeContext({
      session: 'user_abc123',
      channel_id: '  abc123  ',
    }));

    const urlArg = mockClient.mock.calls[0][2] as string;
    expect(urlArg).toContain('abc123');
    expect(urlArg).not.toContain(' ');
  });

  it('encodes special chars in channel_id (e.g. @newsletter)', async () => {
    mockClient.mockResolvedValueOnce({ body: MOCK_CHANNEL_BODY, status: 200 } as any);

    await getChannelInfoAction.run(makeContext({
      session: 'user_abc123',
      channel_id: 'abc@newsletter',
    }));

    const urlArg = mockClient.mock.calls[0][2] as string;
    expect(urlArg).toContain(encodeURIComponent('abc@newsletter'));
  });

  it('throws on proxy error', async () => {
    mockClient.mockRejectedValueOnce(new Error('Channel not found'));

    await expect(
      getChannelInfoAction.run(makeContext({
        session: 'user_abc123',
        channel_id: 'nonexistent',
      }))
    ).rejects.toThrow('Channel not found');
  });
});
