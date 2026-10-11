import { format } from 'node:util';
import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  DeepgramApiError,
  deepgramClient,
  LONG_AUDIO_HINT,
} from '../src/common/client';
import { deepgramAuth } from '../src/common/auth';
import { API_KEY, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('deepgramClient.request', () => {
  test('sends a trimmed Token header to api.deepgram.com through a certificate-checking agent', async () => {
    const seen = stubFetch(() => ({ body: { projects: [] } }));
    await deepgramClient.request({
      apiKey: `  ${API_KEY}\n`,
      method: HttpMethod.GET,
      path: '/projects',
      timeoutMs: 1000,
      operation: 'list projects',
    });
    expect(seen[0].url).toBe('https://api.deepgram.com/v1/projects');
    expect(seen[0].headers.get('authorization')).toBe(`Token ${API_KEY}`);
    expect(seen[0].headers.get('accept')).toBe('application/json');
    expect(Reflect.get(Object(seen[0].dispatcher), 'constructor')?.name).toBe(
      'Agent'
    );
  });

  test('repeats array query parameters and skips empty ones', () => {
    const url = deepgramClient.buildUrl({
      path: '/listen',
      query: {
        model: 'nova-3',
        keyterm: ['Acme', 'Zed Co'],
        tag: [],
        language: undefined,
        redact: ['pci', 'pii'],
        smart_format: 'true',
      },
    });
    expect(url).toBe(
      'https://api.deepgram.com/v1/listen?model=nova-3&keyterm=Acme&keyterm=Zed+Co&redact=pci&redact=pii&smart_format=true'
    );
  });

  test('maps the legacy error shape', async () => {
    stubFetch(() => ({
      status: 400,
      body: {
        err_code: 'Bad Request',
        err_msg: 'No such model/version/tier combination found.',
        request_id: 'r-1',
      },
    }));
    const error = await deepgramClient
      .request({
        apiKey: API_KEY,
        method: HttpMethod.GET,
        path: '/x',
        timeoutMs: 1000,
        operation: 'do x',
      })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DeepgramApiError);
    const message = String(Reflect.get(Object(error), 'message'));
    expect(message).toBe(
      'Deepgram could not do x (HTTP 400 Bad Request): No such model/version/tier combination found. Deepgram request ID: r-1.'
    );
    expect(Reflect.get(Object(error), 'requestId')).toBe('r-1');
    expect(Reflect.get(Object(error), 'body')).toBeUndefined();
    expect(Reflect.get(Object(error), 'responseBody')).toBeDefined();
  });

  test('maps the modern error shape with a role hint on 403', async () => {
    stubFetch(() => ({
      status: 403,
      body: {
        category: 'INSUFFICIENT_PERMISSIONS',
        message: 'Your account does not have the required scope.',
        details: "Check the 'billing:read' scope.",
        request_id: 'r-2',
      },
    }));
    await expect(
      deepgramClient.request({
        apiKey: API_KEY,
        method: HttpMethod.GET,
        path: '/x',
        timeoutMs: 1000,
        operation: 'get balances',
      })
    ).rejects.toThrow(
      /HTTP 403 INSUFFICIENT_PERMISSIONS\): Your account does not have the required scope\. - Check the 'billing:read' scope\. .*Admin or Owner/
    );
  });

  test('maps a plain-text 401 and a 402 out-of-credit error', async () => {
    stubFetch((_, index) =>
      index === 0
        ? {
            status: 401,
            text: 'Invalid credentials.',
            headers: { 'content-type': 'text/plain' },
          }
        : {
            status: 402,
            body: {
              err_code: 'ASR_PAYMENT_REQUIRED',
              err_msg: 'Project does not have enough credits.',
            },
          }
    );
    await expect(
      deepgramClient.request({
        apiKey: API_KEY,
        method: HttpMethod.GET,
        path: '/x',
        timeoutMs: 1000,
        operation: 'x',
      })
    ).rejects.toThrow(
      'Deepgram could not x (HTTP 401): Invalid credentials. Check that the API key is correct'
    );
    await expect(
      deepgramClient.request({
        apiKey: API_KEY,
        method: HttpMethod.GET,
        path: '/x',
        timeoutMs: 1000,
        operation: 'x',
      })
    ).rejects.toThrow('out of credit');
  });

  test('uses the long-audio hint on a 504', async () => {
    stubFetch(() => ({ status: 504, text: '' }));
    await expect(
      deepgramClient.request({
        apiKey: API_KEY,
        method: HttpMethod.POST,
        path: '/listen',
        body: { url: 'https://a.io/a.mp3' },
        timeoutMs: 1000,
        operation: 'transcribe',
        timeoutHint: LONG_AUDIO_HINT,
      })
    ).rejects.toThrow(LONG_AUDIO_HINT);
  });

  test('reports a timeout in seconds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw Object.assign(new Error('aborted'), { name: 'AbortError' });
      })
    );
    await expect(
      deepgramClient.request({
        apiKey: API_KEY,
        method: HttpMethod.GET,
        path: '/x',
        timeoutMs: 480_000,
        operation: 'transcribe the audio',
        timeoutHint: LONG_AUDIO_HINT,
      })
    ).rejects.toThrow(
      `Deepgram did not answer within 480 seconds while trying to transcribe the audio. ${LONG_AUDIO_HINT}`
    );
  });

  test('keeps a failed 5 MB upload out of the error message and the log', async () => {
    stubFetch(() => ({
      status: 400,
      body: { err_code: 'Bad Request', err_msg: 'corrupt or unsupported data' },
    }));
    const logged: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      logged.push(format(...args));
    });
    const data = Buffer.alloc(5 * 1024 * 1024, 7);
    const error = await deepgramClient
      .request({
        apiKey: API_KEY,
        method: HttpMethod.POST,
        path: '/listen',
        body: deepgramClient.audioUploadBody(data),
        headers: { 'Content-Type': 'audio/wav' },
        timeoutMs: 1000,
        operation: 'transcribe',
      })
      .catch((e: unknown) => e);
    expect(String(Reflect.get(Object(error), 'message')).length).toBeLessThan(
      1024
    );
    expect(logged.join('\n').length).toBeLessThan(8192);
    expect(logged.join('\n')).toContain('[audio upload, 5242880 bytes]');
  });

  test('streams the upload unchanged', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    const data = Buffer.from(
      Array.from({ length: 200_000 }, (_, index) => index % 251)
    );
    await deepgramClient.request({
      apiKey: API_KEY,
      method: HttpMethod.POST,
      path: '/listen',
      body: deepgramClient.audioUploadBody(data),
      headers: { 'Content-Type': 'audio/wav' },
      timeoutMs: 1000,
      operation: 'x',
    });
    expect(seen[0].streamed).toBe(true);
    expect(seen[0].bytes?.equals(data)).toBe(true);
    expect(seen[0].headers.get('content-type')).toBe('audio/wav');
  });
});

