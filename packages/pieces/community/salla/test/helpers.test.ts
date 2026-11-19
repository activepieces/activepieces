import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { SallaOrderStatus, sallaUtils } from '../src/lib/common/helpers';

const originalTz = process.env['TZ'];

afterEach(() => {
  vi.restoreAllMocks();
  if (originalTz === undefined) {
    delete process.env['TZ'];
  } else {
    process.env['TZ'] = originalTz;
  }
});

describe('toIsoDate', () => {
  it('converts the Salla date object in Riyadh time to UTC', () => {
    expect(sallaUtils.toIsoDate({ date: '2022-06-26 12:21:45.000000', timezone_type: 3, timezone: 'Asia/Riyadh' })).toBe(
      '2022-06-26T09:21:45.000Z',
    );
  });

  it('crosses the day boundary when Riyadh time is just after midnight', () => {
    expect(sallaUtils.toIsoDate({ date: '2026-11-02 01:30:00.000000', timezone_type: 3, timezone: 'Asia/Riyadh' })).toBe(
      '2026-11-01T22:30:00.000Z',
    );
  });

  it('keeps milliseconds from the fraction', () => {
    expect(sallaUtils.toIsoDate({ date: '2022-06-26 12:21:45.123456', timezone: 'Asia/Riyadh' })).toBe('2022-06-26T09:21:45.123Z');
  });

  it('honours another timezone on the object and defaults to Riyadh when it is missing', () => {
    expect(sallaUtils.toIsoDate({ date: '2022-06-26 12:00:00.000000', timezone: 'UTC' })).toBe('2022-06-26T12:00:00.000Z');
    expect(sallaUtils.toIsoDate({ date: '2022-06-26 12:00:00.000000' })).toBe('2022-06-26T09:00:00.000Z');
  });

  it('treats plain date-time strings as Riyadh time', () => {
    expect(sallaUtils.toIsoDate('2022-05-26 09:45:09')).toBe('2022-05-26T06:45:09.000Z');
    expect(sallaUtils.toIsoDate('2022-05-26T09:45')).toBe('2022-05-26T06:45:00.000Z');
    expect(sallaUtils.toIsoDate('2022-05-26')).toBe('2022-05-25T21:00:00.000Z');
  });

  it('does not depend on the machine timezone', () => {
    process.env['TZ'] = 'America/New_York';
    expect(sallaUtils.toIsoDate('2022-05-26 09:45:09')).toBe('2022-05-26T06:45:09.000Z');
  });

  it('keeps ISO strings with Z or an offset', () => {
    expect(sallaUtils.toIsoDate('2024-01-15T10:30:00Z')).toBe('2024-01-15T10:30:00.000Z');
    expect(sallaUtils.toIsoDate('2024-01-15T10:30:00.5z')).toBe('2024-01-15T10:30:00.500Z');
    expect(sallaUtils.toIsoDate('2024-01-15T13:30:00+03:00')).toBe('2024-01-15T10:30:00.000Z');
    expect(sallaUtils.toIsoDate('2024-01-15T13:30:00+0300')).toBe('2024-01-15T10:30:00.000Z');
  });

  it('reads the webhook created_at string', () => {
    expect(sallaUtils.toIsoDate('Sun Jun 26 2022 12:21:48 GMT+0300')).toBe('2022-06-26T09:21:48.000Z');
  });

  it('returns undefined for invalid input', () => {
    expect(sallaUtils.toIsoDate('not a date')).toBeUndefined();
    expect(sallaUtils.toIsoDate('')).toBeUndefined();
    expect(sallaUtils.toIsoDate('   ')).toBeUndefined();
    expect(sallaUtils.toIsoDate(undefined)).toBeUndefined();
    expect(sallaUtils.toIsoDate(null)).toBeUndefined();
    expect(sallaUtils.toIsoDate(12345)).toBeUndefined();
    expect(sallaUtils.toIsoDate({ date: 'garbage', timezone: 'Asia/Riyadh' })).toBeUndefined();
    expect(sallaUtils.toIsoDate({ date: 20220626 })).toBeUndefined();
    expect(sallaUtils.toIsoDate({ date: '2022-06-26 12:00:00', timezone: 'Mars/Olympus' })).toBeUndefined();
    expect(sallaUtils.toIsoDate('2024-01-15T99:99:99Z')).toBeUndefined();
  });

  it('rejects impossible calendar dates instead of rolling them over', () => {
    expect(sallaUtils.toIsoDate('2022-13-45 10:00:00')).toBeUndefined();
  });
});

