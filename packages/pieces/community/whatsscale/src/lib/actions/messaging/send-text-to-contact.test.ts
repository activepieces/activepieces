import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendTextToContactAction } from './send-text-to-contact';
import * as clientModule from '../../common/client';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));

const mockAuth = { secret_text: 'test-api-key' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendTextToContactAction', () => {
  const baseProps = {
    session: 'test-session',
    contact: '31649931832@c.us',
    text: 'Hello from tests',
  };

  it('sends text to contact using pre-formatted chatId from dropdown', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { sent: true },
    } as any);

    await (sendTextToContactAction as any).run({
      auth: mockAuth,
      propsValue: baseProps,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/sendText',
      {
        session: 'test-session',
        chatId: '31649931832@c.us',
        text: 'Hello from tests',
        platform: 'activepieces',
      },
    );
  });

  it('passes auth API key in the request', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { sent: true },
    } as any);

    await (sendTextToContactAction as any).run({
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

    await (sendTextToContactAction as any).run({
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
    const mockResponse = { sent: true, messageId: 'abc123' };
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: mockResponse,
    } as any);

    const result = await (sendTextToContactAction as any).run({
      auth: mockAuth,
      propsValue: baseProps,
    });

    expect(result).toEqual(mockResponse);
  });

  it('surfaces error when client throws', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockRejectedValueOnce(
      new Error('401 Unauthorized'),
    );

    await expect(
      (sendTextToContactAction as any).run({
        auth: mockAuth,
        propsValue: baseProps,
      }),
    ).rejects.toThrow('401 Unauthorized');
  });
});
