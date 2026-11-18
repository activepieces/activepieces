import { describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@base44/sdk', () => ({ createClient }));

import { entityEvent, entityEventInternals } from '../src/lib/triggers/entity-event';

const created = { id: 'c', created_date: '2024-01-02T00:00:00.000Z', updated_date: '2024-01-02T00:00:00.000Z' };
const edited = { id: 'e', created_date: '2024-01-01T00:00:00.000Z', updated_date: '2024-01-03T00:00:00.000Z' };
const old = { id: 'o', created_date: '2023-01-01T00:00:00.000Z', updated_date: '2023-01-01T00:00:00.000Z' };

describe('entity event selection', () => {
  it('created mode returns records created after the last fetch', () => {
    const result = entityEventInternals.selectEventRecords({
      records: [created, edited, old],
      eventType: 'created',
      lastFetchEpochMS: new Date('2024-01-01T12:00:00.000Z').getTime(),
    });
    expect(result.map(({ record }) => record['id'])).toEqual(['c']);
  });

  it('updated mode skips never-edited new records', () => {
    const result = entityEventInternals.selectEventRecords({
      records: [created, edited, old],
      eventType: 'updated',
      lastFetchEpochMS: 0,
    });
    expect(result.map(({ record }) => record['id'])).toEqual(['e']);
    expect(result[0].epochMilliSeconds).toBe(new Date(edited.updated_date).getTime());
  });

  it('drops records with unparseable dates', () => {
    const result = entityEventInternals.selectEventRecords({
      records: [{ id: 'x', created_date: 'nope' }],
      eventType: 'created',
      lastFetchEpochMS: 0,
    });
    expect(result).toEqual([]);
  });

  it('reads offset-less Base44 timestamps as UTC', () => {
    const result = entityEventInternals.selectEventRecords({
      records: [{ id: 'n', created_date: '2026-11-01T12:56:20.141000', updated_date: '2026-11-01T12:56:20.141000' }],
      eventType: 'created',
      lastFetchEpochMS: 0,
    });
    expect(result[0].epochMilliSeconds).toBe(Date.UTC(2026, 10, 1, 12, 56, 20, 141));
  });

  it('keeps timestamps that already carry a zone', () => {
    const result = entityEventInternals.selectEventRecords({
      records: [{ id: 'z', created_date: '2026-11-01T12:56:20.141562Z' }],
      eventType: 'created',
      lastFetchEpochMS: 0,
    });
    expect(result[0].epochMilliSeconds).toBe(Date.UTC(2026, 10, 1, 12, 56, 20, 141));
  });

  it('declares an outputSchema', () => {
    expect(entityEvent.outputSchema?.fields.map((f) => f.key)).toContain('_eventType');
  });
});

describe('entity event full-precision update detection', () => {
  it('treats a sub-millisecond edit as an update (create vs read formats)', () => {
    const result = entityEventInternals.selectEventRecords({
      records: [{ id: 'f', created_date: '2026-11-01T12:56:20.141000', updated_date: '2026-11-01T12:56:20.141562Z' }],
      eventType: 'updated',
      lastFetchEpochMS: 0,
    });
    expect(result.map(({ record }) => record['id'])).toEqual(['f']);
  });

  it('treats the same instant in different formats/offsets as never edited', () => {
    const result = entityEventInternals.selectEventRecords({
      records: [
        { id: 'a', created_date: '2026-11-01T12:56:20.141000', updated_date: '2026-11-01T12:56:20.141000Z' },
        { id: 'b', created_date: '2026-11-01T12:56:20.141562Z', updated_date: '2026-11-01T14:56:20.141562+02:00' },
        { id: 'c', created_date: '2026-11-01T12:56:20.141Z', updated_date: '2026-11-01T12:56:20.141000' },
      ],
      eventType: 'updated',
      lastFetchEpochMS: 0,
    });
    expect(result).toEqual([]);
  });

  it('parses microseconds', () => {
    expect(entityEventInternals.toEpochMicros('2026-11-01T12:56:20.141562Z')).toBe(
      Date.UTC(2026, 10, 1, 12, 56, 20, 141) * 1000 + 562,
    );
  });
});

describe('entity event scheduled poll (run)', () => {
  const lastPoll = Date.UTC(2026, 10, 1, 12, 0, 0);
  function setup(list: ReturnType<typeof vi.fn>) {
    const handler = { list };
    const entities = new Proxy({}, { get: () => handler });
    createClient.mockReturnValue({ entities, asServiceRole: { entities } });
    const data: Record<string, unknown> = { lastPoll };
    const store = {
      get: vi.fn(async (key: string) => data[key] ?? null),
      put: vi.fn(async (key: string, value: unknown) => {
        data[key] = value;
        return value;
      }),
      delete: vi.fn(async () => undefined),
    };
    return { store, data };
  }
  async function poll({ store, eventType }: { store: unknown; eventType: string }): Promise<Record<string, unknown>[]> {
    const context = {
      store,
      auth: { props: { appId: 'app', token: 'tok' } },
      propsValue: { entityType: 'Product', eventType },
      files: {},
    };
    const result: unknown = await Reflect.apply(entityEvent.run, entityEvent, [context]);
    if (!Array.isArray(result)) {
      throw new Error('expected an array of items');
    }
    return result.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null);
  }

  it('created mode lists by -created_date with limit 500 and emits new records', async () => {
    const list = vi.fn().mockResolvedValue([
      { id: 'new', name: 'Widget', created_date: '2026-11-01T12:56:20.141000', updated_date: '2026-11-01T12:56:20.141000' },
      { id: 'old', created_date: '2026-11-01T11:00:00.000000', updated_date: '2026-11-01T11:00:00.000000' },
    ]);
    const { store, data } = setup(list);
    const items = await poll({ store, eventType: 'created' });
    expect(list).toHaveBeenCalledWith('-created_date', 500);
    expect(items.map((i) => i['id'])).toEqual(['new']);
    expect(items[0]).toMatchObject({ name: 'Widget', _eventType: 'created', _entityType: 'Product' });
    expect(data['lastPoll']).toBe(Date.UTC(2026, 10, 1, 12, 56, 20, 141));
  });

  it('updated mode lists by -updated_date with limit 500 and skips never-edited records', async () => {
    const list = vi.fn().mockResolvedValue([
      { id: 'edited', created_date: '2026-11-01T12:56:20.141000', updated_date: '2026-11-01T12:56:20.141562Z' },
      { id: 'fresh', created_date: '2026-11-01T12:30:00.000000', updated_date: '2026-11-01T12:30:00.000000' },
    ]);
    const { store } = setup(list);
    const items = await poll({ store, eventType: 'updated' });
    expect(list).toHaveBeenCalledWith('-updated_date', 500);
    expect(items.map((i) => i['id'])).toEqual(['edited']);
    expect(items[0]['_eventType']).toBe('updated');
  });

  it('propagates a rejected SDK request', async () => {
    const list = vi.fn().mockRejectedValue(Object.assign(new Error('Request failed'), { status: 500 }));
    const { store, data } = setup(list);
    await expect(poll({ store, eventType: 'created' })).rejects.toThrow();
    expect(list).toHaveBeenCalledWith('-created_date', 500);
    expect(data['lastPoll']).toBe(lastPoll);
  });
});
