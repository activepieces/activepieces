import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pollJob } from './poll-job';
import { whatsscaleClient } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

vi.mock('./client', () => ({ whatsscaleClient: vi.fn() }));

describe('pollJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns body.result when status is COMPLETED and result exists', async () => {
    const result = { id: 'true_31649931832@c.us_ABC', _data: {} };
    (whatsscaleClient as any).mockResolvedValueOnce({ body: { status: 'COMPLETED', result } });

    const promise = pollJob('test-api-key', 'job_abc123');
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response).toEqual(result);
  });

  it('returns full body when status is COMPLETED and result is absent', async () => {
    const body = { status: 'COMPLETED', jobId: 'job_abc123' };
    (whatsscaleClient as any).mockResolvedValueOnce({ body });

    const promise = pollJob('test-api-key', 'job_abc123');
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(response).toEqual(body);
  });

  it('throws with body.error when status is FAILED', async () => {
    (whatsscaleClient as any).mockResolvedValueOnce({ body: { status: 'FAILED', error: 'Upload failed' } });

    const assertion = expect(pollJob('test-api-key', 'job_abc123')).rejects.toThrow('Upload failed');
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('throws generic message when FAILED with no error field', async () => {
    (whatsscaleClient as any).mockResolvedValueOnce({ body: { status: 'FAILED' } });

    const assertion = expect(pollJob('test-api-key', 'job_abc123')).rejects.toThrow('Job failed');
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('polls GET /api/status/:jobId with the correct jobId', async () => {
    const result = { id: 'msg_1' };
    (whatsscaleClient as any).mockResolvedValueOnce({ body: { status: 'COMPLETED', result } });

    const promise = pollJob('test-api-key', 'job_xyz999');
    await vi.runAllTimersAsync();
    await promise;

    expect(whatsscaleClient).toHaveBeenCalledWith('test-api-key', HttpMethod.GET, '/api/status/job_xyz999');
  });

  it('continues polling through QUEUED and PROCESSING before COMPLETED', async () => {
    const result = { id: 'msg_done' };
    (whatsscaleClient as any)
      .mockResolvedValueOnce({ body: { status: 'QUEUED' } })
      .mockResolvedValueOnce({ body: { status: 'PROCESSING' } })
      .mockResolvedValueOnce({ body: { status: 'COMPLETED', result } });

    const promise = pollJob('test-api-key', 'job_abc123');
    await vi.runAllTimersAsync();
    const response = await promise;

    expect(whatsscaleClient).toHaveBeenCalledTimes(3);
    expect(response).toEqual(result);
  });

  it('throws timeout error after MAX_ATTEMPTS without COMPLETED or FAILED', async () => {
    (whatsscaleClient as any).mockResolvedValue({ body: { status: 'QUEUED' } });

    const assertion = expect(pollJob('test-api-key', 'job_abc123')).rejects.toThrow('Job timed out after 80 attempts');
    await vi.runAllTimersAsync();
    await assertion;
  });
});
