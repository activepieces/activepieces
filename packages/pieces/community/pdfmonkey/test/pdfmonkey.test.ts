import { Readable } from 'stream';
import { httpClient, HttpError } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PdfmonkeyApiError } from '../src/lib/common/client';
import { pdfmonkeyOperations } from '../src/lib/common/operations';
import { documentGeneratedTrigger } from '../src/lib/triggers/document-generated';

const auth = { type: 'SECRET_TEXT', secret_text: ' key-123 ' };
const CARD = {
  id: 'doc-1',
  status: 'success',
  filename: 'Invoice.pdf',
  output_type: 'pdf',
  document_template_id: 'tpl-1',
  document_template_identifier: 'Invoice',
  download_url: 'https://pdfmonkey-store.s3.eu-west-3.amazonaws.com/doc-1/Invoice.pdf?sig=1',
  meta: '{"ref":"a"}',
  updated_at: '2026-10-15T13:54:22.021+02:00',
};

type Call = { method: string; url: string; query: unknown; body: unknown; headers: unknown; redact: boolean | undefined; followRedirects: boolean | undefined };
type Route = { method: string; path: string; status?: number; body?: unknown; match?: (query: Record<string, string>) => boolean };

function mockRoutes(routes: Route[]) {
  const calls: Call[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    const url = new URL(request.url);
    calls.push({
      method: request.method,
      url: request.url,
      query: request.queryParams,
      body: request.body,
      headers: request.headers,
      redact: request.redactBodyInErrors,
      followRedirects: request.followRedirects,
    });
    const query = request.queryParams ?? {};
    const route = routes.find((r) => r.method === request.method && (url.pathname === `/api/v1${r.path}` || url.href.startsWith(r.path)) && (!r.match || r.match(query)));
    if (!route) throw new Error(`unexpected ${request.method} ${url.pathname}`);
    if ((route.status ?? 200) >= 400) throw new HttpError({ secret: 'x' }, { status: route.status ?? 500, responseBody: route.body });
    return { status: route.status ?? 200, headers: { 'content-type': 'application/pdf' }, body: route.body };
  });
  return calls;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createDocument', () => {
  it('waits through the sync endpoint with status pending and the file name in meta', async () => {
    const calls = mockRoutes([{ method: 'POST', path: '/documents/sync', body: { document_card: CARD } }]);
    const result = await pdfmonkeyOperations.createDocument({
      auth,
      templateId: ' tpl-1 ',
      payload: '{"name":"Jane"}',
      meta: { ref: 'a' },
      filename: 'Invoice.pdf',
      status: 'draft',
      waitForCompletion: true,
    });
    expect(result['id']).toBe('doc-1');
    expect(calls[0].url).toBe('https://api.pdfmonkey.io/api/v1/documents/sync');
    expect(calls[0].body).toEqual({ document: { document_template_id: 'tpl-1', status: 'pending', payload: { name: 'Jane' }, meta: { ref: 'a', _filename: 'Invoice.pdf' } } });
    expect(calls[0].headers).toMatchObject({ Authorization: 'Bearer key-123', 'Content-Type': 'application/json' });
    expect(calls[0].redact).toBe(true);
    expect(calls[0].followRedirects).toBe(false);
  });

  it('fails when the sync generation fails', async () => {
    mockRoutes([{ method: 'POST', path: '/documents/sync', body: { document_card: { ...CARD, status: 'failure', failure_cause: 'Liquid error' } } }]);
    await expect(pdfmonkeyOperations.createDocument({ auth, templateId: 'tpl-1', payload: {}, waitForCompletion: true })).rejects.toThrow('Liquid error');
  });

  it('rejects array payloads and unknown statuses before any request', async () => {
    const calls = mockRoutes([]);
    await expect(pdfmonkeyOperations.createDocument({ auth, templateId: 'tpl-1', payload: [1] })).rejects.toThrow('JSON object');
    await expect(pdfmonkeyOperations.createDocument({ auth, templateId: 'tpl-1', payload: {}, status: 'success' })).rejects.toThrow('draft');
    await expect(pdfmonkeyOperations.createDocument({ auth, templateId: '', payload: {} })).rejects.toThrow('Template ID is required');
    expect(calls).toHaveLength(0);
  });
});

