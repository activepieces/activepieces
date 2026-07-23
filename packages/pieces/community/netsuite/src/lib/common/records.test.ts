import { describe, expect, it } from 'vitest';
import { netsuiteRecords } from './records';

describe('netsuiteRecords', () => {
  it('toRef wraps ids and drops empties', () => {
    expect(netsuiteRecords.toRef('42')).toEqual({ id: '42' });
    expect(netsuiteRecords.toRef(42)).toEqual({ id: '42' });
    expect(netsuiteRecords.toRef('')).toBeUndefined();
    expect(netsuiteRecords.toRef(undefined)).toBeUndefined();
    expect(netsuiteRecords.toRef(null)).toBeUndefined();
  });

  it('compact strips undefined/null/empty but keeps false and 0', () => {
    expect(
      netsuiteRecords.compact({ a: undefined, b: null, c: '', d: false, e: 0, f: 'x' })
    ).toEqual({ d: false, e: 0, f: 'x' });
  });

  it('buildLineItems maps only present fields', () => {
    expect(
      netsuiteRecords.buildLineItems([{ itemId: '5', quantity: 2 }])
    ).toEqual({ items: [{ item: { id: '5' }, quantity: 2 }] });
    expect(netsuiteRecords.buildLineItems([])).toBeUndefined();
    expect(netsuiteRecords.buildLineItems(undefined)).toBeUndefined();
  });

  it('buildPaymentApplications sets apply flag and doc ref', () => {
    expect(
      netsuiteRecords.buildPaymentApplications([{ invoiceId: '9', amount: 100 }])
    ).toEqual({ items: [{ apply: true, doc: { id: '9' }, amount: 100 }] });
  });

  it('buildEntitySearchQuery escapes single quotes and requires a filter', () => {
    expect(netsuiteRecords.buildEntitySearchQuery({ table: 'customer' })).toBeNull();

    const query = netsuiteRecords.buildEntitySearchQuery({
      table: 'customer',
      email: "o'brien@x.com",
    });
    expect(query).toContain("email = 'o''brien@x.com'");
    expect(query).toContain('FROM customer');
  });

  it('buildEntitySearchQuery escapes LIKE wildcards in name', () => {
    const query = netsuiteRecords.buildEntitySearchQuery({
      table: 'vendor',
      name: '50%_off',
    });
    expect(query).toContain("LIKE '%50\\%\\_off%' ESCAPE '\\'");
    expect(query).toContain('FROM vendor');
  });
});
