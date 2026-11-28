import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { datalabGuards } from './guards';

const BASE_URL = 'https://www.datalab.to/api/v1';
const KEYS_URL = 'https://www.datalab.to/app/keys';
const MAX_WAIT_MS = 240_000;
const SUBMIT_TIMEOUT_MS = 120_000;
const POLL_TIMEOUT_MS = 30_000;
const KEY_CHECK_TIMEOUT_MS = 15_000;
const SUBMIT_RETRY_WAITS_MS = [5_000, 10_000, 20_000];
const FIRST_POLL_MS = 1_000;
const MAX_POLL_MS = 5_000;
const POLL_GROWTH = 1.5;
const MAX_FAILED_POLLS_IN_A_ROW = 5;
const PAGE_LIMIT_PATTERN = /page rate limit exceeded/i;
const MAX_DETAIL_LENGTH = 300;

const OPERATION_LABELS: Record<DatalabOperation, string> = {
  convert: 'Convert Document',
  extract: 'Extract Structured Data',
  segment: 'Segment Document',
  fill: 'Fill Form',
  'form-fields': 'Get Form Fields',
  'create-document': 'Create Document',
};

const realTiming: DatalabTiming = {
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
};

async function checkKey({ apiKey }: { apiKey: string }): Promise<DatalabKeyCheck> {
  try {
    await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BASE_URL}/user_health`,
      headers: { 'X-API-Key': apiKey },
      timeout: KEY_CHECK_TIMEOUT_MS,
    });
    return 'valid';
  } catch (error) {
    const status = statusOf(error);
    if (status === 401) {
      return 'rejected';
    }
    if (status === 402) {
      return 'no_allowance';
    }
    throw toError({ error });
  }
}

async function submit({ apiKey, operation, body, timing = realTiming }: SubmitParams): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${BASE_URL}/${operation}`,
        headers: { 'X-API-Key': apiKey },
        body,
        timeout: SUBMIT_TIMEOUT_MS,
        retries: 0,
        redactBodyInErrors: true,
      });
      return readRequestId(response.body);
    } catch (error) {
      const status = statusOf(error);
      const wait = SUBMIT_RETRY_WAITS_MS[attempt];
      const mapped = toError({ error });
      if ((status !== 429 && status !== 503) || !mapped.retryable || wait === undefined) {
        throw mapped;
      }
      await timing.sleep(wait);
    }
  }
}

