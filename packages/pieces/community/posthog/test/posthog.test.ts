import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { posthog } from '../src';
import { PostHogApiError, posthogClient } from '../src/lib/common/client';
import { posthogNewEvent } from '../src/lib/triggers/new-event';

const props = { personal_api_key: 'phx_secret', project_id: '123', api_host: 'https://eu.posthog.com/', ingestion_host: '' };
const auth = { props };

function action(name: string) {
  const found = posthog.actions()[name];
  if (!found) throw new Error(`missing ${name}`);
  return found;
}

function run({ name, propsValue = {} }: { name: string; propsValue?: Record<string, unknown> }) {
  return Reflect.apply(action(name).run, undefined, [{ auth, propsValue }]);
}

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function httpFailure({ status, body }: { status: number; body: unknown }) {
  return Object.assign(new Error('http'), { response: { status, body, headers: {} } });
}

function mockSeq(...bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const b of bodies) {
    if (b instanceof Error) spy.mockRejectedValueOnce(b);
    else spy.mockResolvedValueOnce(ok(b));
  }
  return spy;
}

function req({ spy, i = 0 }: { spy: ReturnType<typeof mockSeq>; i?: number }) {
  return spy.mock.calls[i][0];
}

afterEach(() => vi.restoreAllMocks());

describe('metadata', () => {
  it('every action has an outputSchema and ai actions take no dropdowns', () => {
    for (const a of Object.values(posthog.actions())) {
      if (a.name === 'custom_api_call') continue;
      expect(a.outputSchema, a.name).toBeDefined();
      if (a.audience === 'ai') {
        for (const p of Object.values(a.props)) expect(Reflect.get(p, 'type')).not.toBe('DROPDOWN');
        expect(a.aiMetadata?.description, a.name).toBeTruthy();
      }
    }
  });
  it('create_project is human only', () => {
    expect(action('create_project').audience).toBe('human');
  });
});

describe('hosts', () => {
  it('normalises and defaults', () => {
    expect(posthogClient.apiHostOf({ ...props, api_host: ' https://eu.posthog.com// ' })).toBe('https://eu.posthog.com');
    expect(posthogClient.apiHostOf({ ...props, api_host: '' })).toBe('https://us.posthog.com');
    expect(posthogClient.apiHostOf({ ...props, api_host: 'posthog.acme.io' })).toBe('https://posthog.acme.io');
  });
  it.each(['http://evil.io', 'https://u:p@x.io', 'https://x.io/?a=1', 'https://x.io/a/../b', 'ftp://x.io'])('rejects %s', (h) => {
    expect(() => posthogClient.apiHostOf({ ...props, api_host: h })).toThrow();
  });
  it('same-origin check refuses lookalikes', () => {
    expect(posthogClient.isSameOrigin({ url: 'https://eu.posthog.com/api/x?offset=1', baseUrl: 'https://eu.posthog.com' })).toBe(true);
    expect(posthogClient.isSameOrigin({ url: 'https://eu.posthog.com.evil.io/api', baseUrl: 'https://eu.posthog.com' })).toBe(false);
  });
});

describe('errors', () => {
  it('surfaces PostHog detail and status, no body field', async () => {
    mockSeq(httpFailure({ status: 400, body: { type: 'validation_error', code: 'unique', detail: 'There is already a feature flag with this key.', attr: 'key' } }));
    const err: unknown = await run({ name: 'create_feature_flag', propsValue: { key: 'dup' } }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PostHogApiError);
    expect(err instanceof Error ? err.message : '').toBe('PostHog API error (400): key: There is already a feature flag with this key.');
    expect(err).not.toHaveProperty('body');
  });
  it('401 hint', async () => {
    mockSeq(httpFailure({ status: 401, body: { detail: 'Invalid personal API key.' } }));
    await expect(run({ name: 'get_feature_flag', propsValue: { flagId: '5' } })).rejects.toThrow(/reconnect PostHog/);
  });
});

