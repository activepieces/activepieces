import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { GoogleDocumentAiApi, GoogleDocumentAiApiError, apiBase, parentOf, processorResourceName } = await import('../../../src/lib/common/client');

const AUTH = { accessToken: 'ya29.test', projectId: 'my-project', location: 'eu' };
const BASE = 'https://eu-documentai.googleapis.com/v1';
const PROCESSOR = 'projects/my-project/locations/eu/processors/abc';
const SECRET_CONTENT = Buffer.from('%PDF-1.7 confidential payroll of ACME, employee 4711, salary 9999 '.repeat(20)).toString('base64');

const fetchMock = vi.fn<(input: unknown, init?: RequestInit) => Promise<Response>>();

function jsonResponse({ status = 200, body }: { status?: number; body: unknown }): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function sentInit(call: number): RequestInit {
  return fetchMock.mock.calls[call]?.[1] ?? {};
}

function errorChain(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  while (current instanceof Error) {
    parts.push(current.message, current.stack ?? '', JSON.stringify(current));
    current = current.cause;
  }
  if (current !== undefined) parts.push(String(current));
  return parts.join('\n');
}

function processSecret(): Promise<unknown> {
  return GoogleDocumentAiApi.process({
    auth: AUTH,
    processorName: PROCESSOR,
    request: { rawDocument: { content: SECRET_CONTENT, mimeType: 'application/pdf', displayName: 'payroll.pdf' } },
  }).then(
    () => undefined,
    (e: unknown) => e
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input) => {
    throw new Error(`Unexpected network call in tests: ${String(input)}`);
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('apiBase() / parentOf() / processorResourceName()', () => {
  it('should build the regional base and the parent', () => {
    expect(apiBase('us')).toBe('https://us-documentai.googleapis.com/v1');
    expect(parentOf(AUTH)).toBe('projects/my-project/locations/eu');
  });

  it('should accept a bare id, a full name, and append a version', () => {
    expect(processorResourceName({ auth: AUTH, processor: 'abc123' })).toBe('projects/my-project/locations/eu/processors/abc123');
    expect(processorResourceName({ auth: AUTH, processor: 'projects/1/locations/us/processors/x' })).toBe('projects/1/locations/us/processors/x');
    expect(processorResourceName({ auth: AUTH, processor: 'abc123', version: 'pretrained-ocr-v2.0-2023-06-02' })).toBe(
      'projects/my-project/locations/eu/processors/abc123/processorVersions/pretrained-ocr-v2.0-2023-06-02'
    );
    expect(processorResourceName({ auth: AUTH, processor: 'abc123', version: 'processorVersions/v1' })).toBe('projects/my-project/locations/eu/processors/abc123/processorVersions/v1');
  });

  it('should reject empty, malformed and double-versioned names', () => {
    expect(() => processorResourceName({ auth: AUTH, processor: '' })).toThrow('Pick a processor');
    expect(() => processorResourceName({ auth: AUTH, processor: 'projects/1/processors/x' })).toThrow('not a processor resource name');
    expect(() => processorResourceName({ auth: AUTH, processor: 'abc/def' })).toThrow('not a processor id');
    expect(() => processorResourceName({ auth: AUTH, processor: 'projects/1/locations/us/processors/x/processorVersions/v1', version: 'v2' })).toThrow('already carries a version');
  });
});

describe('GoogleDocumentAiApiError', () => {
  it('should surface status, message, reason, field violations and a setup hint', () => {
    const error = GoogleDocumentAiApiError.fromResponse({
      status: 403,
      body: {
        error: {
          code: 403,
          message: 'Cloud Document AI API has not been used in project 123 before or it is disabled.',
          status: 'PERMISSION_DENIED',
          details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'SERVICE_DISABLED', domain: 'googleapis.com' }],
        },
      },
    });
    expect(error.message).toBe(
      'Google Document AI returned 403 (PERMISSION_DENIED): Cloud Document AI API has not been used in project 123 before or it is disabled. [reason: SERVICE_DISABLED] Enable the Cloud Document AI API in the Google Cloud project of the connection.'
    );

    const bad = GoogleDocumentAiApiError.fromResponse({
      status: 400,
      body: {
        error: {
          code: 400,
          message: 'Request contains an invalid argument.',
          status: 'INVALID_ARGUMENT',
          details: [{ '@type': 'type.googleapis.com/google.rpc.BadRequest', fieldViolations: [{ field: 'raw_document.mime_type', description: 'Unsupported input file format.' }] }],
        },
      },
    });
    expect(bad.message).toBe('Google Document AI returned 400 (INVALID_ARGUMENT): Request contains an invalid argument. [raw_document.mime_type: Unsupported input file format.]');
    expect(bad.fieldViolations).toHaveLength(1);
  });

  it('should hint at the page limit and at the role on a plain 403', () => {
    expect(GoogleDocumentAiApiError.fromResponse({ status: 400, body: { error: { code: 400, status: 'INVALID_ARGUMENT', message: 'Document pages exceed the limit: 15 got 40.' } } }).message).toContain('up to 15 pages');
    expect(GoogleDocumentAiApiError.fromResponse({ status: 403, body: { error: { code: 403, status: 'PERMISSION_DENIED', message: 'Permission denied on resource.' } } }).message).toContain('roles/documentai.apiUser');
  });

  it('should fall back to the raw response body, truncated, when it is not a google.rpc.Status', () => {
    expect(GoogleDocumentAiApiError.fromResponse({ status: 502, body: 'Bad Gateway' }).message).toBe('Google Document AI returned 502: Bad Gateway');
    expect(GoogleDocumentAiApiError.fromResponse({ status: 502, body: 'x'.repeat(2000) }).message.length).toBeLessThan(600);
  });
});

