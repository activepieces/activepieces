import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildMindeeError, detectKeyType, normalizeApiKey, v2PathFromUrl, vendorDetail } from '../src/lib/common/client';
import { mindeeFiles } from '../src/lib/common/file';
import { mindeeInference } from '../src/lib/common/inference';
import { mindeeApi } from '../src/lib/common/api';
import { productActionHelpers } from '../src/lib/actions/product-action-helpers';

const dnsAnswers = vi.hoisted(() => new Map<string, { address: string; family: number }[]>([['example.com', [{ address: '93.184.215.14', family: 4 }]]]));

vi.mock('node:dns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:dns')>();
  const lookup = (...args: [hostname: string, options: unknown, callback: (error: NodeJS.ErrnoException | null, addresses: { address: string; family: number }[]) => void]) => {
    const [hostname, , callback] = args;
    const answer = dnsAnswers.get(hostname);
    if (answer === undefined) {
      throw new Error(`Unexpected DNS lookup in tests: ${hostname}`);
    }
    process.nextTick(() => callback(null, answer));
  };
  return { ...actual, lookup, default: { ...actual, lookup } };
});

const MODEL = '21b8675e-4c68-4d8d-abb6-ef34c453b0de';
const JOB = '11111111-2222-4333-8444-555555555555';
const INF = '99999999-2222-4333-8444-555555555555';

function json({ status, body }: { status: number; body: unknown }): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function job({ status, extra = {} }: { status: string; extra?: Record<string, unknown> }) {
  return {
    job: {
      id: JOB,
      model_id: MODEL,
      filename: 'invoice.jpg',
      alias: 'a1',
      created_at: '2026-10-20T10:00:00Z',
      completed_at: null,
      status,
      polling_url: `https://api-v2.mindee.net/v2/jobs/${JOB}`,
      result_url: status === 'Processed' ? `https://api-v2.mindee.net/v2/products/extraction/results/${INF}` : null,
      webhooks: [],
      ...extra,
    },
  };
}

const extractionResult = {
  inference: {
    id: INF,
    job: { id: JOB },
    model: { id: MODEL },
    file: { name: 'invoice.jpg', alias: 'a1', page_count: 1, mime_type: 'image/jpeg' },
    active_options: { raw_text: true, polygon: false, confidence: true, rag: false, text_context: false, data_schema: { replace: false } },
    result: {
      fields: {
        total_amount: { value: 42.5, confidence: 'High', locations: [] },
        supplier: { fields: { name: { value: 'ACME' } } },
        line_items: { items: [{ fields: { description: { value: 'Pen' }, quantity: { value: 2 } } }] },
      },
      raw_text: { pages: [{ content: 'line 1' }, { content: 'line 2' }] },
      rag: null,
    },
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('client helpers', () => {
  it('strips Token/Bearer prefixes from the key', () => {
    expect(normalizeApiKey('  Token md_abc ')).toBe('md_abc');
    expect(normalizeApiKey('Bearer md_abc')).toBe('md_abc');
    expect(() => normalizeApiKey(' ')).toThrow('Enter your Mindee API key.');
  });

  it('only accepts result URLs on the v2 host', () => {
    expect(v2PathFromUrl(`https://api-v2.mindee.net/v2/products/ocr/results/${INF}`)).toBe(`/v2/products/ocr/results/${INF}`);
    expect(() => v2PathFromUrl('https://evil.example.com/v2/jobs/1')).toThrow('refusing');
    expect(() => v2PathFromUrl('http://api-v2.mindee.net/v2/jobs/1')).toThrow('refusing');
  });

  it('reads v1 and v2 error bodies', () => {
    expect(vendorDetail({ status: 422, detail: 'Invalid fields', title: 'x', code: '422-001', errors: [{ pointer: '#/model_id', detail: 'bad uuid' }] })).toBe(
      'Invalid fields #/model_id: bad uuid',
    );
    expect(vendorDetail({ api_request: { error: { message: 'Authorization required', details: 'Invalid token provided' } } })).toBe(
      'Authorization required: Invalid token provided',
    );
    expect(vendorDetail('<html>')).toBeUndefined();
  });

  it('builds errors without a body field and points v1 keys to the legacy action', () => {
    const error = buildMindeeError({ status: 401, responseBody: { detail: 'The provided API key is invalid.' }, api: 'v2' });
    expect(error.message).toContain('Legacy v1');
    expect(error.status).toBe(401);
    expect(Reflect.has(error, 'body')).toBe(false);
    expect(error.responseBody).toEqual({ detail: 'The provided API key is invalid.' });
  });
});

describe('detectKeyType', () => {
  it('returns v2 when search/models works', async () => {
    const fetchMock = vi.fn(async () => json({ status: 200, body: { models: [], pagination: { page: 1, per_page: 1, total_items: 0, total_pages: 0 } } }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(detectKeyType('md_key')).resolves.toBe('v2');
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain('https://api-v2.mindee.net/v2/search/models');
    expect(init?.headers).toMatchObject({ Authorization: 'md_key' });
  });

  it('returns v1 when v2 rejects the key but v1 accepts it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (String(url).includes('api-v2') ? json({ status: 401, body: { detail: 'invalid' } }) : json({ status: 404, body: { api_request: { error: { message: 'Not found' } } } }))),
    );
    await expect(detectKeyType('old')).resolves.toBe('v1');
  });

  it('returns invalid when both reject the key', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ status: 401, body: { detail: 'invalid' } })));
    await expect(detectKeyType('bad')).resolves.toBe('invalid');
  });
});

