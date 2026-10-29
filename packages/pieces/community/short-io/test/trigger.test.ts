import { afterEach, describe, expect, test, vi } from 'vitest';
import { newLinkCreatedTrigger } from '../src/lib/triggers/new-link-created';
import { DOMAIN_PROP, link, memoryStore, stubFetch } from './helpers';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';

const OLD = '2026-09-01T00:00:00.000Z';

function context(store: ReturnType<typeof memoryStore>): TriggerContext {
  return { auth: { type: AppConnectionType.CUSTOM_AUTH, props: { apiKey: 'k' } }, propsValue: { domain: DOMAIN_PROP }, store };
}

function events(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object') : [];
}

function ids(value: unknown): unknown[] {
  return events(value).map((event) => event['id']);
}

function makeLink({ id, createdAt, updatedAt }: { id: string; createdAt: string; updatedAt?: string }): Record<string, unknown> {
  return link({ idString: id, createdAt, updatedAt: updatedAt ?? createdAt });
}

function fakeShortIo(db: Record<string, unknown>[]): { requests: () => number } {
  const seen = stubFetch((request) => {
    const direction = request.url.searchParams.get('dateSortOrder') === 'asc' ? -1 : 1;
    const sorted = [...db].sort((a, b) => direction * (Date.parse(String(b['createdAt'])) - Date.parse(String(a['createdAt']))));
    const offset = Number(request.url.searchParams.get('pageToken') ?? '0');
    const limit = Number(request.url.searchParams.get('limit') ?? '150');
    const page = sorted.slice(offset, offset + limit);
    const next = offset + limit < sorted.length ? String(offset + limit) : undefined;
    return { body: { count: sorted.length, links: page, ...(next ? { nextPageToken: next } : {}) } };
  });
  return { requests: () => seen.length };
}

function oldLinks(count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => makeLink({ id: `link_8yXK_0000${String(99999 - i).padStart(5, '0')}`, createdAt: new Date(Date.parse(OLD) - i * 1000).toISOString() }));
}

