import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { describe, expect, it } from 'vitest';
import { jungleGrid } from '../src';
import { cancelJob } from '../src/lib/actions/cancel-job';
import { estimateJob } from '../src/lib/actions/estimate-job';
import { getArtifactDownloadUrl } from '../src/lib/actions/get-artifact-download-url';
import { getJobEvents } from '../src/lib/actions/get-job-events';
import { getJobLogs } from '../src/lib/actions/get-job-logs';
import { getJobStatus } from '../src/lib/actions/get-job-status';
import { listJobInputs } from '../src/lib/actions/list-job-inputs';
import { listArtifacts } from '../src/lib/actions/list-artifacts';
import { listJobs } from '../src/lib/actions/list-jobs';
import { submitJob } from '../src/lib/actions/submit-job';
import { uploadJobInput } from '../src/lib/actions/upload-job-input';
import { JungleGridApiError, jungleGridCommon } from '../src/lib/common';

const auth = {
  props: {
    api_base_url: 'https://workspace.junglegrid.test/api/',
    api_key: 'test-api-key',
  },
};

describe('jungleGridCommon payload helpers', () => {
  it('builds MCP-compatible submit payloads and strips empty optional fields', () => {
    expect.assertions(1);

    expect(
      jungleGridCommon.buildSubmitJobPayload({
        name: 'batch-demo',
        workload_type: 'fine_tuning',
        image: 'python:3.11',
        model_size_gb: 1,
        command: ['python', 'train.py', ''],
        args: ['--epochs', '3', ''],
        routing_mode: 'cost',
        env: {
          EPOCHS: '3',
        },
        input_files: ['inp_dataset'],
        script_files: [{ input_id: 'inp_script' }],
        expected_artifacts: ['/workspace/artifacts/model.bin'],
        template: 'lora',
        metadata: {
          source: 'activepieces',
        },
        callback_url: 'https://api.example.com/jungle/webhook',
      }),
    ).toStrictEqual({
      name: 'batch-demo',
      workload_type: 'fine-tuning',
      image: 'python:3.11',
      model_size_gb: 1,
      command: ['python', 'train.py'],
      args: ['--epochs', '3'],
      environment: {
        EPOCHS: '3',
      },
      input_files: [{ input_id: 'inp_dataset' }],
      script_files: [{ input_id: 'inp_script' }],
      expected_artifacts: ['/workspace/artifacts/model.bin'],
      optimize_for: 'cost',
      template: 'lora',
      metadata: {
        source: 'activepieces',
      },
      webhook_url: 'https://api.example.com/jungle/webhook',
    });
  });

  it('preserves existing command and args compatibility', () => {
    expect.assertions(1);

    expect(
      jungleGridCommon.buildSubmitJobPayload({
        name: 'legacy-command',
        workload_type: 'batch',
        image: 'python:3.11',
        command: 'python',
        args: ['-c', 'print(42)'],
        optimize_for: 'balanced',
      }),
    ).toMatchObject({
      command: 'python',
      args: ['-c', 'print(42)'],
      optimize_for: 'balanced',
    });
  });

  it('validates malformed payload fields before calling the API', () => {
    expect.assertions(6);

    expect(() =>
      jungleGridCommon.buildSubmitJobPayload({
        workload_type: 'batch',
        image: 'python:3.11',
      }),
    ).toThrow('Job Name is required.');

    expect(() =>
      jungleGridCommon.buildSubmitJobPayload({
        name: 'bad-workload',
        workload_type: 'fine-tuning',
        image: 'python:3.11',
      }),
    ).toThrow('workload_type must be one of: inference, training, fine_tuning, batch.');

    expect(() =>
      jungleGridCommon.buildSubmitJobPayload({
        name: 'bad-env',
        workload_type: 'batch',
        image: 'python:3.11',
        env: {
          COUNT: 3,
        },
      }),
    ).toThrow('env.COUNT must be a string.');

    expect(() =>
      jungleGridCommon.buildSubmitJobPayload({
        name: 'bad-input',
        workload_type: 'batch',
        image: 'python:3.11',
        input_files: [{}],
      }),
    ).toThrow('input_files[0] must include input_id.');

    expect(() =>
      jungleGridCommon.buildSubmitJobPayload({
        name: 'bad-artifact',
        workload_type: 'batch',
        image: 'python:3.11',
        expected_artifacts: [42],
      }),
    ).toThrow('expected_artifacts[0] must be a string.');

    expect(() =>
      jungleGridCommon.buildSubmitJobPayload({
        name: 'bad-callback',
        workload_type: 'batch',
        image: 'python:3.11',
        callback_url: 'http://example.com/jungle/webhook',
      }),
    ).toThrow('Callback URL must use HTTPS unless it targets localhost.');
  });

  it('validates pagination ranges', () => {
    expect.assertions(3);

    expect(() =>
      jungleGridCommon.buildLogsQueryParams({
        limit: 1001,
      }),
    ).toThrow('limit must be between 1 and 1000.');

    expect(() =>
      jungleGridCommon.buildListJobsQueryParams({
        limit: 0,
      }),
    ).toThrow('limit must be between 1 and 100.');

    expect(() =>
      jungleGridCommon.buildEventsQueryParams({
        limit: 1001,
      }),
    ).toThrow('limit must be between 1 and 1000.');
  });
});