describe('runInference', () => {
  it('enqueues, polls and normalizes an extraction result', async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push(`${init.method} ${url}`);
        if (String(url).endsWith('/v2/products/extraction/enqueue')) {
          const form = init.body;
          expect(form).toBeInstanceOf(FormData);
          if (form instanceof FormData) {
            expect(form.get('model_id')).toBe(MODEL);
            expect(form.get('url')).toBe('https://example.com/a.pdf');
            expect(form.get('confidence')).toBe('true');
            expect(form.get('rag')).toBeNull();
          }
          return json({ status: 202, body: job({ status: 'Processing' }) });
        }
        if (String(url).includes('/v2/jobs/')) {
          return json({ status: 200, body: job({ status: calls.length > 2 ? 'Processed' : 'Processing' }) });
        }
        return json({ status: 200, body: extractionResult });
      }),
    );
    vi.useFakeTimers();
    const promise = mindeeInference.runInference({
      apiKey: 'k',
      product: 'extraction',
      modelId: MODEL,
      source: { type: 'url', url: 'https://example.com/a.pdf' },
      options: { confidence: true },
    });
    await vi.runAllTimersAsync();
    const output = await promise;
    expect(calls[1]).toContain(`/v2/jobs/${JOB}?redirect=false`);
    expect(output).toMatchObject({
      completed: true,
      status: 'Processed',
      job_id: JOB,
      inference_id: INF,
      model_id: MODEL,
      file: { name: 'invoice.jpg', page_count: 1, mime_type: 'image/jpeg' },
      fields: { total_amount: 42.5, supplier: { name: 'ACME' }, line_items: [{ description: 'Pen', quantity: 2 }] },
      field_confidence: { total_amount: 'High', supplier: null, line_items: null },
      raw_text: 'line 1\n\nline 2',
      rag_document_id: null,
    });
  });

  it('fails a builder action with the job id when the wait limit is hit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ status: 202, body: job({ status: 'Processing' }) })));
    vi.useFakeTimers();
    const promise = productActionHelpers.runWithFile({
      apiKey: 'k',
      product: 'ocr',
      props: { model_id: MODEL, file: { filename: 'a.pdf', extension: 'pdf', data: Buffer.from('%PDF-1.4') } },
    });
    const assertion = expect(promise).rejects.toThrow(JOB);
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('returns the job id instead of failing when the wait limit is hit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ status: 202, body: job({ status: 'Processing' }) })));
    vi.useFakeTimers();
    const promise = mindeeInference.runInference({
      apiKey: 'k',
      product: 'ocr',
      modelId: MODEL,
      source: { type: 'url', url: 'https://example.com/a.pdf' },
      options: {},
      maxWaitMs: 10_000,
    });
    await vi.runAllTimersAsync();
    const output = await promise;
    expect(output).toMatchObject({ completed: false, status: 'Processing', job_id: JOB, inference_id: null, text: null, pages: [] });
    expect(output.message).toContain(JOB);
  });

  it('throws the vendor reason when the job fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ status: 200, body: job({ status: 'Failed', extra: { error: { status: 422, detail: 'File is corrupted', title: 'x', code: '422-002' } } }) })),
    );
    vi.useFakeTimers();
    const promise = mindeeInference.runInference({
      apiKey: 'k',
      product: 'split',
      modelId: MODEL,
      source: { type: 'url', url: 'https://example.com/a.pdf' },
      options: {},
    });
    const assertion = expect(promise).rejects.toThrow('File is corrupted');
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('rejects a model id that is not a UUID before calling Mindee', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      mindeeInference.runInference({ apiKey: 'k', product: 'crop', modelId: 'invoice', source: { type: 'url', url: 'https://x.com/a' }, options: {} }),
    ).rejects.toThrow('List Models');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a public-looking name that resolves to a private address', async () => {
    dnsAnswers.set('internal.example.org', [{ address: '10.0.0.7', family: 4 }]);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(mindeeFiles.downloadFile({ url: new URL('https://internal.example.org/a.pdf'), label: 'File URL' })).rejects.toThrow(/private network/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows a name that resolves to a public address', async () => {
    dnsAnswers.set('files.example.org', [{ address: '93.184.215.14', family: 4 }]);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok', { status: 200 })));
    await expect(mindeeFiles.downloadFile({ url: new URL('https://files.example.org/a.pdf'), label: 'File URL' })).resolves.toMatchObject({ filename: 'a.pdf' });
  });

  it('rejects non-https file URLs', async () => {
    vi.stubGlobal('fetch', vi.fn());
    await expect(
      mindeeInference.runInference({ apiKey: 'k', product: 'ocr', modelId: MODEL, source: { type: 'url', url: 'file:///etc/passwd' }, options: {} }),
    ).rejects.toThrow('https://');
  });
});

