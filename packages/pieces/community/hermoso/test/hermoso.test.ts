import { ExecutionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPostAction } from '../src/lib/actions/create-post';
import { generateImageAction } from '../src/lib/actions/generate-image';
import { generateVideoAction } from '../src/lib/actions/generate-video';
import { hermosoApi } from '../src/lib/common/client';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const API = 'https://app.hermoso.ai/v1';

type Route = { method: string; url: string; status?: number; headers?: Record<string, string>; body: unknown };

function routes(list: Route[]) {
  sendRequest.mockImplementation(async (req: { method: string; url: string }) => {
    const hit = list.find((r) => r.method === req.method && r.url === req.url);
    if (!hit) {
      throw new Error(`unexpected ${req.method} ${req.url}`);
    }
    return { status: hit.status ?? 200, headers: hit.headers ?? {}, body: hit.body };
  });
}

function runContext({ canPause, runId = 'run_1' }: { canPause: boolean; runId?: string }) {
  return {
    id: runId,
    canPause,
    stop: vi.fn(),
    respond: vi.fn(),
    createWaitpoint: vi.fn(async () => ({
      id: 'wp_1',
      resumeUrl: 'https://cloud.example.com/resume/wp_1',
      buildResumeUrl: () => 'https://cloud.example.com/resume/wp_1',
    })),
    waitForWaitpoint: vi.fn(),
  };
}

function videoContext({
  run,
  props = {},
  executionType = ExecutionType.BEGIN,
  resumeBody,
}: {
  run: ReturnType<typeof runContext>;
  props?: Record<string, unknown>;
  executionType?: ExecutionType;
  resumeBody?: unknown;
}) {
  return {
    auth: { type: 'SECRET_TEXT', secret_text: 'hmk_test' },
    propsValue: { prompt: ' A soda can on a picnic table ', aspect_ratio: '9:16', wait_for_result: true, ...props },
    executionType,
    resumePayload: { body: resumeBody, headers: {}, queryParams: {} },
    run,
    step: { name: 'step_1' },
  };
}

function callsTo(method: string, url: string) {
  return sendRequest.mock.calls.map((c) => c[0]).filter((req) => req.method === method && req.url === url);
}

describe('render steps', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  it('pauses the flow when Hermoso registers the callback', async () => {
    routes([
      {
        method: 'POST',
        url: `${API}/generations`,
        status: 202,
        headers: { 'hermoso-callback': 'registered' },
        body: { object: 'job', id: 'job_1', status: 'queued', type: 'video' },
      },
    ]);
    const run = runContext({ canPause: true });
    const output = await generateVideoAction.run(videoContext({ run }) as never);
    const [submit] = callsTo('POST', `${API}/generations`);
    expect(submit.body).toEqual({ type: 'video', prompt: 'A soda can on a picnic table', aspect_ratio: '9:16' });
    expect(submit.headers['X-Hermoso-Callback-Url']).toBe('https://cloud.example.com/resume/wp_1');
    expect(submit.headers['Idempotency-Key']).toMatch(/^activepieces-[0-9a-f]{48}$/);
    expect(run.waitForWaitpoint).toHaveBeenCalledWith('wp_1');
    expect(output).toMatchObject({ job_id: 'job_1', status: 'queued', is_finished: false });
  });

  it('polls the job when the callback is not registered', async () => {
    routes([
      {
        method: 'POST',
        url: `${API}/generations`,
        status: 202,
        headers: { 'hermoso-callback': 'not-registered' },
        body: { object: 'job', id: 'job_1', status: 'queued' },
      },
      {
        method: 'GET',
        url: `${API}/jobs/job_1`,
        body: { object: 'job', id: 'job_1', status: 'done', url: 'https://assets.hermoso.ai/a/video.mp4' },
      },
    ]);
    const run = runContext({ canPause: true });
    const output = await generateVideoAction.run(videoContext({ run }) as never);
    expect(run.waitForWaitpoint).not.toHaveBeenCalled();
    expect(output).toMatchObject({ status: 'done', is_finished: true, url: 'https://assets.hermoso.ai/a/video.mp4' });
  });

  it('polls without a waitpoint when the run cannot pause', async () => {
    routes([
      { method: 'POST', url: `${API}/generations`, status: 202, body: { object: 'job', id: 'job_1', status: 'queued' } },
      { method: 'GET', url: `${API}/jobs/job_1`, body: { id: 'job_1', status: 'done', url: 'https://assets.hermoso.ai/a/v.mp4' } },
    ]);
    const run = runContext({ canPause: false });
    const output = await generateVideoAction.run(videoContext({ run }) as never);
    expect(run.createWaitpoint).not.toHaveBeenCalled();
    expect(callsTo('POST', `${API}/generations`)[0].headers['X-Hermoso-Callback-Url']).toBeUndefined();
    expect(output.url).toBe('https://assets.hermoso.ai/a/v.mp4');
  });

  it('returns the queued job at once when waiting is off', async () => {
    routes([{ method: 'POST', url: `${API}/generations`, status: 202, body: { id: 'job_1', status: 'queued' } }]);
    const run = runContext({ canPause: true });
    const output = await generateVideoAction.run(videoContext({ run, props: { wait_for_result: false } }) as never);
    expect(run.createWaitpoint).not.toHaveBeenCalled();
    expect(callsTo('GET', `${API}/jobs/job_1`)).toHaveLength(0);
    expect(output).toMatchObject({ job_id: 'job_1', status: 'queued' });
  });

  it('reads the job from Hermoso on resume instead of trusting the callback body', async () => {
    routes([{ method: 'GET', url: `${API}/jobs/job_1`, body: { id: 'job_1', status: 'done', url: 'https://assets.hermoso.ai/a/real.mp4' } }]);
    const run = runContext({ canPause: true });
    const output = await generateVideoAction.run(
      videoContext({
        run,
        executionType: ExecutionType.RESUME,
        resumeBody: { id: 'job_1', status: 'done', url: 'https://attacker.example.com/fake.mp4' },
      }) as never
    );
    expect(callsTo('POST', `${API}/generations`)).toHaveLength(0);
    expect(output.url).toBe('https://assets.hermoso.ai/a/real.mp4');
  });

  it('raises a failed render with its reason', async () => {
    routes([{ method: 'GET', url: `${API}/jobs/job_1`, body: { id: 'job_1', status: 'error', error_message: 'the prompt was refused' } }]);
    const run = runContext({ canPause: true });
    await expect(
      generateVideoAction.run(videoContext({ run, executionType: ExecutionType.RESUME, resumeBody: { id: 'job_1' } }) as never)
    ).rejects.toThrow('the prompt was refused');
  });

  it('stores outside reference images in Hermoso before rendering an image', async () => {
    routes([
      { method: 'POST', url: `${API}/media`, body: { object: 'media', url: 'https://assets.hermoso.ai/a/upload.png' } },
      { method: 'POST', url: `${API}/generations`, status: 202, body: { id: 'job_2', status: 'done', url: 'https://assets.hermoso.ai/a/image.png' } },
    ]);
    const run = runContext({ canPause: false });
    const output = await generateImageAction.run({
      ...videoContext({ run }),
      propsValue: {
        prompt: 'A product photo',
        use_brand: true,
        reference_images: ['https://example.com/photo.png', 'https://assets.hermoso.ai/a/logo.png'],
        brand: 'pm_shared::acct_owner',
      },
    } as never);
    const [media] = callsTo('POST', `${API}/media`);
    expect(media.queryParams).toEqual({ url: 'https://example.com/photo.png' });
    const [submit] = callsTo('POST', `${API}/generations`);
    expect(submit.body.ref_images).toEqual(['https://assets.hermoso.ai/a/upload.png', 'https://assets.hermoso.ai/a/logo.png']);
    expect(submit.headers['X-Hermoso-User']).toBe('pm_shared');
    expect(submit.headers['X-Hermoso-Owner']).toBe('acct_owner');
    expect(output.url).toBe('https://assets.hermoso.ai/a/image.png');
  });
});

