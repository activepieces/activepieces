import { HttpMethod } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_KEY,
  BASE,
  fail,
  ok,
  okWithStatus,
  request,
  sendRequest,
} from './helpers';
import {
  FlowluApiError,
  FlowluClient,
  flowluTiming,
  normalizeDomain,
  toFormBody,
} from '../src/lib/common/client';
import { flowluAuth } from '../src/lib/auth';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
});

const client = () => new FlowluClient('example', API_KEY);

async function caught(promise: Promise<unknown>): Promise<FlowluApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof FlowluApiError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected a FlowluApiError');
}

beforeEach(() => {
  sendRequest.mockReset();
  vi.restoreAllMocks();
});

describe('normalizeDomain', () => {
  it.each([
    ['example', 'example'],
    ['  Example  ', 'example'],
    ['example.flowlu.com', 'example'],
    ['https://example.flowlu.com/', 'example'],
    ['http://my-company.flowlu.com', 'my-company'],
  ])('accepts %s', (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });

  it.each([
    'example.flowlu.com.evil.io',
    'evil.io/x#',
    'evil.io',
    'user@evil.io',
    'https://evil.io/example.flowlu.com',
    'example.flowlu.com/../x',
    '-example',
    '',
    'exa mple',
  ])('rejects %s so the key never leaves *.flowlu.com', (input) => {
    expect(() => normalizeDomain(input)).toThrow(FlowluApiError);
  });
});

describe('toFormBody', () => {
  it('drops unset values instead of sending "undefined" or "null"', () => {
    const body = toFormBody({
      a: undefined,
      b: null,
      c: '',
      d: 0,
      e: false,
      f: true,
      g: 'x y',
      h: 1.5,
    });
    expect(body).toBe('d=0&e=0&f=1&g=x+y&h=1.5');
    expect(body).not.toContain('undefined');
    expect(body).not.toContain('null');
  });

  it('refuses objects and arrays', () => {
    expect(() => toFormBody({ a: { b: 1 } })).toThrow(FlowluApiError);
    expect(() => toFormBody({ a: [1] })).toThrow(FlowluApiError);
  });
});

