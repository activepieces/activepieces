import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendImageManualAction } from './send-image-manual';
import * as clientModule from '../../common/client';
import * as prepareFileModule from '../../common/prepare-file';
import { ChatType } from '../../common/types';

vi.mock('../../common/client', () => ({
  whatsscaleClient: vi.fn(),
}));
vi.mock('../../common/prepare-file', () => ({
  prepareFile: vi.fn(),
}));

const mockAuth = { secret_text: 'test-api-key' };
const PREPARED_URL = 'https://proxy.whatsscale.com/files/prepared.jpg';
const IMAGE_URL = 'https://example.com/photo.jpg';
const PHONE = '31649931832';
const GROUP_ID = '120363318673245672';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendImageManualAction', () => {
  it('calls prepareFile first with the correct imageUrl', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: ChatType.CONTACT, recipient: PHONE, imageUrl: IMAGE_URL },
    });

    expect(prepareFileModule.prepareFile).toHaveBeenCalledWith('test-api-key', IMAGE_URL);
  });

  it('builds chatId with @c.us suffix when chatType is CONTACT', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: ChatType.CONTACT, recipient: PHONE, imageUrl: IMAGE_URL },
    });

    const callArgs = vi.mocked(clientModule.whatsscaleClient).mock.calls[0][3] as any;
    expect(callArgs.chatId).toBe(`${PHONE}@c.us`);
  });

  it('builds chatId with @g.us suffix when chatType is GROUP', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: ChatType.GROUP, recipient: GROUP_ID, imageUrl: IMAGE_URL },
    });

    const callArgs = vi.mocked(clientModule.whatsscaleClient).mock.calls[0][3] as any;
    expect(callArgs.chatId).toBe(`${GROUP_ID}@g.us`);
  });

  it('calls POST /api/sendImage with correct full body', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: ChatType.CONTACT, recipient: PHONE, imageUrl: IMAGE_URL },
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/sendImage',
      { session: 'test-session', chatId: `${PHONE}@c.us`, file: PREPARED_URL, caption: '', platform: 'activepieces' },
    );
  });

  it('returns response body', async () => {
    const mockResponse = { key: { id: 'abc123' }, messageTimestamp: 1234567890, status: 'sent' };
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: mockResponse } as any);

    const result = await (sendImageManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: ChatType.CONTACT, recipient: PHONE, imageUrl: IMAGE_URL },
    });

    expect(result).toEqual(mockResponse);
  });

  it('sends caption when provided', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: ChatType.CONTACT, recipient: PHONE, imageUrl: IMAGE_URL, caption: 'Look at this!' , platform: 'activepieces' },
    });

    const callArgs = vi.mocked(clientModule.whatsscaleClient).mock.calls[0][3] as any;
    expect(callArgs.caption).toBe('Look at this!');
  });

  it('sends caption as empty string when caption is undefined', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockResolvedValueOnce(PREPARED_URL);
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({ body: { status: 'sent' } } as any);

    await (sendImageManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: ChatType.CONTACT, recipient: PHONE, imageUrl: IMAGE_URL },
    });

    const callArgs = vi.mocked(clientModule.whatsscaleClient).mock.calls[0][3] as any;
    expect(callArgs.caption).toBe('');
  });

  it('throws and never calls sendImage when prepareFile fails', async () => {
    vi.mocked(prepareFileModule.prepareFile).mockRejectedValueOnce(
      new Error('prepareFile failed: invalid URL'),
    );

    await expect(
      (sendImageManualAction as any).run({
        auth: mockAuth,
        propsValue: { session: 'test-session', chatType: ChatType.CONTACT, recipient: PHONE, imageUrl: 'bad-url' },
      }),
    ).rejects.toThrow('prepareFile failed: invalid URL');

    expect(clientModule.whatsscaleClient).not.toHaveBeenCalled();
  });
});
