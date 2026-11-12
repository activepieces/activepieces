import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateCouponInput, sallaMarketing } from '../src/lib/common/marketing';

function raw<T>(value: unknown): T {
  if (acceptsAnything<T>(value)) {
    return value;
  }
  throw new Error('unreachable');
}

function acceptsAnything<T>(value: unknown): value is T {
  return value !== undefined || value === undefined;
}

function baseCoupon(overrides: Partial<CreateCouponInput> = {}): CreateCouponInput {
  return { code: ' SUMMER10 ', type: 'percentage', amount: '10', expiryDate: '2026-12-31', maximumAmount: 50, ...overrides };
}

function coupon(overrides: Partial<CreateCouponInput> = {}): Record<string, unknown> {
  return sallaMarketing.buildCreateCouponBody(baseCoupon(overrides));
}

const required = {
  code: 'SUMMER10',
  type: 'percentage',
  amount: 10,
  free_shipping: false,
  expiry_date: '2026-12-31',
  exclude_sale_products: false,
  maximum_amount: 50,
};

const noonInRiyadh = Date.UTC(2026, 10, 11, 9, 0, 0);

describe('buildCreateCouponBody', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(noonInRiyadh);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('always sends the required fields, with free_shipping and exclude_sale_products false by default', () => {
    expect(coupon()).toEqual(required);
    expect(coupon({ freeShipping: 'unchanged', excludeSaleProducts: undefined })).toEqual(required);
    expect(coupon({ freeShipping: null, excludeSaleProducts: 'no' })).toEqual(required);
  });

  it('normalises the coupon type', () => {
    for (const [type, expected] of [
      ['P', 'percentage'],
      ['p', 'percentage'],
      ['Percentage', 'percentage'],
      [' percent ', 'percentage'],
      ['F', 'fixed'],
      ['f', 'fixed'],
      ['Fixed', 'fixed'],
    ]) {
      expect(coupon({ type })['type']).toBe(expected);
    }
    expect(() => coupon({ type: 'bogus' })).toThrow('"bogus" is not a coupon type. Use percentage or fixed.');
    expect(() => coupon({ type: '' })).toThrow('"" is not a coupon type');
    expect(() => coupon({ type: raw<string>(undefined) })).toThrow('"" is not a coupon type');
  });

  it('requires an amount above 0, and at most 100 for a percentage', () => {
    expect(coupon({ amount: 100 })['amount']).toBe(100);
    expect(coupon({ amount: '٢٥' })['amount']).toBe(25);
    expect(coupon({ type: 'fixed', amount: 150 })['amount']).toBe(150);
    expect(coupon({ amount: 0.5 })['amount']).toBe(0.5);
    for (const amount of [0, -5, '', ' ']) {
      expect(() => coupon({ amount })).toThrow('Give the discount amount, a number greater than 0');
    }
    expect(() => coupon({ amount: 'ten' })).toThrow('Discount amount must be a number, but got "ten".');
    expect(() => coupon({ amount: 100.5 })).toThrow('A percentage coupon cannot take more than 100%; you gave 100.5.');
  });

  it('requires a maximum discount for percentage coupons only', () => {
    for (const maximumAmount of [undefined, '', ' ']) {
      expect(() => coupon({ maximumAmount })).toThrow(
        'Salla needs a maximum discount amount for percentage coupons. Fill Maximum Discount, for example 50.',
      );
      expect(coupon({ type: 'fixed', maximumAmount })).not.toHaveProperty('maximum_amount');
    }
    expect(coupon({ maximumAmount: '٧٥' })['maximum_amount']).toBe(75);
  });

  it('requires a code without spaces', () => {
    expect(() => coupon({ code: ' ' })).toThrow('Give the coupon code customers type at checkout');
    expect(() => coupon({ code: 'SUMMER 10' })).toThrow('The coupon code "SUMMER 10" has spaces.');
  });

  it('requires a valid expiry date at least one day after today in Riyadh', () => {
    expect(() => coupon({ expiryDate: '' })).toThrow('Give the coupon expiry date, for example 2026-12-31.');
    expect(() => coupon({ expiryDate: '2026-02-30' })).toThrow('Expiry date "2026-02-30" is not a valid date.');
    expect(() => coupon({ expiryDate: '2026-11-11' })).toThrow('Today is 2026-11-11, so use 2026-11-12 or later; you gave 2026-11-11.');
    expect(coupon({ expiryDate: '2026-11-12' })['expiry_date']).toBe('2026-11-12');
    expect(coupon({ expiryDate: '2026-12-31T23:59' })['expiry_date']).toBe('2026-12-31 23:59:00');
  });

  it('requires the start date before the expiry date', () => {
    expect(coupon({ startDate: '2026-12-01 08:00' })['start_date']).toBe('2026-12-01 08:00:00');
    expect(coupon({ startDate: '2026-12-30T23:00:00' })['start_date']).toBe('2026-12-30 23:00:00');
    expect(() => coupon({ startDate: '2026-12-31' })).toThrow('The start date (2026-12-31) must be before the expiry date (2026-12-31).');
    expect(() => coupon({ startDate: '2027-01-01' })).toThrow('must be before the expiry date');
    expect(() => coupon({ startDate: 'soon' })).toThrow('Start date "soon" is not a valid date.');
  });

  it('maps the tri-states: unchanged omits, yes and no become booleans', () => {
    expect(coupon({ applyWithOffer: 'unchanged', showMaximumAmount: undefined })).toEqual(required);
    expect(coupon({ freeShipping: 'yes', excludeSaleProducts: true, applyWithOffer: 'no', showMaximumAmount: 'yes' })).toEqual({
      ...required,
      free_shipping: true,
      exclude_sale_products: true,
      is_apply_with_offer: false,
      show_maximum_amount: true,
    });
  });

  it('dedupes ID lists and drops empty ones', () => {
    const body = coupon({
      includeProductIds: [1, '1', ' 2 '],
      excludeProductIds: '3, 3, 4',
      includeCategoryIds: '[5,"6"]',
      excludeCategoryIds: [],
      excludeBrandIds: '',
      includeCustomerGroupIds: [7],
      excludeCustomerGroupIds: '8',
      excludeShippingCompanyIds: ['٩'],
    });
    expect(body).toEqual({
      ...required,
      products_include: ['1', '2'],
      products_exclude: ['3', '4'],
      list_include_categories: ['5', '6'],
      list_include_groups: ['7'],
      list_exclude_groups: ['8'],
      list_exclude_shipping: ['9'],
    });
    expect(() => coupon({ includeProductIds: ['TS-1'] })).toThrow('Included product ID must be a numeric Salla ID');
    expect(() => coupon({ excludeBrandIds: 'nike' })).toThrow('Excluded brand ID must be a numeric Salla ID');
  });

  it('lowercases payment methods and drops an empty list', () => {
    expect(coupon({ paymentMethods: ['MADA', ' Apple_Pay '] })['payment_methods']).toEqual(['mada', 'apple_pay']);
    expect(coupon({ paymentMethods: 'COD, bank' })['payment_methods']).toEqual(['cod', 'bank']);
    expect(coupon({ paymentMethods: [] })).not.toHaveProperty('payment_methods');
  });

  it('sends the optional settings, validated', () => {
    expect(
      coupon({
        status: ' Active ',
        appliedIn: 'WEB',
        minimumAmount: '50',
        maximumAmount: 0,
        usageLimit: '٥',
        usageLimitPerUser: 1,
        beneficiaryDomain: ' example.com ',
      }),
    ).toEqual({
      ...required,
      status: 'active',
      applied_in: 'web',
      minimum_amount: 50,
      maximum_amount: 0,
      usage_limit: 5,
      usage_limit_per_user: 1,
      beneficiary_domain: 'example.com',
    });
    expect(coupon({ status: '', appliedIn: ' ', beneficiaryDomain: ' ' })).toEqual(required);
    expect(() => coupon({ status: 'paused' })).toThrow('"paused" is not a coupon status. Use active or inactive.');
    expect(() => coupon({ appliedIn: 'store' })).toThrow('"store" is not a valid channel. Use all, web or app.');
    expect(() => coupon({ minimumAmount: -1 })).toThrow('Minimum purchase amount cannot be negative.');
    expect(() => coupon({ maximumAmount: 'lots' })).toThrow('Maximum discount amount must be a number');
    expect(() => coupon({ usageLimit: 1.5 })).toThrow('Usage limit must be a whole number, but got "1.5".');
    expect(() => coupon({ usageLimitPerUser: -2 })).toThrow('Usage limit per customer cannot be negative.');
  });
});

