import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_KEY,
  BASE,
  listBody,
  memoryStore,
  ok,
  request,
  runHook,
  sendRequest,
} from './helpers';
import { newTaskTrigger } from '../src/lib/triggers/new-task';
import { newCrmAccountTrigger } from '../src/lib/triggers/new-crm-account';
import { newOpportunityTrigger } from '../src/lib/triggers/new-opportunity';
import { newProjectTrigger } from '../src/lib/triggers/new-project';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
});

const KEY = 'flowlu_last_seen_id';
const asRecord = (value: unknown): Record<string, unknown> => Object(value);

beforeEach(() => {
  sendRequest.mockReset();
});

describe('polling triggers', () => {
  it('onEnable stores the newest id of the whole entity, ignoring the filters', async () => {
    const { store, data } = memoryStore();
    fakeFlowlu({
      records: [
        { id: 1, responsible_id: 2 },
        { id: 42, responsible_id: 3 },
      ],
    });
    await runHook({
      trigger: asRecord(newTaskTrigger),
      hook: 'onEnable',
      context: { store, propsValue: { responsible_id: 2 } },
    });
    expect(request(0).url).toBe(`${BASE}/task/tasks/list`);
    expect(request(0).queryParams).toEqual({
      'order_by[desc][]': 'id',
      limit: '1',
      api_key: API_KEY,
    });
    expect(data.get(KEY)).toBe(42);
  });

  it('run asks only for ids above the checkpoint, oldest first, and emits them in order', async () => {
    const { store, data } = memoryStore({ [KEY]: 42 });
    fakeFlowlu({ records: ids({ from: 40, to: 45 }) });
    const items = await runHook({
      trigger: asRecord(newTaskTrigger),
      hook: 'run',
      context: { store },
    });
    expect(request(1).queryParams).toMatchObject({
      'filter[id]': '{"type":"more","value":42}',
      'order_by[asc][]': 'id',
      limit: '100',
      page: '1',
    });
    expect(items).toEqual(ids({ from: 43, to: 45 }));
    expect(data.get(KEY)).toBe(45);
  });

  it('run follows full pages and never re-emits an item on the next poll', async () => {
    const { store, data } = memoryStore({ [KEY]: 0 });
    fakeFlowlu({ records: ids({ from: 1, to: 103 }) });
    const first = await poll({ trigger: newProjectTrigger, store });
    expect(first.map(idOf)).toEqual(range({ from: 1, to: 103 }));
    expect(data.get(KEY)).toBe(103);
    const second = await poll({ trigger: newProjectTrigger, store });
    expect(second).toEqual([]);
  });

  it('more than 500 new records arrive across two polls, each emitted exactly once', async () => {
    const { store, data } = memoryStore({ [KEY]: 100 });
    const records = ids({ from: 1, to: 100 });
    fakeFlowlu({ records });
    records.push(...ids({ from: 101, to: 750 }));
    const first = await poll({ trigger: newProjectTrigger, store });
    expect(first.map(idOf)).toEqual(range({ from: 101, to: 600 }));
    expect(data.get(KEY)).toBe(600);
    const second = await poll({ trigger: newProjectTrigger, store });
    expect(second.map(idOf)).toEqual(range({ from: 601, to: 750 }));
    expect(await poll({ trigger: newProjectTrigger, store })).toEqual([]);
  });

  it('an old record reassigned into the filter never fires; a new matching one does', async () => {
    const { store } = memoryStore();
    const records = ids({ from: 1, to: 10 }).map((r) => ({
      ...r,
      responsible_id: 3,
    }));
    fakeFlowlu({ records });
    const propsValue = { responsible_id: 2 };
    await runHook({
      trigger: asRecord(newTaskTrigger),
      hook: 'onEnable',
      context: { store, propsValue },
    });
    expect(await poll({ trigger: newTaskTrigger, store, propsValue })).toEqual(
      []
    );
    records[2] = { ...records[2], responsible_id: 2 };
    expect(await poll({ trigger: newTaskTrigger, store, propsValue })).toEqual(
      []
    );
    records.push({ id: 11, responsible_id: 2 }, { id: 12, responsible_id: 3 });
    const fired = await poll({ trigger: newTaskTrigger, store, propsValue });
    expect(fired).toEqual([{ id: 11, responsible_id: 2 }]);
  });

  it('nothing matches the filter at enable time: older records still never fire', async () => {
    const { store, data } = memoryStore();
    const records = ids({ from: 1, to: 5 }).map((r) => ({
      ...r,
      responsible_id: 3,
    }));
    fakeFlowlu({ records });
    const propsValue = { responsible_id: 2 };
    await runHook({
      trigger: asRecord(newTaskTrigger),
      hook: 'onEnable',
      context: { store, propsValue },
    });
    expect(data.get(KEY)).toBe(5);
    records[1] = { ...records[1], responsible_id: 2 };
    expect(await poll({ trigger: newTaskTrigger, store, propsValue })).toEqual(
      []
    );
    expect(data.get(KEY)).toBe(5);
  });

  it('an empty entity at enable time stores 0, and the first new record fires', async () => {
    const { store, data } = memoryStore();
    const records: Record<string, unknown>[] = [];
    fakeFlowlu({ records });
    await runHook({
      trigger: asRecord(newProjectTrigger),
      hook: 'onEnable',
      context: { store },
    });
    expect(data.get(KEY)).toBe(0);
    records.push({ id: 1 });
    expect(await poll({ trigger: newProjectTrigger, store })).toEqual([
      { id: 1 },
    ]);
    expect(data.get(KEY)).toBe(1);
  });

  it('records that do not match the filter still move the checkpoint, so they never fire later', async () => {
    const { store, data } = memoryStore({ [KEY]: 1 });
    fakeFlowlu({
      records: ids({ from: 1, to: 5 }).map((r) => ({ ...r, type: 1 })),
    });
    const propsValue = { account_type: 'contact' };
    expect(
      await poll({ trigger: newCrmAccountTrigger, store, propsValue })
    ).toEqual([]);
    expect(data.get(KEY)).toBe(5);
  });

  it('when Flowlu ignores the id filter, it finds the checkpoint and emits >500 new records oldest first, once each', async () => {
    const { store, data } = memoryStore({ [KEY]: 1000 });
    const records = ids({ from: 1, to: 1000 });
    fakeFlowlu({ records, honourIdFilter: false });
    records.push(...ids({ from: 1001, to: 1650 }));
    const first = await poll({ trigger: newProjectTrigger, store });
    expect(first.map(idOf)).toEqual(range({ from: 1001, to: 1500 }));
    expect(data.get(KEY)).toBe(1500);
    expect(sendRequest.mock.calls.length).toBeLessThan(20);
    const second = await poll({ trigger: newProjectTrigger, store });
    expect(second.map(idOf)).toEqual(range({ from: 1501, to: 1650 }));
    expect(data.get(KEY)).toBe(1650);
    expect(await poll({ trigger: newProjectTrigger, store })).toEqual([]);
  });

  it('when Flowlu ignores the id filter, filters still apply and the checkpoint is found on page 1', async () => {
    const { store, data } = memoryStore({ [KEY]: 10 });
    fakeFlowlu({
      records: [
        { id: 1, pipeline_id: 3 },
        { id: 11, pipeline_id: 3 },
        { id: 12, pipeline_id: 4 },
        { id: 13, pipeline_id: 3 },
      ],
      honourIdFilter: false,
    });
    const items = await poll({
      trigger: newOpportunityTrigger,
      store,
      propsValue: { pipeline_id: 3 },
    });
    expect(items).toEqual([
      { id: 11, pipeline_id: 3 },
      { id: 13, pipeline_id: 3 },
    ]);
    expect(data.get(KEY)).toBe(13);
  });

  it('fails, keeping the checkpoint, when Flowlu ignores both the id filter and the sort order', async () => {
    const { store, data } = memoryStore({ [KEY]: 2 });
    fakeFlowlu({
      records: [{ id: 5 }, { id: 1 }, { id: 3 }],
      honourIdFilter: false,
      honourOrder: false,
    });
    await expect(poll({ trigger: newProjectTrigger, store })).rejects.toThrow(
      'ignored both the id filter and the sort order'
    );
    expect(data.get(KEY)).toBe(2);
  });

  it('run without a checkpoint initialises it and emits nothing', async () => {
    const { store, data } = memoryStore();
    fakeFlowlu({ records: ids({ from: 1, to: 7 }) });
    const items = await poll({ trigger: newProjectTrigger, store });
    expect(items).toEqual([]);
    expect(data.get(KEY)).toBe(7);
  });

  it('a failed poll keeps the checkpoint', async () => {
    const { store, data } = memoryStore({ [KEY]: 5 });
    ok({ error: { error_code: 11, error_msg: 'api key not found' } });
    await expect(poll({ trigger: newProjectTrigger, store })).rejects.toThrow(
      'error 11'
    );
    expect(data.get(KEY)).toBe(5);
  });

  it('filters go to Flowlu on the new-records query only', async () => {
    const { store } = memoryStore({ [KEY]: 1 });
    fakeFlowlu({ records: [] });
    await poll({
      trigger: newCrmAccountTrigger,
      store,
      propsValue: { account_type: 'contact' },
    });
    expect(request(0).url).toBe(`${BASE}/crm/account/list`);
    expect(request(0).queryParams['filter[type]']).toBeUndefined();
    expect(request(1).queryParams).toMatchObject({ 'filter[type]': '2' });
    await poll({
      trigger: newOpportunityTrigger,
      store,
      propsValue: { pipeline_id: 3 },
    });
    expect(request(3).queryParams).toMatchObject({
      'filter[pipeline_id]': '3',
    });
    await poll({
      trigger: newTaskTrigger,
      store,
      propsValue: { project_id: 7, responsible_id: 2 },
    });
    expect(request(5).queryParams).toMatchObject({
      'filter[model_id]': '7',
      'filter[model]': 'project',
      'filter[responsible_id]': '2',
    });
  });

  it('test returns the 5 newest records', async () => {
    ok(listBody({ items: [{ id: 9 }, { id: 8 }] }));
    const items = await runHook({
      trigger: asRecord(newTaskTrigger),
      hook: 'test',
      context: { store: memoryStore().store },
    });
    expect(request(0).queryParams).toMatchObject({
      'order_by[desc][]': 'id',
      limit: '5',
    });
    expect(items).toEqual([{ id: 9 }, { id: 8 }]);
  });

  it('onDisable forgets the checkpoint', async () => {
    const { store, data } = memoryStore({ [KEY]: 5 });
    await runHook({
      trigger: asRecord(newTaskTrigger),
      hook: 'onDisable',
      context: { store },
    });
    expect(data.has(KEY)).toBe(false);
  });
});

