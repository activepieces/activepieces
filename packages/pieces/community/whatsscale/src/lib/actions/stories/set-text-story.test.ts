import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setTextStoryAction } from './set-text-story';
import { whatsscaleClient } from '../../common/client';
import { pollJob } from '../../common/poll-job';

vi.mock('../../common/client', () => ({ whatsscaleClient: vi.fn() }));
vi.mock('../../common/poll-job', () => ({ pollJob: vi.fn() }));

const mockAuth = { secret_text: 'test-api-key' };

describe('setTextStoryAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (whatsscaleClient as any).mockResolvedValue({
      body: { jobId: 'txt_abc123', status: 'QUEUED' },
    });
    (pollJob as any).mockResolvedValue({
      jobId: 'txt_abc123',
      status: 'COMPLETED',
      message: 'Story posted',
    });
  });

  it('should post text story with required fields only', async () => {
    const result = await setTextStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', text: 'Hello World!', backgroundColor: undefined },
    } as any);

    expect(whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/status/text',
      { session: 'default', text: 'Hello World!', platform: 'activepieces'  },
    );
    expect(pollJob).toHaveBeenCalledWith('test-api-key', 'txt_abc123');
    expect(result).toEqual({ jobId: 'txt_abc123', status: 'COMPLETED', message: 'Story posted' });
  });

  it('should include backgroundColor when provided', async () => {
    await setTextStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', text: 'Hi', backgroundColor: '#25D366' },
    } as any);

    expect(whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'POST',
      '/api/status/text',
      { session: 'default', text: 'Hi', backgroundColor: '#25D366', platform: 'activepieces'  },
    );
  });

  it('should not include backgroundColor when empty string', async () => {
    await setTextStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', text: 'Hi', backgroundColor: '' },
    } as any);

    const callBody = (whatsscaleClient as any).mock.calls[0][3];
    expect(callBody).not.toHaveProperty('backgroundColor');
  });

  it('should not include backgroundColor when undefined', async () => {
    await setTextStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', text: 'Hi', backgroundColor: undefined },
    } as any);

    const callBody = (whatsscaleClient as any).mock.calls[0][3];
    expect(callBody).not.toHaveProperty('backgroundColor');
  });

  it('should pass auth key to whatsscaleClient', async () => {
    await setTextStoryAction.run({
      auth: { secret_text: 'my-secret-key' },
      propsValue: { session: 'default', text: 'test', backgroundColor: undefined },
    } as any);

    expect(whatsscaleClient).toHaveBeenCalledWith(
      'my-secret-key',
      expect.any(String),
      expect.any(String),
      expect.any(Object),
    );
  });

  it('should pass auth key to pollJob', async () => {
    await setTextStoryAction.run({
      auth: { secret_text: 'my-secret-key' },
      propsValue: { session: 'default', text: 'test', backgroundColor: undefined },
    } as any);

    expect(pollJob).toHaveBeenCalledWith('my-secret-key', expect.any(String));
  });

  it('should return pollJob result', async () => {
    (pollJob as any).mockResolvedValue({ jobId: 'txt_xyz', status: 'COMPLETED', message: 'Done' });

    const result = await setTextStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', text: 'test', backgroundColor: undefined },
    } as any);

    expect(result).toEqual({ jobId: 'txt_xyz', status: 'COMPLETED', message: 'Done' });
  });

  it('should not include font in request body', async () => {
    await setTextStoryAction.run({
      auth: mockAuth,
      propsValue: { session: 'default', text: 'test', backgroundColor: undefined },
    } as any);

    const callBody = (whatsscaleClient as any).mock.calls[0][3];
    expect(callBody).not.toHaveProperty('font');
  });
});