describe('checkExpiryDate', () => {
  const midday = Date.UTC(2026, 10, 11, 12, 0, 0);
  const justBeforeRiyadhMidnight = Date.UTC(2026, 10, 11, 20, 59, 59);
  const justAfterRiyadhMidnight = Date.UTC(2026, 10, 11, 21, 0, 0);

  it('rejects today and earlier, accepts tomorrow', () => {
    expect(() => sallaMarketing.checkExpiryDate({ value: '2026-11-11', now: midday })).toThrow(
      'The coupon expiry date must be at least one day after today in store time (Asia/Riyadh). Today is 2026-11-11, so use 2026-11-12 or later; you gave 2026-11-11.',
    );
    expect(() => sallaMarketing.checkExpiryDate({ value: '2026-11-10', now: midday })).toThrow('Today is 2026-11-11');
    expect(() => sallaMarketing.checkExpiryDate({ value: '2026-11-12', now: midday })).not.toThrow();
    expect(() => sallaMarketing.checkExpiryDate({ value: '2026-11-12 00:00:00', now: new Date(midday) })).not.toThrow();
  });

  it('uses the Riyadh date just before Riyadh midnight', () => {
    expect(() => sallaMarketing.checkExpiryDate({ value: '2026-11-12', now: justBeforeRiyadhMidnight })).not.toThrow();
    expect(() => sallaMarketing.checkExpiryDate({ value: '2026-11-11', now: justBeforeRiyadhMidnight })).toThrow('Today is 2026-11-11');
  });

  it('moves to the next day once Riyadh passes midnight, even though UTC has not', () => {
    expect(() => sallaMarketing.checkExpiryDate({ value: '2026-11-12', now: justAfterRiyadhMidnight })).toThrow(
      'Today is 2026-11-12, so use 2026-11-13 or later',
    );
    expect(() => sallaMarketing.checkExpiryDate({ value: '2026-11-13', now: justAfterRiyadhMidnight })).not.toThrow();
  });

  it('rolls over months and years', () => {
    const newYearInRiyadh = Date.UTC(2026, 11, 31, 21, 30, 0);
    expect(() => sallaMarketing.checkExpiryDate({ value: '2027-01-01', now: newYearInRiyadh })).toThrow('Today is 2027-01-01, so use 2027-01-02 or later');
    expect(() => sallaMarketing.checkExpiryDate({ value: '2027-01-02', now: newYearInRiyadh })).not.toThrow();
    const endOfFebruary = Date.UTC(2028, 1, 29, 6, 0, 0);
    expect(() => sallaMarketing.checkExpiryDate({ value: '2028-02-29', now: endOfFebruary })).toThrow('so use 2028-03-01 or later');
  });
});