describe('createDocument with an agent deadline', () => {
  it('queues the document, polls it, and returns the finished card', async () => {
    vi.useFakeTimers();
    let polls = 0;
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (request.method === 'POST') return { status: 200, headers: {}, body: { document: { id: 'doc-1', status: 'pending' } } };
      polls += 1;
      return { status: 200, headers: {}, body: { document_card: polls < 2 ? { ...CARD, status: 'generating' } : CARD } };
    });
    const pending = pdfmonkeyOperations.createDocument({ auth, templateId: 'tpl-1', payload: {}, waitForCompletion: true, maxWaitMs: pdfmonkeyOperations.AI_MAX_WAIT_MS });
    await vi.advanceTimersByTimeAsync(10000);
    const result = await pending;
    expect(result['status']).toBe('success');
    expect(polls).toBe(2);
    vi.useRealTimers();
  });

  it('returns the document ID and current status when the deadline passes', async () => {
    vi.useFakeTimers();
    const urls: string[] = [];
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      urls.push(request.url);
      if (request.method === 'POST') return { status: 200, headers: {}, body: { document: { id: 'doc-1', status: 'pending' } } };
      return { status: 200, headers: {}, body: { document_card: { ...CARD, status: 'generating', download_url: null } } };
    });
    const pending = pdfmonkeyOperations.createDocument({ auth, templateId: 'tpl-1', payload: {}, waitForCompletion: true, maxWaitMs: pdfmonkeyOperations.AI_MAX_WAIT_MS });
    await vi.advanceTimersByTimeAsync(pdfmonkeyOperations.AI_MAX_WAIT_MS + 10000);
    const result = await pending;
    expect(result).toMatchObject({ id: 'doc-1', status: 'generating' });
    expect(urls[0]).toBe('https://api.pdfmonkey.io/api/v1/documents');
    expect(urls.some((url) => url.includes('/documents/sync'))).toBe(false);
    expect(pdfmonkeyOperations.AI_MAX_WAIT_MS).toBeLessThan(5 * 60 * 1000);
    vi.useRealTimers();
  });

  it('keeps polling through temporary status failures and still returns the created document', async () => {
    vi.useFakeTimers();
    let polls = 0;
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (request.method === 'POST') return { status: 200, headers: {}, body: { document: { id: 'doc-1', status: 'pending' } } };
      polls += 1;
      if (polls === 1) throw new HttpError({}, { status: 503, responseBody: {} });
      if (polls === 2) throw new Error('socket hang up');
      return { status: 200, headers: {}, body: { document_card: CARD } };
    });
    const pending = pdfmonkeyOperations.createDocument({ auth, templateId: 'tpl-1', payload: {}, waitForCompletion: true, maxWaitMs: pdfmonkeyOperations.AI_MAX_WAIT_MS });
    await vi.advanceTimersByTimeAsync(20000);
    const result = await pending;
    expect(result).toMatchObject({ id: 'doc-1', status: 'success' });
    vi.useRealTimers();
  });

  it('returns the created ID when every status check fails until the deadline', async () => {
    vi.useFakeTimers();
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (request.method === 'POST') return { status: 200, headers: {}, body: { document: { id: 'doc-1', status: 'pending' } } };
      throw new HttpError({}, { status: 429, responseBody: {} });
    });
    const pending = pdfmonkeyOperations.createDocument({ auth, templateId: 'tpl-1', payload: {}, waitForCompletion: true, maxWaitMs: pdfmonkeyOperations.AI_MAX_WAIT_MS });
    await vi.advanceTimersByTimeAsync(pdfmonkeyOperations.AI_MAX_WAIT_MS + 10000);
    const result = await pending;
    expect(result).toMatchObject({ id: 'doc-1', status: 'pending' });
    vi.useRealTimers();
  });

  it('stops on a permanent status error such as 401', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (request.method === 'POST') return { status: 200, headers: {}, body: { document: { id: 'doc-1', status: 'pending' } } };
      throw new HttpError({}, { status: 401, responseBody: {} });
    });
    await expect(pdfmonkeyOperations.createDocument({ auth, templateId: 'tpl-1', payload: {}, waitForCompletion: true, maxWaitMs: 1000 })).rejects.toBeInstanceOf(PdfmonkeyApiError);
  });

  it('fails with the cause when generation fails while polling', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (request.method === 'POST') return { status: 200, headers: {}, body: { document: { id: 'doc-1', status: 'pending' } } };
      return { status: 200, headers: {}, body: { document_card: { ...CARD, status: 'failure', failure_cause: 'Liquid error' } } };
    });
    await expect(pdfmonkeyOperations.createDocument({ auth, templateId: 'tpl-1', payload: {}, waitForCompletion: true, maxWaitMs: 1000 })).rejects.toThrow('Liquid error');
  });
});

