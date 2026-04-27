import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendVideoToCrmContactAction } from './send-video-to-crm-contact';
import { whatsscaleClient } from '../../common/client';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

vi.mock('../../common/client', () => ({ whatsscaleClient: vi.fn() }));
vi.mock('../../common/prepare-file', () => ({ prepareFile: vi.fn() }));
vi.mock('../../common/poll-job', () => ({ pollJob: vi.fn() }));

const mockAuth = { secret_text: 'test-api-key' };
const crmContactId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

describe('sendVideoToCrmContactAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prepareFile as any).mockResolvedValue('https://proxy.whatsscale.com/files/video.mp4');
    (whatsscaleClient as any).mockResolvedValue({ body: { jobId: 'job_abc123', status: 'QUEUED' } });
    (pollJob as any).mockResolvedValue({ id: 'true_31649931832@c.us_ABC', _data: {} });
  });

  it('calls prepareFile with the video URL', async () => {
    await (sendVideoToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/video.mp4');
  });

  it('calls POST /api/sendVideo with CRM body shape (no chatId)', async () => {
    await (sendVideoToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, videoUrl: 'https://example.com/video.mp4', caption: 'Hello' , platform: 'activepieces' },
    });

    expect(whatsscaleClient).toHaveBeenCalledWith('test-api-key', expect.anything(), '/api/sendVideo', {
      session: 'test-session',
      contact_type: 'crm_contact',
      crm_contact_id: crmContactId,
      file: 'https://proxy.whatsscale.com/files/video.mp4',
      caption: 'Hello',
      platform: 'activepieces',
    });
  });

  it('uses crm_contact_id body shape — no chatId field', async () => {
    await (sendVideoToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg).toHaveProperty('crm_contact_id', crmContactId);
    expect(callArg).toHaveProperty('contact_type', 'crm_contact');
    expect(callArg).not.toHaveProperty('chatId');
  });

  it('calls pollJob with the jobId from send response', async () => {
    await (sendVideoToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    expect(pollJob).toHaveBeenCalledWith('test-api-key', 'job_abc123');
  });

  it('returns the result from pollJob', async () => {
    const result = { id: 'true_31649931832@c.us_ABC', _data: {} };
    (pollJob as any).mockResolvedValue(result);

    const response = await (sendVideoToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    expect(response).toEqual(result);
  });

  it('sends empty string caption when caption is undefined', async () => {
    await (sendVideoToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    expect(whatsscaleClient).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(),
      expect.objectContaining({ caption: '' }));
  });

  it('uses apiKey from context.auth.secret_text', async () => {
    await (sendVideoToCrmContactAction as any).run({
      auth: { secret_text: 'my-secret-key' },
      propsValue: { session: 'test-session', crmContact: crmContactId, videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.anything());
    expect(pollJob).toHaveBeenCalledWith('my-secret-key', expect.anything());
  });

  it('propagates error when pollJob throws', async () => {
    (pollJob as any).mockRejectedValue(new Error('Job failed'));

    await expect((sendVideoToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    })).rejects.toThrow('Job failed');
  });

  it('propagates error when prepareFile throws', async () => {
    (prepareFile as any).mockRejectedValue(new Error('File prep failed'));

    await expect((sendVideoToCrmContactAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', crmContact: crmContactId, videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    })).rejects.toThrow('File prep failed');
  });
});
