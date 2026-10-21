import { HttpError, httpClient, HttpRequest } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBatchResultsAction } from '../src/lib/actions/get-batch-results';
import { getBatchStatusAction } from '../src/lib/actions/get-batch-status';
import { startBatchVerificationAction } from '../src/lib/actions/start-batch-verification';
import { verifyEmailAction } from '../src/lib/actions/verify-email';
import { mailflossAuth } from '../src/lib/auth';
import { emailUndeliverableTrigger } from '../src/lib/triggers/email-undeliverable';
import { verificationJobFinishedTrigger } from '../src/lib/triggers/verification-job-finished';

const API_KEY = 'mf_live_test';
const sendRequest = vi.fn();

beforeEach(() => {
  sendRequest.mockReset();
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) =>
    sendRequest(request)
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function httpError(status: number) {
  return new HttpError({}, { status, responseBody: { error: { code: 'x' } } });
}

function request(call = 0): HttpRequest {
  return sendRequest.mock.calls[call][0];
}

function runAction<T extends { run: (ctx: never) => unknown }>(
  action: T,
  propsValue: Record<string, unknown>
) {
  return action.run({
    auth: { secret_text: API_KEY },
    propsValue,
  } as never);
}

function triggerContext(store: Map<string, unknown>, body?: unknown) {
  return {
    auth: { secret_text: API_KEY },
    webhookUrl: 'https://cloud.activepieces.com/api/v1/webhooks/flow123',
    payload: { body, headers: {}, queryParams: {} },
    store: {
      put: async (key: string, value: unknown) => store.set(key, value),
      get: async (key: string) => store.get(key) ?? null,
      delete: async (key: string) => {
        store.delete(key);
      },
    },
  } as never;
}

describe('auth', () => {
  const validate = (auth: string) =>
    mailflossAuth.validate!({ auth, server: {} as never });

  it('accepts a key that check-key accepts, sent as a Bearer token', async () => {
    sendRequest.mockResolvedValue(ok({ verified: true, status: 'success' }));
    expect(await validate(API_KEY)).toEqual({ valid: true });
    expect(request().url).toBe('https://api.mailfloss.com/v1/check-key');
    expect(request().authentication).toEqual({
      type: 'BEARER_TOKEN',
      token: API_KEY,
    });
  });

  it('rejects a key that check-key refuses', async () => {
    sendRequest.mockRejectedValue(httpError(401));
    expect(await validate('bad')).toEqual({
      valid: false,
      error: 'Invalid API key.',
    });
  });

  it('does not blame the key for a server error', async () => {
    sendRequest.mockRejectedValue(httpError(503));
    const result = await validate(API_KEY);
    expect(result.valid).toBe(false);
    expect(result).toHaveProperty('error', expect.stringContaining('reach'));
  });
});

describe('actions', () => {
  it('Verify Email calls /v1/verify with the trimmed address', async () => {
    const verdict = { email: 'jane@example.com', status: 'passed', passed: true };
    sendRequest.mockResolvedValue(ok(verdict));
    expect(await runAction(verifyEmailAction, { email: ' jane@example.com ' })).toEqual(verdict);
    expect(request()).toMatchObject({
      method: 'GET',
      url: 'https://api.mailfloss.com/v1/verify',
      queryParams: { email: 'jane@example.com' },
    });
  });

  it('Start Batch Verification splits, trims and drops empty addresses', async () => {
    sendRequest.mockResolvedValue(ok({ id: 'job_1' }));
    const result = await runAction(startBatchVerificationAction, {
      emails: ['a@example.com, b@example.com', '\nc@example.com\n', ' '],
      webhookUrl: '',
    });
    expect(result).toEqual({ id: 'job_1' });
    expect(request()).toMatchObject({
      method: 'POST',
      url: 'https://api.mailfloss.com/v1/batch-verify',
    });
    expect(request().body).toEqual({
      emails: ['a@example.com', 'b@example.com', 'c@example.com'],
    });
  });

  it('Start Batch Verification passes the callback URL as webhook_url', async () => {
    sendRequest.mockResolvedValue(ok({ id: 'job_1' }));
    await runAction(startBatchVerificationAction, {
      emails: ['a@example.com'],
      webhookUrl: 'https://example.com/hook',
    });
    expect(request().body).toEqual({
      emails: ['a@example.com'],
      webhook_url: 'https://example.com/hook',
    });
  });

  it('Start Batch Verification refuses an empty list', async () => {
    await expect(
      runAction(startBatchVerificationAction, { emails: [' ', ''] })
    ).rejects.toThrow('at least one email');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('Get Batch Status reads the job status', async () => {
    sendRequest.mockResolvedValue(ok({ id: 'job_1', processed: true }));
    await runAction(getBatchStatusAction, { jobId: 'job_1' });
    expect(request().url).toBe(
      'https://api.mailfloss.com/v1/batch-verify/job_1/status'
    );
  });

  it('Get Batch Results follows the next cursor to the last page', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: [{ email: 'a@example.com' }], next: 'c1' }))
      .mockResolvedValueOnce(ok({ data: [{ email: 'b@example.com' }] }));
    expect(await runAction(getBatchResultsAction, { jobId: 'job_1' })).toEqual([
      { email: 'a@example.com' },
      { email: 'b@example.com' },
    ]);
    expect(request(0)).toMatchObject({
      url: 'https://api.mailfloss.com/v1/batch-verify/job_1/results',
      queryParams: { per_page: '1000' },
    });
    expect(request(1).queryParams).toEqual({ per_page: '1000', next: 'c1' });
  });

  it('Get Batch Results stops when the cursor repeats', async () => {
    sendRequest.mockResolvedValue(ok({ data: [{ email: 'a@example.com' }], next: 'same' }));
    const results = await runAction(getBatchResultsAction, { jobId: 'job_1' });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(2);
  });
});