describe('updateDocument', () => {
  it('keeps the other meta keys when only the file name changes', async () => {
    const calls = mockRoutes([
      { method: 'GET', path: '/document_cards/doc-1', body: { document_card: CARD } },
      { method: 'PUT', path: '/documents/doc-1', body: { document: { ...CARD, status: 'pending' } } },
    ]);
    await pdfmonkeyOperations.updateDocument({ auth, documentId: 'doc-1', filename: 'New.pdf', generate: true });
    expect(calls[1].body).toEqual({ document: { meta: { ref: 'a', _filename: 'New.pdf' }, status: 'pending' } });
  });

  it('refuses an empty update', async () => {
    const calls = mockRoutes([]);
    await expect(pdfmonkeyOperations.updateDocument({ auth, documentId: 'doc-1' })).rejects.toThrow('Nothing to update');
    expect(calls).toHaveLength(0);
  });
});

describe('listDocuments', () => {
  it('sends page[number], filters and updated_since in Unix seconds', async () => {
    const calls = mockRoutes([{ method: 'GET', path: '/document_cards', body: { document_cards: [CARD], meta: { current_page: 2, total_pages: 3, next_page: 3 } } }]);
    const result = await pdfmonkeyOperations.listDocuments({ auth, templateId: 'tpl-1', status: 'success', updatedSince: '2022-01-01T00:00:00Z', page: 2 });
    expect(calls[0].query).toEqual({ 'page[number]': '2', 'q[document_template_id]': 'tpl-1', 'q[status]': 'success', 'q[updated_since]': '1640995200' });
    expect(result).toMatchObject({ page: 2, total_pages: 3, has_more: true });
  });
});

describe('listTemplates', () => {
  it('lists every workspace and strips the internal auth token', async () => {
    const calls = mockRoutes([
      { method: 'GET', path: '/workspaces', body: { apps: [{ id: 'ws-1' }, { id: 'ws-2' }], meta: { next_page: null } } },
      { method: 'GET', path: '/document_template_cards', match: (q) => q['q[workspace_id]'] === 'ws-1', body: { document_template_cards: [{ id: 't1', identifier: 'A', auth_token: 'secret' }], meta: { next_page: null } } },
      { method: 'GET', path: '/document_template_cards', match: (q) => q['q[workspace_id]'] === 'ws-2', body: { document_template_cards: [{ id: 't2', identifier: 'B' }], meta: { next_page: null } } },
    ]);
    const result = await pdfmonkeyOperations.listTemplates({ auth });
    expect(result.templates).toEqual([{ id: 't1', identifier: 'A' }, { id: 't2', identifier: 'B' }]);
    expect(calls).toHaveLength(3);
  });
});

describe('getCurrentUser', () => {
  it('never returns the account API key', async () => {
    mockRoutes([{ method: 'GET', path: '/current_user', body: { current_user: { id: 'u1', email: 'a@b.c', auth_token: 'secret', available_documents: 20 } } }]);
    const user = await pdfmonkeyOperations.getCurrentUser({ auth });
    expect(JSON.stringify(user)).not.toContain('secret');
    expect(user['available_documents']).toBe(20);
  });
});