describe('deepgramClient.maskUrlCredentials', () => {
  test('hides user and password in plain and percent-encoded URLs', () => {
    expect(deepgramClient.maskUrlCredentials('https://u:secret@x.io/cb')).toBe(
      'https://***@x.io/cb'
    );
    expect(
      deepgramClient.maskUrlCredentials(
        '/v1/listen?callback=https%3A%2F%2Fu%3Asecret%40x.io%2Fcb&model=nova'
      )
    ).toBe('/v1/listen?callback=https%3A%2F%2F***%40x.io%2Fcb&model=nova');
    expect(deepgramClient.maskUrlCredentials('https://x.io/path@v2')).toBe(
      'https://x.io/path@v2'
    );
    expect(deepgramClient.maskOptional(null)).toBeNull();
  });
});

describe('deepgramAuth.validate', () => {
  const validate = (auth: string) =>
    Reflect.get(Object(deepgramAuth), 'validate')({ auth });

  test('accepts a working key', async () => {
    stubFetch(() => ({ body: { projects: [] } }));
    await expect(validate('k')).resolves.toEqual({ valid: true });
  });

  test('rejects only on 401 or 403', async () => {
    stubFetch(() => ({ status: 401, text: 'Invalid credentials.' }));
    await expect(validate('k')).resolves.toEqual({
      valid: false,
      error: 'Invalid API key.',
    });
  });

  test('reports other failures as a reachability problem', async () => {
    stubFetch(() => ({ status: 503, text: 'unavailable' }));
    const result = await validate('k');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Could not reach Deepgram');
    expect(result.error).toContain('HTTP 503');
  });
});

describe('deepgramClient.maskUrlCredentials edge cases', () => {
  const mask = deepgramClient.maskUrlCredentials;
  test('masks credentials with percent-encoded characters', () => {
    expect(mask('https://alice:p%2Fsecret@hooks.example.com/cb')).toBe(
      'https://***@hooks.example.com/cb'
    );
    expect(mask('https://alice:p%40ss@hooks.example.com/cb')).toBe(
      'https://***@hooks.example.com/cb'
    );
  });
  test('masks a password containing ":" and a user without a password', () => {
    expect(mask('https://alice:pa:ss@x.io/cb')).toBe('https://***@x.io/cb');
    expect(mask('https://alice@x.io/cb')).toBe('https://***@x.io/cb');
  });
  test('masks URLs inside free text and percent-encoded query values', () => {
    expect(
      mask('Callback https://alice:p%2Fsecret@hooks.example.com/cb failed')
    ).toBe('Callback https://***@hooks.example.com/cb failed');
    expect(
      mask(
        '/v1/listen?callback=https%3A%2F%2Falice%3Ap%252Fs%40hooks.example.com%2Fcb'
      )
    ).toBe('/v1/listen?callback=https%3A%2F%2F***%40hooks.example.com%2Fcb');
  });
  test('leaves text without credentials untouched', () => {
    expect(mask('not a url at all')).toBe('not a url at all');
    expect(mask('email me at bob@example.com')).toBe(
      'email me at bob@example.com'
    );
    expect(mask('https://x.io/cb?a=1')).toBe('https://x.io/cb?a=1');
  });
});
