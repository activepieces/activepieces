import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendTextToChannelAction } from './send-text-to-channel';
import * as clientModule from '../../common/client';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));

const mockAuth = { secret_text: 'test-api-key' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendTextToChannelAction', () => {
  const baseProps = {
    session: 'test-session',
    channel: '120363318673245672@newsletter',
    text: 'Channel announcement',
  };

  it('sends text to channel using pre-formatted newsletter chatId', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { sent: true },
    } as any);

    await (sendTextToChannelAction as any).run({
      auth: mockAuth,
      propsValue: baseProps,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/sendText',
      {
        session: 'test-session',
        chatId: '120363318673245672@newsletter',
        text: 'Channel announcement',
        platform: 'activepieces',
      },
    );
  });

  it('passes auth API key in the request', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { sent: true },
    } as any);

    await (sendTextToChannelAction as any).run({
      auth: mockAuth,
      propsValue: baseProps,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      expect.any(String),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('calls POST /api/sendText', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { sent: true },
    } as any);

    await (sendTextToChannelAction as any).run({
      auth: mockAuth,
      propsValue: baseProps,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      expect.any(String),
      'POST',
      '/api/sendText',
      expect.any(Object),
    );
  });

  it('returns response body on success', async () => {
    const mockResponse = { sent: true, messageId: 'ch-abc123' };
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: mockResponse,
    } as any);

    const result = await (sendTextToChannelAction as any).run({
      auth: mockAuth,
      propsValue: baseProps,
    });

    expect(result).toEqual(mockResponse);
  });

  it('surfaces error when client throws', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockRejectedValueOnce(
      new Error('400 Bad Request'),
    );

    await expect(
      (sendTextToChannelAction as any).run({
        auth: mockAuth,
        propsValue: baseProps,
      }),
    ).rejects.toThrow('400 Bad Request');
  });
});