describe('toCouponDate', () => {
  const label = 'Expiry date';

  it('returns undefined for an empty value', () => {
    for (const value of [undefined, null, '', '   ']) {
      expect(sallaMarketing.toCouponDate({ value, label })).toBeUndefined();
    }
  });

  it('keeps a plain date and fills the seconds of a local date-time', () => {
    expect(sallaMarketing.toCouponDate({ value: ' 2026-12-31 ', label })).toBe('2026-12-31');
    expect(sallaMarketing.toCouponDate({ value: '2026-12-31T10:30', label })).toBe('2026-12-31 10:30:00');
    expect(sallaMarketing.toCouponDate({ value: '2026-12-31 10:30:15.123', label })).toBe('2026-12-31 10:30:15');
    expect(sallaMarketing.toCouponDate({ value: '2028-02-29', label })).toBe('2028-02-29');
    expect(sallaMarketing.toCouponDate({ value: '٢٠٢٦-١٢-٣١', label })).toBe('2026-12-31');
  });

  it('converts an instant with a zone to Riyadh time', () => {
    expect(sallaMarketing.toCouponDate({ value: '2026-12-31T21:30:00Z', label })).toBe('2027-01-01 00:30:00');
    expect(sallaMarketing.toCouponDate({ value: '2026-12-31T10:00:00+03:00', label })).toBe('2026-12-31 10:00:00');
  });

  it('rejects impossible dates, times and non-strings', () => {
    for (const value of ['2026-02-29', '2026-13-01', '2026-12-31 24:00', '2026-12-31 10:60', 'garbage']) {
      expect(() => sallaMarketing.toCouponDate({ value, label })).toThrow(`${label} "${value}" is not a valid date.`);
    }
    expect(() => sallaMarketing.toCouponDate({ value: 1767225600000, label })).toThrow('is not a valid date');
  });
});

