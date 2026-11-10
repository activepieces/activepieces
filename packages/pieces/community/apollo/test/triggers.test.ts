import { afterEach, describe, expect, test, vi } from 'vitest';
import { newContactTrigger } from '../src/lib/triggers/new-contact';
import { updatedContactTrigger } from '../src/lib/triggers/updated-contact';
import { newAccountTrigger } from '../src/lib/triggers/new-account';
import { SeenRequest, memoryStore, runContext, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

const NEW_CONTACT_KEY = 'apollo_new_contact_checkpoint';

function contactsNewestFirst({ count, newestMs }: { count: number; newestMs: number }) {
  return Array.from({ length: count }, (_, index) => {
    const at = new Date(newestMs - index * 1000).toISOString();
    return { id: `c${count - index}`, name: `Contact ${count - index}`, created_at: at, updated_at: at };
  });
}

function pagedReply({ all }: { all: () => Record<string, unknown>[] }) {
  return (request: SeenRequest) => {
    const body = request.body;
    const page = typeof body === 'object' && body !== null ? Number(Reflect.get(body, 'page')) : 1;
    const perPage = typeof body === 'object' && body !== null ? Number(Reflect.get(body, 'per_page')) : 100;
    return { body: { contacts: all().slice((page - 1) * perPage, page * perPage), accounts: all().slice((page - 1) * perPage, page * perPage) } };
  };
}

describe('new contact trigger', () => {
  test('onEnable stores the newest checkpoint; run pages back to it and emits oldest first, once', async () => {
    let all = contactsNewestFirst({ count: 10, newestMs: Date.parse('2026-11-09T10:00:00Z') });
    const seen = stubFetch({ respond: pagedReply({ all: () => all }) });
    const store = memoryStore();
    await newContactTrigger.onEnable(runContext({ store }));
    expect(seen[0].path).toBe('/api/v1/contacts/search');
    expect(seen[0].body).toEqual({ sort_by_field: 'contact_created_at', sort_ascending: false, page: 1, per_page: 100 });
    expect(store.data.get(NEW_CONTACT_KEY)).toEqual({ checkpointMs: Date.parse('2026-11-09T10:00:00Z'), seenKeys: ['c10'] });
    const fresh = contactsNewestFirst({ count: 250, newestMs: Date.parse('2026-11-09T11:00:00Z') }).map((contact) => ({ ...contact, id: `n${contact.id}` }));
    all = [...fresh, ...all];
    const output = await newContactTrigger.run(runContext({ store }));
    expect(output).toHaveLength(250);
    expect(output[0]['id']).toBe('nc1');
    expect(output[249]['id']).toBe('nc250');
    expect(seen.slice(1).map((request) => Reflect.get(Object(request.body), 'page'))).toEqual([1, 2, 3]);
    expect(await newContactTrigger.run(runContext({ store }))).toEqual([]);
  });

  test('a record with the same timestamp as the checkpoint but a new id still fires', async () => {
    const at = '2026-11-09T10:00:00.000Z';
    stubFetch({ respond: () => ({ body: { contacts: [{ id: 'b', created_at: at }, { id: 'a', created_at: at }, { id: 'old', created_at: '2026-11-09T09:00:00.000Z' }] } }) });
    const store = memoryStore({ initial: { [NEW_CONTACT_KEY]: { checkpointMs: Date.parse(at), seenKeys: ['a'] } } });
    const output = await newContactTrigger.run(runContext({ store }));
    expect(output.map((contact) => contact['id'])).toEqual(['b']);
    expect(store.data.get(NEW_CONTACT_KEY)).toEqual({ checkpointMs: Date.parse(at), seenKeys: ['a', 'b'] });
  });

  test('same-timestamp de-dupe stays correct beyond 500 records', async () => {
    const at = '2026-11-09T10:00:00.000Z';
    const burst = Array.from({ length: 750 }, (_, index) => ({ id: `b${index}`, created_at: at }));
    stubFetch({ respond: pagedReply({ all: () => burst }) });
    const store = memoryStore({ initial: { [NEW_CONTACT_KEY]: { checkpointMs: Date.parse('2026-11-09T09:00:00Z'), seenKeys: [] } } });
    expect(await newContactTrigger.run(runContext({ store }))).toHaveLength(750);
    expect(await newContactTrigger.run(runContext({ store }))).toEqual([]);
    burst.unshift({ id: 'late', created_at: at });
    const again = await newContactTrigger.run(runContext({ store }));
    expect(again.map((contact) => contact['id'])).toEqual(['late']);
    expect(Reflect.get(Object(store.data.get(NEW_CONTACT_KEY)), 'seenKeys')).toHaveLength(751);
  });

  test('seen keys are dropped once the checkpoint moves to a newer timestamp', async () => {
    stubFetch({ respond: () => ({ body: { contacts: [{ id: 'n1', created_at: '2026-11-09T11:00:00.000Z' }, { id: 'a', created_at: '2026-11-09T10:00:00.000Z' }] } }) });
    const store = memoryStore({ initial: { [NEW_CONTACT_KEY]: { checkpointMs: Date.parse('2026-11-09T10:00:00Z'), seenKeys: ['a', 'b'] } } });
    await newContactTrigger.run(runContext({ store }));
    expect(store.data.get(NEW_CONTACT_KEY)).toEqual({ checkpointMs: Date.parse('2026-11-09T11:00:00Z'), seenKeys: ['n1'] });
  });

  test('a failed page request leaves the checkpoint untouched', async () => {
    const all = contactsNewestFirst({ count: 300, newestMs: Date.parse('2026-11-09T12:00:00Z') });
    stubFetch({
      respond: (request) => (Reflect.get(Object(request.body), 'page') === 2 ? { status: 500, body: { error: 'boom' } } : pagedReply({ all: () => all })(request)),
    });
    const initial = { checkpointMs: Date.parse('2026-11-01T00:00:00Z'), seenKeys: ['x'] };
    const store = memoryStore({ initial: { [NEW_CONTACT_KEY]: initial } });
    await expect(newContactTrigger.run(runContext({ store }))).rejects.toThrow('(500)');
    expect(store.data.get(NEW_CONTACT_KEY)).toEqual(initial);
    expect(store.puts).toBe(0);
  });

  test('throws instead of truncating when the cap is hit before the checkpoint', async () => {
    stubFetch({ respond: (request) => ({ body: { contacts: contactsNewestFirst({ count: 100, newestMs: Date.parse('2026-11-09T12:00:00Z') - (Number(Reflect.get(Object(request.body), 'page')) - 1) * 100_000 }).map((contact) => ({ ...contact, id: `${contact.id}-${String(Reflect.get(Object(request.body), 'page'))}` })) } }) });
    const initial = { checkpointMs: 0, seenKeys: [] };
    const store = memoryStore({ initial: { [NEW_CONTACT_KEY]: initial } });
    await expect(newContactTrigger.run(runContext({ store }))).rejects.toThrow('More than 5000');
    expect(store.puts).toBe(0);
  });

  test('test() returns the newest 5 without touching the store', async () => {
    stubFetch({ respond: pagedReply({ all: () => contactsNewestFirst({ count: 20, newestMs: Date.parse('2026-11-09T10:00:00Z') }) }) });
    const store = memoryStore();
    const output = await newContactTrigger.test(runContext({ store }));
    expect(output).toHaveLength(5);
    expect(store.puts).toBe(0);
  });

  test('republish keeps an existing checkpoint', async () => {
    const seen = stubFetch({ respond: pagedReply({ all: () => [] }) });
    const initial = { checkpointMs: 5, seenKeys: ['a'] };
    const store = memoryStore({ initial: { [NEW_CONTACT_KEY]: initial } });
    await newContactTrigger.onEnable(runContext({ store, isRepublish: true }));
    expect(seen).toHaveLength(0);
    expect(store.data.get(NEW_CONTACT_KEY)).toEqual(initial);
  });
});

describe('updated contact and new account triggers', () => {
  test('updated contact sorts by updated_at and fires again for a newer version of the same contact', async () => {
    let contacts = [{ id: 'c1', updated_at: '2026-11-09T10:00:00.000Z' }];
    const seen = stubFetch({ respond: () => ({ body: { contacts } }) });
    const store = memoryStore();
    await updatedContactTrigger.onEnable(runContext({ store }));
    expect(Reflect.get(Object(seen[0].body), 'sort_by_field')).toBe('contact_updated_at');
    contacts = [{ id: 'c1', updated_at: '2026-11-09T11:00:00.000Z' }];
    const output = await updatedContactTrigger.run(runContext({ store }));
    expect(output.map((contact) => contact['updated_at'])).toEqual(['2026-11-09T11:00:00.000Z']);
    expect(await updatedContactTrigger.run(runContext({ store }))).toEqual([]);
  });

  test('new account polls accounts sorted by creation', async () => {
    const seen = stubFetch({ respond: () => ({ body: { accounts: [{ id: 'a1', name: 'Acme', created_at: '2026-11-09T10:00:00.000Z' }] } }) });
    await newAccountTrigger.onEnable(runContext({ store: memoryStore() }));
    expect(seen[0].path).toBe('/api/v1/accounts/search');
    expect(seen[0].body).toEqual({ sort_by_field: 'account_created_at', sort_ascending: false, page: 1, per_page: 100 });
  });
});
