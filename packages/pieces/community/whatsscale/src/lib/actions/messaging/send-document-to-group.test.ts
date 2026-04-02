import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendDocumentToGroupAction } from './send-document-to-group';
import { whatsscaleClient } from '../../common/client';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

vi.mock('../../common/client', () => ({ whatsscaleClient: vi.fn() }));
vi.mock('../../common/prepare-file', () => ({ prepareFile: vi.fn() }));
vi.mock('../../common/poll-job', () => ({ pollJob: vi.fn() }));

const mockAuth = { secret_text: 'test-api-key' };

describe('sendDocumentToGroupAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prepareFile as any).mockResolvedValue('https://proxy.whatsscale.com/files/doc.pdf');
    (whatsscaleClient as any).mockResolvedValue({ body: { jobId: 'job_abc123', status: 'QUEUED' } });
    (pollJob as any).mockResolvedValue({ id: 'true_120363000000000001@g.us_ABC', _data: {} });
  });

  it('calls prepareFile with the document URL', async () => {
    await (sendDocumentToGroupAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/doc.pdf', 'document');
  });

  it('calls POST /api/sendDocument with group chatId', async () => {
    await (sendDocumentToGroupAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: 'notes.pdf', caption: 'Meeting notes' , platform: 'activepieces' },
    });

    expect(whatsscaleClient).toHaveBeenCalledWith('test-api-key', expect.anything(), '/api/sendDocument', expect.objectContaining({
      session: 'test-session',
      chatId: '120363000000000001@g.us',
      file: 'https://proxy.whatsscale.com/files/doc.pdf',
      caption: 'Meeting notes',
      filename: 'notes.pdf',
    }));
  });

  it('omits filename field entirely when filename is undefined', async () => {
    await (sendDocumentToGroupAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg).not.toHaveProperty('filename');
  });

  it('omits filename field when filename is empty string', async () => {
    await (sendDocumentToGroupAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: '', caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg).not.toHaveProperty('filename');
  });

  it('includes filename when provided', async () => {
    await (sendDocumentToGroupAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: 'agenda.pdf', caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg).toHaveProperty('filename', 'agenda.pdf');
  });

  it('calls pollJob with the jobId from send response', async () => {
    await (sendDocumentToGroupAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    expect(pollJob).toHaveBeenCalledWith('test-api-key', 'job_abc123');
  });

  it('returns the result from pollJob', async () => {
    const result = { id: 'true_120363000000000001@g.us_ABC', _data: {} };
    (pollJob as any).mockResolvedValue(result);

    const response = await (sendDocumentToGroupAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    expect(response).toEqual(result);
  });

  it('sends empty string caption when caption is undefined', async () => {
    await (sendDocumentToGroupAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    expect(whatsscaleClient).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(),
      expect.objectContaining({ caption: '' }));
  });

  it('uses chatId for group', async () => {
    await (sendDocumentToGroupAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg).toHaveProperty('chatId', '120363000000000001@g.us');
    expect(callArg).not.toHaveProperty('crm_contact_id');
  });

  it('uses apiKey from context.auth.secret_text', async () => {
    await (sendDocumentToGroupAction as any).run({
      auth: { secret_text: 'my-secret-key' },
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    });

    expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.anything(), 'document');
  });

  it('propagates error when pollJob throws', async () => {
    (pollJob as any).mockRejectedValue(new Error('Job failed'));

    await expect((sendDocumentToGroupAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', group: '120363000000000001@g.us', documentUrl: 'https://example.com/doc.pdf', filename: undefined, caption: undefined , platform: 'activepieces' },
    })).rejects.toThrow('Job failed');
  });
});