describe('toStoreDate', () => {
  it('keeps YYYY-MM-DD as is', () => {
    expect(sallaUtils.toStoreDate('2026-11-01')).toBe('2026-11-01');
    expect(sallaUtils.toStoreDate(' 2026-11-01 ')).toBe('2026-11-01');
  });

  it('puts an ISO instant just before midnight UTC on the next Riyadh day', () => {
    expect(sallaUtils.toStoreDate('2026-11-01T22:30:00.000Z')).toBe('2026-11-02');
    expect(sallaUtils.toStoreDate('2026-11-01T20:59:59Z')).toBe('2026-11-01');
    expect(sallaUtils.toStoreDate('2026-11-01T21:00:00Z')).toBe('2026-11-02');
  });

  it('puts an ISO instant just after midnight UTC on the same Riyadh day', () => {
    expect(sallaUtils.toStoreDate('2026-11-02T00:10:00Z')).toBe('2026-11-02');
  });

  it('does not depend on the machine timezone for ISO instants', () => {
    process.env['TZ'] = 'America/Los_Angeles';
    expect(sallaUtils.toStoreDate('2026-11-01T22:30:00Z')).toBe('2026-11-02');
  });

  it('reads a zone-less date-time as store time, not machine time', () => {
    process.env['TZ'] = 'UTC';
    expect(sallaUtils.toStoreDate('2026-11-01 23:30')).toBe('2026-11-01');
  });

  it('returns undefined for empty input and throws a readable error for garbage', () => {
    expect(sallaUtils.toStoreDate(undefined)).toBeUndefined();
    expect(sallaUtils.toStoreDate(null)).toBeUndefined();
    expect(sallaUtils.toStoreDate('  ')).toBeUndefined();
    expect(() => sallaUtils.toStoreDate('yesterday-ish')).toThrow('"yesterday-ish" is not a valid date. Use YYYY-MM-DD');
  });
});

