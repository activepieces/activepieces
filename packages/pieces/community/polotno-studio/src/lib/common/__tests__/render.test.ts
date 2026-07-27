import { describe, expect, it, vi } from 'vitest';
import type { PolotnoClient } from '../client';
import { executeRender, readResumedRender } from '../render';

const client = (overrides: Partial<Record<string, unknown>> = {}) => {
  const request = vi.fn().mockResolvedValue({ id: 'img_1', object: 'image', status: 'pending' });
  return { client: { request, ...overrides } as unknown as PolotnoClient, request };
};

const waitpoint = () => ({
  id: 'wp_1',
  resumeUrl: 'https://cloud.example.com/api/v1/resume/wp_1',
  buildResumeUrl: () => 'https://cloud.example.com/api/v1/resume/wp_1',
});

const base = {
  kind: 'images' as const,
  body: { template_id: 'tpl_1' },
  idempotencyKey: 'run_1:step_1',
  maxWaitSeconds: 120,
};

describe('executeRender (BEGIN)', () => {
  it('returns the pending render without a waitpoint when not waiting', async () => {
    const { client: c, request } = client();
    const createWaitpoint = vi.fn();

    const result = await executeRender({
      ...base, client: c, waitForCompletion: false, createWaitpoint, waitForWaitpoint: vi.fn(),
    });

    expect(createWaitpoint).not.toHaveBeenCalled();
    expect(result['timed_out']).toBe(false);
    expect(request.mock.calls[0][0].queryParams).toBeUndefined();
  });

  it('parks on the waitpoint when the resume URL is public', async () => {
    const { client: c, request } = client();
    const waitForWaitpoint = vi.fn();

    await executeRender({
      ...base, client: c, waitForCompletion: true,
      createWaitpoint: vi.fn().mockResolvedValue(waitpoint()), waitForWaitpoint,
    });

    expect(request.mock.calls[0][0].body['webhook_url']).toBe('https://cloud.example.com/api/v1/resume/wp_1');
    expect(waitForWaitpoint).toHaveBeenCalledWith('wp_1');
  });

  it('does not park when the POST already returned a terminal render', async () => {
    const request = vi.fn().mockResolvedValue({ id: 'img_1', object: 'image', status: 'completed' });
    const waitForWaitpoint = vi.fn();

    const result = await executeRender({
      ...base, client: { request } as unknown as PolotnoClient, waitForCompletion: true,
      createWaitpoint: vi.fn().mockResolvedValue(waitpoint()), waitForWaitpoint,
    });

    expect(waitForWaitpoint).not.toHaveBeenCalled();
    expect(result['status']).toBe('completed');
  });

  it('falls back to sync + polling when the resume URL is private', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce({ id: 'img_1', object: 'image', status: 'pending' })
      .mockResolvedValue({ id: 'img_1', object: 'image', status: 'completed' });
    const waitForWaitpoint = vi.fn();
    const privateWaitpoint = { ...waitpoint(), buildResumeUrl: () => 'https://192.168.1.5/api/v1/resume/wp_1' };

    const result = await executeRender({
      ...base, client: { request } as unknown as PolotnoClient, waitForCompletion: true,
      createWaitpoint: vi.fn().mockResolvedValue(privateWaitpoint), waitForWaitpoint,
      sleep: vi.fn().mockResolvedValue(undefined),
    });

    expect(waitForWaitpoint).not.toHaveBeenCalled();
    expect(request.mock.calls[0][0].queryParams).toEqual({ sync: 'true' });
    expect(request.mock.calls[0][0].body['webhook_url']).toBeUndefined();
    expect(result['status']).toBe('completed');
    expect(result['timed_out']).toBe(false);
  });

  it('never sends sync for videos', async () => {
    const request = vi.fn().mockResolvedValue({ id: 'vid_1', object: 'video', status: 'completed' });
    const privateWaitpoint = { ...waitpoint(), buildResumeUrl: () => 'http://localhost/api/v1/resume/wp_1' };

    await executeRender({
      ...base, kind: 'videos', client: { request } as unknown as PolotnoClient, waitForCompletion: true,
      createWaitpoint: vi.fn().mockResolvedValue(privateWaitpoint), waitForWaitpoint: vi.fn(),
    });

    expect(request.mock.calls[0][0].queryParams).toBeUndefined();
  });

  it('marks a polling timeout as timed_out', async () => {
    const request = vi.fn().mockResolvedValue({ id: 'img_1', object: 'image', status: 'pending' });
    let clock = 0;
    const privateWaitpoint = { ...waitpoint(), buildResumeUrl: () => 'https://127.0.0.1/api/v1/resume/wp_1' };

    const result = await executeRender({
      ...base, client: { request } as unknown as PolotnoClient, waitForCompletion: true, maxWaitSeconds: 1,
      createWaitpoint: vi.fn().mockResolvedValue(privateWaitpoint), waitForWaitpoint: vi.fn(),
      sleep: vi.fn().mockResolvedValue(undefined), now: () => (clock += 1_000),
    });

    expect(result['timed_out']).toBe(true);
    expect(result['status']).toBe('pending');
  });

  it('sends the idempotency key', async () => {
    const { client: c, request } = client();
    await executeRender({ ...base, client: c, waitForCompletion: false, createWaitpoint: vi.fn(), waitForWaitpoint: vi.fn() });
    expect(request.mock.calls[0][0].headers).toEqual({ 'Idempotency-Key': 'run_1:step_1' });
  });
});

describe('readResumedRender', () => {
  it('extracts the render from the callback envelope', () => {
    const result = readResumedRender({
      body: { id: 'evt_1', type: 'image.completed', data: { object: { id: 'img_1', status: 'completed' } } },
    });
    expect(result).toEqual({ id: 'img_1', status: 'completed', timed_out: false });
  });

  it('throws on an unrecognised callback', () => {
    expect(() => readResumedRender({ body: { hello: 'world' } })).toThrow(/unrecognised callback/i);
  });
});
