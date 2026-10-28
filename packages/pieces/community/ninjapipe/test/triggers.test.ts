import { afterEach, describe, expect, it, vi } from 'vitest';
import { ids, loadOptions, memoryStore, page, request, runHook, stubFetch } from './helpers';

const PROJECT = 'proj 1';
const T0 = Date.parse('2026-10-25T10:00:00Z');

function rec({ id, minutes, field = 'updated_at' }: { id: string; minutes: number; field?: string }) {
  return { id, name: id, title: id, created_at: new Date(T0 + minutes * 60000).toISOString(), [field]: new Date(T0 + minutes * 60000).toISOString() };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const recordTriggers = [
  { name: 'new_contact', path: '/contacts', field: 'created_at' },
  { name: 'new_company', path: '/companies', field: 'created_at' },
  { name: 'new_deal', path: '/deals', field: 'created_at' },
  { name: 'new_or_updated_contact', path: '/contacts', field: 'updated_at' },
  { name: 'new_or_updated_company', path: '/companies', field: 'updated_at' },
  { name: 'new_or_updated_deal', path: '/deals', field: 'updated_at' },
];

describe('record polling triggers', () => {
  it.each(recordTriggers)('$name sorts by $field and pages back to the checkpoint', async ({ name, path, field }) => {
    const trigger = name;
    const fetchMock = stubFetch({
      responses: [
        { status: 200, body: page({ data: [rec({ id: 'c', minutes: 30, field }), rec({ id: 'b', minutes: 20, field })], page: 1, pages: 3 }) },
        { status: 200, body: page({ data: [rec({ id: 'a', minutes: 15, field }), rec({ id: 'old', minutes: 5, field })], page: 2, pages: 3 }) },
      ],
    });
    const { store } = memoryStore({ initial: { lastPoll: T0 + 10 * 60000 } });
    const result = ids(await runHook({ name: trigger, hook: 'run', context: { store, propsValue: {} } }));
    expect(result).toEqual(['c', 'b', 'a']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = request({ fetchMock, call: 0 });
    expect(first.path).toBe(path);
    expect(first.query).toMatchObject({ sort_by: field, sort_order: 'desc', limit: '100', page: '1' });
    expect(request({ fetchMock, call: 1 }).query).toMatchObject({ page: '2' });
    expect(await store.get('lastPoll')).toBe(T0 + 30 * 60000);
  });

  it('a burst larger than ten pages is read back to the checkpoint', async () => {
    const trigger = 'new_or_updated_deal';
    const pages = 12;
    const responses = Array.from({ length: pages }, (_, index) => ({
      status: 200,
      body: page({ data: [rec({ id: `p${index}`, minutes: 1000 - index })], page: index + 1, pages: pages + 1 }),
    }));
    responses.push({ status: 200, body: page({ data: [rec({ id: 'old', minutes: 5 })], page: pages + 1, pages: pages + 1 }) });
    const fetchMock = stubFetch({ responses });
    const { store } = memoryStore({ initial: { lastPoll: T0 + 10 * 60000 } });
    const result = ids(await runHook({ name: trigger, hook: 'run', context: { store, propsValue: {} } }));
    expect(result).toHaveLength(pages);
    expect(result.at(-1)).toBe(`p${pages - 1}`);
    expect(fetchMock).toHaveBeenCalledTimes(pages + 1);
  });

  it('stops with an error when paging never reaches the checkpoint', async () => {
    const fetchMock = stubFetch({ responses: [{ status: 200, body: page({ data: [rec({ id: 'loop', minutes: 1000 })], page: 1, pages: 9999 }) }] });
    const { store } = memoryStore({ initial: { lastPoll: T0 + 10 * 60000 } });
    await expect(runHook({ name: 'new_or_updated_deal', hook: 'run', context: { store, propsValue: {} } })).rejects.toThrow(/stopped after 100 pages/);
    expect(fetchMock).toHaveBeenCalledTimes(100);
  });

  it('a second poll with no changes emits nothing', async () => {
    const trigger = 'new_or_updated_deal';
    stubFetch({ responses: [{ status: 200, body: page({ data: [rec({ id: 'c', minutes: 30 })] }) }] });
    const { store } = memoryStore({ initial: { lastPoll: T0 + 30 * 60000 } });
    expect(await runHook({ name: trigger, hook: 'run', context: { store, propsValue: {} } })).toEqual([]);
  });

  it('items without a timestamp fire once, with bounded dedupe', async () => {
    const trigger = 'new_or_updated_contact';
    const untimed = { id: 'no-ts', name: 'x' };
    stubFetch({ responses: [{ status: 200, body: page({ data: [untimed] }) }] });
    const { store, data } = memoryStore({ initial: { lastPoll: T0, ninjapipe_untimed_seen_ids: Array.from({ length: 500 }, (_, index) => `old-${index}`) } });
    const first = await runHook({ name: trigger, hook: 'run', context: { store, propsValue: {} } });
    const second = await runHook({ name: trigger, hook: 'run', context: { store, propsValue: {} } });
    expect(first).toEqual([untimed]);
    expect(second).toEqual([]);
    const seen = ids(data.get('ninjapipe_untimed_seen_ids'));
    expect(seen).toHaveLength(501);
    expect(seen.at(-1)).toBe('no-ts');
  });

  it('more than 500 untimed items never fire twice', async () => {
    const trigger = 'new_or_updated_contact';
    const records = Array.from({ length: 501 }, (_, index) => ({ id: `t-${index}`, name: 'x' }));
    stubFetch({ responses: [{ status: 200, body: page({ data: records }) }] });
    const { store } = memoryStore({ initial: { lastPoll: T0 } });
    const first = await runHook({ name: trigger, hook: 'run', context: { store, propsValue: {} } });
    const second = await runHook({ name: trigger, hook: 'run', context: { store, propsValue: {} } });
    const third = await runHook({ name: trigger, hook: 'run', context: { store, propsValue: {} } });
    expect(first).toHaveLength(501);
    expect(second).toEqual([]);
    expect(third).toEqual([]);
  });

  it('test() returns untimed samples every time and leaves the remembered IDs alone', async () => {
    const trigger = 'new_or_updated_contact';
    const untimed = { id: 'no-ts', name: 'x' };
    stubFetch({ responses: [{ status: 200, body: page({ data: [untimed] }) }] });
    const { store, data } = memoryStore();
    expect(await runHook({ name: trigger, hook: 'test', context: { store, propsValue: {} } })).toEqual([untimed]);
    expect(await runHook({ name: trigger, hook: 'test', context: { store, propsValue: {} } })).toEqual([untimed]);
    expect(data.get('ninjapipe_untimed_seen_ids')).toBeUndefined();
  });

  it('test() reads one small page', async () => {
    const trigger = 'new_contact';
    const fetchMock = stubFetch({ responses: [{ status: 200, body: page({ data: [rec({ id: 'a', minutes: 1 })], pages: 9 }) }] });
    const { store } = memoryStore();
    const result = await runHook({ name: trigger, hook: 'test', context: { store, propsValue: {} } });
    expect(result).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(request({ fetchMock }).query).toMatchObject({ limit: '5' });
  });

  it('polling errors fail instead of returning an empty list', async () => {
    const trigger = 'new_deal';
    stubFetch({ responses: [{ status: 401, body: { error: 'Unauthorized', code: 'INVALID_API_KEY' } }] });
    const { store } = memoryStore({ initial: { lastPoll: T0 } });
    await expect(runHook({ name: trigger, hook: 'run', context: { store, propsValue: {} } })).rejects.toThrow(/HTTP 401/);
  });
});

describe('task polling triggers', () => {
  it.each([
    { name: 'new_task', field: 'created_at' },
    { name: 'new_or_updated_task', field: 'updated_at' },
  ])('$name encodes the project id and emits only newer tasks', async ({ name, field }) => {
    const trigger = name;
    const fetchMock = stubFetch({ responses: [{ status: 200, body: { data: [rec({ id: 'old', minutes: 1, field }), rec({ id: 'new', minutes: 20, field })] } }] });
    const { store } = memoryStore({ initial: { lastPoll: T0 + 10 * 60000 } });
    const result = ids(await runHook({ name: trigger, hook: 'run', context: { store, propsValue: { projectId: PROJECT } } }));
    expect(result).toEqual(['new']);
    expect(request({ fetchMock }).url.pathname).toBe('/api/projects/proj%201/tasks');
    expect(request({ fetchMock }).query).toMatchObject({ sort_by: field, sort_order: 'desc' });
  });
});

describe('dropdowns', () => {
  it('show the API error instead of hiding it', async () => {
    stubFetch({ responses: [{ status: 403, body: { error: 'Forbidden', message: 'Key revoked' } }] });
    const state = await loadOptions({ action: 'get_contact', prop: 'contactId', ctx: { searchValue: undefined } });
    expect(state.disabled).toBe(true);
    expect(state.placeholder).toMatch(/Could not load contacts: .*Key revoked/);
  });

  it('follow pages and pass the search text', async () => {
    const fetchMock = stubFetch({
      responses: [
        { status: 200, body: page({ data: [{ id: '1', first_name: 'A', email: 'a@x.io' }], page: 1, pages: 2 }) },
        { status: 200, body: page({ data: [{ id: '2', first_name: 'B' }], page: 2, pages: 2 }) },
      ],
    });
    const state = await loadOptions({ action: 'get_contact', prop: 'contactId', ctx: { searchValue: 'a' } });
    expect(state.options).toEqual([
      { label: 'A <a@x.io>', value: '1' },
      { label: 'B', value: '2' },
    ]);
    expect(request({ fetchMock, call: 0 }).query).toMatchObject({ search: 'a', limit: '100' });
  });

  it('stage dropdown reads the selected pipeline', async () => {
    stubFetch({ responses: [{ status: 200, body: { data: { id: 'p', stages: [{ id: 's1', name: 'Lead' }] } } }] });
    const state = await loadOptions({ action: 'create_pipeline_item', prop: 'stageId', propsValue: { pipelineId: 'p' } });
    expect(state.options).toEqual([{ label: 'Lead', value: 's1' }]);
  });
});