describe('amountOf and normalizeDigits', () => {
  it('reads numbers, {amount} objects and strings', () => {
    expect(sallaUtils.amountOf(51.75)).toBe(51.75);
    expect(sallaUtils.amountOf({ amount: 51.75, currency: 'SAR' })).toBe(51.75);
    expect(sallaUtils.amountOf({ amount: '15.00', currency: 'SAR' })).toBe(15);
    expect(sallaUtils.amountOf('15.00')).toBe(15);
    expect(sallaUtils.amountOf(' 1,234.50 ')).toBe(1234.5);
    expect(sallaUtils.amountOf(0)).toBe(0);
  });

  it('reads Arabic-Indic and Persian digits', () => {
    expect(sallaUtils.normalizeDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(sallaUtils.normalizeDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(sallaUtils.amountOf('١٥٠')).toBe(150);
    expect(sallaUtils.amountOf({ amount: '١٢.٥' })).toBe(12.5);
  });

  it('reads the Arabic decimal and thousands separators', () => {
    expect(sallaUtils.amountOf('١٢٫٥')).toBe(12.5);
    expect(sallaUtils.amountOf('١٬٢٣٤٫٥٠')).toBe(1234.5);
  });

  it('returns undefined for things that are not amounts', () => {
    expect(sallaUtils.amountOf('')).toBeUndefined();
    expect(sallaUtils.amountOf('abc')).toBeUndefined();
    expect(sallaUtils.amountOf(Number.NaN)).toBeUndefined();
    expect(sallaUtils.amountOf(Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(sallaUtils.amountOf(null)).toBeUndefined();
    expect(sallaUtils.amountOf({ currency: 'SAR' })).toBeUndefined();
    expect(sallaUtils.amountOf([1])).toBeUndefined();
  });
});

describe('withOrderExtras', () => {
  const fullOrder = {
    id: 2116149737,
    reference_id: 41027662,
    date: { date: '2022-06-26 12:21:45.000000', timezone_type: 3, timezone: 'Asia/Riyadh' },
    updated_at: { date: '2022-06-27 00:30:00.000000', timezone_type: 3, timezone: 'Asia/Riyadh' },
    status: { id: 566146469, name: 'بإنتظار المراجعة', slug: 'under_review' },
    payment_method: 'bank',
    customer: { id: 1227534533, full_name: 'Ahmed Ali', email: 'ahmed@example.com', mobile: 557777777, mobile_code: '+966' },
    amounts: { total: { amount: 201, currency: 'SAR' } },
  };

  it('adds flat, table-ready fields and keeps every raw field', () => {
    expect(sallaUtils.withOrderExtras(fullOrder)).toEqual({
      ...fullOrder,
      status_name: 'بإنتظار المراجعة',
      status_slug: 'under_review',
      total_amount: 201,
      currency: 'SAR',
      customer_id: 1227534533,
      customer_name: 'Ahmed Ali',
      customer_email: 'ahmed@example.com',
      customer_mobile: '+966557777777',
      date_iso: '2022-06-26T09:21:45.000Z',
      updated_at_iso: '2022-06-26T21:30:00.000Z',
    });
  });

  it('uses null, not a missing key, for every flat field it cannot fill', () => {
    const result = sallaUtils.withOrderExtras({ id: 2 });
    expect(result).toEqual({
      id: 2,
      status_name: null,
      status_slug: null,
      total_amount: null,
      currency: null,
      payment_method: null,
      customer_id: null,
      customer_name: null,
      customer_email: null,
      customer_mobile: null,
      date_iso: null,
      updated_at_iso: null,
    });
  });

  it('gives null dates for unreadable date values, and keeps the raw value', () => {
    const result = sallaUtils.withOrderExtras({ id: 3, date: 'bad', updated_at: { date: 'nope' } });
    expect(result['date_iso']).toBeNull();
    expect(result['updated_at_iso']).toBeNull();
    expect(result['date']).toBe('bad');
  });

  it('reads the total from total or from amounts.total', () => {
    expect(sallaUtils.withOrderExtras({ id: 4, total: { amount: '99.5', currency: 'USD' }, amounts: { total: { amount: 1, currency: 'SAR' } } })).toMatchObject({
      total_amount: 99.5,
      currency: 'USD',
    });
    expect(sallaUtils.withOrderExtras({ id: 5, amounts: { total: { amount: 12, currency: 'SAR' } } })).toMatchObject({
      total_amount: 12,
      currency: 'SAR',
    });
    expect(sallaUtils.withOrderExtras({ id: 6, total: 40, currency: 'SAR' })).toMatchObject({ total_amount: 40, currency: 'SAR' });
  });

  it('builds the customer name from first and last name and leaves the mobile code off when missing', () => {
    expect(
      sallaUtils.withOrderExtras({ id: 7, customer: { id: 9, first_name: ' Sara ', last_name: 'Omar', mobile: '0551234567' } }),
    ).toMatchObject({ customer_id: 9, customer_name: 'Sara Omar', customer_mobile: '0551234567', customer_email: null });
    expect(sallaUtils.withOrderExtras({ id: 8, customer: { first_name: 'Sara' } })).toMatchObject({ customer_name: 'Sara' });
    expect(sallaUtils.withOrderExtras({ id: 9, customer: { first_name: '  ', mobile_code: '+966' } })).toMatchObject({
      customer_name: null,
      customer_mobile: null,
    });
  });

  it('lets raw order keys win on a name collision', () => {
    const result = sallaUtils.withOrderExtras({ id: 10, currency: 'KWD', total_amount: 'raw', amounts: { total: { amount: 5, currency: 'SAR' } } });
    expect(result['currency']).toBe('KWD');
    expect(result['total_amount']).toBe('raw');
  });

  it('returns an empty object for non-records', () => {
    expect(sallaUtils.withOrderExtras(undefined)).toEqual({});
    expect(sallaUtils.withOrderExtras([1])).toEqual({});
    expect(sallaUtils.withOrderExtras('x')).toEqual({});
  });
});

describe('small helpers', () => {
  it('triState maps yes/no/true/false and leaves the rest undefined', () => {
    expect(sallaUtils.triState('yes')).toBe(true);
    expect(sallaUtils.triState(true)).toBe(true);
    expect(sallaUtils.triState('no')).toBe(false);
    expect(sallaUtils.triState(false)).toBe(false);
    expect(sallaUtils.triState(undefined)).toBeUndefined();
    expect(sallaUtils.triState('')).toBeUndefined();
    expect(sallaUtils.triState('any')).toBeUndefined();
  });

  it('optionalNumber parses numbers and digits and rejects text', () => {
    expect(sallaUtils.optionalNumber({ value: undefined, label: 'X' })).toBeUndefined();
    expect(sallaUtils.optionalNumber({ value: null, label: 'X' })).toBeUndefined();
    expect(sallaUtils.optionalNumber({ value: '', label: 'X' })).toBeUndefined();
    expect(sallaUtils.optionalNumber({ value: 0, label: 'X' })).toBe(0);
    expect(sallaUtils.optionalNumber({ value: ' 24.7136 ', label: 'X' })).toBe(24.7136);
    expect(sallaUtils.optionalNumber({ value: '١٢', label: 'X' })).toBe(12);
    expect(() => sallaUtils.optionalNumber({ value: 'abc', label: 'Branch ID' })).toThrow('Branch ID must be a number, but got "abc".');
  });

  it('optionalNumber treats a blank string as not set, not 0', () => {
    expect(sallaUtils.optionalNumber({ value: '   ', label: 'Latitude' })).toBeUndefined();
  });

  it('requireId accepts numeric IDs and Arabic digits and rejects the rest', () => {
    expect(sallaUtils.requireId({ value: 2116149737, label: 'Order ID' })).toBe('2116149737');
    expect(sallaUtils.requireId({ value: ' 2116149737 ', label: 'Order ID' })).toBe('2116149737');
    expect(sallaUtils.requireId({ value: '٢١١٦', label: 'Order ID' })).toBe('2116');
    expect(() => sallaUtils.requireId({ value: 'ABC-1', label: 'Order ID' })).toThrow(
      'Order ID must be a numeric Salla ID, for example 2116149737. Got "ABC-1".',
    );
    expect(() => sallaUtils.requireId({ value: undefined, label: 'Order ID' })).toThrow('Got "".');
    expect(() => sallaUtils.requireId({ value: -5, label: 'Order ID' })).toThrow();
    expect(() => sallaUtils.requireId({ value: 1.5, label: 'Order ID' })).toThrow();
    expect(() => sallaUtils.requireId({ value: '', label: 'Order ID' })).toThrow();
  });

  it('compact drops empty values and empty nested objects but keeps 0 and false', () => {
    expect(
      sallaUtils.compact({
        a: undefined,
        b: null,
        c: '',
        d: [],
        e: {},
        f: { g: undefined, h: { i: '' } },
        zero: 0,
        no: false,
        list: [1],
        nested: { keep: 'x', drop: '' },
      }),
    ).toEqual({ zero: 0, no: false, list: [1], nested: { keep: 'x' } });
  });

  it('toStringList reads arrays, comma strings and numbers', () => {
    expect(sallaUtils.toStringList([' a ', 2, '', null, 'b'])).toEqual(['a', '2', 'b']);
    expect(sallaUtils.toStringList('a, b,,c ')).toEqual(['a', 'b', 'c']);
    expect(sallaUtils.toStringList(5)).toEqual(['5']);
    expect(sallaUtils.toStringList(undefined)).toEqual([]);
    expect(sallaUtils.toStringList({})).toEqual([]);
  });
});

describe('isCancelStatus', () => {
  const statuses: SallaOrderStatus[] = [
    { id: '100', name: 'Canceled', slug: 'canceled', type: 'original', isActive: true },
    { id: '200', name: 'Changed mind', slug: 'in_progress', type: 'custom', isActive: true, parentId: '100' },
    { id: '300', name: 'Out of stock', type: 'custom', isActive: true, originalId: '100' },
    { id: '400', name: 'Shipped', slug: 'shipped', type: 'original', isActive: true },
    { id: '500', name: 'Packed', type: 'custom', isActive: true, parentId: '400' },
  ];

  it('matches the canceled slug in both spellings and any case', () => {
    expect(sallaUtils.isCancelStatus({ value: 'canceled', statuses: [] })).toBe(true);
    expect(sallaUtils.isCancelStatus({ value: ' Cancelled ', statuses: [] })).toBe(true);
    expect(sallaUtils.isCancelStatus({ value: 'shipped', statuses: [] })).toBe(false);
  });

  it('matches the canceled status by ID and custom statuses linked to it', () => {
    expect(sallaUtils.isCancelStatus({ value: 100, statuses })).toBe(true);
    expect(sallaUtils.isCancelStatus({ value: '200', statuses })).toBe(true);
    expect(sallaUtils.isCancelStatus({ value: '300', statuses })).toBe(true);
    expect(sallaUtils.isCancelStatus({ value: '١٠٠', statuses })).toBe(true);
  });

  it('does not match other statuses or unknown IDs', () => {
    expect(sallaUtils.isCancelStatus({ value: '400', statuses })).toBe(false);
    expect(sallaUtils.isCancelStatus({ value: '500', statuses })).toBe(false);
    expect(sallaUtils.isCancelStatus({ value: '999', statuses })).toBe(false);
    expect(sallaUtils.isCancelStatus({ value: '100', statuses: [] })).toBe(false);
  });

  describe('with live Salla status rows that carry their own ID and an original ID', () => {
    const liveStatuses: SallaOrderStatus[] = [
      { id: '1591241134', name: 'Canceled', slug: 'canceled', type: 'custom', isActive: true, originalId: '525144736' },
      { id: '857090988', name: 'Under review', slug: 'under_review', type: 'custom', isActive: true, originalId: '566146469' },
    ];

    it('blocks the row ID of the canceled status', () => {
      expect(sallaUtils.isCancelStatus({ value: '1591241134', statuses: liveStatuses })).toBe(true);
    });

    it('blocks the original ID of the canceled status', () => {
      expect(sallaUtils.isCancelStatus({ value: '525144736', statuses: liveStatuses })).toBe(true);
      expect(sallaUtils.isCancelStatus({ value: 525144736, statuses: liveStatuses })).toBe(true);
    });

    it('does not block the original ID of a status that is not a cancel', () => {
      expect(sallaUtils.isCancelStatus({ value: '566146469', statuses: liveStatuses })).toBe(false);
      expect(sallaUtils.isCancelStatus({ value: '857090988', statuses: liveStatuses })).toBe(false);
    });
  });
});

describe('resolveStatusTarget', () => {
  const statuses: SallaOrderStatus[] = [
    { id: '566146469', name: 'Under review', slug: 'under_review', type: 'original', isActive: true },
    { id: '986688842', name: 'Waiting on supplier', slug: 'in_progress', type: 'custom', isActive: true },
    { id: '111', name: 'Odd original', type: 'original', isActive: true },
  ];

  it('sends the slug for a built-in status picked by ID', () => {
    expect(sallaUtils.resolveStatusTarget({ value: '566146469', statuses })).toEqual({ slug: 'under_review' });
    expect(sallaUtils.resolveStatusTarget({ value: 566146469, statuses })).toEqual({ slug: 'under_review' });
  });

  it('sends status_id for a custom status, an unknown ID or an original without slug', () => {
    expect(sallaUtils.resolveStatusTarget({ value: '986688842', statuses })).toEqual({ status_id: 986688842 });
    expect(sallaUtils.resolveStatusTarget({ value: '42', statuses })).toEqual({ status_id: 42 });
    expect(sallaUtils.resolveStatusTarget({ value: '111', statuses })).toEqual({ status_id: 111 });
    expect(sallaUtils.resolveStatusTarget({ value: '٤٢', statuses: [] })).toEqual({ status_id: 42 });
  });

  it('maps cancelled to canceled and accepts slugs in any case', () => {
    expect(sallaUtils.resolveStatusTarget({ value: 'cancelled', statuses: [] })).toEqual({ slug: 'canceled' });
    expect(sallaUtils.resolveStatusTarget({ value: 'Cancelled', statuses: [] })).toEqual({ slug: 'canceled' });
    expect(sallaUtils.resolveStatusTarget({ value: 'canceled', statuses: [] })).toEqual({ slug: 'canceled' });
    expect(sallaUtils.resolveStatusTarget({ value: ' Completed ', statuses: [] })).toEqual({ slug: 'completed' });
  });

  it('throws for an unknown slug and for an empty value', () => {
    expect(() => sallaUtils.resolveStatusTarget({ value: 'shipping', statuses: [] })).toThrow(
      '"shipping" is not a Salla order status. Use a status ID from List Order Statuses, or one of: payment_pending,',
    );
    expect(() => sallaUtils.resolveStatusTarget({ value: '  ', statuses: [] })).toThrow('Pick the new order status.');
  });
});

describe('listOrderStatuses', () => {
  it('reads statuses and skips entries without an ID', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: {
        data: [
          { id: 1, name: 'Completed', slug: 'completed', type: 'original', is_active: true },
          { id: 2, name: 'Sub', type: 'custom', is_active: false, parent: { name: 'Completed' } },
          { name: 'no id' },
          'junk',
        ],
      },
    });
    const statuses = await sallaUtils.listOrderStatuses({ auth: { access_token: 't' } });
    expect(spy.mock.calls[0][0].url).toBe('https://api.salla.dev/admin/v2/orders/statuses');
    expect(statuses).toEqual([
      { id: '1', name: 'Completed', slug: 'completed', type: 'original', isActive: true, parentName: undefined },
      { id: '2', name: 'Sub', slug: undefined, type: 'custom', isActive: false, parentName: 'Completed' },
    ]);
  });
});

describe('list props that arrive as JSON strings', () => {
  it('toStringList parses a JSON array string instead of splitting it on commas', () => {
    expect(sallaUtils.toStringList('["1939592358", 566146469]')).toEqual(['1939592358', '566146469']);
    expect(sallaUtils.toStringList('mada, cod')).toEqual(['mada', 'cod']);
    expect(sallaUtils.toStringList('[not json')).toEqual(['[not json']);
  });

  it('toRecordList accepts arrays and JSON array strings, and rejects other values', () => {
    expect(sallaUtils.toRecordList({ value: '[{"identifier":"A","quantity":1}]', label: 'Products' })).toEqual([{ identifier: 'A', quantity: 1 }]);
    expect(sallaUtils.toRecordList({ value: [{ identifier: 'B' }], label: 'Products' })).toEqual([{ identifier: 'B' }]);
    expect(sallaUtils.toRecordList({ value: undefined, label: 'Products' })).toEqual([]);
    expect(() => sallaUtils.toRecordList({ value: 'SKU-1', label: 'Products' })).toThrow('Products must be a list');
  });

  it('withKeys fills missing schema keys with null and keeps every raw key', () => {
    expect(sallaUtils.withKeys({ record: { id: 1, extra: 'x' }, keys: ['id', 'name'] })).toEqual({ id: 1, name: null, extra: 'x' });
    expect(sallaUtils.withKeys({ record: undefined, keys: ['id'] })).toEqual({ id: null });
  });
});
