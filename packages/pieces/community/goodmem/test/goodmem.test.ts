import { describe, expect, it, vi, afterEach } from 'vitest';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { goodmemApi, goodmemBuilders, goodmemParsers } from '../src/lib/common/client';
import { buildGoodMemApiError, GoodMemApiError, goodmemValidationMessage } from '../src/lib/common/errors';
import { goodmem } from '../src/index';

const auth = { baseUrl: 'http://localhost:8080/', apiKey: 'secret-key' };
const aiStoreMemory = goodmem.getAction('ai_store_memory');

function storeMemoryContext({ text }: { text: string }): Parameters<NonNullable<typeof aiStoreMemory>['run']>[0] {
  return Object.assign(Object.create(null), {
    auth: { type: 'CUSTOM_AUTH', props: { baseUrl: auth.baseUrl, apiKey: auth.apiKey } },
    propsValue: { spaceId: ' space-1 ', text },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('error mapping', () => {
  it('keeps the vendor message, trims trailing punctuation, and uses responseBody not body', () => {
    const error = buildGoodMemApiError({ status: 404, responseBody: { error: 'Memory not found.' }, action: 'get memory' });
    expect(error.message).toBe('GoodMem get memory failed (HTTP 404): Memory not found');
    expect(error.status).toBe(404);
    expect(error.responseBody).toEqual({ error: 'Memory not found.' });
    expect(Object.keys(error)).not.toContain('body');
  });

  it('falls back to a status hint when the body has no message', () => {
    expect(buildGoodMemApiError({ status: 401, responseBody: '', action: 'list spaces' }).message).toContain('API key is invalid');
  });

  it('throws GoodMemApiError when the HTTP call fails instead of returning success false', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 404, responseBody: { message: 'not found' } }));
    await expect(goodmemApi.request({ auth, method: HttpMethod.GET, path: goodmemApi.memoryPath('x'), action: 'get memory' })).rejects.toMatchObject({ status: 404, message: 'GoodMem get memory failed (HTTP 404): not found' });
  });

  it('maps network failures to status 0 and validation names them', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new TypeError('fetch failed'));
    const failure = await goodmemApi.request({ auth, method: HttpMethod.GET, path: '/v1/spaces', action: 'connection check' }).catch((error: unknown) => error);
    expect(goodmemValidationMessage(failure)).toContain('Cannot reach the base URL');
    expect(goodmemValidationMessage(new GoodMemApiError({ message: 'm', status: 401, responseBody: null }))).toBe('Invalid API key. m');
  });
});

describe('request', () => {
  it('trims base URL, sends X-API-Key, and encodes memory IDs', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { memoryId: 'a' } });
    await goodmemApi.request({ auth, method: HttpMethod.GET, path: goodmemApi.memoryPath('a/b c'), action: 'get memory' });
    const call = spy.mock.calls[0][0];
    expect(call.url).toBe('http://localhost:8080/v1/memories/a%2Fb%20c');
    expect(call.headers).toMatchObject({ 'X-API-Key': 'secret-key' });
  });
});