describe('normalizeInference', () => {
  it('flattens classification, crop, ocr and split results', () => {
    const base = { id: INF, job: { id: JOB }, model: { id: MODEL }, file: { name: 'f.pdf', page_count: 3, mime_type: 'application/pdf' } };
    expect(
      mindeeInference.normalizeInference({ product: 'classification', job: null, body: { inference: { ...base, result: { classification: { document_type: 'invoice' } } } } }),
    ).toMatchObject({ document_type: 'invoice', fields: {} });
    expect(
      mindeeInference.normalizeInference({
        product: 'crop',
        job: null,
        body: { inference: { ...base, result: { crops: [{ object_type: 'receipt', location: { page: 0, polygon: [[0, 0], [1, 0], [1, 1]] } }] } } },
      }),
    ).toMatchObject({ crops: [{ object_type: 'receipt', page: 0, fields: {} }] });
    expect(
      mindeeInference.normalizeInference({
        product: 'ocr',
        job: null,
        body: { inference: { ...base, result: { pages: [{ content: 'a b', words: [{}, {}] }, { content: 'c', words: [{}] }] } } },
      }),
    ).toMatchObject({ text: 'a b\n\nc', pages: [{ page: 0, content: 'a b', word_count: 2 }, { page: 1, content: 'c', word_count: 1 }] });
    expect(
      mindeeInference.normalizeInference({
        product: 'split',
        job: null,
        body: { inference: { ...base, result: { splits: [{ page_range: [0, 1], document_type: 'invoice' }, { page_range: [2, 2], document_type: 'receipt' }] } } },
      }),
    ).toMatchObject({ splits: [{ start_page: 0, end_page: 1, page_count: 2 }, { start_page: 2, end_page: 2, page_count: 1 }] });
  });
});

describe('jobSummary', () => {
  it('derives product and inference id from the result URL', () => {
    const summary = mindeeInference.jobSummary({
      id: JOB,
      status: 'Processed',
      model_id: MODEL,
      filename: 'f',
      alias: null,
      created_at: null,
      completed_at: null,
      polling_url: null,
      result_url: `https://api-v2.mindee.net/v2/products/split/results/${INF}`,
      error: null,
    });
    expect(summary).toMatchObject({ completed: true, product: 'split', inference_id: INF, error: null });
  });
});

describe('poll delay', () => {
  it('stays bounded', () => {
    expect(mindeeInference.pollDelay(0)).toBe(2000);
    expect(mindeeInference.pollDelay(50)).toBe(6000);
  });
});