const trigger: { run(context: TriggerContext): Promise<unknown>; onEnable(context: TriggerContext): Promise<void> } = newLinkCreatedTrigger;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('new_link_created', () => {
  test('baseline records every link at the newest timestamp, so none of them fire', async () => {
    const db = [...oldLinks(5), ...Array.from({ length: 3 }, (_, i) => makeLink({ id: `link_8yXK_0000tie${i}`, createdAt: OLD }))];
    fakeShortIo(db);
    const store = memoryStore();
    await trigger.onEnable(context(store));
    expect(await trigger.run(context(store))).toEqual([]);
  });

  test('a new link fires once, without the password', async () => {
    const db = oldLinks(300);
    fakeShortIo(db);
    const store = memoryStore();
    await trigger.onEnable(context(store));
    db.push(makeLink({ id: 'link_8yXK_9new1', createdAt: new Date().toISOString() }));
    const first = await trigger.run(context(store));
    expect(ids(first)).toEqual(['link_8yXK_9new1']);
    expect(JSON.stringify(first)).not.toContain('hunter2');
    expect(events(first)[0]).not.toHaveProperty('password');
    expect(await trigger.run(context(store))).toEqual([]);
  });

  test('a future-dated link does not hide links created after it', async () => {
    const db = oldLinks(10);
    fakeShortIo(db);
    const store = memoryStore();
    await trigger.onEnable(context(store));
    db.push(makeLink({ id: 'link_8yXK_9future', createdAt: '2030-01-01T00:00:00.000Z', updatedAt: new Date().toISOString() }));
    expect(ids(await trigger.run(context(store)))).toEqual(['link_8yXK_9future']);
    db.push(makeLink({ id: 'link_8yXK_9zafter', createdAt: new Date().toISOString() }));
    expect(ids(await trigger.run(context(store)))).toEqual(['link_8yXK_9zafter']);
  });

  test('a back-dated link deep in the list fires once; old links never do', async () => {
    const db = oldLinks(2000);
    fakeShortIo(db);
    const store = memoryStore();
    await trigger.onEnable(context(store));
    db.push(makeLink({ id: 'link_8yXK_9backdated', createdAt: '2020-01-01T00:00:00.000Z', updatedAt: new Date().toISOString() }));
    expect(ids(await trigger.run(context(store)))).toEqual(['link_8yXK_9backdated']);
    expect(await trigger.run(context(store))).toEqual([]);
  });

  test('more than 1,500 new links with the same createdAt are resumed on the next poll', async () => {
    const db = oldLinks(10);
    fakeShortIo(db);
    const store = memoryStore();
    await trigger.onEnable(context(store));
    const now = new Date().toISOString();
    db.push(...Array.from({ length: 1600 }, (_, i) => makeLink({ id: `link_8yXK_9burst${String(i).padStart(5, '0')}`, createdAt: now })));
    const first = ids(await trigger.run(context(store)));
    const second = ids(await trigger.run(context(store)));
    expect(first).toHaveLength(1500);
    expect(second).toHaveLength(100);
    expect(new Set([...first, ...second]).size).toBe(1600);
    expect(await trigger.run(context(store))).toEqual([]);
  });

  test('deleting links does not re-emit older ones', async () => {
    const db = oldLinks(400);
    fakeShortIo(db);
    const store = memoryStore();
    await trigger.onEnable(context(store));
    db.splice(0, 50);
    expect(await trigger.run(context(store))).toEqual([]);
  });

  test('a future-dated link does not fire again after 5,000 newer links pushed it out of the seen list', async () => {
    const db = oldLinks(5);
    fakeShortIo(db);
    const store = memoryStore();
    await trigger.onEnable(context(store));
    db.push(makeLink({ id: 'link_8yXK_9future', createdAt: '2030-01-01T00:00:00.000Z', updatedAt: new Date().toISOString() }));
    expect(ids(await trigger.run(context(store)))).toEqual(['link_8yXK_9future']);
    for (let batch = 0; batch < 4; batch++) {
      db.push(...Array.from({ length: 1400 }, (_, i) => makeLink({ id: `link_8yXK_9n${batch}${String(i).padStart(5, '0')}`, createdAt: new Date(Date.now() + batch).toISOString() })));
      expect(ids(await trigger.run(context(store)))).not.toContain('link_8yXK_9future');
    }
    expect(ids(await trigger.run(context(store)))).toEqual([]);
  });

  test('an old link outside the baseline window that gets edited does not fire, while a back-dated new link does', async () => {
    const db = oldLinks(2000);
    fakeShortIo(db);
    const store = memoryStore();
    await trigger.onEnable(context(store));
    db[1900] = { ...db[1900], updatedAt: new Date().toISOString() };
    db.push(makeLink({ id: 'link_8yXK_9new1', createdAt: new Date().toISOString() }));
    db.push(makeLink({ id: 'link_8yXK_9new2', createdAt: new Date().toISOString() }));
    db.push(makeLink({ id: 'link_8yXK_9backdated', createdAt: '2020-01-01T00:00:00.000Z', updatedAt: new Date().toISOString() }));
    expect(ids(await trigger.run(context(store))).sort()).toEqual(['link_8yXK_9backdated', 'link_8yXK_9new1', 'link_8yXK_9new2']);
  });

  test('an existing back-dated link at the oldest end does not fire when edited later', async () => {
    const db = [...oldLinks(2000), makeLink({ id: 'link_8yXK_5existingbackdated', createdAt: '2019-01-01T00:00:00.000Z' })];
    fakeShortIo(db);
    const store = memoryStore();
    await trigger.onEnable(context(store));
    db[2000] = { ...db[2000], updatedAt: new Date().toISOString() };
    db.push(makeLink({ id: 'link_8yXK_9new1', createdAt: new Date().toISOString() }));
    db.push(makeLink({ id: 'link_8yXK_9new2', createdAt: new Date().toISOString() }));
    db.push(makeLink({ id: 'link_8yXK_9backdated', createdAt: '2020-01-01T00:00:00.000Z', updatedAt: new Date().toISOString() }));
    expect(ids(await trigger.run(context(store))).sort()).toEqual(['link_8yXK_9backdated', 'link_8yXK_9new1', 'link_8yXK_9new2']);
  });

  test('migrates from the legacy id list once', async () => {
    const db = [makeLink({ id: 'link_8yXK_9new1', createdAt: '2026-10-02T00:00:00.000Z' }), makeLink({ id: 'link_8yXK_0old1', createdAt: OLD })];
    fakeShortIo(db);
    const store = memoryStore({ 'shortio-last-link-ids': ['link_8yXK_0old1'] });
    expect(ids(await trigger.run(context(store)))).toEqual(['link_8yXK_9new1']);
    expect(store.read('shortio-last-link-ids')).toBeUndefined();
    expect(await trigger.run(context(store))).toEqual([]);
  });
});

type TriggerContext = {
  auth: { type: AppConnectionType.CUSTOM_AUTH; props: { apiKey: string } };
  propsValue: { domain: string };
  store: Store;
};
