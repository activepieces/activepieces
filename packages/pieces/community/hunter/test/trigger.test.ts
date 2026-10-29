import { afterEach, describe, expect, test, vi } from 'vitest';
import { newLeadTrigger, LAST_LEAD_ID_KEY } from '../src/lib/triggers/new-lead';
import { API_KEY, SeenRequest, memoryStore, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('new lead trigger', () => {
  test('pages back to the last seen id and emits each new lead once, oldest first', async () => {
    const all = Array.from({ length: 250 }, (_, index) => ({ id: 1000 - index, email: `l${index}@example.com` }));
    const seen = stubFetch((request: SeenRequest) => {
      const offset = Number(request.query.get('offset'));
      const limit = Number(request.query.get('limit'));
      return { body: { data: { leads: all.slice(offset, offset + limit) } } };
    });
    const store = memoryStore({ [LAST_LEAD_ID_KEY]: 1000 - 150 });
    const output = await newLeadTrigger.run(fakeContext({ store }));
    expect(output).toHaveLength(150);
    expect(output[0]).toMatchObject({ id: 851 });
    expect(output[149]).toMatchObject({ id: 1000 });
    expect(store.data.get(LAST_LEAD_ID_KEY)).toBe(1000);
    expect(seen.map((r) => r.query.get('offset'))).toEqual(['0', '100']);
    const again = await newLeadTrigger.run(fakeContext({ store }));
    expect(again).toEqual([]);
  });

  test('an empty account enabled at 0 emits every lead of a first bulk import', async () => {
    const all = Array.from({ length: 150 }, (_, index) => ({ id: 150 - index }));
    stubFetch((request: SeenRequest) => {
      const offset = Number(request.query.get('offset'));
      const limit = Number(request.query.get('limit'));
      return { body: { data: { leads: offset === 0 && limit === 1 ? [] : all.slice(offset, offset + limit) } } };
    });
    const store = memoryStore();
    await newLeadTrigger.onEnable(fakeContext({ store }));
    expect(store.data.get(LAST_LEAD_ID_KEY)).toBe(0);
    const output = await newLeadTrigger.run(fakeContext({ store }));
    expect(output).toHaveLength(150);
    expect(output[0]).toMatchObject({ id: 1 });
    expect(store.data.get(LAST_LEAD_ID_KEY)).toBe(150);
  });

  test('more than 1000 new leads are emitted oldest first over several polls', async () => {
    const all = Array.from({ length: 1500 }, (_, index) => ({ id: 1500 - index }));
    stubFetch((request: SeenRequest) => {
      const offset = Number(request.query.get('offset'));
      const limit = Number(request.query.get('limit'));
      return { body: { data: { leads: all.slice(offset, offset + limit) } } };
    });
    const store = memoryStore({ [LAST_LEAD_ID_KEY]: 0 });
    const first = await newLeadTrigger.run(fakeContext({ store }));
    expect(first).toHaveLength(1000);
    expect(store.data.get(LAST_LEAD_ID_KEY)).toBe(1000);
    const second = await newLeadTrigger.run(fakeContext({ store }));
    expect(second).toHaveLength(500);
    expect(second[0]).toMatchObject({ id: 1001 });
  });

  test('a run without a stored baseline only records the newest id', async () => {
    stubFetch(() => ({ body: { data: { leads: [{ id: 7 }] } } }));
    const store = memoryStore();
    const output = await newLeadTrigger.run(fakeContext({ store }));
    expect(output).toEqual([]);
    expect(store.data.get(LAST_LEAD_ID_KEY)).toBe(7);
  });

  test('onEnable stores the newest lead id', async () => {
    stubFetch(() => ({ body: { data: { leads: [{ id: 42 }] } } }));
    const store = memoryStore();
    await newLeadTrigger.onEnable(fakeContext({ store }));
    expect(store.data.get(LAST_LEAD_ID_KEY)).toBe(42);
  });

  test('a republish keeps the stored cursor so leads created since the last poll still fire', async () => {
    const all = [{ id: 501 }, { id: 500 }];
    stubFetch((request: SeenRequest) => {
      const offset = Number(request.query.get('offset'));
      const limit = Number(request.query.get('limit'));
      return { body: { data: { leads: all.slice(offset, offset + limit) } } };
    });
    const store = memoryStore({ [LAST_LEAD_ID_KEY]: 500 });
    await newLeadTrigger.onDisable(fakeContext({ store }));
    await newLeadTrigger.onEnable(fakeContext({ store, isRepublish: true }));
    expect(store.data.get(LAST_LEAD_ID_KEY)).toBe(500);
    const output = await newLeadTrigger.run(fakeContext({ store }));
    expect(output).toEqual([{ id: 501 }]);
  });

  test('a republish without a stored cursor sets the baseline', async () => {
    stubFetch(() => ({ body: { data: { leads: [{ id: 42 }] } } }));
    const store = memoryStore();
    await newLeadTrigger.onEnable(fakeContext({ store, isRepublish: true }));
    expect(store.data.get(LAST_LEAD_ID_KEY)).toBe(42);
  });
});

function fakeContext({
  store,
  isRepublish = false,
}: {
  store: ReturnType<typeof memoryStore>;
  isRepublish?: boolean;
}): Parameters<typeof newLeadTrigger.run>[0] {
  return Object.assign(Object.create(null), { auth: { type: 'SECRET_TEXT', secret_text: API_KEY }, store, propsValue: {}, isRepublish });
}