function poll({
  trigger,
  store,
  propsValue = {},
}: {
  trigger: unknown;
  store: ReturnType<typeof memoryStore>['store'];
  propsValue?: Record<string, unknown>;
}): Promise<Record<string, unknown>[]> {
  return runHook({
    trigger: asRecord(trigger),
    hook: 'run',
    context: { store, propsValue },
  }).then((items) => (Array.isArray(items) ? items : []));
}

function fakeFlowlu({
  records,
  honourIdFilter = true,
  honourOrder = true,
}: {
  records: Record<string, unknown>[];
  honourIdFilter?: boolean;
  honourOrder?: boolean;
}) {
  sendRequest.mockImplementation(
    async (req: { queryParams: Record<string, string> }) => {
      const query = req.queryParams;
      const matching = records.filter((record) =>
        Object.entries(query).every(([key, value]) => {
          const field = /^filter\[(\w+)\]$/.exec(key)?.[1];
          if (field === undefined) {
            return true;
          }
          if (field === 'id') {
            return (
              !honourIdFilter ||
              idOf(record) > Number(JSON.parse(value)['value'])
            );
          }
          return String(record[field]) === value;
        })
      );
      const desc = query['order_by[desc][]'] === 'id';
      const ordered = honourOrder
        ? [...matching].sort((a, b) =>
            desc ? idOf(b) - idOf(a) : idOf(a) - idOf(b)
          )
        : matching;
      const limit = Number(query['limit']);
      const page = Number(query['page'] ?? 1);
      const items = ordered.slice((page - 1) * limit, page * limit);
      return {
        status: 200,
        headers: {},
        body: listBody({ items, total: ordered.length, page }),
      };
    }
  );
}

function ids({ from, to }: { from: number; to: number }) {
  return range({ from, to }).map((id) => ({ id }));
}

function range({ from, to }: { from: number; to: number }) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function idOf(item: Record<string, unknown>): number {
  return Number(item['id']);
}