describe('Jungle Grid actions', () => {
  it('uses the configured API base URL and bearer auth for JSON requests', async () => {
    expect.assertions(11);
    const calls: CapturedCall[] = [];

    await withMockedFetch(
      async (input, init) => {
        calls.push(captureCall({ input, init }));
        return Response.json({
          ok: true,
        });
      },
      async () => {
        await runAction(estimateJob, {
          workload_type: 'batch',
          image: 'python:3.11',
          routing_mode: 'balanced',
        });
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
          limit: 50,
          cursor: '42',
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

    expect(calls).toHaveLength(7);
    expect(calls.every((call) => call.url.startsWith('https://workspace.junglegrid.test/api/'))).toBe(true);
    expect(calls.every((call) => call.headers.Authorization === 'Bearer test-api-key')).toBe(true);
    expect(calls[0]?.url).toBe('https://workspace.junglegrid.test/api/v1/mcp/jobs/estimate');
    expect(calls[1]?.url).toBe('https://workspace.junglegrid.test/api/v1/mcp/jobs?limit=20&cursor=10&status=running');
    expect(calls[2]?.url).toBe('https://workspace.junglegrid.test/api/v1/mcp/jobs/job%201');
    expect(calls[3]?.url).toBe('https://workspace.junglegrid.test/api/v1/mcp/jobs/job%201/logs?limit=50&cursor=42');
    expect(calls[4]?.url).toBe('https://workspace.junglegrid.test/api/v1/mcp/jobs/job%201/artifacts');
    expect(calls[5]?.url).toBe('https://workspace.junglegrid.test/api/v1/mcp/jobs/job%201/artifacts/art%2F1/download');
    expect(calls[6]?.url).toBe('https://workspace.junglegrid.test/api/v1/mcp/jobs/job%201/cancel');
    expect(calls[6]?.body).toBe(JSON.stringify({ reason: 'test cancellation' }));
  });

  it('submit_job supports MCP file references, artifacts, env, and fine_tuning', async () => {
    expect.assertions(4);

    await withMockedFetch(
      async (input, init) => {
        expect(String(input)).toBe('https://workspace.junglegrid.test/api/v1/mcp/jobs');
        expect(init?.method).toBe('POST');
        expect(init?.body).toBe(JSON.stringify({
          name: 'train-model',
          image: 'python:3.11',
          workload_type: 'fine-tuning',
          command: ['python', 'train.py'],
          environment: {
            EPOCHS: '3',
          },
          input_files: [{ input_id: 'inp_dataset' }],
          script_files: [{ input_id: 'inp_script' }],
          expected_artifacts: ['/workspace/artifacts/model.bin'],
          optimize_for: 'speed',
        }));
        return Response.json({
          job_id: 'job_123',
          status: 'queued',
        }, {
          status: 202,
        });
      },
      async () => {
        const result = await runAction(submitJob, {
          name: 'train-model',
          workload_type: 'fine_tuning',
          image: 'python:3.11',
          command: ['python', 'train.py'],
          env: {
            EPOCHS: '3',
          },
          input_files: ['inp_dataset'],
          script_files: ['inp_script'],
          expected_artifacts: ['/workspace/artifacts/model.bin'],
          routing_mode: 'speed',
        });

        expect(result).toStrictEqual({
          job_id: 'job_123',
          status: 'queued',
        });
      },
    );
  });

  it('upload_job_input creates a slot, uploads bytes, completes the upload, and preserves filename', async () => {
    expect.assertions(13);
    const calls: CapturedCall[] = [];

    await withMockedFetch(
      async (input, init) => {
        calls.push(captureCall({ input, init }));
        if (String(input) === 'https://workspace.junglegrid.test/api/v1/job-inputs') {
          return Response.json({
            upload: {
              input_id: 'inp_script',
              filename: 'train.py',
              method: 'PUT',
              upload_url: 'https://uploads.junglegrid.test/inp_script',
              token: 'upload-token',
              complete_url: '/v1/job-inputs/inp_script/complete',
            },
          });
        }
        if (String(input) === 'https://uploads.junglegrid.test/inp_script') {
          return new Response(undefined, { status: 200 });
        }
        return Response.json({
          input_id: 'inp_script',
          status: 'ready',
        });
      },
      async () => {
        const result = await runAction(uploadJobInput, {
          file: {
            filename: 'train.py',
            base64: Buffer.from('print(42)').toString('base64'),
            contentType: 'text/x-python',
          },
          kind: 'script',
        });

        expect(result).toMatchObject({
          input_id: 'inp_script',
          filename: 'train.py',
          content_type: 'text/x-python',
          kind: 'script',
          complete: {
            input_id: 'inp_script',
            status: 'ready',
          },
        });
      },
    );

    expect(calls).toHaveLength(3);
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.headers.Authorization).toBe('Bearer test-api-key');
    expect(calls[0]?.body).toBe(JSON.stringify({
      filename: 'train.py',
      content_type: 'text/x-python',
      kind: 'script',
    }));
    expect(calls[1]?.method).toBe('PUT');
    expect(calls[1]?.url).toBe('https://uploads.junglegrid.test/inp_script');
    expect(calls[1]?.headers.Authorization).toBe('Bearer upload-token');
    expect(Buffer.from(calls[1]?.body as Buffer).toString()).toBe('print(42)');
    expect(calls[2]?.method).toBe('POST');
    expect(calls[2]?.url).toBe('https://workspace.junglegrid.test/api/v1/job-inputs/inp_script/complete');
    expect(calls[2]?.headers.Authorization).toBe('Bearer test-api-key');
    expect(calls.every((call) => !call.url.includes('test-api-key'))).toBe(true);
  });

  it('list_job_inputs and get_job_events call the correct endpoints with query parameters', async () => {
    expect.assertions(5);
    const calls: CapturedCall[] = [];

    await withMockedFetch(
      async (input, init) => {
        calls.push(captureCall({ input, init }));
        return Response.json({
          ok: true,
        });
      },
      async () => {
        await runAction(listJobInputs, {
          limit: 20,
          cursor: 'cur_1',
          kind: 'script',
          status: 'ready',
        });
        await runAction(getJobEvents, {
          job_id: 'job 1',
          limit: 100,
          cursor: 'evt_1',
          type: 'running',
          since: '2026-06-04T10:00:00Z',
        });
      },
    );

    expect(calls).toHaveLength(2);
    expect(calls[0]?.method).toBe('GET');
    expect(calls[0]?.url).toBe('https://workspace.junglegrid.test/api/v1/job-inputs?limit=20&cursor=cur_1&status=ready&kind=script');
    expect(calls[1]?.method).toBe('GET');
    expect(calls[1]?.url).toBe('https://workspace.junglegrid.test/api/v1/jobs/job%201/events?limit=100&cursor=evt_1&type=running&since=2026-06-04T10%3A00%3A00Z');
  });

  it('omits undefined optional properties from JSON bodies', async () => {
    expect.assertions(1);

    expect(
      jungleGridCommon.buildSubmitJobPayload({
        name: 'minimal',
        workload_type: 'batch',
        image: 'python:3.11',
        command: '',
        args: [],
        input_files: [],
      }),
    ).toStrictEqual({
      name: 'minimal',
      image: 'python:3.11',
      workload_type: 'batch',
    });
  });

  it('custom_api_call uses the configured base URL instead of the default production URL', async () => {
    expect.assertions(3);
    const customApiCall = jungleGrid.getAction('custom_api_call');
    if (customApiCall === undefined) {
      throw new Error('Custom API Call action was not registered.');
    }

    await withMockedHttpClient(
      async (request) => {
        expect(request.url).toBe('https://workspace.junglegrid.test/api/v1/job-inputs');
        expect(request.headers).toMatchObject({
          Authorization: 'Bearer test-api-key',
        });
        return {
          status: 200,
          headers: {},
          body: {
            ok: true,
          },
        };
      },
      async () => {
        const result = await customApiCall.run({
          auth,
          propsValue: {
            url: {
              url: '/v1/job-inputs',
            },
            method: HttpMethod.GET,
            headers: {},
            queryParams: {},
            body_type: 'none',
            failsafe: false,
            response_is_binary: false,
            followRedirects: false,
          },
          files: {
            write: async () => '',
          },
        } as never);

        expect(result).toStrictEqual({
          status: 200,
          headers: {},
          body: {
            ok: true,
          },
        });
      },
    );
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

async function withMockedHttpClient(
  implementation: HttpClientSendRequest,
  run: () => Promise<void>,
): Promise<void> {
  const client = httpClient as unknown as MutableHttpClient;
  const originalSendRequest = client.sendRequest;
  client.sendRequest = implementation;

  try {
    await run();
  } finally {
    client.sendRequest = originalSendRequest;
  }
}

async function runAction(action: RunnableAction, propsValue: Record<string, unknown>): Promise<unknown> {
  return await action.run({
    auth,
    propsValue,
  } as never);
}

function captureCall({
  input,
  init,
}: CaptureCallParams): CapturedCall {
  return {
    url: String(input),
    method: init?.method ?? 'GET',
    headers: headersRecord(init?.headers),
    body: init?.body,
  };
}

function headersRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (headers === undefined) {
    return {};
  }
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

type RunnableAction = {
  run: (context: never) => Promise<unknown | void>;
};

type CapturedCall = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: BodyInit | null;
};

type CaptureCallParams = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

type HttpClientRequest = {
  url: string;
  headers?: Record<string, unknown>;
};

type HttpClientResponse = {
  status: number;
  headers: Record<string, unknown>;
  body: unknown;
};

type HttpClientSendRequest = (request: HttpClientRequest) => Promise<HttpClientResponse>;

type MutableHttpClient = {
  sendRequest: HttpClientSendRequest;
};