describe('create post', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  it('takes the next queue slot without a publish time', async () => {
    routes([
      {
        method: 'POST',
        url: `${API}/posts`,
        body: {
          id: 'rec_1',
          status: 'scheduled',
          channels: ['instagram', 'linkedin'],
          results: [{ channel: 'linkedin', ok: false, error: 'token expired' }],
        },
      },
    ]);
    const output = await createPostAction.run({
      auth: { type: 'SECRET_TEXT', secret_text: 'hmk_test' },
      propsValue: {
        channels: ['instagram', 'linkedin'],
        caption: 'Hello',
        timing: 'queue',
        scheduled_at: '2030-01-01T00:00:00.000Z',
        timezone: 'America/Toronto',
        media: ['https://assets.hermoso.ai/a/image.png'],
      },
      run: { id: 'run_1' },
      step: { name: 'step_2' },
    } as never);
    const [post] = callsTo('POST', `${API}/posts`);
    expect(post.body).toEqual({
      channels: ['instagram', 'linkedin'],
      caption: 'Hello',
      media: ['https://assets.hermoso.ai/a/image.png'],
      use_queue: true,
      timezone: 'America/Toronto',
    });
    expect(output).toMatchObject({ post_id: 'rec_1', channels: 'instagram, linkedin', failed_channels: 'linkedin' });
  });

  it('refuses a set time with no time before sending anything', async () => {
    await expect(
      createPostAction.run({
        auth: { type: 'SECRET_TEXT', secret_text: 'hmk_test' },
        propsValue: { channels: ['x'], caption: 'Hi', timing: 'scheduled' },
        run: { id: 'run_1' },
        step: { name: 'step_2' },
      } as never)
    ).rejects.toThrow('Publish Time is empty');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('client helpers', () => {
  it('derives the same idempotency key for a retry and a new one for a new run', () => {
    const base = { stepName: 's', operation: 'generation', payload: { b: 1, a: 2 } };
    const first = hermosoApi.idempotencyKey({ runId: 'r1', ...base });
    expect(hermosoApi.idempotencyKey({ runId: 'r1', ...base, payload: { a: 2, b: 1 } })).toBe(first);
    expect(hermosoApi.idempotencyKey({ runId: 'r2', ...base })).not.toBe(first);
  });

  it('only sends the key to the Hermoso API host in Custom API Call', () => {
    expect(() => hermosoApi.assertHermosoUrl('https://example.com/v1/brands')).toThrow();
    expect(() => hermosoApi.assertHermosoUrl('https://app.hermoso.ai/v1/brands')).not.toThrow();
    expect(() => hermosoApi.assertHermosoUrl('/brands')).not.toThrow();
  });
});
