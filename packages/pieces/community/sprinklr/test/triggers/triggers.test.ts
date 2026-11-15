import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sprinklrCase } from '../../src/lib/common/case';
import { sprinklrCaseTrigger } from '../../src/lib/triggers/common';
import { newCase as newCaseTrigger } from '../../src/lib/triggers/new-case';
import { updatedCase as updatedCaseTrigger } from '../../src/lib/triggers/updated-case';
import { pieceRunner, RunnablePollingTrigger, shape } from '../support/piece-runner';

const T0 = 1_780_000_000_000;
const MINUTE = 60_000;
const auth = {
  access_token: 'token-1',
  client_id: 'key-1',
  props: { base: 'https://api3.sprinklr.com/prod2', callback: 'https://cloud.activepieces.com/redirect' },
};

const newCase = pieceRunner.pollingTrigger(newCaseTrigger);
const updatedCase = pieceRunner.pollingTrigger(updatedCaseTrigger);

function memoryStore(): Store {
  const data = new Map<string, string>();
  return {
    put: async <T>(key: string, value: T): Promise<T> => {
      data.set(key, JSON.stringify(value));
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

function contextFor({ store, queueId, isRepublish }: { store: Store; queueId?: string; isRepublish?: boolean }) {
  return pieceRunner.pollingContext({ auth, store, propsValue: { queueId }, isRepublish });
}

function stubSearch(pages: Page[]) {
  let call = 0;
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (_request: HttpRequest) => {
    const page = pages[Math.min(call, pages.length - 1)];
    call += 1;
    return { status: 200, headers: {}, body: { data: page, errors: [] } };
  });
}

function sprinklrCaseRaw({ id, created, modified }: { id: string; created: number; modified?: number }) {
  return { id, caseNumber: Number(id), subject: `Case ${id}`, createdTime: created, modifiedTime: modified ?? created };
}

function idsOf(items: unknown[]): unknown[] {
  return items.map((item) => (shape.isRecord(item) ? item['id'] : undefined));
}

function requestOf({ spy, call }: { spy: ReturnType<typeof stubSearch>; call: number }): HttpRequest {
  return spy.mock.calls[call][0];
}

async function enable({ trigger, queueId }: { trigger: RunnablePollingTrigger; queueId?: string }): Promise<Store> {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  const store = memoryStore();
  await trigger.onEnable(contextFor({ store, queueId }));
  vi.setSystemTime(T0 + 5 * MINUTE);
  return store;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('New Case trigger', () => {
  it('makes no call when it is turned on, so old cases cannot flood the flow', async () => {
    const spy = stubSearch([{ results: [] }]);

    const store = await enable({ trigger: newCase });

    expect(spy).not.toHaveBeenCalled();
    expect(await store.get('lastPoll')).toBe(T0);
  });

  it('asks for cases created after the last seen time, oldest first, in one call', async () => {
    const store = await enable({ trigger: newCase });
    const spy = stubSearch([{ results: [sprinklrCaseRaw({ id: '2', created: T0 + 2 * MINUTE }), sprinklrCaseRaw({ id: '1', created: T0 + MINUTE })] }]);

    const items = await newCase.run(contextFor({ store }));

    expect(idsOf(items)).toEqual(['1', '2']);
    expect(spy).toHaveBeenCalledTimes(1);
    const request = requestOf({ spy, call: 0 });
    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://api3.sprinklr.com/prod2/api/v3/search/case');
    expect(request.body).toEqual({
      filter: { type: 'GT', key: 'createdTime', values: [T0] },
      sorts: [{ key: 'createdTime', order: 'ASC' }],
      page: { size: 100 },
    });
  });

  it('continues from the newest case time it saw, as an epoch number', async () => {
    const store = await enable({ trigger: newCase });
    const spy = stubSearch([{ results: [sprinklrCaseRaw({ id: '1', created: T0 + MINUTE + 123 })] }, { results: [] }]);

    await newCase.run(contextFor({ store }));
    const second = await newCase.run(contextFor({ store }));

    expect(second).toEqual([]);
    expect(requestOf({ spy, call: 1 }).body).toMatchObject({ filter: { type: 'GT', key: 'createdTime', values: [T0 + MINUTE + 123] } });
  });

  it('does not send a case twice when the API returns it again', async () => {
    const store = await enable({ trigger: newCase });
    const old = sprinklrCaseRaw({ id: '1', created: T0 + MINUTE });
    stubSearch([{ results: [old] }, { results: [old, sprinklrCaseRaw({ id: '2', created: T0 + 2 * MINUTE })] }]);

    const first = await newCase.run(contextFor({ store }));
    const second = await newCase.run(contextFor({ store }));

    expect(idsOf(first)).toEqual(['1']);
    expect(idsOf(second)).toEqual(['2']);
  });

  it('returns each case in the shared case shape', async () => {
    const store = await enable({ trigger: newCase });
    const raw = { ...sprinklrCaseRaw({ id: '7', created: T0 + MINUTE }), extra: 'dropped', workflow: { queues: [{ queueId: 5001 }] } };
    stubSearch([{ results: [raw] }]);

    const items = await newCase.run(contextFor({ store }));

    expect(items).toEqual([sprinklrCase.normalize(raw)]);
  });

  it('skips results without a usable time', async () => {
    const store = await enable({ trigger: newCase });
    stubSearch([{ results: [{ id: 'x', createdTime: 'soon' }, sprinklrCaseRaw({ id: '1', created: T0 + MINUTE })] }]);

    expect(idsOf(await newCase.run(contextFor({ store })))).toEqual(['1']);
  });

  it('adds the queue to the filter when a Queue ID is set', async () => {
    const store = await enable({ trigger: newCase, queueId: ' 5001 ' });
    const spy = stubSearch([{ results: [] }]);

    await newCase.run(contextFor({ store, queueId: ' 5001 ' }));

    expect(requestOf({ spy, call: 0 }).body).toMatchObject({
      filter: {
        type: 'AND',
        filters: [
          { type: 'GT', key: 'createdTime', values: [T0] },
          { type: 'IN', key: 'workflow.queues.queueId', values: ['5001'] },
        ],
      },
    });
  });

  it('follows the cursor when the first page is full', async () => {
    const store = await enable({ trigger: newCase });
    const firstPage = Array.from({ length: 100 }, (_, n) => sprinklrCaseRaw({ id: String(n + 1), created: T0 + 1000 + n }));
    const spy = stubSearch([{ results: firstPage, cursor: 'next-1' }, { results: [sprinklrCaseRaw({ id: '101', created: T0 + 2000 })] }]);

    const items = await newCase.run(contextFor({ store }));

    expect(items).toHaveLength(101);
    expect(requestOf({ spy, call: 1 }).method).toBe('GET');
    expect(requestOf({ spy, call: 1 }).url).toBe('https://api3.sprinklr.com/prod2/api/v3/search/case?id=next-1');
  });

  it('stops at the per-poll cap and holds back the last timestamp so a tie is not lost', async () => {
    const store = await enable({ trigger: newCase });
    const cap = sprinklrCaseTrigger.MAX_CASES_PER_POLL;
    const pages: Page[] = Array.from({ length: cap / 100 }, (_, p) => ({
      results: Array.from({ length: 100 }, (_, n) => {
        const index = p * 100 + n;
        return sprinklrCaseRaw({ id: String(index + 1), created: index >= cap - 2 ? T0 + 9000 : T0 + 1000 + index });
      }),
      cursor: `c-${p + 1}`,
    }));
    const tied = sprinklrCaseRaw({ id: String(cap + 1), created: T0 + 9000 });
    const spy = stubSearch([...pages, { results: [pages[4].results[98], pages[4].results[99], tied] }]);

    const first = await newCase.run(contextFor({ store }));
    const second = await newCase.run(contextFor({ store }));

    expect(spy.mock.calls.filter(([request]) => request.method === 'POST').length).toBe(2);
    expect(first).toHaveLength(cap - 2);
    expect(idsOf(second)).toEqual([String(cap - 1), String(cap), String(cap + 1)]);
    expect(requestOf({ spy, call: cap / 100 }).body).toMatchObject({ filter: { values: [T0 + 1000 + cap - 3] } });
  });

  it('keeps its place when the flow is republished', async () => {
    const store = await enable({ trigger: newCase });
    await store.put('lastPoll', T0 + MINUTE);
    await newCase.onEnable(contextFor({ store, isRepublish: true }));
    const spy = stubSearch([{ results: [] }]);

    await newCase.run(contextFor({ store }));

    expect(requestOf({ spy, call: 0 }).body).toMatchObject({ filter: { values: [T0 + MINUTE] } });
  });

  it('returns the five newest cases, newest first, when testing', async () => {
    const results = [6, 5, 4, 3, 2].map((n) => sprinklrCaseRaw({ id: String(n), created: T0 + n * MINUTE }));
    const spy = stubSearch([{ results, cursor: 'more' }]);

    const items = await newCase.test(contextFor({ store: memoryStore() }));

    expect(idsOf(items)).toEqual(['6', '5', '4', '3', '2']);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(requestOf({ spy, call: 0 }).body).toEqual({
      filter: { type: 'GT', key: 'createdTime', values: [0] },
      sorts: [{ key: 'createdTime', order: 'DESC' }],
      page: { size: 5 },
    });
  });
});

describe('Updated Case trigger', () => {
  it('watches modifiedTime and fires again when a case changes', async () => {
    const store = await enable({ trigger: updatedCase });
    const spy = stubSearch([
      { results: [sprinklrCaseRaw({ id: '1', created: T0 - MINUTE, modified: T0 + MINUTE })] },
      { results: [sprinklrCaseRaw({ id: '1', created: T0 - MINUTE, modified: T0 + 3 * MINUTE })] },
    ]);

    const first = await updatedCase.run(contextFor({ store }));
    const second = await updatedCase.run(contextFor({ store }));

    expect(idsOf(first)).toEqual(['1']);
    expect(idsOf(second)).toEqual(['1']);
    expect(requestOf({ spy, call: 0 }).body).toEqual({
      filter: { type: 'GT', key: 'modifiedTime', values: [T0] },
      sorts: [{ key: 'modifiedTime', order: 'ASC' }],
      page: { size: 100 },
    });
    expect(requestOf({ spy, call: 1 }).body).toMatchObject({ filter: { values: [T0 + MINUTE] } });
  });

  it('sorts the test cases by modifiedTime', async () => {
    const spy = stubSearch([{ results: [] }]);

    await updatedCase.test(contextFor({ store: memoryStore() }));

    expect(requestOf({ spy, call: 0 }).body).toMatchObject({ sorts: [{ key: 'modifiedTime', order: 'DESC' }], page: { size: 5 } });
  });
});

describe('trigger metadata', () => {
  it.each([
    [newCaseTrigger, 'new_case', 'New Case', 'Fires when a case is created.'],
    [updatedCaseTrigger, 'updated_case', 'Updated Case', 'Fires when a case is created or changed.'],
  ])('%#: names, polling type, READ, schema and sample data', (trigger, name, displayName, description) => {
    expect(trigger.name).toBe(name);
    expect(trigger.displayName).toBe(displayName);
    expect(trigger.description).toBe(description);
    expect(trigger.type).toBe('POLLING');
    expect(trigger.classification).toBe('READ');
    expect(trigger.outputSchema).toBe(sprinklrCase.outputSchema);
    expect(trigger.sampleData).toEqual(sprinklrCase.sampleData);
    expect(trigger.aiMetadata?.description?.length).toBeGreaterThan(0);
    expect(String(trigger.props['queueId'].description).length).toBeLessThanOrEqual(70);
  });
});

type Page = { results: unknown[]; cursor?: string };
