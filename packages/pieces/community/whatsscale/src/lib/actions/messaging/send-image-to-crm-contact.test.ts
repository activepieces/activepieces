import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendImageToCrmContactAction } from './send-image-to-crm-contact';
import * as clientModule from '../../common/client';
import * as prepareFileModule from '../../common/prepare-file';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));
vi.mock('../../common/prepare-file', () => ({
  prepareFile: vi.fn(),
}));

const mockAuth = { secret_text: 'test-api-key' };
const PREPARED_URL = 'https://proxy.whatsscale.com/files/prepared.jpg';
const IMAGE_URL = 'https://example.com/photo.jpg';
const CRM_CONTACT_ID = 'uuid-1234-5678-abcd';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendImageToCrmContactAction', () => {
  const baseProps = {
    session: 'test-session',
    crmContact: CRM_CONTACT_ID,
    imageUrl: IMAGE_URL,
    caption: undefined,
  };

  it('calls prepareFile first with the correct imageUrl', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageToCrmContactAction as any).run({ auth: mockAuth, propsValue: baseProps });

    expect(prepareFileModule.prepareFile).toHaveBeenCalledWith('test-api-key', IMAGE_URL);
  });

  it('calls POST /api/sendImage with correct CRM body shape', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageToCrmContactAction as any).run({ auth: mockAuth, propsValue: baseProps });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/sendImage',
      {
        session: 'test-session',
        contact_type: 'crm_contact',
        crm_contact_id: CRM_CONTACT_ID,
        file: PREPARED_URL,
        caption: '',
        platform: 'activepieces',
      },
    );
  });

  it('does not include chatId field in the body', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageToCrmContactAction as any).run({ auth: mockAuth, propsValue: baseProps });

    const callArgs = vi.mocked(clientModule.whatsscaleClient).mock.calls[0][3] as any;
    expect(callArgs).not.toHaveProperty('chatId');
  });

  it('returns response body', async () => {
    const mockResponse = { key: { id: 'abc123' }, messageTimestamp: 1234567890, status: 'sent' };
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: mockResponse } as any);

    const result = await (sendImageToCrmContactAction as any).run({ auth: mockAuth, propsValue: baseProps });

    expect(result).toEqual(mockResponse);
  });

  it('sends caption when provided', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { ...baseProps, caption: 'Your invoice' },
    });

    const callArgs = vi.mocked(clientModule.whatsscaleClient).mock.calls[0][3] as any;
    expect(callArgs.caption).toBe('Your invoice');
  });

  it('sends caption as empty string when caption is undefined', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageToCrmContactAction as any).run({ auth: mockAuth, propsValue: baseProps });

    const callArgs = vi.mocked(clientModule.whatsscaleClient).mock.calls[0][3] as any;
    expect(callArgs.caption).toBe('');
  });

  it('throws and never calls sendImage when prepareFile fails', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockRejectedValueOnce(
      new Error('prepareFile failed: invalid URL'),
    );

    await expect(
      (sendImageToCrmContactAction as any).run({ auth: mockAuth, propsValue: baseProps }),
    ).rejects.toThrow('prepareFile failed: invalid URL');

    expect(clientModule.whatsscaleClient).not.toHaveBeenCalled();
  });
});
