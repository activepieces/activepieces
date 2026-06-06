import { HttpMethod } from '@activepieces/pieces-common';
import { describe, expect, it } from 'vitest';
import { cancelJob } from '../src/lib/actions/cancel-job';
import { estimateJob } from '../src/lib/actions/estimate-job';
import { getArtifactDownloadUrl } from '../src/lib/actions/get-artifact-download-url';
import { getJobLogs } from '../src/lib/actions/get-job-logs';
import { getJobStatus } from '../src/lib/actions/get-job-status';
import { listArtifacts } from '../src/lib/actions/list-artifacts';
import { listJobs } from '../src/lib/actions/list-jobs';
import { submitJob } from '../src/lib/actions/submit-job';
import { JungleGridApiError, jungleGridCommon } from '../src/lib/common';

const auth = {
  props: {
    api_base_url: 'https://api.junglegrid.dev/',
    api_key: 'test-api-key',
  },
};

describe('jungleGridCommon payload helpers', () => {
  it('builds documented submit payloads and strips empty optional fields', () => {
    expect.assertions(1);

    expect(
      jungleGridCommon.buildSubmitJobPayload({
        name: 'batch-demo',
        workload_type: 'batch',
        image: 'python:3.11',
        model_size_gb: 1,
        command: 'python',
        args: ['-c', 'print(42)', ''],
        optimize_for: 'cost',
        max_price_per_hour: 2.5,
        preferred_gpu_family: 'l4',
        avoid_gpu_families: ['a100'],
        region_preference: 'us-east',
        latency_priority: 'high',
        cost_priority: 'balanced',
        callback_url: 'https://api.example.com/jungle/webhook',
        callback_metadata: {
          request_id: 'req_123',
        },
      }),
    ).toStrictEqual({
      name: 'batch-demo',
      workload_type: 'batch',
      image: 'python:3.11',
      model_size_gb: 1,
      command: 'python',
      args: ['-c', 'print(42)'],
      optimize_for: 'cost',
      constraints: {
        max_price_per_hour: 2.5,
        preferred_gpu_family: 'l4',
        avoid_gpu_families: ['a100'],
        region_preference: 'us-east',
        latency_priority: 'high',
        cost_priority: 'balanced',
      },
      callback_url: 'https://api.example.com/jungle/webhook',
      callback_metadata: {
        request_id: 'req_123',
      },
    });
  });

  it('validates missing required fields before calling the API', () => {
    expect.assertions(4);

    expect(() =>
      jungleGridCommon.buildEstimateJobPayload({
        workload_type: 'batch',
      }),
    ).toThrow('Image is required.');

    expect(() =>
      jungleGridCommon.buildSubmitJobPayload({
        workload_type: 'fine-tuning',
        image: 'python:3.11',
      }),
    ).toThrow('workload_type must be one of: inference, batch, training.');

    expect(() =>
      jungleGridCommon.buildSubmitJobPayload({
        workload_type: 'batch',
        image: 'python:3.11',
        model_size_gb: 0,
      }),
    ).toThrow('Model Size (GB) must be greater than 0.');

    expect(() =>
      jungleGridCommon.buildSubmitJobPayload({
        workload_type: 'batch',
        image: 'python:3.11',
        callback_url: 'http://example.com/jungle/webhook',
      }),
    ).toThrow('Callback URL must use HTTPS unless it targets localhost.');
  });

  it('validates log and list query ranges', () => {
    expect.assertions(2);

    expect(() =>
      jungleGridCommon.buildLogsQueryParams({
        tail_lines: 501,
      }),
    ).toThrow('tail_lines must be between 1 and 500.');

    expect(() =>
      jungleGridCommon.buildListJobsQueryParams({
        limit: 0,
      }),
    ).toThrow('limit must be between 1 and 100.');
  });
});

