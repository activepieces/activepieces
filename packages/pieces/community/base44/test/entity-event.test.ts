import { describe, expect, it, vi } from 'vitest';

vi.mock('@base44/sdk', () => ({ createClient: vi.fn() }));

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
