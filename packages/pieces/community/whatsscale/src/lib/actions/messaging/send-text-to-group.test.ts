import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendTextToGroupAction } from './send-text-to-group';
import * as clientModule from '../../common/client';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));

const mockAuth = { secret_text: 'test-api-key' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendTextToGroupAction', () => {
  const baseProps = {
    session: 'test-session',
    group: '120363318673245672@g.us',
    text: 'Hello group',
  };

  it('sends text to group using pre-formatted chatId from dropdown', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { sent: true },
    } as any);

    await (sendTextToGroupAction as any).run({
      auth: mockAuth,
      propsValue: baseProps,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/sendText',
      {
        session: 'test-session',
        chatId: '120363318673245672@g.us',
        text: 'Hello group',
        platform: 'activepieces',
      },
    );
  });

  it('passes auth API key in the request', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { sent: true },
    } as any);

    await (sendTextToGroupAction as any).run({
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

    await (sendTextToGroupAction as any).run({
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
    const mockResponse = { sent: true, messageId: 'grp-abc123' };
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: mockResponse,
    } as any);

    const result = await (sendTextToGroupAction as any).run({
      auth: mockAuth,
      propsValue: baseProps,
    });

    expect(result).toEqual(mockResponse);
  });

  it('surfaces error when client throws', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockRejectedValueOnce(
      new Error('429 Too Many Requests'),
    );

    await expect(
      (sendTextToGroupAction as any).run({
        auth: mockAuth,
        propsValue: baseProps,
      }),
    ).rejects.toThrow('429 Too Many Requests');
  });
});
