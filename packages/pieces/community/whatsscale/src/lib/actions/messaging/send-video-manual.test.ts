import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendVideoManualAction } from './send-video-manual';
import { whatsscaleClient } from '../../common/client';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

vi.mock('../../common/client', () => ({ whatsscaleClient: vi.fn() }));
vi.mock('../../common/prepare-file', () => ({ prepareFile: vi.fn() }));
vi.mock('../../common/poll-job', () => ({ pollJob: vi.fn() }));

const mockAuth = { secret_text: 'test-api-key' };

describe('sendVideoManualAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prepareFile as any).mockResolvedValue('https://proxy.whatsscale.com/files/video.mp4');
    (whatsscaleClient as any).mockResolvedValue({ body: { jobId: 'job_abc123', status: 'QUEUED' } });
    (pollJob as any).mockResolvedValue({ id: 'true_31649931832@c.us_ABC', _data: {} });
  });

  it('calls prepareFile with the video URL', async () => {
    await (sendVideoManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: 'contact', recipient: '31649931832@c.us', videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/video.mp4');
  });

  it('calls POST /api/sendVideo with correct body for contact', async () => {
    await (sendVideoManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: 'contact', recipient: '31649931832@c.us', videoUrl: 'https://example.com/video.mp4', caption: 'Hello' , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0];
    expect(callArg[2]).toBe('/api/sendVideo');
    expect(callArg[3]).toMatchObject({
      session: 'test-session',
      file: 'https://proxy.whatsscale.com/files/video.mp4',
      caption: 'Hello',
      platform: 'activepieces',
    });
  });

  it('calls pollJob with the jobId from send response', async () => {
    await (sendVideoManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: 'contact', recipient: '31649931832@c.us', videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    expect(pollJob).toHaveBeenCalledWith('test-api-key', 'job_abc123');
  });

  it('returns the result from pollJob', async () => {
    const result = { id: 'true_31649931832@c.us_ABC', _data: {} };
    (pollJob as any).mockResolvedValue(result);

    const response = await (sendVideoManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: 'contact', recipient: '31649931832@c.us', videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    expect(response).toEqual(result);
  });

  it('sends empty string caption when caption is undefined', async () => {
    await (sendVideoManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: 'contact', recipient: '31649931832@c.us', videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    expect(whatsscaleClient).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.anything(),
      expect.objectContaining({ caption: '' }));
  });

  it('uses chatType from propsValue when building recipient body', async () => {
    await (sendVideoManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: 'group', recipient: '120363000000000001@g.us', videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg).toHaveProperty('session', 'test-session');
  });

  it('uses apiKey from context.auth.secret_text', async () => {
    await (sendVideoManualAction as any).run({
      auth: { secret_text: 'my-secret-key' },
      propsValue: { session: 'test-session', chatType: 'contact', recipient: '31649931832@c.us', videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    });

    expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.anything());
    expect(pollJob).toHaveBeenCalledWith('my-secret-key', expect.anything());
  });

  it('propagates error when pollJob throws', async () => {
    (pollJob as any).mockRejectedValue(new Error('Job timed out after 80 attempts'));

    await expect((sendVideoManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: 'contact', recipient: '31649931832@c.us', videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    })).rejects.toThrow('Job timed out after 80 attempts');
  });

  it('propagates error when prepareFile throws', async () => {
    (prepareFile as any).mockRejectedValue(new Error('File prep failed'));

    await expect((sendVideoManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: 'contact', recipient: '31649931832@c.us', videoUrl: 'https://example.com/video.mp4', caption: undefined , platform: 'activepieces' },
    })).rejects.toThrow('File prep failed');
  });

  it('includes file field from preparedUrl (not raw videoUrl)', async () => {
    await (sendVideoManualAction as any).run({
      auth: mockAuth,
      propsValue: { session: 'test-session', chatType: 'contact', recipient: '31649931832@c.us', videoUrl: 'https://example.com/raw-video.mp4', caption: undefined , platform: 'activepieces' },
    });

    const callArg = (whatsscaleClient as any).mock.calls[0][3];
    expect(callArg.file).toBe('https://proxy.whatsscale.com/files/video.mp4');
    expect(callArg.file).not.toBe('https://example.com/raw-video.mp4');
  });
});
