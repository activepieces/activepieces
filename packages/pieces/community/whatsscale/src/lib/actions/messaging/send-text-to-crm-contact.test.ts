import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendTextToCrmContactAction } from './send-text-to-crm-contact';
import * as clientModule from '../../common/client';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));

const mockAuth = { secret_text: 'test-api-key' };
const mockUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendTextToCrmContactAction', () => {
  const baseProps = {
    session: 'test-session',
    crmContact: mockUuid,
    text: 'Hello CRM contact',
  };

  it('sends text using CRM body shape (contact_type + crm_contact_id, no chatId)', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { sent: true },
    } as any);

    await (sendTextToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: baseProps,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/sendText',
      {
        session: 'test-session',
        contact_type: 'crm_contact',
        crm_contact_id: mockUuid,
        text: 'Hello CRM contact',
        platform: 'activepieces',
      },
    );
  });

  it('passes auth API key in the request', async () => {
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: { sent: true },
    } as any);

    await (sendTextToCrmContactAction as any).run({
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

    await (sendTextToCrmContactAction as any).run({
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
    const mockResponse = { sent: true, messageId: 'crm-abc123' };
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: mockResponse,
    } as any);

    const result = await (sendTextToCrmContactAction as any).run({
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
      (sendTextToCrmContactAction as any).run({
        auth: mockAuth,
        propsValue: baseProps,
      }),
    ).rejects.toThrow('401 Unauthorized');
  });
});
