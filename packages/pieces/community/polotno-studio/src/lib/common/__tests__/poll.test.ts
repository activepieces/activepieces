import { describe, expect, it, vi } from 'vitest';
import type { PolotnoClient } from '../client';
import type { RenderLike, RenderStatus } from '../types';
import { pollUntilTerminal } from '../poll';

const render = (status: RenderStatus): RenderLike => ({ id: 'img_1', object: 'image', status });

function clientReturning(sequence: RenderLike[]): { client: PolotnoClient; request: ReturnType<typeof vi.fn> } {
  const request = vi.fn();
  sequence.forEach((r) => request.mockResolvedValueOnce(r));
  request.mockResolvedValue(sequence[sequence.length - 1]);
  const client: PolotnoClient = { request };
  return { client, request };
}

describe('pollUntilTerminal', () => {
  it('returns immediately when the first read is terminal', async () => {
    const { client, request } = clientReturning([render('completed')]);
    const result = await pollUntilTerminal({ client, kind: 'images', id: 'img_1', maxWaitMs: 10_000 });

    expect(result).toEqual({ render: render('completed'), timedOut: false });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('polls until a terminal status appears', async () => {
    const { client, request } = clientReturning([render('pending'), render('processing'), render('completed')]);
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await pollUntilTerminal({ client, kind: 'images', id: 'img_1', maxWaitMs: 60_000, sleep });

    expect(result.render.status).toBe('completed');
    expect(result.timedOut).toBe(false);
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('treats failed as terminal without throwing', async () => {
    const { client } = clientReturning([render('failed')]);
    const result = await pollUntilTerminal({ client, kind: 'images', id: 'img_1', maxWaitMs: 10_000 });
    expect(result).toEqual({ render: render('failed'), timedOut: false });
  });

  it('returns the pending render with timedOut when the budget expires', async () => {
    const { client } = clientReturning([render('pending')]);
    const sleep = vi.fn().mockResolvedValue(undefined);
    let clock = 0;
    const now = () => (clock += 1_000);

    const result = await pollUntilTerminal({ client, kind: 'videos', id: 'vid_1', maxWaitMs: 1_500, sleep, now });

    expect(result.timedOut).toBe(true);
    expect(result.render.status).toBe('pending');
  });

  it('builds the poll path from kind and id rather than self_url', async () => {
    const { client, request } = clientReturning([render('completed')]);
    await pollUntilTerminal({ client, kind: 'videos', id: 'vid_a b', maxWaitMs: 10_000 });
    expect(request.mock.calls[0][0]).toEqual({ path: '/v1/videos/vid_a%20b' });
  });

  it('backs off between polls up to the ceiling', async () => {
    const { client } = clientReturning([
      render('pending'), render('pending'), render('pending'), render('pending'),
      render('pending'), render('pending'), render('pending'), render('completed'),
    ]);
    const delays: number[] = [];
    const sleep = vi.fn().mockImplementation((ms: number) => { delays.push(ms); return Promise.resolve(); });

    await pollUntilTerminal({ client, kind: 'images', id: 'img_1', maxWaitMs: 600_000, sleep });

    expect(delays[0]).toBe(2_000);
    expect(delays[1]).toBe(3_000);
    expect(Math.max(...delays)).toBeLessThanOrEqual(10_000);
  });
});