describe('buildCouponListQuery', () => {
  it('sends only the keyword without dates', () => {
    expect(sallaMarketing.buildCouponListQuery({ maxResults: 10, keyword: ' SUMMER ' })).toEqual({ keyword: 'SUMMER' });
    expect(sallaMarketing.buildCouponListQuery({ maxResults: 10 })).toEqual({ keyword: undefined });
  });

  it('builds "from,to" entries for creation and expiration dates', () => {
    expect(
      sallaMarketing.buildCouponListQuery({
        maxResults: 10,
        createdFrom: '2026-01-01',
        createdTo: '2026-01-31 23:00',
        expiresFrom: '2026-12-01',
        expiresTo: '2026-12-31',
      }),
    ).toEqual({
      keyword: undefined,
      creation_date: ['2026-01-01,2026-01-31'],
      expiration_date: ['2026-12-01,2026-12-31'],
    });
  });

  it('fills an open end with the default bounds', () => {
    expect(sallaMarketing.buildCouponListQuery({ maxResults: 10, createdFrom: '2026-01-01' })['creation_date']).toEqual(['2026-01-01,2099-12-31']);
    expect(sallaMarketing.buildCouponListQuery({ maxResults: 10, expiresTo: '2026-12-31' })['expiration_date']).toEqual(['2000-01-01,2026-12-31']);
  });

  it('rejects a reversed range and a bad date', () => {
    expect(() => sallaMarketing.buildCouponListQuery({ maxResults: 10, createdFrom: '2026-02-01', createdTo: '2026-01-01' })).toThrow(
      'The date range starts (2026-02-01) after it ends (2026-01-01).',
    );
    expect(() => sallaMarketing.buildCouponListQuery({ maxResults: 10, expiresFrom: 'later' })).toThrow('"later" is not a valid date');
  });
});

