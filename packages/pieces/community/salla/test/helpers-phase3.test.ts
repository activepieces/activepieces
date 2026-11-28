import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sallaUtils } from '../src/lib/common/helpers';
import { sallaMarketing } from '../src/lib/common/marketing';

describe('wallClockFromDateTimeProp', () => {
  it('returns the date only for a UTC midnight value', () => {
    expect(sallaUtils.wallClockFromDateTimeProp('2026-12-31T00:00:00.000Z')).toBe('2026-12-31');
    expect(sallaUtils.wallClockFromDateTimeProp(' 2026-12-31T00:00Z ')).toBe('2026-12-31');
  });

  it('keeps the UTC wall-clock time instead of converting the instant', () => {
    expect(sallaUtils.wallClockFromDateTimeProp('2026-12-31T22:00:00.000Z')).toBe('2026-12-31 22:00:00');
    expect(sallaUtils.wallClockFromDateTimeProp('2026-12-31T08:30:15Z')).toBe('2026-12-31 08:30:15');
  });

  it('passes other strings through trimmed', () => {
    expect(sallaUtils.wallClockFromDateTimeProp('2026-12-31')).toBe('2026-12-31');
    expect(sallaUtils.wallClockFromDateTimeProp(' 2026-12-31 10:00 ')).toBe('2026-12-31 10:00');
    expect(sallaUtils.wallClockFromDateTimeProp('2026-12-31T22:00:00+03:00')).toBe('2026-12-31T22:00:00+03:00');
  });

  it('returns undefined for empty values', () => {
    for (const value of [undefined, null, '', '   ', 5]) {
      expect(sallaUtils.wallClockFromDateTimeProp(value)).toBeUndefined();
    }
  });
});

describe('coupon dates from DateTime props', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.UTC(2026, 10, 11, 9, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends what the user typed as store time', () => {
    const body = sallaMarketing.buildCreateCouponBody({
      code: 'SUMMER10',
      type: 'fixed',
      amount: 10,
      expiryDate: sallaUtils.wallClockFromDateTimeProp('2026-12-31T22:00:00.000Z') ?? '',
      startDate: sallaUtils.wallClockFromDateTimeProp('2026-12-01T00:00:00.000Z'),
    });
    expect(body['expiry_date']).toBe('2026-12-31 22:00:00');
    expect(body['start_date']).toBe('2026-12-01');
  });
});
