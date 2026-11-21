import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

import { HttpError } from '@activepieces/pieces-common';
import {
  browseAlgoliaRecords,
  deleteAlgoliaRecordsByFilter,
  getAlgoliaRecord,
  mapAlgoliaError,
  partialUpdateAlgoliaRecord,
  saveAlgoliaRecords,
  searchAlgoliaRecords,
} from '../src/lib/common/client';
import { parseIntegerInRange, parseRequiredString } from '../src/lib/common/utils';

const auth = { props: { applicationId: 'APP', apiKey: 'KEY' } };

function httpError({ status, body }: { status: number; body: unknown }): HttpError {
  return new HttpError({}, { status, responseBody: body });
}

function respondWith({ bodies }: { bodies: unknown[] }): void {
  for (const body of bodies) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
  }
}

describe('algolia client', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    vi.useRealTimers();
  });

  it('searches with the documented body keys', async () => {
    respondWith({ bodies: [{ hits: [], nbHits: 0, page: 0, nbPages: 0, hitsPerPage: 5, query: 'x' }] });
    await searchAlgoliaRecords({ auth, indexName: 'my index', query: 'x', filters: 'a:b', hitsPerPage: 5, page: 0, attributesToRetrieve: ['title'] });
    const request = sendRequest.mock.calls[0][0];
    expect(request.url).toBe('https://APP.algolia.net/1/indexes/my%20index/query');
    expect(request.body).toEqual({ query: 'x', hitsPerPage: 5, page: 0, filters: 'a:b', attributesToRetrieve: ['title'] });
  });

  it('gets a record and maps 404 to a not-found message', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body: { message: 'ObjectID does not exist' } }));
    await expect(getAlgoliaRecord({ auth, indexName: 'i', objectID: 'o1' })).rejects.toThrow('no record with objectID "o1"');
  });

  it('sends partial updates with createIfNotExists', async () => {
    respondWith({ bodies: [{ taskID: 7, objectID: 'o1', updatedAt: 't' }, { status: 'published' }] });
    const result = await partialUpdateAlgoliaRecord({ auth, indexName: 'i', objectID: 'o1', attributes: { price: 1 }, createIfNotExists: false });
    const request = sendRequest.mock.calls[0][0];
    expect(request.url).toBe('https://APP.algolia.net/1/indexes/i/o1/partial');
    expect(request.queryParams).toEqual({ createIfNotExists: 'false' });
    expect(result.status).toBe('published');
  });

  it('deletes by filter', async () => {
    respondWith({ bodies: [{ taskID: 3 }, { status: 'published' }] });
    const result = await deleteAlgoliaRecordsByFilter({ auth, indexName: 'i', filters: 'category:books' });
    expect(sendRequest.mock.calls[0][0].body).toEqual({ filters: 'category:books' });
    expect(result).toEqual({ taskID: 3, status: 'published' });
  });

  it('chunks 1001 records into two batches', async () => {
    respondWith({ bodies: [{ taskID: 1, objectIDs: ['a'] }, { taskID: 2, objectIDs: ['b'] }, { status: 'published' }] });
    const records = Array.from({ length: 1001 }, (_, index) => ({ objectID: String(index) }));
    const result = await saveAlgoliaRecords({ auth, indexName: 'i', records });
    expect(sendRequest.mock.calls[0][0].body.requests).toHaveLength(1000);
    expect(sendRequest.mock.calls[1][0].body.requests).toHaveLength(1);
    expect(result).toEqual({ taskID: 2, objectIDs: ['a', 'b'], status: 'published' });
  });

  it('returns notPublished instead of throwing when the task is slow', async () => {
    vi.useFakeTimers();
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { taskID: 9, objectIDs: ['a'] } });
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body: { status: 'notPublished' } });
    const promise = saveAlgoliaRecords({ auth, indexName: 'i', records: [{ a: 1 }] });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toMatchObject({ taskID: 9, objectIDs: ['a'], status: 'notPublished' });
  });

  it('requests only the needed hits when browsing', async () => {
    respondWith({ bodies: [{ hits: [{ objectID: 'a' }, { objectID: 'b' }], cursor: 'c' }] });
    const records = await browseAlgoliaRecords({ auth, indexName: 'i', limit: 2 });
    expect(sendRequest.mock.calls[0][0].body).toEqual({ hitsPerPage: 2 });
    expect(records).toEqual([{ objectID: 'a' }, { objectID: 'b' }]);
  });
});