describe('Jungle Grid actions', () => {
  it('estimate_job posts the documented estimate request with bearer auth', async () => {
    expect.assertions(5);

    await withMockedFetch(
      async (input, init) => {
        expect(String(input)).toBe('https://api.junglegrid.dev/v1/jobs/estimate');
        expect(init?.method).toBe('POST');
        expect(init?.headers).toMatchObject({
          Accept: 'application/json',
          Authorization: 'Bearer test-api-key',
          'Content-Type': 'application/json',
        });
        expect(init?.body).toBe(
          JSON.stringify({
            image: 'python:3.11',
            workload_type: 'batch',
            model_size_gb: 1,
            command: 'python',
            args: ['-c', 'print(42)'],
            optimize_for: 'balanced',
          }),
        );
        return Response.json({
          available: true,
          estimated_cost_min_usd: 0.01,
          estimated_cost_max_usd: 0.02,
        });
      },
      async () => {
        const result = await runAction(estimateJob, {
          workload_type: 'batch',
          image: 'python:3.11',
          model_size_gb: 1,
          command: 'python',
          args: ['-c', 'print(42)'],
          optimize_for: 'balanced',
        });

        expect(result).toStrictEqual({
          available: true,
          estimated_cost_min_usd: 0.01,
          estimated_cost_max_usd: 0.02,
        });
      },
    );
  });

  it('submit_job posts a queue request and returns the async job status', async () => {
    expect.assertions(4);

    await withMockedFetch(
      async (input, init) => {
        expect(String(input)).toBe('https://api.junglegrid.dev/v1/jobs');
        expect(init?.method).toBe('POST');
        expect(init?.body).toBe(
          JSON.stringify({
            name: 'chat-infer',
            image: 'pytorch/pytorch:2.4.0-cuda12.1-cudnn9-runtime',
            workload_type: 'inference',
            model_size_gb: 7,
            optimize_for: 'speed',
          }),
        );
        return Response.json(
          {
            job_id: 'job_123',
            status: 'queued',
            queued_at: '2026-06-02T12:00:00Z',
          },
          {
            status: 202,
          },
        );
      },
      async () => {
        const result = await runAction(submitJob, {
          name: 'chat-infer',
          workload_type: 'inference',
          image: 'pytorch/pytorch:2.4.0-cuda12.1-cudnn9-runtime',
          model_size_gb: 7,
          optimize_for: 'speed',
        });

        expect(result).toStrictEqual({
          job_id: 'job_123',
          status: 'queued',
          queued_at: '2026-06-02T12:00:00Z',
        });
      },
    );
  });

  it('status, logs, artifacts, download, list, and cancel actions call the documented endpoints', async () => {
    expect.assertions(15);
    const calls: CapturedCall[] = [];

    await withMockedFetch(
      async (input, init) => {
        calls.push({
          url: String(input),
          method: init?.method ?? 'GET',
          body: typeof init?.body === 'string' ? init.body : undefined,
        });
        return Response.json({
          ok: true,
        });
      },
      async () => {
        await runAction(listJobs, {
          limit: 20,
          cursor: '10',
          status: 'running',
        });
        await runAction(getJobStatus, {
          job_id: 'job 1',
        });
        await runAction(getJobLogs, {
          job_id: 'job 1',
          tail_lines: 50,
          cursor: '42',
          stream: 'stdout',
        });
        await runAction(listArtifacts, {
          job_id: 'job 1',
        });
        await runAction(getArtifactDownloadUrl, {
          job_id: 'job 1',
          artifact_id: 'art/1',
        });
        await runAction(cancelJob, {
          job_id: 'job 1',
          reason: 'test cancellation',
        });
      },
    );

    expect(calls).toHaveLength(6);
    expect(calls[0]?.method).toBe('GET');
    expect(calls[0]?.url).toBe('https://api.junglegrid.dev/v1/jobs?limit=20&cursor=10&status=running');
    expect(calls[1]?.method).toBe('GET');
    expect(calls[1]?.url).toBe('https://api.junglegrid.dev/v1/jobs/job%201');
    expect(calls[2]?.method).toBe('GET');
    expect(calls[2]?.url).toBe('https://api.junglegrid.dev/v1/jobs/job%201/logs?tail=50&cursor=42&stream=stdout');
    expect(calls[3]?.method).toBe('GET');
    expect(calls[3]?.url).toBe('https://api.junglegrid.dev/v1/jobs/job%201/artifacts');
    expect(calls[4]?.method).toBe('POST');
    expect(calls[4]?.url).toBe('https://api.junglegrid.dev/v1/jobs/job%201/artifacts/art%2F1/download');
    expect(calls[5]?.method).toBe('POST');
    expect(calls[5]?.url).toBe('https://api.junglegrid.dev/v1/jobs/job%201/cancel');
    expect(calls[5]?.body).toBe(JSON.stringify({ reason: 'test cancellation' }));
    expect(calls.every((call) => !call.url.includes('test-api-key'))).toBe(true);
  });
});

describe('Jungle Grid API errors', () => {
  it('throws useful sanitized errors without request secrets', async () => {
    expect.assertions(6);

    await withMockedFetch(
      async () =>
        Response.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Bearer test-api-key cannot use callback-token-123.',
            },
          },
          {
            status: 403,
          },
        ),
      async () => {
        try {
          await jungleGridCommon.apiCall({
            auth,
            method: HttpMethod.POST,
            path: jungleGridCommon.endpoints.submitJob,
            body: {
              workload_type: 'batch',
              image: 'python:3.11',
              callback_auth_token: 'callback-token-123',
            },
          });
        } catch (error) {
          expect(error).toBeInstanceOf(JungleGridApiError);
          expect(error).toHaveProperty('status', 403);
          expect(error).toHaveProperty('code', 'FORBIDDEN');
          expect(error).toHaveProperty(
            'message',
            'FORBIDDEN: Bearer [redacted] cannot use [redacted].',
          );
          expect(error).not.toHaveProperty('request');
          expect(String(error)).not.toContain('test-api-key');
        }
      },
    );
  });
});

async function withMockedFetch(
  implementation: typeof fetch,
  run: () => Promise<void>,
): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = implementation;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function runAction(action: RunnableAction, propsValue: Record<string, unknown>): Promise<unknown> {
  return await action.run({
    auth,
    propsValue,
  } as never);
}

type RunnableAction = {
  run: (context: never) => Promise<unknown | void>;
};

type CapturedCall = {
  url: string;
  method: string;
  body?: string;
};
