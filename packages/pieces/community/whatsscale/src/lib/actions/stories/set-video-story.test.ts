import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setVideoStoryAction } from './set-video-story';
import { whatsscaleClient } from '../../common/client';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

vi.mock('../../common/client', () => ({ whatsscaleClient: vi.fn() }));
vi.mock('../../common/prepare-file', () => ({ prepareFile: vi.fn() }));
vi.mock('../../common/poll-job', () => ({ pollJob: vi.fn() }));

const mockAuth = { secret_text: 'test-api-key' };

describe('setVideoStoryAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prepareFile as any).mockResolvedValue('https://proxy.whatsscale.com/files/vid_story.mp4');
    (whatsscaleClient as any).mockResolvedValue({
      body: { jobId: 'vid_abc123', status: 'QUEUED' },
    });
    (pollJob as any).mockResolvedValue({
      jobId: 'vid_abc123',
      status: 'COMPLETED',
      message: 'Story posted',
    });
  });

  it('should call prepareFile with videoUrl', async () => {
    await setVideoStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', videoUrl: 'https://example.com/clip.mp4', caption: undefined },
    } as any);

    expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/clip.mp4');
  });

  it('should post video story with prepared URL and empty caption by default', async () => {
    await setVideoStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', videoUrl: 'https://example.com/clip.mp4', caption: undefined },
    } as any);

    expect(whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/status/video',
      {
        session: 'default',
        file: 'https://proxy.whatsscale.com/files/vid_story.mp4',
        caption: '',
        platform: 'activepieces',
      },
    );
  });

  it('should include caption when provided', async () => {
    await setVideoStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', videoUrl: 'https://example.com/clip.mp4', caption: 'Watch this!' },
    } as any);

    expect(whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/status/video',
      {
        session: 'default',
        file: 'https://proxy.whatsscale.com/files/vid_story.mp4',
        caption: 'Watch this!',
        platform: 'activepieces',
      },
    );
  });

  it('should call pollJob with jobId from response', async () => {
    await setVideoStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', videoUrl: 'https://example.com/clip.mp4', caption: undefined },
    } as any);

    expect(pollJob).toHaveBeenCalledWith('test-api-key', 'vid_abc123');
  });

  it('should return pollJob result', async () => {
    const result = await setVideoStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', videoUrl: 'https://example.com/clip.mp4', caption: undefined },
    } as any);

    expect(result).toEqual({ jobId: 'vid_abc123', status: 'COMPLETED', message: 'Story posted' });
  });

  it('should pass apiKey to prepareFile', async () => {
    await setVideoStoryAction.run({
      auth: { secret_text: 'my-secret-key' },
      propsValue: { session: 'default', videoUrl: 'https://example.com/clip.mp4', caption: undefined },
    } as any);

    expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.any(String));
  });

  it('should pass apiKey to pollJob', async () => {
    await setVideoStoryAction.run({
      auth: { secret_text: 'my-secret-key' },
      propsValue: { session: 'default', videoUrl: 'https://example.com/clip.mp4', caption: undefined },
    } as any);

    expect(pollJob).toHaveBeenCalledWith('my-secret-key', expect.any(String));
  });

  it('should support Google Drive URLs via prepareFile', async () => {
    const driveUrl = 'https://drive.google.com/file/d/abc123/view';
    (prepareFile as any).mockResolvedValue('https://proxy.whatsscale.com/files/vid_gdrive.mp4');

    await setVideoStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', videoUrl: driveUrl, caption: undefined },
    } as any);

    expect(prepareFile).toHaveBeenCalledWith('test-api-key', driveUrl);
    const callBody = (whatsscaleClient as any).mock.calls[0][3];
    expect(callBody.file).toBe('https://proxy.whatsscale.com/files/vid_gdrive.mp4');
  });

  it('should use /api/status/video endpoint (not image)', async () => {
    await setVideoStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', videoUrl: 'https://example.com/clip.mp4', caption: undefined },
    } as any);

    expect(whatsscaleClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      '/api/status/video',
      expect.any(Object),
    );
  });
});