describe('files', () => {
  it('duck-types file props without instanceof', () => {
    const upload = mindeeFiles.readFileProp({ value: { filename: 'a.png', data: Buffer.from('abc') }, label: 'File' });
    expect(upload).toEqual({ filename: 'a.png', data: Buffer.from('abc') });
    expect(() => mindeeFiles.readFileProp({ value: '/etc/passwd', label: 'File' })).toThrow('File is required');
  });

  it('downloads with a status check', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));
    await expect(mindeeFiles.downloadFile({ url: new URL('https://example.com/a.pdf'), label: 'File URL' })).rejects.toThrow('HTTP 404');
  });

  it('stops at the deadline when an error body never finishes', async () => {
    const neverEnding = new ReadableStream<Uint8Array>({ start: (controller) => controller.enqueue(new TextEncoder().encode('partial')) });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(neverEnding, { status: 500 })));
    await expect(mindeeFiles.downloadFile({ url: new URL('https://example.com/a.pdf'), label: 'File URL', timeoutMs: 50 })).rejects.toThrow('took longer than');
  });

  it('refuses downloads larger than the cap', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 200, headers: { 'content-length': String(60 * 1024 * 1024) } })));
    await expect(mindeeFiles.downloadFile({ url: new URL('https://example.com/a.pdf'), label: 'File URL' })).rejects.toThrow('50 MB');
  });

  it('returns the downloaded bytes and file name', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('pdfdata', { status: 200 })));
    await expect(mindeeFiles.downloadFile({ url: new URL('https://example.com/docs/My%20File.pdf'), label: 'File URL' })).resolves.toEqual({
      data: Buffer.from('pdfdata'),
      filename: 'My File.pdf',
    });
  });
});

describe('rag documents', () => {
  it('requires a status or annotation to update', async () => {
    vi.stubGlobal('fetch', vi.fn());
    await expect(mindeeApi.updateRagDocument({ apiKey: 'k', documentId: INF })).rejects.toThrow('Set a new status');
    await expect(mindeeApi.updateRagDocument({ apiKey: 'k', documentId: INF, status: 'Deleted' })).rejects.toThrow('Draft or Active');
  });

  it('sends PATCH with JSON and maps the document', async () => {
    const fetchMock = vi.fn(async () =>
      json({ status: 200, body: { id: INF, model_id: MODEL, filename: 'r.pdf', created_at: 'x', total_matches: 0, last_match_at: null, status: 'Active', annotation: null } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await mindeeApi.updateRagDocument({ apiKey: 'k', documentId: INF, status: 'Active' });
    expect(result).toMatchObject({ id: INF, status: 'Active', annotation: null });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe(`https://api-v2.mindee.net/v2/products/extraction/rag-documents/${INF}`);
    expect(init?.method).toBe('PATCH');
    expect(init?.body).toBe(JSON.stringify({ status: 'Active' }));
  });
});

describe('download SSRF guard', () => {
  it('blocks private, loopback, link-local and metadata addresses and local names', async () => {
    const { mindeeNetwork } = await import('../src/lib/common/network-guard');
    for (const host of ['127.0.0.1', '10.1.2.3', '192.168.0.1', '172.16.0.5', '169.254.169.254', '[::1]', '[fe80::1]', '[::ffff:127.0.0.1]', 'localhost', 'metadata.google.internal', 'db']) {
      expect(mindeeNetwork.isBlockedHostname(host)).toBe(true);
    }
    expect(mindeeNetwork.isBlockedHostname('93.184.215.14')).toBe(false);
    expect(mindeeNetwork.isBlockedHostname('example.com')).toBe(false);
  });

  it('refuses a blocked host before any request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(mindeeFiles.downloadFile({ url: new URL('https://169.254.169.254/latest'), label: 'File URL' })).rejects.toThrow(/private network/);
    await expect(mindeeFiles.downloadFile({ url: new URL('https://localhost/x.pdf'), label: 'File URL' })).rejects.toThrow(/private network/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not auto-follow redirects and re-validates every hop', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.redirect).toBe('manual');
      return new Response(null, { status: 302, headers: { location: 'https://10.0.0.5/secret' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(mindeeFiles.downloadFile({ url: new URL('https://93.184.215.14/a.pdf'), label: 'File URL' })).rejects.toThrow(/private network/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refuses a redirect to http', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 301, headers: { location: 'http://93.184.215.14/a.pdf' } })));
    await expect(mindeeFiles.downloadFile({ url: new URL('https://93.184.215.14/a.pdf'), label: 'File URL' })).rejects.toThrow(/https/);
  });

  it('follows a safe redirect and stops after 3 hops', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls++;
        return calls === 2 ? new Response('PDFDATA', { status: 200 }) : new Response(null, { status: 302, headers: { location: '/doc.pdf' } });
      }),
    );
    const upload = await mindeeFiles.downloadFile({ url: new URL('https://93.184.215.14/a.pdf'), label: 'File URL' });
    expect(upload.data.toString()).toBe('PDFDATA');
    expect(upload.filename).toBe('doc.pdf');
    calls = -10;
    await expect(mindeeFiles.downloadFile({ url: new URL('https://93.184.215.14/a.pdf'), label: 'File URL' })).rejects.toThrow(/more than 3 redirects/);
  });
});

describe('custom API call', () => {
  async function runCustom(props: Record<string, unknown>) {
    const { mindeeCustomApiCall } = await import('../src/lib/actions/custom-api-call');
    return Reflect.apply(mindeeCustomApiCall.run, mindeeCustomApiCall, [{ auth: { secret_text: 'md_key' }, propsValue: props, files: { write: vi.fn() } }]);
  }

  it('sends the bare key to v2 and Token to v1, with redirects off', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => json({ status: 200, body: { ok: true } }));
    vi.stubGlobal('fetch', fetchMock);
    await runCustom({ method: 'GET', url: { url: '/search/models' } });
    await runCustom({ method: 'GET', url: { url: 'https://api.mindee.net/v1/products' } });
    const first = fetchMock.mock.calls[0];
    const second = fetchMock.mock.calls[1];
    expect(String(first[0])).toBe('https://api-v2.mindee.net/v2/search/models');
    expect(new Headers(first[1].headers).get('authorization')).toBe('md_key');
    expect(new Headers(second[1].headers).get('authorization')).toBe('Token md_key');
    expect(first[1].redirect).toBe('manual');
  });

  it('refuses non-Mindee hosts and http', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(runCustom({ method: 'GET', url: { url: 'https://evil.example.com/v2/x' } })).rejects.toThrow(/api-v2.mindee.net/);
    await expect(runCustom({ method: 'GET', url: { url: 'http://api-v2.mindee.net/v2/x' } })).rejects.toThrow(/api-v2.mindee.net/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not follow a redirect off Mindee hosts', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 302, headers: { location: 'https://evil.example.com/' } })));
    await expect(runCustom({ method: 'GET', url: { url: '/jobs/1' }, followRedirects: true })).rejects.toThrow(/api-v2.mindee.net/);
  });

  it('redacts the request body in errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ status: 400, body: { detail: 'bad' } })));
    const error = await runCustom({ method: 'POST', url: { url: '/x' }, body: { secret: 'doc-bytes' } }).catch((e: unknown) => e);
    expect(JSON.stringify(error instanceof Error ? error.message : error)).not.toContain('doc-bytes');
  });
});