describe('bug hunt fixes', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    vi.useRealTimers();
  });

  it('refuses an application ID that would change the host', async () => {
    const badAuth = { props: { applicationId: 'example.com#', apiKey: 'KEY' } };
    await expect(getAlgoliaRecord({ auth: badAuth, indexName: 'i', objectID: 'o' })).rejects.toThrow('Invalid Algolia Application ID');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('stops polling the task at the 30 second deadline with short per-poll timeouts', async () => {
    vi.useFakeTimers();
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { taskID: 4, objectIDs: ['a'] } });
    sendRequest.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      return { status: 200, headers: {}, body: { status: 'notPublished' } };
    });
    const started = Date.now();
    const promise = saveAlgoliaRecords({ auth, indexName: 'i', records: [{ a: 1 }] });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.status).toBe('notPublished');
    expect(Date.now() - started).toBeLessThanOrEqual(36_000);
    const pollTimeouts = sendRequest.mock.calls.slice(1).map((call) => call[0].timeout);
    expect(Math.max(...pollTimeouts)).toBeLessThanOrEqual(5_000);
  });

  it('accepts any browse limit of at least 1 and rejects invalid ones', () => {
    const parseLimit = ({ value }: { value: unknown }) => parseIntegerInRange({ value, fieldName: 'Limit', min: 1, max: Number.MAX_SAFE_INTEGER, defaultValue: 10_000 });
    expect(parseLimit({ value: 50_000 })).toBe(50_000);
    for (const value of [0, -1, 1.5]) {
      expect(() => parseLimit({ value })).toThrow('Limit must be a whole number of at least 1.');
    }
  });
});

describe('error mapping', () => {
  it('maps 403 with the vendor message', () => {
    const error = mapAlgoliaError({ error: httpError({ status: 403, body: { message: 'Method not allowed with this API key' } }), operation: 'search records', isWrite: false });
    expect(error.message).toBe('Algolia search records failed (403): Method not allowed with this API key — The API key is missing the ACL needed for this operation, or the Application ID is wrong.');
  });

  it('maps 400', () => {
    const error = mapAlgoliaError({ error: httpError({ status: 400, body: { message: 'Record is too big' } }), operation: 'save records', isWrite: true });
    expect(error.message).toBe('Algolia save records failed (400): Record is too big');
  });

  it('maps transport errors and warns a write may be applied', () => {
    const error = mapAlgoliaError({ error: new Error('timeout of 60000ms exceeded'), operation: 'save records', isWrite: true });
    expect(error.message).toContain('could not get a response');
    expect(error.message).toContain('may still have been applied');
  });
});

describe('validation', () => {
  it('rejects an empty filter', () => {
    expect(() => parseRequiredString('  ', 'Filters')).toThrow('Filters is required.');
  });

  it('rejects a browse limit below 1', () => {
    expect(() => parseIntegerInRange({ value: 0, fieldName: 'Limit', min: 1, max: 10, defaultValue: 5 })).toThrow();
    expect(() => parseIntegerInRange({ value: 0, fieldName: 'Limit', min: 1, max: Number.MAX_SAFE_INTEGER, defaultValue: 5 })).toThrow('Limit must be a whole number of at least 1.');
    expect(parseIntegerInRange({ value: undefined, fieldName: 'Limit', min: 1, max: 10, defaultValue: 5 })).toBe(5);
  });
});

