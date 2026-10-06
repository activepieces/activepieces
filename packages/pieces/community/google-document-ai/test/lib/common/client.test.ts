import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn<() => Promise<{ body: unknown }>>(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

const { HttpError } = await import('@activepieces/pieces-common');
const { GoogleDocumentAiApi, GoogleDocumentAiApiError, apiBase, parentOf, processorResourceName } = await import('../../../src/lib/common/client');

const AUTH = { accessToken: 'ya29.test', projectId: 'my-project', location: 'eu' };
const BASE = 'https://eu-documentai.googleapis.com/v1';
const BEARER = { type: 'BEARER_TOKEN', token: 'ya29.test' };

function httpError(status: number, data: unknown): InstanceType<typeof HttpError> {
  return new HttpError({}, { status, responseBody: data });
}

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
    const error = GoogleDocumentAiApiError.fromHttpError(
      httpError(403, {
        error: {
          code: 403,
          message: 'Cloud Document AI API has not been used in project 123 before or it is disabled.',
          status: 'PERMISSION_DENIED',
          details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'SERVICE_DISABLED', domain: 'googleapis.com' }],
        },
      })
    );
    expect(error.message).toBe(
      'Google Document AI returned 403 (PERMISSION_DENIED): Cloud Document AI API has not been used in project 123 before or it is disabled. [reason: SERVICE_DISABLED] Enable the Cloud Document AI API in the Google Cloud project of the connection.'
    );

    const bad = GoogleDocumentAiApiError.fromHttpError(
      httpError(400, {
        error: {
          code: 400,
          message: 'Request contains an invalid argument.',
          status: 'INVALID_ARGUMENT',
          details: [{ '@type': 'type.googleapis.com/google.rpc.BadRequest', fieldViolations: [{ field: 'raw_document.mime_type', description: 'Unsupported input file format.' }] }],
        },
      })
    );
    expect(bad.message).toBe('Google Document AI returned 400 (INVALID_ARGUMENT): Request contains an invalid argument. [raw_document.mime_type: Unsupported input file format.]');
    expect(bad.fieldViolations).toHaveLength(1);
  });

  it('should hint at the page limit and at the role on a plain 403', () => {
    expect(GoogleDocumentAiApiError.fromHttpError(httpError(400, { error: { code: 400, status: 'INVALID_ARGUMENT', message: 'Document pages exceed the limit: 15 got 40.' } })).message).toContain('up to 15 pages');
    expect(GoogleDocumentAiApiError.fromHttpError(httpError(403, { error: { code: 403, status: 'PERMISSION_DENIED', message: 'Permission denied on resource.' } })).message).toContain('roles/documentai.apiUser');
  });

  it('should fall back to the raw body when it is not a google.rpc.Status', () => {
    expect(GoogleDocumentAiApiError.fromHttpError(httpError(502, 'Bad Gateway')).message).toBe('Google Document AI returned 502: Bad Gateway');
  });
});

describe('GoogleDocumentAiApi', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  it('listProcessors() should GET the parent on the regional host and follow pages', async () => {
    sendRequest
      .mockResolvedValueOnce({ body: { processors: [{ name: 'projects/1/locations/eu/processors/a' }], nextPageToken: 'p2' } })
      .mockResolvedValueOnce({ body: { processors: [{ name: 'projects/1/locations/eu/processors/b' }] } });

    const processors = await GoogleDocumentAiApi.listProcessors(AUTH);

    expect(processors.map((p) => p.name)).toEqual(['projects/1/locations/eu/processors/a', 'projects/1/locations/eu/processors/b']);
    expect(sendRequest).toHaveBeenNthCalledWith(1, { method: 'GET', url: `${BASE}/projects/my-project/locations/eu/processors`, queryParams: { pageSize: '100' }, authentication: BEARER });
    expect(sendRequest).toHaveBeenNthCalledWith(2, expect.objectContaining({ queryParams: { pageSize: '100', pageToken: 'p2' } }));
  });

  it('process() should POST the request to the processor', async () => {
    sendRequest.mockResolvedValue({ body: { document: { text: 'hello' } } });

    const response = await GoogleDocumentAiApi.process({
      auth: AUTH,
      processorName: 'projects/my-project/locations/eu/processors/abc',
      request: {
      rawDocument: { content: 'aGVsbG8=', mimeType: 'application/pdf' },
      fieldMask: 'text',
      imagelessMode: true,
      },
    });

    expect(response.document?.text).toBe('hello');
    expect(sendRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: `${BASE}/projects/my-project/locations/eu/processors/abc:process`,
      body: { rawDocument: { content: 'aGVsbG8=', mimeType: 'application/pdf' }, fieldMask: 'text', imagelessMode: true },
      authentication: BEARER,
    });
  });

  it('process() should refuse a request without a document, and wrap API failures', async () => {
    await expect(GoogleDocumentAiApi.process({ auth: AUTH, processorName: 'projects/p/locations/eu/processors/a', request: {} })).rejects.toThrow('needs a rawDocument or a gcsDocument');

    sendRequest.mockRejectedValue(httpError(404, { error: { code: 404, status: 'NOT_FOUND', message: 'Processor projects/p/locations/eu/processors/a not found.' } }));
    await expect(GoogleDocumentAiApi.getProcessor({ auth: AUTH, processor: 'a' })).rejects.toThrow('Check the processor ID and that the connection');
  });
});