describe.each([
  ['Verification Job Finished', verificationJobFinishedTrigger, 'job-finished'],
  ['Email Undeliverable', emailUndeliverableTrigger, 'status-undeliverable'],
] as const)('%s trigger', (_name, trigger, event) => {
  it(`registers a ${event} webhook on enable and deletes it on disable`, async () => {
    const store = new Map<string, unknown>();
    sendRequest.mockResolvedValueOnce(ok({ id: 'wh_1' }));
    await trigger.onEnable(triggerContext(store));
    expect(request()).toMatchObject({
      method: 'POST',
      url: 'https://api.mailfloss.com/v1/webhooks',
      body: {
        url: 'https://cloud.activepieces.com/api/v1/webhooks/flow123',
        events: [event],
      },
    });

    sendRequest.mockResolvedValueOnce(ok({ id: 'wh_1', deleted: true }));
    await trigger.onDisable(triggerContext(store));
    expect(request(1)).toMatchObject({
      method: 'DELETE',
      url: 'https://api.mailfloss.com/v1/webhooks/wh_1',
    });
    expect(store.size).toBe(0);
  });

  it('treats a webhook already deleted in mailfloss as disabled', async () => {
    const store = new Map<string, unknown>();
    sendRequest.mockResolvedValueOnce(ok({ id: 'wh_1' }));
    await trigger.onEnable(triggerContext(store));
    sendRequest.mockRejectedValueOnce(httpError(404));
    await expect(trigger.onDisable(triggerContext(store))).resolves.toBeUndefined();
  });

  it('explains a 403 when the plan has no webhooks', async () => {
    sendRequest.mockRejectedValueOnce(httpError(403));
    await expect(trigger.onEnable(triggerContext(new Map()))).rejects.toThrow(
      'plan includes Webhooks'
    );
  });

  it('emits the delivered payload', async () => {
    const body = { id: 'job_1', email: 'jane@example.com' };
    expect(await trigger.run(triggerContext(new Map(), body))).toEqual([body]);
  });
});