describe('validate', () => {
  it('maps 401 to invalid credentials and passes other errors through', async () => {
    const check = async () => {
      const result: unknown = await Reflect.apply(Reflect.get(posthog.auth ?? {}, 'validate'), undefined, [{ auth: props }]);
      return Reflect.get(result ?? {}, 'error');
    };
    mockSeq(httpFailure({ status: 401, body: {} }));
    expect(await check()).toMatch(/Invalid credentials/);
    mockSeq(httpFailure({ status: 404, body: {} }));
    expect(await check()).toMatch(/Project not found/);
    mockSeq(httpFailure({ status: 500, body: { detail: 'boom' } }));
    expect(await check()).toMatch(/boom/);
  });
});

describe('actions', () => {
  it('capture event sends token, uuid and timestamp to the ingestion host', async () => {
    const spy = mockSeq({ api_token: 'phc_tok' }, { status: 'Ok' });
    const out = await run({ name: 'create_event', propsValue: { event: 'signup', distinct_id: 'u1', properties: { a: 1 }, uuid: '0190A1B2-C3D4-7E5F-8A9B-0C1D2E3F4A5B', timestamp: '2026-10-18T10:00:00Z' } });
    expect(req({ spy, i: 0 }).url).toBe('https://eu.posthog.com/api/projects/123/');
    expect(req({ spy, i: 0 }).headers?.['authorization']).toBe('Bearer phx_secret');
    expect(req({ spy, i: 1 })).toMatchObject({ method: HttpMethod.POST, url: 'https://us.i.posthog.com/i/v0/e/', followRedirects: false });
    expect(req({ spy, i: 1 }).headers?.['authorization']).toBeUndefined();
    expect(req({ spy, i: 1 }).body).toEqual({ api_key: 'phc_tok', event: 'signup', distinct_id: 'u1', properties: { a: 1 }, timestamp: '2026-10-18T10:00:00.000Z', uuid: '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b' });
    expect(spy.mock.calls[1][1]).toHaveProperty('dispatcher');
    expect(out).toMatchObject({ uuid: '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b', status: 'Ok' });
  });
  it('capture event rejects bad uuid before any request', async () => {
    const spy = mockSeq();
    await expect(run({ name: 'create_event', propsValue: { event: 'e', distinct_id: 'u', uuid: 'nope' } })).rejects.toThrow(/UUID/);
    expect(spy).not.toHaveBeenCalled();
  });
  it('list persons validates limit and keeps legacy shape', async () => {
    await expect(run({ name: 'list_persons', propsValue: { limit: 0 } })).rejects.toThrow(/1 to 100/);
    const spy = mockSeq({ results: [{ id: 1, uuid: 'u', distinct_ids: ['a', 'b'], properties: { email: 'x@y.z' }, created_at: 't' }], next: null });
    const out = await run({ name: 'list_persons', propsValue: { limit: '5', search: 'x' } });
    expect(req({ spy }).queryParams).toEqual({ limit: '5', search: 'x' });
    expect(out).toEqual([{ id: 1, uuid: 'u', distinct_ids: 'a, b', name: null, email: 'x@y.z', created_at: 't', updated_at: null }]);
  });
  it('get feature flags builds creator name without undefined', async () => {
    mockSeq({ results: [{ id: 1, key: 'k', created_by: { email: 'e@x.io', first_name: 'Ann' } }] });
    const [flag] = await run({ name: 'get_feature_flags', propsValue: {} });
    expect(flag.created_by_name).toBe('Ann');
  });
  it('hogql query maps rows and rejects non-select', async () => {
    await expect(run({ name: 'run_hogql_query', propsValue: { query: 'ALTER TABLE events DELETE' } })).rejects.toThrow(/Only SELECT/);
    const spy = mockSeq({ columns: ['event', 'c'], types: [['event', 'String'], ['c', 'UInt64']], results: [['pageview', 3]], hasMore: false });
    const out = await run({ name: 'run_hogql_query', propsValue: { query: 'select event, count() as c from events group by event' } });
    expect(req({ spy })).toMatchObject({ method: HttpMethod.POST, url: 'https://eu.posthog.com/api/projects/123/query/' });
    expect(req({ spy }).body).toMatchObject({ query: { kind: 'HogQLQuery' } });
    expect(out).toEqual({ columns: ['event', 'c'], types: ['String', 'UInt64'], rows: [{ event: 'pageview', c: 3 }], rowCount: 1, hasMore: false });
  });
  it('get person returns found=false when no exact match', async () => {
    mockSeq({ results: [{ uuid: 'p', distinct_ids: ['other'] }] });
    expect(await run({ name: 'get_person', propsValue: { distinctId: 'u1' } })).toMatchObject({ found: false, id: null });
    mockSeq({ results: [{ uuid: 'p', distinct_ids: ['u1'], properties: { email: 'a@b.c' } }] });
    expect(await run({ name: 'get_person', propsValue: { distinctId: 'u1' } })).toMatchObject({ found: true, id: 'p', email: 'a@b.c', distinctIds: ['u1'] });
  });
  it('update person properties needs a change and sends $set', async () => {
    await expect(run({ name: 'update_person_properties', propsValue: { distinctId: 'u' } })).rejects.toThrow(/at least one/);
    const spy = mockSeq({ api_token: 't' }, { status: 1 });
    await run({ name: 'update_person_properties', propsValue: { distinctId: 'u', set: { plan: 'pro' }, unset: ['old'] } });
    expect(req({ spy, i: 1 }).body).toMatchObject({ event: '$set', distinct_id: 'u', properties: { $set: { plan: 'pro' }, $unset: ['old'] } });
  });
  it('delete person requires a uuid and passes delete_events', async () => {
    await expect(run({ name: 'delete_person', propsValue: { personId: 'u1' } })).rejects.toThrow(/UUID/);
    const spy = mockSeq(null);
    await run({ name: 'delete_person', propsValue: { personId: '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b', deleteEvents: true } });
    expect(req({ spy })).toMatchObject({ method: HttpMethod.DELETE, url: 'https://eu.posthog.com/api/projects/123/persons/0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b/', queryParams: { delete_events: 'true' } });
  });
  it('create flag sends one rollout group', async () => {
    await expect(run({ name: 'create_feature_flag', propsValue: { key: 'bad key' } })).rejects.toThrow(/letters/);
    const spy = mockSeq({ id: 9, key: 'k', active: true, filters: { groups: [{ rollout_percentage: 25 }] } });
    const out = await run({ name: 'create_feature_flag', propsValue: { key: 'k', rolloutPercentage: 25 } });
    expect(req({ spy }).body).toEqual({ key: 'k', name: '', active: true, filters: { groups: [{ properties: [], rollout_percentage: 25 }] } });
    expect(out).toMatchObject({ id: 9, rolloutPercentage: 25, url: 'https://eu.posthog.com/project/123/feature_flags/9' });
  });
  it('update flag sends only given fields and refuses multi-group rollout', async () => {
    await expect(run({ name: 'update_feature_flag', propsValue: { flagId: '9' } })).rejects.toThrow(/at least one/);
    let spy = mockSeq({ id: 9 });
    await run({ name: 'update_feature_flag', propsValue: { flagId: '9', active: 'false' } });
    expect(req({ spy }).body).toEqual({ active: false });
    vi.restoreAllMocks();
    mockSeq({ filters: { groups: [{}, {}] } });
    await expect(run({ name: 'update_feature_flag', propsValue: { flagId: '9', rolloutPercentage: 10 } })).rejects.toThrow(/exactly one/);
    vi.restoreAllMocks();
    const flag = { version: 4, filters: { groups: [{ properties: [{ key: 'x' }], rollout_percentage: 5 }] } };
    spy = mockSeq(flag, flag, { id: 9, version: 5 });
    await run({ name: 'update_feature_flag', propsValue: { flagId: '9', rolloutPercentage: 50 } });
    expect(req({ spy, i: 2 }).body).toEqual({ version: 4, filters: { groups: [{ properties: [{ key: 'x' }], rollout_percentage: 50 }] } });
  });
  it('update flag rollout refuses when the flag changed between reads', async () => {
    const flag = { version: 4, filters: { groups: [{ rollout_percentage: 5 }] } };
    const spy = mockSeq(flag, { version: 5, filters: { groups: [{ properties: [{ key: 'new' }], rollout_percentage: 5 }] } });
    await expect(run({ name: 'update_feature_flag', propsValue: { flagId: '9', rolloutPercentage: 50 } })).rejects.toThrow(/changed in PostHog/);
    expect(spy).toHaveBeenCalledTimes(2);
  });
  it('update flag rollout reports a write that raced another edit', async () => {
    const flag = { version: 4, filters: { groups: [{ rollout_percentage: 5 }] } };
    mockSeq(flag, flag, { id: 9, version: 6 });
    await expect(run({ name: 'update_feature_flag', propsValue: { flagId: '9', rolloutPercentage: 50 } })).rejects.toThrow(/same time/);
  });
  it('hogql query keeps every value when column names repeat', async () => {
    mockSeq({ columns: ['count()', 'count()', 'count()_2'], types: [], results: [[1, 2, 3]] });
    const out = await run({ name: 'run_hogql_query', propsValue: { query: 'select count(), count(), 3' } });
    expect(out.columns).toEqual(['count()', 'count()_2', 'count()_2_2']);
    expect(out.rows).toEqual([{ 'count()': 1, 'count()_2': 2, 'count()_2_2': 3 }]);
  });
  it('custom api call uses the certificate-checked dispatcher and same-host guard', async () => {
    const spy = mockSeq({ ok: true });
    const out = await run({ name: 'custom_api_call', propsValue: { method: HttpMethod.GET, url: { url: '/api/projects/123/' }, headers: { x: '1' }, queryParams: {} } });
    expect(out).toMatchObject({ status: 200, body: { ok: true } });
    expect(req({ spy })).toMatchObject({ url: 'https://eu.posthog.com/api/projects/123/', headers: { x: '1', Authorization: 'Bearer phx_secret' } });
    expect(spy.mock.calls[0][1]?.dispatcher).toBe(await posthogClient.verifiedTls());
    vi.restoreAllMocks();
    const paged = mockSeq({ ok: true });
    await run({ name: 'custom_api_call', propsValue: { method: HttpMethod.GET, url: { url: '/x' }, queryParams: { limit: 10, flag: true, skip: null, q: 'a' } } });
    expect(paged).toHaveBeenCalledTimes(1);
    expect(req({ spy: paged }).queryParams).toEqual({ limit: '10', flag: 'true', q: 'a' });
    await expect(run({ name: 'custom_api_call', propsValue: { method: HttpMethod.GET, url: { url: 'https://evil.example/x' } } })).rejects.toThrow(/API Host/);
    await expect(run({ name: 'custom_api_call', propsValue: { method: HttpMethod.GET, url: { url: '/api/../x' } } })).rejects.toThrow(/\.\./);
    mockSeq(httpFailure({ status: 500, body: 'boom' }));
    const failed = await run({ name: 'custom_api_call', propsValue: { method: HttpMethod.POST, url: { url: '/x' }, failsafe: true, body_type: 'json', body: { data: { a: 1 } } } });
    expect(failed).toBeDefined();
  });
  it('delete flag soft-deletes via PATCH', async () => {
    const spy = mockSeq({});
    expect(await run({ name: 'delete_feature_flag', propsValue: { flagId: '9' } })).toEqual({ id: '9', deleted: true });
    expect(req({ spy })).toMatchObject({ method: HttpMethod.PATCH, body: { deleted: true } });
    await expect(run({ name: 'delete_feature_flag', propsValue: { flagId: '9/../x' } })).rejects.toThrow(/numeric/);
  });
  it('evaluate flags posts to /flags?v=2', async () => {
    const spy = mockSeq({ api_token: 't' }, { flags: { beta: { enabled: true, variant: null, reason: { code: 'condition_match', description: 'Matched' }, metadata: { payload: null } } }, errorsWhileComputingFlags: false });
    const out = await run({ name: 'evaluate_feature_flags', propsValue: { distinctId: 'u' } });
    expect(req({ spy, i: 1 })).toMatchObject({ url: 'https://us.i.posthog.com/flags/', queryParams: { v: '2' } });
    expect(out.flags).toEqual([{ key: 'beta', enabled: true, variant: null, reason: 'Matched', payload: null }]);
  });
  it('list actions page with hasMore from next', async () => {
    mockSeq({ results: [{ id: 1, name: 'c' }], next: 'https://eu.posthog.com/api/projects/123/cohorts/?offset=1' });
    expect(await run({ name: 'list_cohorts', propsValue: { limit: 1 } })).toMatchObject({ count: 1, hasMore: true, nextOffset: 1 });
    mockSeq({ results: [], next: null });
    expect(await run({ name: 'list_dashboards', propsValue: {} })).toMatchObject({ count: 0, hasMore: false, nextOffset: null });
  });
  it('annotation create validates scope', async () => {
    await expect(run({ name: 'create_annotation', propsValue: { content: 'x', scope: 'world' } })).rejects.toThrow(/Scope/);
    const spy = mockSeq({ id: 4, content: 'x', scope: 'project' });
    await run({ name: 'create_annotation', propsValue: { content: 'x', dateMarker: '2026-10-18T00:00:00Z' } });
    expect(req({ spy }).body).toEqual({ content: 'x', date_marker: '2026-10-18T00:00:00.000Z', scope: 'project' });
  });
});

