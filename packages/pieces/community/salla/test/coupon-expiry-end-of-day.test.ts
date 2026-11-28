import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sallaMarketing } from '../src/lib/common/marketing';

function couponBody({ expiryDate, startDate }: { expiryDate: string; startDate?: string }): Record<string, unknown> {
  return sallaMarketing.buildCreateCouponBody({ code: 'SUMMER10', type: 'fixed', amount: 10, expiryDate, startDate });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-12T09:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('coupon expiry at the end of the day', () => {
  it('sends 23:59:59 when the expiry has no time', () => {
    expect(couponBody({ expiryDate: '2026-12-31' })['expiry_date']).toBe('2026-12-31 23:59:59');
    expect(couponBody({ expiryDate: '2026-11-13' })['expiry_date']).toBe('2026-11-13 23:59:59');
  });

  it('keeps an explicit time', () => {
    expect(couponBody({ expiryDate: '2026-12-31 18:30' })['expiry_date']).toBe('2026-12-31 18:30:00');
    expect(couponBody({ expiryDate: '2026-12-31T00:00:00' })['expiry_date']).toBe('2026-12-31 00:00:00');
  });

  it('still checks the expiry against tomorrow and the start date by day', () => {
    expect(() => couponBody({ expiryDate: '2026-11-12' })).toThrow('so use 2026-11-13 or later; you gave 2026-11-12.');
    expect(() => couponBody({ expiryDate: '2026-12-31', startDate: '2026-12-31' })).toThrow('The start date (2026-12-31) must be before the expiry date (2026-12-31).');
  });
});
