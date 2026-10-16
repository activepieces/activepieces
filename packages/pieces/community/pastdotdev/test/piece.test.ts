import { afterEach, describe, expect, test, vi } from 'vitest';
import { pastdotdev } from '../src';
import { deleteDataPointAction } from '../src/lib/actions/delete-data-point';
import { ingestAction } from '../src/lib/actions/ingest';
import { recallAction } from '../src/lib/actions/recall';
import { pastDevAuth } from '../src/lib/auth';
import { pastDevClient } from '../src/lib/common/client';
import { pastDevProps } from '../src/lib/common/props';
import { FAKE_HOST, FAKE_KEY, actionContext, installFakePastDev } from './fake-past-dev';

const server = {
  apiUrl: 'http://localhost:3000',
  publicUrl: 'http://localhost:4200',
  mintOidcToken: async () => 'token',
};

const connection = {
  type: 'CUSTOM_AUTH',
  props: { apiKey: FAKE_KEY, apiHost: FAKE_HOST },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('piece definition', () => {
  test('uses the agreed names', () => {
    expect(pastdotdev.displayName).toBe('past dev');
    expect(pastdotdev.description.startsWith('past dev is a memory API for AI agents')).toBe(true);
    const actions = pastdotdev.actions();
    expect(Object.keys(actions).sort()).toEqual(
      ['custom_api_call', 'delete_data_point', 'ingest', 'recall'].sort()
    );
    expect(actions['ingest'].displayName).toBe('Ingest');
    expect(actions['recall'].displayName).toBe('Recall');
    expect(actions['delete_data_point'].displayName).toBe('Delete data point');
  });

  test('exposes the API field keys and serializable metadata', () => {
    const actions = pastdotdev.actions();
    expect(Object.keys(actions['ingest'].props)).toEqual([
      'content',
      'identity',
      'timestamp',
      'id',
      'audience',
      'label',
      'metadata',
      'idempotencyKey',
    ]);
    expect(Object.keys(actions['recall'].props)).toEqual([
      'query',
      'identity',
      'limit',
      'level',
      'maxTokens',
      'sort',
      'queryTimestamp',
      'occurredFrom',
      'occurredTo',
    ]);
    expect(Object.keys(actions['delete_data_point'].props)).toEqual(['sourceId']);
    expect(() => JSON.stringify(pastdotdev.metadata())).not.toThrow();
  });
});

describe('connection', () => {
  test('validates with the free audiences read', async () => {
    const fake = installFakePastDev({ responses: [{ status: 200, body: { audiences: [] } }] });
    const result = await pastDevAuth.validate?.({
      auth: { apiKey: FAKE_KEY, apiHost: FAKE_HOST },
      server,
    });
    expect(result).toEqual({ valid: true });
    expect(fake.calls).toEqual([
      {
        url: `${FAKE_HOST}/api/v1/audiences`,
        method: 'GET',
        authorization: `Bearer ${FAKE_KEY}`,
        body: undefined,
      },
    ]);
  });

  test('uses https://api.past.dev when no host is set', async () => {
    const fake = installFakePastDev({ responses: [{ status: 200, body: { audiences: [] } }] });
    await pastDevAuth.validate?.({ auth: { apiKey: FAKE_KEY, apiHost: undefined }, server });
    expect(fake.calls[0].url).toBe('https://api.past.dev/api/v1/audiences');
  });

  test('refuses a bad key with the API error code and never echoes the key', async () => {
    installFakePastDev({
      responses: [
        {
          status: 401,
          body: { code: 'unauthorized', status: 401, debugMessage: 'The key is unknown.' },
        },
      ],
    });
    const result = await pastDevAuth.validate?.({
      auth: { apiKey: FAKE_KEY, apiHost: FAKE_HOST },
      server,
    });
    expect(result?.valid).toBe(false);
    const error = result && !result.valid ? result.error : '';
    expect(error).toContain('401 unauthorized');
    expect(error).toContain('The key is unknown.');
    expect(error).not.toContain(FAKE_KEY);
  });
});

describe('host setting', () => {
  test('normalizes the host', () => {
    expect(pastDevClient.resolveBaseUrl({ apiHost: '' })).toBe('https://api.past.dev');
    expect(pastDevClient.resolveBaseUrl({ apiHost: ' https://memory.acme.test/ ' })).toBe(
      'https://memory.acme.test'
    );
    expect(pastDevClient.resolveBaseUrl({ apiHost: 'https://memory.acme.test/api/v1/' })).toBe(
      'https://memory.acme.test'
    );
  });
});

describe('Ingest', () => {
  test('sends only the fields that are set, with the API field names', async () => {
    const fake = installFakePastDev({
      responses: [
        {
          status: 202,
          requestId: 'req_ingest',
          body: { projectId: 7, ingestionId: 'ing-1', sourceId: 'msg-1', status: 'queued' },
        },
      ],
    });
    const output = await ingestAction.run(
      actionContext({
        apiHost: FAKE_HOST,
        propsValue: {
          content: 'Ana prefers email over phone.',
          identity: 'user-42',
          timestamp: '2026-10-01T09:30:00.000Z',
          id: 'msg-1',
          audience: undefined,
          label: '',
          metadata: { channel: 'support' },
          idempotencyKey: undefined,
        },
      })
    );
    expect(fake.calls[0].method).toBe('POST');
    expect(fake.calls[0].url).toBe(`${FAKE_HOST}/api/v1/ingest`);
    expect(fake.calls[0].body).toEqual({
      content: 'Ana prefers email over phone.',
      identity: 'user-42',
      timestamp: '2026-10-01T09:30:00.000Z',
      id: 'msg-1',
      metadata: { channel: 'support' },
    });
    expect(output).toEqual({
      projectId: 7,
      ingestionId: 'ing-1',
      sourceId: 'msg-1',
      status: 'queued',
      requestId: 'req_ingest',
    });
  });

  test('stops on out-of-credits and says not to run again', async () => {
    installFakePastDev({
      responses: [
        {
          status: 402,
          body: { code: 'out-of-credits', status: 402, data: { creditsLeft: 0 } },
        },
      ],
    });
    const run = ingestAction.run(
      actionContext({ apiHost: FAKE_HOST, propsValue: { content: 'hello' } })
    );
    await expect(run).rejects.toThrow(/402 out-of-credits.*Do not run the step again/);
    await expect(run).rejects.not.toThrow(/hello/);
  });
});

describe('Recall', () => {
  test('sends the query and flattens the results', async () => {
    const fake = installFakePastDev({
      responses: [
        {
          status: 200,
          body: {
            asOf: '2026-10-16T10:00:00Z',
            usedEvidenceTokens: 42,
            results: [
              {
                id: 'doc-1',
                rank: 1,
                occurredAt: '2026-10-01T09:30:00Z',
                content: 'Ana prefers email over phone.',
                artifact: { id: 'art-1', kind: 'observation', occurredAt: '2026-10-01T09:30:00Z' },
                sources: [
                  { sourceId: 'msg-1', occurredAt: '2026-10-01T09:30:00Z', excerpts: ['email please'] },
                ],
              },
            ],
          },
        },
      ],
    });
    const output = await recallAction.run(
      actionContext({
        apiHost: FAKE_HOST,
        propsValue: {
          query: 'How does Ana want to be contacted?',
          identity: 'user-42',
          limit: 5,
          level: 'medium',
          maxTokens: undefined,
          sort: 'relevance',
          queryTimestamp: undefined,
          occurredFrom: undefined,
          occurredTo: undefined,
        },
      })
    );
    expect(fake.calls[0].url).toBe(`${FAKE_HOST}/api/v1/recall`);
    expect(fake.calls[0].body).toEqual({
      query: 'How does Ana want to be contacted?',
      identity: 'user-42',
      limit: 5,
      level: 'medium',
      sort: 'relevance',
    });
    expect(output.resultCount).toBe(1);
    expect(output.text).toBe('[2026-10-01T09:30:00Z] Ana prefers email over phone.');
    expect(output.results[0]).toMatchObject({
      rank: 1,
      kind: 'observation',
      sourceIds: 'msg-1',
      supersededAt: null,
    });
  });

  test('refuses level and maxTokens together before any request', async () => {
    const fake = installFakePastDev({ responses: [] });
    await expect(
      recallAction.run(
        actionContext({
          apiHost: FAKE_HOST,
          propsValue: { query: 'q', identity: 'user-42', level: 'low', maxTokens: 500 },
        })
      )
    ).rejects.toThrow('Set Evidence level or Maximum tokens, not both.');
    expect(fake.calls).toHaveLength(0);
  });
});

describe('Delete data point', () => {
  test('deletes by encoded source id', async () => {
    const fake = installFakePastDev({
      responses: [{ status: 202, body: { operationId: 'op-1', ids: ['thread/7 #1'] } }],
    });
    const output = await deleteDataPointAction.run(
      actionContext({ apiHost: FAKE_HOST, propsValue: { sourceId: 'thread/7 #1' } })
    );
    expect(fake.calls[0].method).toBe('DELETE');
    expect(fake.calls[0].url).toBe(`${FAKE_HOST}/api/v1/data-points/thread%2F7%20%231`);
    expect(output).toEqual({ operationId: 'op-1', ids: ['thread/7 #1'], requestId: 'req_test' });
  });

  test('reports a missing source id as not found', async () => {
    installFakePastDev({
      responses: [{ status: 404, body: { code: 'data-point-not-found', status: 404 } }],
    });
    await expect(
      deleteDataPointAction.run(
        actionContext({ apiHost: FAKE_HOST, propsValue: { sourceId: 'gone' } })
      )
    ).rejects.toThrow(/404 data-point-not-found/);
  });
});

describe('dropdowns', () => {
  const propertyContext = {
    server: { apiUrl: '', publicUrl: '', token: '' },
    project: { id: 'p', externalId: async () => undefined },
    flows: { list: async () => ({ data: [], next: null, previous: null }), current: { id: 'f', version: { id: 'v' } } },
    connections: { get: async () => null },
  };

  test('identity pages through the directory and offers a typed new identity', async () => {
    const fake = installFakePastDev({
      responses: [
        {
          status: 200,
          body: {
            identities: [{ identity: 'user-1', traits: { name: 'Ana', email: 'ana@acme.test' } }],
            hasMore: true,
            endCursor: 'c1',
          },
        },
        {
          status: 200,
          body: { identities: [{ identity: 'user-2', traits: {} }], hasMore: false, endCursor: null },
        },
      ],
    });
    const dropdown = pastDevProps.identityDropdown({ required: true, description: 'd' });
    const state = await dropdown.options(
      { auth: connection },
      { ...propertyContext, searchValue: 'new-user' }
    );
    expect(fake.calls.map((call) => call.url)).toEqual([
      `${FAKE_HOST}/api/v1/identities?limit=1000`,
      `${FAKE_HOST}/api/v1/identities?limit=1000&after=c1`,
    ]);
    expect(state.options[0]).toMatchObject({ label: 'Use "new-user"', value: 'new-user' });
  });

  test('identity lists names and emails without a search', async () => {
    installFakePastDev({
      responses: [
        {
          status: 200,
          body: {
            identities: [{ identity: 'user-1', traits: { name: 'Ana', email: 'ana@acme.test' } }],
            hasMore: false,
            endCursor: null,
          },
        },
      ],
    });
    const dropdown = pastDevProps.identityDropdown({ required: true, description: 'd' });
    const state = await dropdown.options({ auth: connection }, propertyContext);
    expect(state.options).toEqual([
      { label: 'user-1', value: 'user-1', description: 'Ana · ana@acme.test' },
    ]);
  });

  test('audience lists slugs', async () => {
    installFakePastDev({
      responses: [
        {
          status: 200,
          body: {
            audiences: [
              { slug: 'project', name: 'project', kind: 'default' },
              { slug: 'support', name: 'Support team', kind: 'fixed' },
            ],
          },
        },
      ],
    });
    const state = await pastDevProps.audienceDropdown.options({ auth: connection }, propertyContext);
    expect(state.options).toEqual([
      { label: 'project', value: 'project' },
      { label: 'Support team (support)', value: 'support' },
    ]);
  });

  test('a dropdown without a connection asks for one', async () => {
    const state = await pastDevProps.audienceDropdown.options({}, propertyContext);
    expect(state.disabled).toBe(true);
  });
});