describe('new event trigger', () => {
  it('follows next pages on later polls and refuses foreign next links', async () => {
    const store = new Map<string, unknown>();
    const ctx = {
      auth,
      propsValue: { event_name: '' },
      store: { get: async (k: string) => store.get(k) ?? null, put: async (k: string, v: unknown) => { store.set(k, v); }, delete: async (k: string) => { store.delete(k); } },
      setSchedule: () => undefined,
    };
    mockSeq({ results: [], next: null });
    await Reflect.apply(posthogNewEvent.onEnable, undefined, [ctx]);
    vi.restoreAllMocks();
    const spy = mockSeq(
      { results: [{ id: 'b', timestamp: new Date(Date.now() + 2000).toISOString() }], next: 'https://eu.posthog.com/api/projects/123/events/?before=x' },
      { results: [{ id: 'a', timestamp: new Date(Date.now() + 1000).toISOString() }], next: null },
    );
    const out = await Reflect.apply(posthogNewEvent.run, undefined, [ctx]);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(out.map((e: { id: string }) => e.id).sort()).toEqual(['a', 'b']);
    vi.restoreAllMocks();
    mockSeq({ results: [], next: 'https://evil.io/api/projects/123/events/' });
    await expect(Reflect.apply(posthogNewEvent.run, undefined, [ctx])).rejects.toThrow(/another host/);
  });
});

describe('custom api call binary responses', () => {
  it.each([
    ['image/png', 'output.png'],
    ['application/pdf; charset=binary', 'output.pdf'],
    ['application/x-unknown', 'output.txt'],
  ])('names a %s response %s', async (contentType, fileName) => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({ status: 200, headers: { 'content-type': contentType }, body: Buffer.from('x') });
    const write = vi.fn(async ({ fileName: name }: { fileName: string }) => `file://${name}`);
    const result = await Reflect.apply(action('custom_api_call').run, undefined, [
      { auth, files: { write }, propsValue: { url: { url: '/api/projects/123/exports/1/content' }, method: HttpMethod.GET, response_is_binary: true } },
    ]);
    expect(write).toHaveBeenCalledWith(expect.objectContaining({ fileName }));
    expect(result.body).toBe(`file://${fileName}`);
  });
});
