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

  it('buildLineItems throws when a line resolves without its required Item ID', () => {
    expect(() =>
      netsuiteRecords.buildLineItems([{ itemId: '5' }, { itemId: '' }])
    ).toThrow('Line 2 is missing Item ID.');
  });

  it('buildLineItems returns undefined instead of a truthy empty wrapper when every entry is malformed', () => {
    expect(netsuiteRecords.buildLineItems([null, undefined, 42])).toBeUndefined();
  });

  it('buildLineItems maps department/class/location per line', () => {
    expect(
      netsuiteRecords.buildLineItems([
        { itemId: '5', departmentId: '1', classId: '2', locationId: '3' },
      ])
    ).toEqual({
      items: [
        {
          item: { id: '5' },
          department: { id: '1' },
          class: { id: '2' },
          location: { id: '3' },
        },
      ],
    });
  });

  it('buildExpenseLines throws when a line resolves without its required Account ID', () => {
    expect(() =>
      netsuiteRecords.buildExpenseLines([{ amount: 10 }])
    ).toThrow('Line 1 is missing Account ID.');
  });

  it('buildExpenseLines returns undefined instead of a truthy empty wrapper when every entry is malformed', () => {
    expect(netsuiteRecords.buildExpenseLines([null, 'x'])).toBeUndefined();
  });

  it('buildPaymentApplications sets apply flag, doc ref, and defaults line to 0', () => {
    expect(
      netsuiteRecords.buildPaymentApplications([{ invoiceId: '9', amount: 100 }])
    ).toEqual({ items: [{ apply: true, doc: { id: '9' }, amount: 100, line: 0 }] });
  });

  it('buildPaymentApplications respects an explicit line index', () => {
    expect(
      netsuiteRecords.buildPaymentApplications([{ invoiceId: '9', amount: 100, line: 2 }])
    ).toEqual({ items: [{ apply: true, doc: { id: '9' }, amount: 100, line: 2 }] });
  });

  it('buildPaymentApplications throws when an application resolves without its required Invoice ID', () => {
    expect(() =>
      netsuiteRecords.buildPaymentApplications([{ amount: 100 }])
    ).toThrow('Application 1 is missing Invoice ID.');
  });

  it('buildPaymentApplications returns undefined instead of a truthy empty wrapper when every entry is malformed', () => {
    expect(netsuiteRecords.buildPaymentApplications([null])).toBeUndefined();
  });

  it('buildClassificationRefs compacts department/class/location', () => {
    expect(
      netsuiteRecords.buildClassificationRefs({ departmentId: '1', classId: '', locationId: undefined })
    ).toEqual({ department: { id: '1' } });
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

  it('buildEntitySearchQuery filters by externalId', () => {
    const query = netsuiteRecords.buildEntitySearchQuery({
      table: 'customer',
      externalId: "ext'1",
    });
    expect(query).toContain("externalId = 'ext''1'");
    expect(query).toContain('FROM customer');
  });
});