describe('GoogleDocumentAiApi', () => {
  it('listProcessors() should GET the parent on the regional host with a bearer token and follow pages', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ body: { processors: [{ name: 'projects/1/locations/eu/processors/a' }], nextPageToken: 'p2' } }))
      .mockResolvedValueOnce(jsonResponse({ body: { processors: [{ name: 'projects/1/locations/eu/processors/b' }] } }));

    const processors = await GoogleDocumentAiApi.listProcessors(AUTH);

    expect(processors.map((p) => p.name)).toEqual(['projects/1/locations/eu/processors/a', 'projects/1/locations/eu/processors/b']);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${BASE}/projects/my-project/locations/eu/processors?pageSize=100`);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(`${BASE}/projects/my-project/locations/eu/processors?pageSize=100&pageToken=p2`);
    expect(sentInit(0)).toMatchObject({ method: 'GET', headers: { Authorization: 'Bearer ya29.test', Accept: 'application/json' } });
    expect(sentInit(0).body).toBeUndefined();
    expect(sentInit(0).signal).toBeInstanceOf(AbortSignal);
  });

  it('listProcessors() should return an empty list for an empty project', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: {} }));
    await expect(GoogleDocumentAiApi.listProcessors(AUTH)).resolves.toEqual([]);
  });

  it('getProcessor() should GET the processor resource', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { name: PROCESSOR, type: 'OCR_PROCESSOR' } }));
    await expect(GoogleDocumentAiApi.getProcessor({ auth: AUTH, processor: 'abc' })).resolves.toEqual({ name: PROCESSOR, type: 'OCR_PROCESSOR' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${BASE}/${PROCESSOR}`);
  });

  it('process() should POST the JSON request to the processor', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { document: { text: 'hello' } } }));

    const response = await GoogleDocumentAiApi.process({
      auth: AUTH,
      processorName: PROCESSOR,
      request: {
        rawDocument: { content: 'aGVsbG8=', mimeType: 'application/pdf' },
        fieldMask: 'text',
        imagelessMode: true,
      },
    });

    expect(response.document?.text).toBe('hello');
    expect(fetchMock.mock.calls[0]?.[0]).toBe(`${BASE}/${PROCESSOR}:process`);
    expect(sentInit(0)).toMatchObject({ method: 'POST', headers: { Authorization: 'Bearer ya29.test', 'Content-Type': 'application/json' } });
    expect(JSON.parse(String(sentInit(0).body))).toEqual({ rawDocument: { content: 'aGVsbG8=', mimeType: 'application/pdf' }, fieldMask: 'text', imagelessMode: true });
  });

  it('process() should refuse a request without a document, and wrap API failures', async () => {
    await expect(GoogleDocumentAiApi.process({ auth: AUTH, processorName: 'projects/p/locations/eu/processors/a', request: {} })).rejects.toThrow('needs a rawDocument or a gcsDocument');
    expect(fetchMock).not.toHaveBeenCalled();

    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 404, body: { error: { code: 404, status: 'NOT_FOUND', message: 'Processor projects/p/locations/eu/processors/a not found.' } } }));
    await expect(GoogleDocumentAiApi.getProcessor({ auth: AUTH, processor: 'a' })).rejects.toThrow('Check the processor ID and that the connection');
  });

  it('should reject a 2xx body of the wrong shape', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { processors: 'nope' } }));
    await expect(GoogleDocumentAiApi.listProcessors(AUTH)).rejects.toThrow('unexpected response body');
  });

  it.each([
    {
      status: 400,
      body: {
        error: {
          code: 400,
          status: 'INVALID_ARGUMENT',
          message: 'Request contains an invalid argument.',
          details: [{ '@type': 'type.googleapis.com/google.rpc.BadRequest', fieldViolations: [{ field: 'raw_document.mime_type', description: 'Unsupported input file format.' }] }],
        },
      },
      expected: 'Google Document AI returned 400 (INVALID_ARGUMENT): Request contains an invalid argument. [raw_document.mime_type: Unsupported input file format.]',
    },
    {
      status: 403,
      body: { error: { code: 403, status: 'PERMISSION_DENIED', message: 'Permission denied on resource.' } },
      expected:
        "Google Document AI returned 403 (PERMISSION_DENIED): Permission denied on resource. Grant the connection's account the role Document AI API User (roles/documentai.apiUser) on the project.",
    },
    {
      status: 429,
      body: { error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded for quota metric online processing requests.', details: [{ reason: 'RATE_LIMIT_EXCEEDED' }] } },
      expected: 'Google Document AI returned 429 (RESOURCE_EXHAUSTED): Quota exceeded for quota metric online processing requests. [reason: RATE_LIMIT_EXCEEDED]',
    },
  ])('process() $status should give the actionable message and never leak the uploaded file', async ({ status, body, expected }) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    fetchMock.mockResolvedValueOnce(jsonResponse({ status, body }));

    const error = await processSecret();

    expect(error).toBeInstanceOf(GoogleDocumentAiApiError);
    expect(error instanceof Error ? error.message : '').toBe(expected);
    expect(error instanceof Error ? error.cause : 'not an error').toBeUndefined();
    expect(String(sentInit(0).body)).toContain(SECRET_CONTENT);
    expect(errorChain(error)).not.toContain(SECRET_CONTENT);
    expect(errorChain(error)).not.toContain(SECRET_CONTENT.slice(0, 40));
    expect(errorChain(error)).not.toContain('ya29.test');
    expect(consoleError).not.toHaveBeenCalled();
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it('process() should not leak the uploaded file on a network failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    const error = await processSecret();

    expect(error instanceof Error ? error.message : '').toBe('Could not reach Google Document AI: fetch failed');
    expect(error instanceof Error ? error.cause : 'not an error').toBeUndefined();
    expect(errorChain(error)).not.toContain(SECRET_CONTENT.slice(0, 40));
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('should give process a 120 second deadline and metadata calls a 30 second one', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    fetchMock.mockImplementation(async (input) => (String(input).endsWith(':process') ? jsonResponse({ body: { document: { text: 'ok' } } }) : jsonResponse({ body: { name: PROCESSOR } })));

    await GoogleDocumentAiApi.process({ auth: AUTH, processorName: PROCESSOR, request: { gcsDocument: { gcsUri: 'gs://b/f.pdf', mimeType: 'application/pdf' } } });
    await GoogleDocumentAiApi.getProcessor({ auth: AUTH, processor: 'abc' });

    expect(timeout.mock.calls).toEqual([[120_000], [30_000]]);
    expect(sentInit(0).signal).toBe(timeout.mock.results[0]?.value);
    expect(sentInit(1).signal).toBe(timeout.mock.results[1]?.value);
  });

  it.each([
    async (): Promise<Response> => {
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
    },
    async (): Promise<Response> => {
      throw new DOMException('This operation was aborted', 'AbortError');
    },
    async (): Promise<Response> =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
          },
        }),
        { status: 200 }
      ),
  ])('process() should give a sanitized timeout error when the deadline passes (case %#)', async (stall) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchMock.mockImplementation(stall);

    const error = await processSecret();

    expect(error instanceof Error ? error.message : '').toBe(
      'Google Document AI did not answer within 120 seconds. Try again in a moment. For large files, select fewer pages or turn on Imageless Mode.'
    );
    expect(error instanceof Error ? error.cause : 'not an error').toBeUndefined();
    expect(errorChain(error)).not.toContain(SECRET_CONTENT.slice(0, 40));
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('metadata calls should give a sanitized 30 second timeout error', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
    await expect(GoogleDocumentAiApi.listProcessors(AUTH)).rejects.toThrow(new Error('Google Document AI did not answer within 30 seconds. Try again in a moment.'));
  });
});