async function fetchOutcome({ apiKey, operation, requestId }: FetchParams): Promise<DatalabJobOutcome> {
  const id = requestId.trim();
  if (id.length === 0) {
    throw new Error('Give the Request ID that the Datalab action returned.');
  }
  let body: unknown;
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${BASE_URL}/${operation}/${encodeURIComponent(id)}`,
      headers: { 'X-API-Key': apiKey },
      timeout: POLL_TIMEOUT_MS,
      retries: 0,
    });
    body = response.body;
  } catch (error) {
    throw toError({ error, requestId: id });
  }
  const poll = datalabGuards.record(body);
  if (poll === undefined) {
    throw new Error(`Datalab sent an unexpected answer for request ${id}. Try again in a moment.`);
  }
  const status = datalabGuards.text(poll['status']) ?? 'processing';
  const stoppedWithoutSuccess = poll['success'] === false && status !== 'processing';
  if (status !== 'complete' && status !== 'failed' && !stoppedWithoutSuccess) {
    return { completed: false, requestId: id, status };
  }
  const result = await mergeOffloadedResult({ poll, requestId: id });
  assertSucceeded({ result, status, requestId: id });
  return { completed: true, requestId: id, result };
}

async function waitForResult({ apiKey, operation, requestId, timing = realTiming, maxWaitMs = MAX_WAIT_MS }: WaitParams): Promise<DatalabJobOutcome> {
  const deadline = timing.now() + maxWaitMs;
  let delay = FIRST_POLL_MS;
  let failedInARow = 0;
  let lastStatus = 'processing';
  while (timing.now() < deadline) {
    await timing.sleep(Math.min(delay, deadline - timing.now()));
    delay = Math.min(Math.round(delay * POLL_GROWTH), MAX_POLL_MS);
    try {
      const outcome = await fetchOutcome({ apiKey, operation, requestId });
      if (outcome.completed) {
        return outcome;
      }
      lastStatus = outcome.status;
      failedInARow = 0;
    } catch (error) {
      if (!(error instanceof DatalabError) || !error.retryable) {
        throw error;
      }
      failedInARow += 1;
      if (failedInARow >= MAX_FAILED_POLLS_IN_A_ROW) {
        throw error;
      }
    }
  }
  return { completed: false, requestId, status: lastStatus, waitedMs: maxWaitMs };
}

async function runJob({ apiKey, operation, body, timing = realTiming, maxWaitMs = MAX_WAIT_MS }: RunJobParams): Promise<DatalabJobOutcome> {
  const requestId = await submit({ apiKey, operation, body, timing });
  return waitForResult({ apiKey, operation, requestId, timing, maxWaitMs });
}

async function finish<T extends Record<string, unknown>>({ outcome, operation, audience, shape }: FinishParams<T>): Promise<DatalabActionOutput<T>> {
  if (outcome.completed) {
    const shaped = await shape(outcome.result);
    return { completed: true, status: 'complete', request_id: outcome.requestId, ...shaped };
  }
  const waitedMs = outcome.waitedMs ?? MAX_WAIT_MS;
  if (audience === 'human') {
    throw new DatalabWaitTimeoutError({ requestId: outcome.requestId, operation, waitedMs });
  }
  return { completed: false, status: outcome.status, request_id: outcome.requestId, message: waitTimeoutMessage({ requestId: outcome.requestId, operation, waitedMs, audience }) };
}

function appendFields({ form, fields }: { form: FormData; fields: Record<string, DatalabFormValue> }): void {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'string') {
      if (value.trim().length > 0) {
        form.append(key, value);
      }
      continue;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      form.append(key, String(value));
      continue;
    }
    form.append(key, JSON.stringify(value));
  }
}

function waitTimeoutMessage({ requestId, operation, waitedMs, audience }: { requestId: string; operation: DatalabOperation; waitedMs: number; audience: DatalabAudience }): string {
  const label = OPERATION_LABELS[operation];
  const minutes = Math.round(waitedMs / 60_000);
  const waited = minutes === 1 ? '1 minute' : `${minutes} minutes`;
  if (audience === 'human') {
    return `Timed out waiting for Datalab: it is still processing request ${requestId} after ${waited}, so this step stopped waiting. The ${label} request has not failed and keeps running at Datalab. To get the result, wait a minute or two and run this step again with the same inputs and Skip Cache off: once Datalab has finished, it usually returns the saved result in seconds. Or use the Get Result action with Operation "${label}" and this Request ID. Results are kept for about one day.`;
  }
  return `Timed out, not failed: Datalab is still processing request ${requestId} after ${waited}. Call Get Result with operation "${label}" and request_id "${requestId}" in about a minute, and repeat until completed is true. Do not call ${label} again right away: that starts a second request and waits again. Results are kept for about one day.`;
}

async function mergeOffloadedResult({ poll, requestId }: { poll: Record<string, unknown>; requestId: string }): Promise<Record<string, unknown>> {
  const resultUrl = datalabGuards.text(poll['result_url']);
  if (resultUrl === undefined) {
    return poll;
  }
  let body: unknown;
  try {
    const response = await httpClient.sendRequest({ method: HttpMethod.GET, url: resultUrl, timeout: SUBMIT_TIMEOUT_MS, retries: 2 });
    body = response.body;
  } catch (error) {
    throw new DatalabError({
      message: `Datalab finished request ${requestId} but its result file could not be downloaded (${describeFailure(error)}). Run Get Result to try again.`,
      retryable: false,
    });
  }
  const offloaded = datalabGuards.record(datalabGuards.parseJsonText(body));
  if (offloaded === undefined) {
    throw new DatalabError({
      message: `Datalab finished request ${requestId} but its result file was not readable. Run Get Result to try again.`,
      retryable: false,
    });
  }
  const merged: Record<string, unknown> = { ...offloaded };
  for (const [key, value] of Object.entries(poll)) {
    if (value !== null && value !== undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

function assertSucceeded({ result, status, requestId }: { result: Record<string, unknown>; status: string; requestId: string }): void {
  if (result['success'] !== false && status === 'complete') {
    return;
  }
  const reason = datalabGuards.text(result['error']) ?? 'Datalab gave no reason';
  if (PAGE_LIMIT_PATTERN.test(reason)) {
    throw new DatalabError({ message: pageLimitMessage(reason), retryable: false });
  }
  throw new DatalabError({ message: `Datalab could not process the document (request ${requestId}): ${reason}`, retryable: false });
}

function readRequestId(body: unknown): string {
  const submitted = datalabGuards.record(body);
  const requestId = datalabGuards.text(submitted?.['request_id']);
  if (submitted === undefined || requestId === undefined) {
    throw new DatalabError({ message: 'Datalab accepted the request but did not return a request ID. Try again.', retryable: false });
  }
  if (submitted['success'] === false) {
    throw new DatalabError({
      message: `Datalab refused the request: ${datalabGuards.text(submitted['error']) ?? 'no reason given'}`,
      retryable: false,
    });
  }
  return requestId;
}

function toError({ error, requestId }: { error: unknown; requestId?: string }): DatalabError {
  if (error instanceof DatalabError) {
    return error;
  }
  if (!(error instanceof HttpError)) {
    return new DatalabError({ message: `Could not reach Datalab: ${describeFailure(error)}`, retryable: true });
  }
  const status = error.response.status;
  const detail = readDetail(error.response.body);
  if (status === 401) {
    return new DatalabError({ message: `Datalab rejected the API key. Create a new key at ${KEYS_URL} and update the connection.`, retryable: false });
  }
  if (status === 402) {
    return new DatalabError({
      message: `Datalab refused the request because the free allowance or this API key's spend limit is used up. Add credit, or raise the key's limit at ${KEYS_URL}, then run the step again.`,
      retryable: false,
    });
  }
  if (status === 403) {
    return new DatalabError({ message: `Datalab denied the request: ${detail ?? 'this key is not allowed to do that'}`, retryable: false });
  }
  if (status === 404 && requestId !== undefined) {
    return new DatalabError({
      message: `Datalab could not find request ${requestId}. Check the Request ID. Results are deleted about one day after they finish.`,
      retryable: false,
    });
  }
  if (status === 429) {
    if (detail !== undefined && PAGE_LIMIT_PATTERN.test(detail)) {
      return new DatalabError({ message: pageLimitMessage(detail), retryable: false });
    }
    return new DatalabError({
      message: `Datalab is rate limiting this API key${detail === undefined ? '' : ` (${detail})`}. Wait a minute and run the step again, or space your requests out.`,
      retryable: true,
    });
  }
  if (status >= 500) {
    return new DatalabError({ message: `Datalab had a problem (HTTP ${status})${detail === undefined ? '' : `: ${detail}`}. Try again in a moment.`, retryable: true });
  }
  return new DatalabError({ message: `Datalab rejected the request (HTTP ${status}): ${detail ?? 'no details given'}`, retryable: false });
}

function pageLimitMessage(reason: string): string {
  return `Datalab stopped the request because your team has too many pages in progress at once. Wait for running requests to finish, then run the step again. Datalab said: ${reason}`;
}

function readDetail(body: unknown): string | undefined {
  const parsed = datalabGuards.record(datalabGuards.parseJsonText(body));
  if (parsed === undefined) {
    return shorten(datalabGuards.text(body));
  }
  const detail = parsed['detail'];
  if (Array.isArray(detail)) {
    const parts = detail.map(describeValidationIssue).filter((part): part is string => part !== undefined);
    return parts.length > 0 ? shorten(parts.join('; ')) : undefined;
  }
  return shorten(datalabGuards.text(detail) ?? datalabGuards.text(parsed['error']));
}

function shorten(detail: string | undefined): string | undefined {
  if (detail === undefined) {
    return undefined;
  }
  const flat = detail.replace(/\s+/g, ' ').trim();
  return flat.length > MAX_DETAIL_LENGTH ? `${flat.slice(0, MAX_DETAIL_LENGTH)}...` : flat;
}

function describeValidationIssue(issue: unknown): string | undefined {
  const entry = datalabGuards.record(issue);
  const message = datalabGuards.text(entry?.['msg']);
  if (entry === undefined || message === undefined) {
    return undefined;
  }
  const field = datalabGuards
    .list(entry['loc'])
    .filter((part) => part !== 'body')
    .map((part) => String(part))
    .join('.');
  return field.length > 0 ? `${field}: ${message}` : message;
}

function describeFailure(error: unknown): string {
  if (error instanceof HttpError) {
    return `HTTP ${error.response.status}`;
  }
  return error instanceof Error ? error.message : String(error);
}

function statusOf(error: unknown): number | undefined {
  return error instanceof HttpError ? error.response.status : undefined;
}

class DatalabError extends Error {
  readonly retryable: boolean;

  constructor({ message, retryable }: { message: string; retryable: boolean }) {
    super(message);
    this.name = 'DatalabError';
    this.retryable = retryable;
  }
}

class DatalabWaitTimeoutError extends Error {
  readonly requestId: string;
  readonly operation: DatalabOperation;
  readonly waitedMs: number;

  constructor({ requestId, operation, waitedMs }: { requestId: string; operation: DatalabOperation; waitedMs: number }) {
    super(waitTimeoutMessage({ requestId, operation, waitedMs, audience: 'human' }));
    this.name = 'DatalabWaitTimeoutError';
    this.requestId = requestId;
    this.operation = operation;
    this.waitedMs = waitedMs;
  }
}

export const datalabClient = {
  BASE_URL,
  KEYS_URL,
  MAX_WAIT_MS,
  OPERATION_LABELS,
  checkKey,
  submit,
  fetchOutcome,
  waitForResult,
  runJob,
  finish,
  appendFields,
  toError,
  describeFailure,
  DatalabError,
  DatalabWaitTimeoutError,
};

export type DatalabOperation = 'convert' | 'extract' | 'segment' | 'fill' | 'form-fields' | 'create-document';

export type DatalabAudience = 'human' | 'ai';

export type DatalabKeyCheck = 'valid' | 'rejected' | 'no_allowance';

export type DatalabTiming = {
  sleep: (ms: number) => Promise<void>;
  now: () => number;
};

export type DatalabFormValue = string | number | boolean | Record<string, unknown> | unknown[] | null | undefined;

export type DatalabJobOutcome =
  | { completed: true; requestId: string; result: Record<string, unknown> }
  | { completed: false; requestId: string; status: string; waitedMs?: number };

export type DatalabActionOutput<T extends Record<string, unknown>> =
  | ({ completed: true; status: 'complete'; request_id: string } & T)
  | { completed: false; status: string; request_id: string; message: string };

type SubmitParams = {
  apiKey: string;
  operation: DatalabOperation;
  body: FormData | Record<string, unknown>;
  timing?: DatalabTiming;
};

type FetchParams = {
  apiKey: string;
  operation: DatalabOperation;
  requestId: string;
};

type WaitParams = FetchParams & {
  timing?: DatalabTiming;
  maxWaitMs?: number;
};

type RunJobParams = SubmitParams & {
  maxWaitMs?: number;
};

type FinishParams<T extends Record<string, unknown>> = {
  outcome: DatalabJobOutcome;
  operation: DatalabOperation;
  audience: DatalabAudience;
  shape: (result: Record<string, unknown>) => Promise<T> | T;
};
