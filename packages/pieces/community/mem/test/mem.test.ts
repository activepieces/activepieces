import { HttpError, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNoteAction } from '../src/lib/actions/create-note';
import { deleteNoteAction } from '../src/lib/actions/delete-note';
import { updateNoteAction } from '../src/lib/actions/update-note';
import { restoreNoteAction } from '../src/lib/actions/restore-note';
import { addNoteToCollectionAction } from '../src/lib/actions/add-note-to-collection';
import { memAuth } from '../src/lib/auth';
import { MemApiError, memClient } from '../src/lib/common';

const auth: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: 'key-123',
};

const server = { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' };

function mockResponses(bodies: unknown[]): HttpRequest[] {
  const calls: HttpRequest[] = [];
  const queue = [...bodies];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    calls.push(request);
    return { status: 200, headers: {}, body: queue.shift() };
  });
  return calls;
}

function mockFailure({ status, body }: { status: number; body: unknown }): void {
  vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
    new HttpError({}, { status, responseBody: body })
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('create_note', () => {
  it('sends UUID values as collection_ids and other values as collection_titles', async () => {
    const calls = mockResponses([{ id: 'n1' }]);
    const propsValue = {
      content: '# Hello',
      id: undefined,
      created_at: undefined,
      add_to_collections: ['59508B41-8770-4855-aa37-302b1e09aee7', 'Work Projects', ' '],
    };
    await createNoteAction.run({ ...createMockActionContext({ propsValue }), auth, propsValue });
    expect(calls[0].url).toBe('https://api.mem.ai/v2/notes');
    expect(calls[0].body).toEqual({
      content: '# Hello',
      collection_ids: ['59508B41-8770-4855-aa37-302b1e09aee7'],
      collection_titles: ['Work Projects'],
    });
  });

  it('omits collection fields when none are given', async () => {
    const calls = mockResponses([{ id: 'n1' }]);
    const propsValue = { content: 'x', id: undefined, created_at: undefined, add_to_collections: undefined };
    await createNoteAction.run({ ...createMockActionContext({ propsValue }), auth, propsValue });
    expect(calls[0].body).toEqual({ content: 'x' });
  });
});

describe('path encoding', () => {
  it('encodes note ids in delete_note', async () => {
    const calls = mockResponses([{ request_id: 'r' }]);
    const propsValue = { note_id: '../collections/x?y' };
    await deleteNoteAction.run({ ...createMockActionContext({ propsValue }), auth, propsValue });
    expect(calls[0].method).toBe(HttpMethod.DELETE);
    expect(calls[0].url).toBe('https://api.mem.ai/v2/notes/..%2Fcollections%2Fx%3Fy');
  });

  it('encodes both ids in add_note_to_collection and uses PUT', async () => {
    const calls = mockResponses([{ request_id: 'r' }]);
    const propsValue = { collection_id: 'a/b', note_id: 'c d' };
    await addNoteToCollectionAction.run({ ...createMockActionContext({ propsValue }), auth, propsValue });
    expect(calls[0].method).toBe(HttpMethod.PUT);
    expect(calls[0].url).toBe('https://api.mem.ai/v2/collections/a%2Fb/notes/c%20d');
  });
});

describe('restore_note', () => {
  it('posts to the encoded restore path with no body', async () => {
    const calls = mockResponses([{ request_id: 'r1' }]);
    const propsValue = { note_id: 'a/b' };
    const result = await restoreNoteAction.run({ ...createMockActionContext({ propsValue }), auth, propsValue });
    expect(calls[0].method).toBe(HttpMethod.POST);
    expect(calls[0].url).toBe('https://api.mem.ai/v2/notes/a%2Fb/restore');
    expect(calls[0].body).toBeUndefined();
    expect(result).toEqual({ request_id: 'r1' });
  });
});

describe('update_note', () => {
  it('fetches the current version when none is given', async () => {
    const calls = mockResponses([{ id: 'n1', version: 7 }, { id: 'n1', version: 8 }]);
    const propsValue = { note_id: 'n1', content: '# New', version: undefined, updated_at: undefined };
    const result = await updateNoteAction.run({ ...createMockActionContext({ propsValue }), auth, propsValue });
    expect(calls).toHaveLength(2);
    expect(calls[0].method).toBe(HttpMethod.GET);
    expect(calls[1].method).toBe(HttpMethod.PATCH);
    expect(calls[1].body).toEqual({ content: '# New', version: 7 });
    expect(result).toEqual({ id: 'n1', version: 8 });
  });

  it('uses the given version without a GET', async () => {
    const calls = mockResponses([{ id: 'n1', version: 4 }]);
    const propsValue = { note_id: 'n1', content: '# New', version: 3, updated_at: undefined };
    await updateNoteAction.run({ ...createMockActionContext({ propsValue }), auth, propsValue });
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toEqual({ content: '# New', version: 3 });
  });
});

describe('errors', () => {
  it('keeps vendor text on responseBody and distinguishes quota from rate limit', async () => {
    const body = { error: { type: 'quota_exceeded', message: 'Monthly limit', details: { reset_time: '2026-12-01T00:00:00Z' } } };
    mockFailure({ status: 429, body });
    const error = await memClient
      .request<unknown>({ apiKey: 'k', method: HttpMethod.GET, path: '/notes' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MemApiError);
    expect(error).toMatchObject({ status: 429, responseBody: body });
    expect(String(error)).toContain('quota');
    expect(String(error)).toContain('2026-12-01T00:00:00Z');
    expect(memClient.describeFailure({ status: 429, body: { error: { type: 'rate_limited' } } })).toContain('rate limit');
  });

  it('labels 401, 403 and 5xx differently', () => {
    expect(memClient.describeFailure({ status: 401, body: {} })).toContain('401');
    expect(memClient.describeFailure({ status: 403, body: {} })).toContain('403');
    expect(memClient.describeFailure({ status: 503, body: 'down' })).toContain('server error (503)');
  });
});

describe('auth validate', () => {
  it('reports 401 as an invalid key', async () => {
    mockFailure({ status: 401, body: { error: { message: 'bad token' } } });
    const result = await memAuth.validate?.({ auth: 'bad', server });
    expect(result).toEqual({ valid: false, error: 'Invalid API key. Mem rejected it with 401.' });
  });

  it('does not call an outage an invalid key', async () => {
    mockFailure({ status: 500, body: { message: 'boom' } });
    const result = await memAuth.validate?.({ auth: 'k', server });
    expect(result?.valid).toBe(false);
    expect(JSON.stringify(result)).toContain('server error (500)');
    expect(JSON.stringify(result)).not.toContain('Invalid API key');
  });

  it('accepts a working key with a cheap call', async () => {
    const calls = mockResponses([{ results: [] }]);
    const result = await memAuth.validate?.({ auth: 'k', server });
    expect(result).toEqual({ valid: true });
    expect(calls[0].url).toBe('https://api.mem.ai/v2/collections');
    expect(calls[0].queryParams).toEqual({ limit: '1' });
  });
});

describe('pollNotes', () => {
  it('dedupes repeats across pages and drops items at the inclusive boundary', async () => {
    const boundary = Date.parse('2026-11-01T10:00:00.000Z');
    const calls = mockResponses([
      {
        results: [
          { id: 'a', title: 'A', created_at: '2026-11-01T10:00:00.000Z', updated_at: '2026-11-01T10:00:00.000Z' },
          { id: 'b', title: 'B', created_at: '2026-11-01T10:05:00.000Z', updated_at: '2026-11-01T10:05:00.000Z' },
        ],
        total: 3,
        next_page: 'p2',
      },
      {
        results: [
          { id: 'b', title: 'B', created_at: '2026-11-01T10:05:00.000Z', updated_at: '2026-11-01T10:05:00.000Z' },
          { id: 'c', title: 'C', created_at: '2026-11-01T10:07:00.000Z', updated_at: '2026-11-01T10:07:00.000Z' },
        ],
        total: 3,
        next_page: null,
      },
    ]);
    const items = await memClient.pollNotes({
      apiKey: 'k',
      timestampField: 'created_at',
      lastFetchEpochMS: boundary,
      collectionId: undefined,
    });
    expect(items.map((item) => item.data.id)).toEqual(['c', 'b']);
    expect(calls[0].queryParams).toMatchObject({
      order_by: 'created_at',
      filter_by_created_after: '2026-11-01T10:00:00.000Z',
      limit: '100',
    });
    expect(calls[1].queryParams).toMatchObject({ page: 'p2' });
  });

  it('stops after 10 pages even when next_page keeps coming', async () => {
    const pages = Array.from({ length: 11 }, (_, index) => ({
      results: [{ id: `n${index}`, title: 'T', created_at: '2026-11-02T00:00:00.000Z', updated_at: '2026-11-02T00:00:00.000Z' }],
      total: 11,
      next_page: `p${index + 1}`,
    }));
    const calls = mockResponses(pages);
    await memClient.pollNotes({ apiKey: 'k', timestampField: 'created_at', lastFetchEpochMS: 1, collectionId: undefined });
    expect(calls).toHaveLength(10);
  });

  it('rethrows API failures instead of returning an empty list', async () => {
    mockFailure({ status: 503, body: 'down' });
    await expect(
      memClient.pollNotes({ apiKey: 'k', timestampField: 'updated_at', lastFetchEpochMS: 1, collectionId: undefined })
    ).rejects.toBeInstanceOf(MemApiError);
  });
});