describe('deleteDocument', () => {
  it('deletes by encoded ID and maps a 404 to a readable error', async () => {
    const calls = mockRoutes([{ method: 'DELETE', path: '/documents/doc-1', status: 204 }]);
    await expect(pdfmonkeyOperations.deleteDocument({ auth, documentId: 'doc-1' })).resolves.toEqual({ success: true, document_id: 'doc-1' });
    expect(calls[0].method).toBe('DELETE');
    vi.restoreAllMocks();
    mockRoutes([{ method: 'DELETE', path: '/documents/doc-2', status: 404, body: { errors: [{ status: '404', title: 'Not Found', detail: 'We could not find it.' }] } }]);
    const error = await pdfmonkeyOperations.deleteDocument({ auth, documentId: 'doc-2' }).catch((e) => e);
    expect(error).toBeInstanceOf(PdfmonkeyApiError);
    expect(error.message).toContain('PDFMonkey API error (404): We could not find it.');
  });

  it('refuses path traversal in IDs', async () => {
    await expect(pdfmonkeyOperations.deleteDocument({ auth, documentId: '..' })).rejects.toThrow('Document ID is required');
  });
});

describe('downloadDocument', () => {
  it('downloads without the API key and writes the file', async () => {
    const calls = mockRoutes([
      { method: 'GET', path: '/document_cards/doc-1', body: { document_card: CARD } },
      { method: 'GET', path: 'https://pdfmonkey-store.s3.eu-west-3.amazonaws.com/', body: Readable.from([Buffer.from('%PDF-1.7')]) },
    ]);
    const write = vi.fn(async () => 'file-url');
    const result = await pdfmonkeyOperations.downloadDocument({ auth, documentId: 'doc-1', files: { write } });
    expect(result).toMatchObject({ file: 'file-url', file_name: 'Invoice.pdf', size: 8, content_type: 'application/pdf' });
    expect(JSON.stringify(calls[1].headers)).not.toContain('key-123');
  });

  it('refuses documents that are not generated yet', async () => {
    mockRoutes([{ method: 'GET', path: '/document_cards/doc-1', body: { document_card: { ...CARD, status: 'pending', download_url: null } } }]);
    await expect(pdfmonkeyOperations.downloadDocument({ auth, documentId: 'doc-1', files: { write: vi.fn() } })).rejects.toThrow('"pending"');
  });
});

describe('documentGenerated trigger', () => {
  it('polls successful documents updated since the last poll, in seconds', async () => {
    const calls = mockRoutes([{ method: 'GET', path: '/document_cards', body: { document_cards: [CARD], meta: { next_page: null } } }]);
    const lastPoll = Date.parse('2026-10-15T11:00:00Z');
    const store = { get: vi.fn(async () => lastPoll), put: vi.fn(async () => undefined), delete: vi.fn() };
    const items = await Reflect.apply(documentGeneratedTrigger.run, undefined, [{ auth, store, propsValue: {}, files: {} }]);
    expect(calls[0].query).toMatchObject({ 'q[status]': 'success', 'q[updated_since]': String(lastPoll / 1000), 'page[number]': '1' });
    expect(items).toEqual([CARD]);
  });

  it('reads every page past the dropdown cap so no document is skipped', async () => {
    const pages = 25;
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      const page = Number(request.queryParams?.['page[number]']);
      return { status: 200, headers: {}, body: { document_cards: [{ ...CARD, id: `doc-${page}`, updated_at: new Date(Date.parse('2026-10-15T12:00:00Z') + page * 1000).toISOString() }], meta: { next_page: page < pages ? page + 1 : null } } };
    });
    const store = { get: vi.fn(async () => Date.parse('2026-10-15T11:00:00Z')), put: vi.fn(async () => undefined), delete: vi.fn() };
    const items = await Reflect.apply(documentGeneratedTrigger.run, undefined, [{ auth, store, propsValue: {}, files: {} }]);
    expect(items).toHaveLength(pages);
    expect(store.put).toHaveBeenCalledWith('lastPoll', Date.parse('2026-10-15T12:00:00Z') + pages * 1000);
  });

  it('fails without moving the checkpoint when the backlog exceeds the safety cap', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      const page = Number(request.queryParams?.['page[number]']);
      return { status: 200, headers: {}, body: { document_cards: [{ ...CARD, id: `doc-${page}` }], meta: { next_page: page + 1 } } };
    });
    const store = { get: vi.fn(async () => Date.parse('2026-10-15T11:00:00Z')), put: vi.fn(async () => undefined), delete: vi.fn() };
    await expect(Reflect.apply(documentGeneratedTrigger.run, undefined, [{ auth, store, propsValue: {}, files: {} }])).rejects.toThrow('without moving its checkpoint');
    expect(store.put).not.toHaveBeenCalled();
  });
});
