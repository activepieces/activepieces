import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setImageStoryAction } from './set-image-story';
import { whatsscaleClient } from '../../common/client';
import { prepareFile } from '../../common/prepare-file';
import { pollJob } from '../../common/poll-job';

vi.mock('../../common/client', () => ({ whatsscaleClient: vi.fn() }));
vi.mock('../../common/prepare-file', () => ({ prepareFile: vi.fn() }));
vi.mock('../../common/poll-job', () => ({ pollJob: vi.fn() }));

const mockAuth = { secret_text: 'test-api-key' };

describe('setImageStoryAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prepareFile as any).mockResolvedValue('https://proxy.whatsscale.com/files/img_story.jpg');
    (whatsscaleClient as any).mockResolvedValue({
      body: { jobId: 'img_abc123', status: 'QUEUED' },
    });
    (pollJob as any).mockResolvedValue({
      jobId: 'img_abc123',
      status: 'COMPLETED',
      message: 'Story posted',
    });
  });

  it('should call prepareFile with imageUrl', async () => {
    await setImageStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', imageUrl: 'https://example.com/photo.jpg', caption: undefined },
    } as any);

    expect(prepareFile).toHaveBeenCalledWith('test-api-key', 'https://example.com/photo.jpg');
  });

  it('should post image story with prepared URL and empty caption by default', async () => {
    await setImageStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', imageUrl: 'https://example.com/photo.jpg', caption: undefined },
    } as any);

    expect(whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/status/image',
      {
        session: 'default',
        file: 'https://proxy.whatsscale.com/files/img_story.jpg',
        caption: '',
        platform: 'activepieces',
      },
    );
  });

  it('should include caption when provided', async () => {
    await setImageStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', imageUrl: 'https://example.com/photo.jpg', caption: 'My caption' },
    } as any);

    expect(whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/status/image',
      {
        session: 'default',
        file: 'https://proxy.whatsscale.com/files/img_story.jpg',
        caption: 'My caption',
        platform: 'activepieces',
      },
    );
  });

  it('should call pollJob with jobId from response', async () => {
    await setImageStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', imageUrl: 'https://example.com/photo.jpg', caption: undefined },
    } as any);

    expect(pollJob).toHaveBeenCalledWith('test-api-key', 'img_abc123');
  });

  it('should return pollJob result', async () => {
    const result = await setImageStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', imageUrl: 'https://example.com/photo.jpg', caption: undefined },
    } as any);

    expect(result).toEqual({ jobId: 'img_abc123', status: 'COMPLETED', message: 'Story posted' });
  });

  it('should pass apiKey to prepareFile', async () => {
    await setImageStoryAction.run({
      auth: { secret_text: 'my-secret-key' },
      propsValue: { session: 'default', imageUrl: 'https://example.com/photo.jpg', caption: undefined },
    } as any);

    expect(prepareFile).toHaveBeenCalledWith('my-secret-key', expect.any(String));
  });

  it('should pass apiKey to pollJob', async () => {
    await setImageStoryAction.run({
      auth: { secret_text: 'my-secret-key' },
      propsValue: { session: 'default', imageUrl: 'https://example.com/photo.jpg', caption: undefined },
    } as any);

    expect(pollJob).toHaveBeenCalledWith('my-secret-key', expect.any(String));
  });

  it('should support Google Drive URLs via prepareFile', async () => {
    const driveUrl = 'https://drive.google.com/file/d/abc123/view';
    (prepareFile as any).mockResolvedValue('https://proxy.whatsscale.com/files/img_gdrive.jpg');

    await setImageStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', imageUrl: driveUrl, caption: undefined },
    } as any);

    expect(prepareFile).toHaveBeenCalledWith('test-api-key', driveUrl);
    const callBody = (whatsscaleClient as any).mock.calls[0][3];
    expect(callBody.file).toBe('https://proxy.whatsscale.com/files/img_gdrive.jpg');
  });
});