describe('buildAbandonedCartListQuery', () => {
  it('sends keyword with Western digits and a whole-minute offset', () => {
    expect(sallaMarketing.buildAbandonedCartListQuery({ maxResults: 10, keyword: ' ٠٥٠١٢٣ ', olderThanMinutes: '30' })).toEqual({
      keyword: '050123',
      offset: 30,
    });
    expect(sallaMarketing.buildAbandonedCartListQuery({ maxResults: 10, olderThanMinutes: 0 })).toEqual({ keyword: undefined, offset: 0 });
    expect(sallaMarketing.buildAbandonedCartListQuery({ maxResults: 10, olderThanMinutes: '' })).toEqual({ keyword: undefined, offset: undefined });
  });

  it('rejects a negative, fractional or non-numeric offset', () => {
    expect(() => sallaMarketing.buildAbandonedCartListQuery({ maxResults: 10, olderThanMinutes: -1 })).toThrow(
      'Offset (minutes) must be a whole number of minutes, 0 or more; you gave -1.',
    );
    expect(() => sallaMarketing.buildAbandonedCartListQuery({ maxResults: 10, olderThanMinutes: '1.5' })).toThrow('you gave 1.5.');
    expect(() => sallaMarketing.buildAbandonedCartListQuery({ maxResults: 10, olderThanMinutes: 'an hour' })).toThrow(
      'Offset (minutes) must be a number, but got "an hour".',
    );
  });
});

describe('withCouponExtras', () => {
  it('adds flat keys and keeps the raw ones', () => {
    const source = {
      id: 1622617640,
      code: 'SUMMER10',
      type: 'P',
      amount: { amount: 10, currency: 'SAR' },
      minimum_amount: { amount: '100', currency: 'SAR' },
      maximum_amount: 50,
      start_date: '2026-12-01 00:00:00',
      expiry_date: { date: '2026-12-31 23:59:59.000000', timezone: 'Asia/Riyadh' },
      created_at: '2026-11-11T09:00:00Z',
      group_coupons: [{ code: 'G-1' }, 'G-2', { code: '' }, 3],
      statistics: { num_of_usage: '12', num_of_customers: 9, coupon_sales: { amount: 4500.5, currency: 'SAR' } },
    };
    expect(sallaMarketing.withCouponExtras(source)).toEqual({
      type_normalized: 'percentage',
      amount_value: 10,
      minimum_amount_value: 100,
      maximum_amount_value: 50,
      currency: 'SAR',
      start_date_iso: '2026-11-30T21:00:00.000Z',
      expiry_date_iso: '2026-12-31T20:59:59.000Z',
      created_at_iso: '2026-11-11T09:00:00.000Z',
      updated_at_iso: null,
      usage_count: 12,
      customer_count: 9,
      sales_amount: 4500.5,
      group_codes: 'G-1, G-2',
      ...source,
    });
  });

  it('nulls the stats without statistics and handles odd input', () => {
    expect(sallaMarketing.withCouponExtras({ id: 1, type: 'unknown', currency: 'USD', amount: 5 })).toMatchObject({
      type_normalized: null,
      amount_value: 5,
      currency: 'USD',
      usage_count: null,
      customer_count: null,
      sales_amount: null,
      group_codes: null,
    });
    expect(sallaMarketing.withCouponExtras(null)).toEqual({});
    expect(sallaMarketing.withCouponExtras('coupon')).toEqual({});
  });
});

