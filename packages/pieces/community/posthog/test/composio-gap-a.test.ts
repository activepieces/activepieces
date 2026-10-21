import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureEventsBatch } from '../src/lib/actions/ai/capture-events-batch';
import { deletePersonProperty } from '../src/lib/actions/ai/delete-person-property';
import { getCurrentUser } from '../src/lib/actions/ai/get-current-user';
import { listProjects } from '../src/lib/actions/ai/list-projects';

const props = { personal_api_key: 'phx_secret', project_id: '123', api_host: 'https://eu.posthog.com', ingestion_host: '' };
const auth = { props };
const PERSON = '0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';

function call({ run, propsValue = {} }: { run: unknown; propsValue?: Record<string, unknown> }) {
  if (typeof run !== 'function') throw new Error('no run');
  return Reflect.apply(run, undefined, [{ auth, propsValue }]);
}

function mockSeq(...bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const b of bodies) spy.mockResolvedValueOnce({ status: 200, headers: {}, body: b });
  return spy;
}

afterEach(() => vi.restoreAllMocks());

describe('metadata', () => {
  it.each([captureEventsBatch, deletePersonProperty, getCurrentUser, listProjects])('$name is ai with schema', (a) => {
    expect(a.audience).toBe('ai');
    expect(a.outputSchema).toBeDefined();
    expect(a.aiMetadata?.description).toBeTruthy();
  });
});

describe('capture_events_batch', () => {
  it('fetches token and posts batch to ingestion host', async () => {
    const spy = mockSeq({ api_token: 'phc_tok' }, { status: 1 });
    const out = await call({
      run: captureEventsBatch.run,
      propsValue: { events: [{ event: 'a', distinctId: 'u1', properties: { x: 1 } }, { event: 'b', distinct_id: 'u2', uuid: PERSON, timestamp: '2026-10-18T00:00:00Z' }] },
    });
    const req = spy.mock.calls[1][0];
    expect(req.url).toBe('https://us.i.posthog.com/batch/');
    expect(req.headers?.['authorization']).toBeUndefined();
    expect(req.body).toMatchObject({ api_key: 'phc_tok', batch: [{ event: 'a', distinct_id: 'u1', properties: { x: 1 } }, { event: 'b', distinct_id: 'u2', uuid: PERSON, timestamp: '2026-10-18T00:00:00.000Z' }] });
    expect(out.count).toBe(2);
    expect(out.events[1].uuid).toBe(PERSON);
    expect(out.status).toBe(1);
  });
  it('rejects bad items before any request', async () => {
    const spy = mockSeq();
    await expect(call({ run: captureEventsBatch.run, propsValue: { events: [{ event: 'a' }] } })).rejects.toThrow('Event #1 distinctId is required.');
    await expect(call({ run: captureEventsBatch.run, propsValue: { events: [] } })).rejects.toThrow('non-empty');
    await expect(call({ run: captureEventsBatch.run, propsValue: { events: 'nope' } })).rejects.toThrow('JSON array');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('delete_person_property', () => {
  it('posts $unset to delete_property', async () => {
    const spy = mockSeq({});
    const out = await call({ run: deletePersonProperty.run, propsValue: { personId: PERSON.toUpperCase(), property: ' plan ' } });
    const req = spy.mock.calls[0][0];
    expect(req.method).toBe('POST');
    expect(req.url).toBe(`https://eu.posthog.com/api/projects/123/persons/${PERSON}/delete_property/`);
    expect(req.body).toEqual({ $unset: 'plan' });
    expect(out).toEqual({ personId: PERSON, property: 'plan', deleted: true });
  });
  it('requires a UUID', async () => {
    await expect(call({ run: deletePersonProperty.run, propsValue: { personId: 'user-1', property: 'p' } })).rejects.toThrow('UUID');
  });
});

describe('list_projects', () => {
  it('lists current org projects and flags the connection project', async () => {
    const spy = mockSeq({ next: 'https://eu.posthog.com/x?offset=1', results: [{ id: 123, name: 'Main', organization: 'org-1', timezone: 'UTC' }, { id: 9, name: 'Other' }] });
    const out = await call({ run: listProjects.run, propsValue: { limit: 2 } });
    expect(spy.mock.calls[0][0].url).toBe('https://eu.posthog.com/api/organizations/@current/projects/');
    expect(spy.mock.calls[0][0].queryParams).toEqual({ limit: '2', offset: '0' });
    expect(out.items[0]).toMatchObject({ id: 123, name: 'Main', organizationId: 'org-1', isCurrentConnection: true });
    expect(out.items[1].isCurrentConnection).toBe(false);
    expect(out.hasMore).toBe(true);
  });
});

describe('get_current_user', () => {
  it('returns safe fields only', async () => {
    mockSeq({ uuid: 'u', email: 'a@b.c', first_name: 'A', last_name: 'B', personal_api_keys: ['x'], organization: { id: 'o', name: 'Org' }, team: { id: 5, name: 'P', api_token: 'phc' } });
    const out = await call({ run: getCurrentUser.run });
    expect(out).toEqual({ uuid: 'u', email: 'a@b.c', name: 'A B', organizationId: 'o', organizationName: 'Org', projectId: 5, projectName: 'P' });
    expect(JSON.stringify(out)).not.toContain('phc');
  });
});
