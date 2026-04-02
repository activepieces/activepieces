import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendDocumentToCrmContactAction } from './send-document-to-crm-contact';
import { whatsscaleClient } from '../../common/client';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

vi.mock('../../common/client', () => ({ whatsscaleClient: vi.fn() }));
vi.mock('../../common/prepare-file', () => ({ prepareFile: vi.fn() }));
vi.mock('../../common/poll-job', () => ({ pollJob: vi.fn() }));

const mockAuth = { secret_text: 'test-api-key' };
const crmContactId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('sendDocumentToCrmContactAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prepareFile as any).mockResolvedValue('https://proxy.whatsscale.com/files/doc.pdf');
    (whatsscaleClient as any).mockResolvedValue({ body: { jobId: 'job_abc123', status: 'QUEUED' } });
    (pollJob as any).mockResolvedValue({ id: 'true_31649931832@c.us_ABC', _data: {} });
  });

  it('calls prepareFile with the document URL', async () => {
    await (sendDocumentToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/doc.pdf', 'document');
  });

  it('calls POST /api/sendDocument with CRM body shape (no chatId)', async () => {
    await (sendDocumentToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: 'report.pdf', caption: 'Q3' , platform: 'activepieces' },
    });

    expect(whatsscaleClient).toHaveBeenCalledWith('test-api-key', expect.anything(), '/api/sendDocument', expect.objectContaining({
      session: 'test-session',
      contact_type: 'crm_contact',
      crm_contact_id: crmContactId,
      file: 'https://proxy.whatsscale.com/files/doc.pdf',
      caption: 'Q3',
      filename: 'report.pdf',
    }));
  });

  it('uses crm_contact_id body shape — no chatId field', async () => {
    await (sendDocumentToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg).toHaveProperty('crm_contact_id', crmContactId);
    expect(callArg).toHaveProperty('contact_type', 'crm_contact');
    expect(callArg).not.toHaveProperty('chatId');
  });

  it('omits filename field entirely when filename is undefined', async () => {
    await (sendDocumentToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg).not.toHaveProperty('filename');
  });

  it('omits filename field when filename is empty string', async () => {
    await (sendDocumentToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: '', caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg).not.toHaveProperty('filename');
  });

  it('includes filename when provided', async () => {
    await (sendDocumentToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: 'invoice.pdf', caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg).toHaveProperty('filename', 'invoice.pdf');
  });

  it('calls pollJob with the jobId from send response', async () => {
    await (sendDocumentToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    expect(pollJob).toHaveBeenCalledWith('test-api-key', 'job_abc123');
  });

  it('returns the result from pollJob', async () => {
    const result = { id: 'true_31649931832@c.us_ABC', _data: {} };
    (pollJob as any).mockResolvedValue(result);

    const response = await (sendDocumentToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    expect(response).toEqual(result);
  });

  it('sends empty string caption when caption is undefined', async () => {
    await (sendDocumentToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    expect(whatsscaleClient).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(),
      expect.objectContaining({ caption: '' }));
  });

  it('uses apiKey from context.auth.secret_text', async () => {
    await (sendDocumentToCrmContactAction as any).run({
      auth: { secret_text: 'my-secret-key' },
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.anything(), 'document');
    expect(pollJob).toHaveBeenCalledWith('my-secret-key', expect.anything());
  });

  it('propagates error when pollJob throws', async () => {
    (pollJob as any).mockRejectedValue(new Error('Job failed'));

    await expect((sendDocumentToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    })).rejects.toThrow('Job failed');
  });
});