describe('pagination', () => {
  it('follows nextToken across pages', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { spaces: [{ spaceId: '1', name: 'a' }], nextToken: 't1' } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { spaces: [{ spaceId: '2', name: 'b' }] } });
    const spaces = await goodmemApi.listAllSpaces({ auth });
    expect(spaces.map((space) => space.spaceId)).toEqual(['1', '2']);
    expect(spy.mock.calls[1][0].queryParams).toMatchObject({ nextToken: 't1', maxResults: '1000' });
  });

  it('reuses a space found on a later page instead of creating a duplicate', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { spaces: [{ spaceId: '1', name: 'other' }], nextToken: 't1' } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { spaces: [{ spaceId: '2', name: 'target', spaceEmbedders: [{ embedderId: 'e1' }] }] } });
    const result = await goodmemApi.createOrReuseSpace({ auth, name: 'target', embedderId: 'e2', chunkingConfig: goodmemBuilders.buildChunkingConfig({}) });
    expect(result).toMatchObject({ spaceId: '2', reused: true, embedderId: 'e1' });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('propagates list errors instead of creating a space', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 500, responseBody: 'boom' }));
    await expect(goodmemApi.createOrReuseSpace({ auth, name: 'x', embedderId: 'e', chunkingConfig: goodmemBuilders.buildChunkingConfig({}) })).rejects.toMatchObject({ status: 500 });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('body builders', () => {
  it('rejects chunk size 0 instead of coercing it to the default', () => {
    expect(() => goodmemBuilders.buildChunkingConfig({ chunkSize: 0 })).toThrow('Chunk Size');
    expect(goodmemBuilders.buildChunkingConfig({ chunkSize: 100, chunkOverlap: 0 }).recursive).toMatchObject({ chunkSize: 100, chunkOverlap: 0 });
  });

  it('builds metadata key by key and rejects non-object metadata', () => {
    expect(goodmemBuilders.buildMemoryMetadata({ source: 's', tags: 'a, b,', metadata: { x: 1 } })).toEqual({ x: 1, source: 's', tags: ['a', 'b'] });
    expect(() => goodmemBuilders.buildMemoryMetadata({ metadata: [1] })).toThrow('JSON object');
    expect(goodmemBuilders.buildMemoryMetadata({})).toBeUndefined();
  });

  it('builds the memory body without auth fields and throws on missing content', () => {
    const body = goodmemBuilders.buildMemoryRequestBody({ spaceId: 's', textContent: 'hello' });
    expect(body).toEqual({ spaceId: 's', contentType: 'text/plain', originalContent: 'hello' });
    expect(JSON.stringify(body)).not.toContain('secret-key');
    expect(() => goodmemBuilders.buildMemoryRequestBody({ spaceId: 's' })).toThrow('No content provided');
    expect(goodmemBuilders.buildMemoryRequestBody({ spaceId: 's', file: { base64: 'JVBERg==', extension: 'pdf' } })).toEqual({ spaceId: 's', contentType: 'application/pdf', originalContentB64: 'JVBERg==' });
  });

  it('builds the retrieve body and throws when no space is given', () => {
    expect(() => goodmemBuilders.buildRetrieveRequestBody({ query: 'q', spaceIds: [' '], fetchMemory: true })).toThrow('At least one space');
    const body = goodmemBuilders.buildRetrieveRequestBody({ query: 'q', spaceIds: ['s1'], fetchMemory: false, rerankerId: 'r', relevanceThreshold: 0 });
    expect(body).toMatchObject({ message: 'q', spaceKeys: [{ spaceId: 's1' }], requestedSize: 5, fetchMemory: false });
    expect(body['postProcessor']).toMatchObject({ config: { reranker_id: 'r', relevance_threshold: 0, max_results: 5 } });
  });
});

describe('retrieve stream parsing', () => {
  it('parses NDJSON and SSE events', () => {
    const raw = [
      'event: message',
      'data: {"resultSetBoundary":{"resultSetId":"rs1"}}',
      '{"retrievedItem":{"chunk":{"chunk":{"chunkId":"c1","chunkText":"hi","memoryId":"m1"},"relevanceScore":0.9,"memoryIndex":0}}}',
      '{"memoryDefinition":{"memoryId":"m1"}}',
      '{"abstractReply":{"text":"answer"}}',
      '',
    ].join('\n');
    const parsed = goodmemParsers.parseRetrieveStream(raw);
    expect(parsed.resultSetId).toBe('rs1');
    expect(parsed.results).toEqual([{ chunkId: 'c1', chunkText: 'hi', memoryId: 'm1', relevanceScore: 0.9, memoryIndex: 0 }]);
    expect(parsed.memories).toEqual([{ memoryId: 'm1' }]);
    expect(parsed.abstractReply).toEqual({ text: 'answer' });
  });

  it('throws on a malformed line instead of skipping it', () => {
    expect(() => goodmemParsers.parseRetrieveStream('{"ok":1}\nnot json')).toThrow(GoodMemApiError);
  });
});

describe('ai store memory', () => {
  it('stores the text exactly as given, keeping indentation and trailing newline', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { memoryId: 'm1' } });
    const text = '    return value\n';
    await aiStoreMemory?.run(storeMemoryContext({ text }));
    expect(spy.mock.calls[0][0].body).toMatchObject({ spaceId: 'space-1', contentType: 'text/plain', originalContent: text });
  });

  it('rejects blank text before calling the API', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(aiStoreMemory?.run(storeMemoryContext({ text: '   \n' }))).rejects.toThrow('Text is required');
    expect(spy).not.toHaveBeenCalled();
  });
});