describe('withCartExtras', () => {
  it('adds flat keys to a full cart', () => {
    const cart = {
      id: 1097962121,
      total: { amount: 200, currency: 'SAR' },
      subtotal: { amount: 180, currency: 'SAR' },
      total_discount: { amount: 20, currency: 'SAR' },
      age_in_minutes: 45,
      customer: { id: 7, name: 'Ali Saleh', mobile: 966501234567, email: 'ali@example.com', city: 'Riyadh', country: 'Saudi Arabia' },
      coupon: { id: 9, code: 'SUMMER10' },
      urls: { checkout: 'https://store.example/checkout/abc' },
      items: [{ product_id: 1, quantity: 2 }, { product_id: '2', quantity: '3' }, { quantity: 1 }, 'junk'],
      created_at: { date: '2026-11-11 10:00:00.000000', timezone: 'Asia/Riyadh' },
    };
    expect(sallaMarketing.withCartExtras(cart)).toEqual({
      total_amount: 200,
      subtotal_amount: 180,
      total_discount_amount: 20,
      currency: 'SAR',
      checkout_url: 'https://store.example/checkout/abc',
      customer_id: 7,
      customer_name: 'Ali Saleh',
      customer_mobile: '966501234567',
      customer_email: 'ali@example.com',
      customer_city: 'Riyadh',
      customer_country: 'Saudi Arabia',
      coupon_id: 9,
      coupon_code: 'SUMMER10',
      item_count: 3,
      item_quantity: 6,
      product_ids: [1, 2],
      created_at_iso: '2026-11-11T07:00:00.000Z',
      updated_at_iso: null,
      ...cart,
    });
  });

  it('prefers checkout_url and full_name fallbacks', () => {
    expect(sallaMarketing.withCartExtras({ checkout_url: 'https://a', urls: { checkout: 'https://b' } })['checkout_url']).toBe('https://a');
    expect(sallaMarketing.withCartExtras({ customer: { full_name: 'Sara' } })['customer_name']).toBe('Sara');
    expect(sallaMarketing.withCartExtras({ total: 50, currency: 'SAR' })).toMatchObject({ total_amount: 50, currency: 'SAR' });
  });

  it('nulls everything on a thin abandoned.cart.purchased payload', () => {
    expect(sallaMarketing.withCartExtras({ id: 1097962121, status: 'purchased' })).toEqual({
      total_amount: null,
      subtotal_amount: null,
      total_discount_amount: null,
      currency: null,
      checkout_url: null,
      customer_id: null,
      customer_name: null,
      customer_mobile: null,
      customer_email: null,
      customer_city: null,
      customer_country: null,
      coupon_id: null,
      coupon_code: null,
      item_count: 0,
      item_quantity: 0,
      product_ids: [],
      created_at_iso: null,
      updated_at_iso: null,
      id: 1097962121,
      status: 'purchased',
    });
    expect(sallaMarketing.withCartExtras(undefined)).toEqual({});
  });
});

describe('withReviewExtras', () => {
  it('reads a review with the rating as a string', () => {
    const review = {
      id: 55,
      type: 'rating',
      rating: '4',
      content: 'Great shirt',
      customer: { id: '7', name: 'Ali', mobile: 501234567 },
      product: { id: 1672932878, name: 'Shirt' },
      order: { id: 2116149737, reference_id: '84732' },
      date: '2026-11-01 10:00:00',
    };
    expect(sallaMarketing.withReviewExtras(review)).toEqual({
      review_type: 'rating',
      rating_number: 4,
      customer_id: 7,
      customer_name: 'Ali',
      customer_mobile: '501234567',
      product_id: 1672932878,
      product_name: 'Shirt',
      order_id: 2116149737,
      order_reference_id: 84732,
      review_date: '2026-11-01 10:00:00',
      created_at_iso: '2026-11-01T07:00:00.000Z',
      ...review,
    });
  });

  it('reads the first date of a date list and prefers created_at', () => {
    expect(
      sallaMarketing.withReviewExtras({ date: [{ date: '2026-11-02 08:00:00.000000' }, '2026-11-03'], created_at: '2026-11-05 00:00:00' }),
    ).toMatchObject({ review_date: '2026-11-02 08:00:00.000000', created_at_iso: '2026-11-04T21:00:00.000Z' });
  });

  it('nulls missing parts and non-numeric IDs', () => {
    expect(sallaMarketing.withReviewExtras({ name: 'Shirt', customer: { id: 'guest' }, rating: 'five' })).toMatchObject({
      review_type: null,
      rating_number: null,
      content: null,
      customer_id: null,
      product_id: null,
      product_name: 'Shirt',
      order_id: null,
      order_reference_id: null,
      review_date: null,
      created_at_iso: null,
    });
    expect(sallaMarketing.withReviewExtras({ content: '  ' })['content']).toBe('  ');
    expect(sallaMarketing.withReviewExtras({ type: 'rating' })['content']).toBeNull();
    expect(sallaMarketing.withReviewExtras([])).toEqual({});
  });
});