describe('Predict Document (Legacy v1)', () => {
  async function runLegacy(props: Record<string, unknown>) {
    const { mindeePredictDocumentAction } = await import('../src/lib/actions/predict-document');
    return Reflect.apply(mindeePredictDocumentAction.run, mindeePredictDocumentAction, [{ auth: { secret_text: 'v1_key' }, propsValue: { account_name: 'mindee', api_name: 'invoices/v4', ...props } }]);
  }

  it('posts an uploaded file as multipart to the v1 predict endpoint with a Token header', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => json({ status: 201, body: { document: { id: 'd1' } } }));
    vi.stubGlobal('fetch', fetchMock);
    const output = await runLegacy({ upload: { filename: 'a.pdf', extension: 'pdf', data: Buffer.from('%PDF-1.4') } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.mindee.net/v1/products/mindee/invoices/v4/predict');
    expect(new Headers(init.headers).get('authorization')).toBe('Token v1_key');
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.redirect).toBe('manual');
    expect(output).toEqual({ document: { id: 'd1' } });
  });

  it('sends a URL and a Base64 string as JSON documents', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => json({ status: 201, body: {} }));
    vi.stubGlobal('fetch', fetchMock);
    await runLegacy({ file: 'https://example.com/a.pdf' });
    await runLegacy({ file: 'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKNSAwIG9iago=' });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body))).toEqual({ document: 'https://example.com/a.pdf' });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body))).toEqual({ document: 'JVBERi0xLjQKJcfsj6IKNSAwIG9iago=' });
  });

  it('rejects a local file path and an empty input before any request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(runLegacy({ file: '/etc/passwd' })).rejects.toThrow('Local file paths are not supported');
    await expect(runLegacy({})).rejects.toThrow('Provide a File');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('explains a v2 key used against the legacy API', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ status: 401, body: { api_request: { error: { code: 'Unauthorized', details: 'The token provided is for the v2 API.', message: 'Authorization required' } } } })));
    await expect(runLegacy({ file: 'https://example.com/a.pdf' })).rejects.toThrow(/legacy v1 API/);
  });
});