describe('qa edge cases', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  it('adds the retry warning on a 5xx write but not on a 5xx read', () => {
    const write = mapAlgoliaError({ error: httpError({ status: 503, body: { message: 'down' } }), operation: 'save records', isWrite: true });
    const read = mapAlgoliaError({ error: httpError({ status: 503, body: { message: 'down' } }), operation: 'search records', isWrite: false });
    expect(write.message).toContain('may still have been applied');
    expect(read.message).not.toContain('may still have been applied');
  });

  it('adds the rate-limit hint on 429 and survives an empty body', () => {
    const error = mapAlgoliaError({ error: httpError({ status: 429, body: undefined }), operation: 'search records', isWrite: false });
    expect(error.message).toBe('Algolia search records failed (429): no error message returned — Algolia rate limit reached; try again later.');
  });

  it('carries no status or body on the thrown error', () => {
    const error = mapAlgoliaError({ error: httpError({ status: 400, body: { message: 'x' } }), operation: 'op', isWrite: false });
    expect(Object.keys(error)).toEqual([]);
  });

  it('reports already-sent records when a later chunk fails', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { taskID: 1, objectIDs: ['a'] } });
    sendRequest.mockRejectedValueOnce(httpError({ status: 400, body: { message: 'Record is too big' } }));
    const records = Array.from({ length: 1500 }, (_, index) => ({ objectID: String(index) }));
    await expect(saveAlgoliaRecords({ auth, indexName: 'i', records })).rejects.toThrow('The first 1000 of 1500 records were already sent');
  });

  it('pages browse with the cursor only and stops at the limit', async () => {
    const page = ({ prefix, cursor }: { prefix: string; cursor?: string }) => ({ hits: Array.from({ length: 1000 }, (_, i) => ({ objectID: `${prefix}${i}` })), ...(cursor ? { cursor } : {}) });
    respondWith({ bodies: [page({ prefix: 'a', cursor: 'c1' }), page({ prefix: 'b', cursor: 'c2' })] });
    const records = await browseAlgoliaRecords({ auth, indexName: 'i', limit: 1500 });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls[1][0].body).toEqual({ cursor: 'c1' });
    expect(records).toHaveLength(1500);
  });

  it('encodes index and objectID and trims the application id', async () => {
    respondWith({ bodies: [{ objectID: 'a/b' }] });
    await getAlgoliaRecord({ auth: { props: { applicationId: ' APP ', apiKey: 'KEY' } }, indexName: 'my index', objectID: 'a/b', attributesToRetrieve: ['x', 'y'] });
    const request = sendRequest.mock.calls[0][0];
    expect(request.url).toBe('https://APP.algolia.net/1/indexes/my%20index/a%2Fb');
    expect(request.queryParams).toEqual({ attributesToRetrieve: 'x,y' });
    expect(request.headers['x-algolia-application-id']).toBe('APP');
  });

  it('does not send empty filters or attributes in search', async () => {
    respondWith({ bodies: [{ hits: [], nbHits: 0, page: 0, nbPages: 0, hitsPerPage: 20, query: '' }] });
    await searchAlgoliaRecords({ auth, indexName: 'i', query: '', hitsPerPage: 20, page: 0 });
    expect(sendRequest.mock.calls[0][0].body).toEqual({ query: '', hitsPerPage: 20, page: 0 });
  });

  it('rejects non-object attributes for partial update', async () => {
    const { parseAlgoliaRecord, parseAlgoliaRecordArray } = await import('../src/lib/common/utils');
    expect(() => parseAlgoliaRecord({ value: [], fieldName: 'Attributes' })).toThrow('non-empty JSON object');
    expect(() => parseAlgoliaRecord({ value: {}, fieldName: 'Attributes' })).toThrow('non-empty JSON object');
    expect(() => parseAlgoliaRecordArray([])).toThrow();
    expect(() => parseAlgoliaRecordArray(['x'])).toThrow('Record 1');
  });

  it('a transport failure while polling the task after an accepted write warns it may be applied', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { taskID: 9, objectIDs: ['a'] } });
    sendRequest.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await saveAlgoliaRecords({ auth, indexName: 'i', records: [{ a: 1 }] });
    expect(result.status).toBe('notPublished');
    expect(result.note).toContain('may still be applied');
  });
});