describe('FlowluClient.request', () => {
  it('sends the key only as a query param to the portal host and never follows redirects', async () => {
    ok({ response: { id: 5 } });
    await client().getRecord('task', 'tasks', 5);
    const req = request(0);
    expect(req.method).toBe(HttpMethod.GET);
    expect(req.url).toBe(`${BASE}/task/tasks/get/5`);
    expect(req.queryParams).toEqual({ api_key: API_KEY });
    expect(req.body).toBeUndefined();
    expect(req.followRedirects).toBe(false);
  });

  it('posts a form-urlencoded body', async () => {
    ok({ response: { id: 9 } });
    await client().createRecord('crm', 'lead', {
      name: 'Deal',
      budget: 10,
      description: undefined,
    });
    const req = request(0);
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.headers).toEqual({
      'Content-Type': 'application/x-www-form-urlencoded',
    });
    expect(req.body).toBe('name=Deal&budget=10');
  });

  it('turns a 200 not-found body into a failure', async () => {
    ok({ error: { error_code: 20, error_msg: 'not found' } });
    const error = await caught(client().getRecord('task', 'tasks', 99));
    expect(error.message).toBe(
      'Flowlu could not find the record (error 20: not found). Check the ID.'
    );
    expect(error.errorCode).toBe(20);
    expect(error.responseBody).toEqual({
      error: { error_code: 20, error_msg: 'not found' },
    });
    expect(Reflect.has(error, 'body')).toBe(false);
  });

  it('turns a 200 validation body into a failure that names the field', async () => {
    ok({
      error: 'validation',
      description: 'Form filling error',
      details: { name: 'name cannot be empty' },
    });
    const error = await caught(client().createRecord('crm', 'lead', {}));
    expect(error.message).toBe(
      'Flowlu validation error: name: name cannot be empty.'
    );
  });

  it('names the portal host, never the key, on error 11', async () => {
    ok({ error: { error_code: 11, error_msg: 'account not found' } });
    const error = await caught(client().list('core', 'user'));
    expect(error.message).toContain('https://example.flowlu.com');
    expect(error.message).not.toContain(API_KEY);
    expect(error.errorCode).toBe(11);
  });

  it('retries 429 with 1 s, 2 s, 4 s backoff and then succeeds', async () => {
    const sleep = vi.spyOn(flowluTiming, 'sleep').mockResolvedValue();
    fail({ status: 429 });
    fail({ status: 429 });
    fail({ status: 429 });
    ok({ response: { id: 1 } });
    await expect(client().getRecord('task', 'tasks', 1)).resolves.toEqual({
      id: 1,
    });
    expect(sleep.mock.calls.map((call) => call[0])).toEqual([1000, 2000, 4000]);
    expect(sendRequest).toHaveBeenCalledTimes(4);
  });

  it('gives up after three 429 retries with a rate-limit message', async () => {
    vi.spyOn(flowluTiming, 'sleep').mockResolvedValue();
    fail({ status: 429 });
    fail({ status: 429 });
    fail({ status: 429 });
    fail({ status: 429, body: 'Too Many Requests' });
    const error = await caught(client().getRecord('task', 'tasks', 1));
    expect(error.status).toBe(429);
    expect(error.message).toContain('rate limit');
    expect(sendRequest).toHaveBeenCalledTimes(4);
  });

  it('does not retry other HTTP errors and keeps the vendor body in responseBody', async () => {
    fail({ status: 500, body: { message: 'boom' } });
    const error = await caught(client().getRecord('task', 'tasks', 1));
    expect(error.status).toBe(500);
    expect(error.message).toBe(
      'Flowlu request failed with HTTP 500: {"message":"boom"}'
    );
    expect(error.responseBody).toEqual({ message: 'boom' });
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('fails on a redirect instead of following it with the key', async () => {
    okWithStatus({ body: '', status: 302 });
    const error = await caught(client().getRecord('task', 'tasks', 1));
    expect(error.status).toBe(302);
    expect(error.message).toContain('redirected');
  });

  it('turns a timeout into a readable failure', async () => {
    const abort = new Error('This operation was aborted');
    abort.name = 'AbortError';
    sendRequest.mockRejectedValueOnce(abort);
    const error = await caught(client().getRecord('task', 'tasks', 1));
    expect(error.message).toBe(
      'Flowlu did not answer within 20 seconds. Try again later.'
    );
    expect(request(0)).toMatchObject({ timeout: 20000 });
  });

  it('fails on a non-JSON response', async () => {
    ok('<html>login</html>');
    const error = await caught(client().getRecord('task', 'tasks', 1));
    expect(error.message).toContain('unexpected response');
  });

  it('rejects an empty key and a bad domain before any request', () => {
    expect(() => new FlowluClient('example', '  ')).toThrow(FlowluApiError);
    expect(() => new FlowluClient('evil.io/x#', API_KEY)).toThrow(
      FlowluApiError
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('auth.validate', () => {
  const validate = (domain: string) =>
    Reflect.apply(asValidate(), undefined, [
      { auth: { domain, apiKey: API_KEY }, server: {} },
    ]);

  it('accepts a working key and calls the users list with limit 1', async () => {
    ok({ response: { items: [] } });
    await expect(validate('https://example.flowlu.com/')).resolves.toEqual({
      valid: true,
    });
    expect(request(0).url).toBe(`${BASE}/core/user/list`);
    expect(request(0).queryParams).toEqual({ limit: '1', api_key: API_KEY });
  });

  it('rejects a key Flowlu does not know', async () => {
    ok({ error: { error_code: 11, error_msg: 'api key not found' } });
    const result = await validate('example');
    expect(result.valid).toBe(false);
  });

  it('accepts a valid key that lacks access to the users module', async () => {
    ok({ error: { error_code: 30, error_msg: 'access denied' } });
    await expect(validate('example')).resolves.toEqual({ valid: true });
  });

  it('rejects a lookalike domain without sending the key', async () => {
    const result = await validate('example.flowlu.com.evil.io');
    expect(result.valid).toBe(false);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

function asValidate(): (
  ...args: unknown[]
) => Promise<{ valid: boolean; error?: string }> {
  const fn: unknown = Reflect.get(flowluAuth, 'validate');
  if (typeof fn !== 'function') {
    throw new Error('validate missing');
  }
  return (...args: unknown[]) =>
    Promise.resolve(Reflect.apply(fn, undefined, args));
}
