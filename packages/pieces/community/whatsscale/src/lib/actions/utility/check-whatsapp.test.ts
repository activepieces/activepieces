import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWhatsappAction } from './check-whatsapp';
import { whatsscaleClient } from '../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));

const mockClient = vi.mocked(whatsscaleClient);

const MOCK_AUTH = { secret_text: 'ws_test_key' } as any;
const MOCK_AUTH_STRING = 'ws_test_key';

function makeContext(propsValue: Record<string, unknown>) {
  return {
    auth: MOCK_AUTH,
    propsValue,
  } as any;
}

describe('checkWhatsappAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns exists=true for a valid WhatsApp number', async () => {
    const mockBody = {
      numberExists: true,
      phone: '+31612345678',
      phoneFormatted: '31612345678',
      chatId: '31612345678@c.us',
    };
    mockClient.mockResolvedValueOnce({ body: mockBody, status: 200 } as any);

    const result = await checkWhatsappAction.run(makeContext({
      session: 'sess1',
      phone: '+31612345678',
    }));

    expect(result.numberExists).toBe(true);
    expect(result.chatId).toBe('31612345678@c.us');
  });

  it('returns exists=false for a non-WhatsApp number', async () => {
    const mockBody = {
      numberExists: false,
      phone: '+99999999999',
      phoneFormatted: '99999999999',
      chatId: '99999999999@c.us',
    };
    mockClient.mockResolvedValueOnce({ body: mockBody, status: 200 } as any);

    const result = await checkWhatsappAction.run(makeContext({
      session: 'sess1',
      phone: '+99999999999',
    }));

    expect(result.numberExists).toBe(false);
  });

  it('calls /make/checkWhatsapp with POST (not /api/checkWhatsapp)', async () => {
    mockClient.mockResolvedValueOnce({
      body: { numberExists: true, phone: '+31612345678', phoneFormatted: '31612345678', chatId: '31612345678@c.us' },
      status: 200,
    } as any);

    await checkWhatsappAction.run(makeContext({
      session: 'sess1',
      phone: '+31612345678',
    }));

    expect(mockClient).toHaveBeenCalledWith(
      MOCK_AUTH_STRING,
      HttpMethod.POST,
      '/make/checkWhatsapp',
      { session: 'sess1', phone: '+31612345678' }
    );
  });

  it('passes phone exactly as entered — no normalization', async () => {
    mockClient.mockResolvedValueOnce({
      body: { numberExists: true, phone: '+1 (234) 567-8900', phoneFormatted: '12345678900', chatId: '12345678900@c.us' },
      status: 200,
    } as any);

    await checkWhatsappAction.run(makeContext({
      session: 'sess1',
      phone: '+1 (234) 567-8900',
    }));

    const bodyArg = mockClient.mock.calls[0][3] as any;
    expect(bodyArg.phone).toBe('+1 (234) 567-8900');
  });

  it('throws on proxy error', async () => {
    mockClient.mockRejectedValueOnce(new Error('Session not found'));

    await expect(
      checkWhatsappAction.run(makeContext({
        session: 'bad_session',
        phone: '+31612345678',
      }))
    ).rejects.toThrow('Session not found');
  });

  it('returns all 4 response fields', async () => {
    const mockBody = {
      numberExists: true,
      phone: '+31612345678',
      phoneFormatted: '31612345678',
      chatId: '31612345678@c.us',
    };
    mockClient.mockResolvedValueOnce({ body: mockBody, status: 200 } as any);

    const result = await checkWhatsappAction.run(makeContext({
      session: 'sess1',
      phone: '+31612345678',
    }));

    expect(result).toHaveProperty('numberExists');
    expect(result).toHaveProperty('phone');
    expect(result).toHaveProperty('phoneFormatted');
    expect(result).toHaveProperty('chatId');
  });

  it('chatId is present even when numberExists=false (may be synthetic)', async () => {
    const mockBody = {
      numberExists: false,
      phone: '+99999',
      phoneFormatted: '99999',
      chatId: '99999@c.us',
    };
    mockClient.mockResolvedValueOnce({ body: mockBody, status: 200 } as any);

    const result = await checkWhatsappAction.run(makeContext({
      session: 'sess1',
      phone: '+99999',
    }));

    expect(result.chatId).toBeDefined();
    expect(result.numberExists).toBe(false);
  });
});
