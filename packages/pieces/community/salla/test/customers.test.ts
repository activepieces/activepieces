import { describe, expect, it } from 'vitest';
import { sallaApi } from '../src/lib/common/client';
import { CUSTOMER_STATS_FIELDS, CreateCustomerInput, UpdateCustomerInput, sallaCustomers } from '../src/lib/common/customers';

function raw<T>(value: unknown): T {
  if (acceptsAnything<T>(value)) {
    return value;
  }
  throw new Error('unreachable');
}

function acceptsAnything<T>(value: unknown): value is T {
  return value !== undefined || value === undefined;
}

function baseCreate(overrides: Partial<CreateCustomerInput> = {}): CreateCustomerInput {
  return { firstName: ' Ali ', lastName: ' Saleh ', mobile: '+966501234567', ...overrides };
}

function update(input: UpdateCustomerInput): Record<string, unknown> {
  return sallaCustomers.buildUpdateCustomerBody(input);
}

const saudi = { mobile: '501234567', mobile_code_country: '+966', country_code: 'SA' };

describe('resolveMobile', () => {
  it('splits an international number with + or 00', () => {
    expect(sallaCustomers.resolveMobile({ mobile: '+966501234567' })).toEqual(saudi);
    expect(sallaCustomers.resolveMobile({ mobile: '00966501234567' })).toEqual(saudi);
    expect(sallaCustomers.resolveMobile({ mobile: '+971501234567' })).toEqual({ mobile: '501234567', mobile_code_country: '+971', country_code: 'AE' });
    expect(sallaCustomers.resolveMobile({ mobile: '+201001234567' })).toEqual({ mobile: '1001234567', mobile_code_country: '+20', country_code: 'EG' });
  });

  it('takes a national number with the mobile country code, with or without the plus sign', () => {
    expect(sallaCustomers.resolveMobile({ mobile: '501234567', mobileCountryCode: '+966' })).toEqual(saudi);
    expect(sallaCustomers.resolveMobile({ mobile: '501234567', mobileCountryCode: '966' })).toEqual(saudi);
    expect(sallaCustomers.resolveMobile({ mobile: '501234567', mobileCountryCode: '00966' })).toEqual(saudi);
    expect(sallaCustomers.resolveMobile({ mobile: 501234567, mobileCountryCode: 966 })).toEqual(saudi);
  });

  it('takes a national number with the two-letter country code only', () => {
    expect(sallaCustomers.resolveMobile({ mobile: '0501234567', countryCode: 'sa' })).toEqual(saudi);
    expect(sallaCustomers.resolveMobile({ mobile: '501234567', countryCode: ' KW ' })).toEqual({ mobile: '501234567', mobile_code_country: '+965', country_code: 'KW' });
  });

  it('strips the leading zero of the national number', () => {
    expect(sallaCustomers.resolveMobile({ mobile: '0501234567', mobileCountryCode: '+966' })).toEqual(saudi);
    expect(sallaCustomers.resolveMobile({ mobile: '+9660501234567' })).toEqual(saudi);
  });

  it('reads Arabic-Indic and Persian digits', () => {
    expect(sallaCustomers.resolveMobile({ mobile: '+٩٦٦٥٠١٢٣٤٥٦٧' })).toEqual(saudi);
    expect(sallaCustomers.resolveMobile({ mobile: '۰۵۰۱۲۳۴۵۶۷', mobileCountryCode: '+٩٦٦' })).toEqual(saudi);
  });

  it('ignores spaces, dashes, dots and brackets', () => {
    expect(sallaCustomers.resolveMobile({ mobile: ' +966 50-123 4567 ' })).toEqual(saudi);
    expect(sallaCustomers.resolveMobile({ mobile: '(050) 123.4567', mobileCountryCode: '+966' })).toEqual(saudi);
  });

  it('does not repeat the code when an international number already carries it', () => {
    expect(sallaCustomers.resolveMobile({ mobile: '+966501234567', mobileCountryCode: '966' })).toEqual(saudi);
    expect(sallaCustomers.resolveMobile({ mobile: '00966501234567', countryCode: 'SA' })).toEqual(saudi);
  });

  it('keeps every digit of a national number that happens to start with its calling code', () => {
    expect(sallaCustomers.resolveMobile({ mobile: '55999999999', mobileCountryCode: '+55' })).toEqual({
      mobile: '55999999999',
      mobile_code_country: '+55',
      country_code: 'BR',
    });
    expect(sallaCustomers.resolveMobile({ mobile: '20123456789', countryCode: 'EG' })).toMatchObject({ mobile: '20123456789', mobile_code_country: '+20' });
  });

  it('keeps a short number that only looks like it starts with the code', () => {
    expect(sallaCustomers.resolveMobile({ mobile: '96512345', mobileCountryCode: '+965' })).toEqual({
      mobile: '96512345',
      mobile_code_country: '+965',
      country_code: 'KW',
    });
  });

  it('lets an explicit country code win and leaves it empty for shared dial codes', () => {
    expect(sallaCustomers.resolveMobile({ mobile: '+14155550100' })).toEqual({ mobile: '4155550100', mobile_code_country: '+1', country_code: undefined });
    expect(sallaCustomers.resolveMobile({ mobile: '+14155550100', countryCode: 'us' })).toEqual({ mobile: '4155550100', mobile_code_country: '+1', country_code: 'US' });
  });

  it('returns undefined for an empty value', () => {
    for (const mobile of [undefined, null, '', '  ', ' - ']) {
      expect(sallaCustomers.resolveMobile({ mobile })).toBeUndefined();
    }
  });

  it('explains unknown codes, missing codes and bad digits', () => {
    expect(() => sallaCustomers.resolveMobile({ mobile: '+999501234567' })).toThrow('Could not tell the country code of "+999501234567"');
    expect(() => sallaCustomers.resolveMobile({ mobile: '501234567' })).toThrow('"501234567" has no country code');
    expect(() => sallaCustomers.resolveMobile({ mobile: '501234567', countryCode: 'US' })).toThrow('has no country code');
    expect(() => sallaCustomers.resolveMobile({ mobile: '+971501234567', mobileCountryCode: '+966' })).toThrow(
      'The mobile number "+971501234567" does not start with the country code +966.',
    );
    expect(() => sallaCustomers.resolveMobile({ mobile: '+96650abc' })).toThrow('"+96650abc" is not a mobile number');
    expect(() => sallaCustomers.resolveMobile({ mobile: '+96612' })).toThrow('"+96612" is not a valid mobile number for +966');
    expect(() => sallaCustomers.resolveMobile({ mobile: '+96612345678901234' })).toThrow('is not a valid mobile number for +966');
    expect(() => sallaCustomers.resolveMobile({ mobile: '501234567', mobileCountryCode: 'KSA' })).toThrow('"KSA" is not a country calling code');
    expect(() => sallaCustomers.resolveMobile({ mobile: '501234567', mobileCountryCode: '+12345' })).toThrow('is not a country calling code');
    expect(() => sallaCustomers.resolveMobile({ mobile: '501234567', countryCode: 'SAU' })).toThrow('"SAU" is not a country code');
  });
});

describe('buildCreateCustomerBody', () => {
  it('builds the required fields with the mobile split in three', () => {
    expect(sallaCustomers.buildCreateCustomerBody(baseCreate())).toEqual({
      first_name: 'Ali',
      last_name: 'Saleh',
      mobile: '501234567',
      mobile_code_country: '+966',
      country_code: 'SA',
    });
  });

  it('adds email, gender, birthday and groups', () => {
    expect(
      sallaCustomers.buildCreateCustomerBody(
        baseCreate({ email: ' ali@example.com ', gender: 'Male', birthday: '1990-05-01 00:00:00', groupIds: [3, '4'] }),
      ),
    ).toEqual({
      first_name: 'Ali',
      last_name: 'Saleh',
      mobile: '501234567',
      mobile_code_country: '+966',
      country_code: 'SA',
      email: 'ali@example.com',
      gender: 'male',
      birthday: '1990-05-01',
      groups: [3, 4],
    });
    expect(sallaCustomers.buildCreateCustomerBody(baseCreate({ gender: ' FEMALE ' }))['gender']).toBe('female');
  });

  it('reads group IDs from an array, a comma list or a JSON array', () => {
    expect(sallaCustomers.buildCreateCustomerBody(baseCreate({ groupIds: ['3', ' 4 '] }))['groups']).toEqual([3, 4]);
    expect(sallaCustomers.buildCreateCustomerBody(baseCreate({ groupIds: '3, 4' }))['groups']).toEqual([3, 4]);
    expect(sallaCustomers.buildCreateCustomerBody(baseCreate({ groupIds: '[3,"4"]' }))['groups']).toEqual([3, 4]);
    expect(() => sallaCustomers.buildCreateCustomerBody(baseCreate({ groupIds: 'VIP' }))).toThrow('Customer group ID must be a numeric Salla ID');
  });

  it('drops empty optional fields', () => {
    expect(
      sallaCustomers.buildCreateCustomerBody(baseCreate({ email: ' ', gender: '', birthday: '', groupIds: [], mobileCountryCode: '', countryCode: '' })),
    ).toEqual({ first_name: 'Ali', last_name: 'Saleh', ...saudi });
    expect(sallaCustomers.buildCreateCustomerBody(baseCreate({ groupIds: '' }))).not.toHaveProperty('groups');
  });

  it('requires both names and the mobile number', () => {
    expect(() => sallaCustomers.buildCreateCustomerBody(baseCreate({ firstName: ' ' }))).toThrow("Give the customer's first name and last name.");
    expect(() => sallaCustomers.buildCreateCustomerBody(baseCreate({ lastName: raw<string>(undefined) }))).toThrow('first name and last name');
    expect(() => sallaCustomers.buildCreateCustomerBody(baseCreate({ mobile: ' ' }))).toThrow("Give the customer's mobile number with the country code");
  });

  it('asks for the country code when the dial code is shared', () => {
    expect(() => sallaCustomers.buildCreateCustomerBody(baseCreate({ mobile: '+14155550100' }))).toThrow(
      'It could not be worked out from +1; fill Country Code.',
    );
    expect(sallaCustomers.buildCreateCustomerBody(baseCreate({ mobile: '+14155550100', countryCode: 'ca' }))['country_code']).toBe('CA');
  });

  it('validates email, gender and birthday', () => {
    expect(() => sallaCustomers.buildCreateCustomerBody(baseCreate({ email: 'ali@' }))).toThrow('"ali@" is not an email address.');
    expect(() => sallaCustomers.buildCreateCustomerBody(baseCreate({ gender: 'other' }))).toThrow('"other" is not a gender Salla accepts. Use male or female.');
    expect(() => sallaCustomers.buildCreateCustomerBody(baseCreate({ birthday: '1990-02-30' }))).toThrow('is not a valid date');
    expect(() => sallaCustomers.buildCreateCustomerBody(baseCreate({ birthday: 'someday' }))).toThrow('"someday" is not a valid date');
  });
});

describe('buildUpdateCustomerBody', () => {
  it('sends only the fields given', () => {
    expect(update({ firstName: ' Sara ' })).toEqual({ first_name: 'Sara' });
    expect(update({ email: 'sara@example.com', gender: 'female' })).toEqual({ email: 'sara@example.com', gender: 'female' });
    expect(update({ birthday: '2000-01-31' })).toEqual({ birthday: '2000-01-31' });
    expect(update({ countryCode: 'ae' })).toEqual({ country_code: 'AE' });
    expect(update({ groupIds: '7' })).toEqual({ groups: [7] });
  });

  it('splits a new mobile number', () => {
    expect(update({ mobile: '+971501234567' })).toEqual({ mobile: '501234567', mobile_code_country: '+971', country_code: 'AE' });
    expect(update({ mobile: '0501234567', mobileCountryCode: '+966' })).toEqual(saudi);
    expect(update({ mobile: 501234567, countryCode: 'SA' })).toEqual(saudi);
  });

  it('throws when nothing is filled', () => {
    expect(() => update({})).toThrow('Nothing to update. Fill at least one field to change on the customer.');
    expect(() => update({ firstName: ' ', email: '', gender: '', birthday: ' ', mobile: '', countryCode: '' })).toThrow('Nothing to update');
  });

  it('never sends groups for an empty group list', () => {
    expect(update({ firstName: 'Sara', groupIds: [] })).toEqual({ first_name: 'Sara' });
    expect(update({ firstName: 'Sara', groupIds: '' })).toEqual({ first_name: 'Sara' });
    expect(update({ firstName: 'Sara', groupIds: '[]' })).toEqual({ first_name: 'Sara' });
    expect(() => update({ groupIds: [] })).toThrow('Nothing to update');
  });

  it('refuses a mobile country code without the mobile number', () => {
    expect(() => update({ firstName: 'Sara', mobileCountryCode: '+966' })).toThrow(
      'Mobile Country Code changes only together with the mobile number. Fill the mobile number too.',
    );
    expect(() => update({ mobileCountryCode: 966 })).toThrow('Mobile Country Code changes only together with the mobile number');
  });

  it('validates the given fields', () => {
    expect(() => update({ email: 'nope' })).toThrow('"nope" is not an email address.');
    expect(() => update({ gender: 'x' })).toThrow('"x" is not a gender Salla accepts');
    expect(() => update({ mobile: '501234567' })).toThrow('has no country code');
    expect(() => update({ countryCode: 'Saudi' })).toThrow('"Saudi" is not a country code');
  });
});

describe('buildCustomerListQuery', () => {
  it('passes date_from and date_to through unchanged as YYYY-MM-DD', () => {
    expect(sallaCustomers.buildCustomerListQuery({ maxResults: 10, keyword: ' ali ', dateFrom: '2026-01-01', dateTo: '2026-02-01 10:00:00' })).toEqual({
      keyword: 'ali',
      date_from: '2026-01-01',
      date_to: '2026-02-01',
    });
  });

  it('converts an instant to the Riyadh date', () => {
    expect(sallaCustomers.buildCustomerListQuery({ maxResults: 10, dateFrom: '2026-01-01T22:00:00Z' })['date_from']).toBe('2026-01-02');
  });

  it('leaves empty filters undefined and rejects a bad date', () => {
    expect(sallaCustomers.buildCustomerListQuery({ maxResults: 10, keyword: ' ', dateFrom: '', dateTo: undefined })).toEqual({
      keyword: undefined,
      date_from: undefined,
      date_to: undefined,
    });
    expect(() => sallaCustomers.buildCustomerListQuery({ maxResults: 10, dateTo: '2026-13-01' })).toThrow('is not a valid date');
  });
});

describe('buildAddCustomersToGroupBody', () => {
  it('builds numeric IDs and drops duplicates', () => {
    expect(sallaCustomers.buildAddCustomersToGroupBody({ groupId: ' 5 ', customerIds: [1, '1', ' 2 ', '٣'] })).toEqual({ group_id: 5, customers: [1, 2, 3] });
    expect(sallaCustomers.buildAddCustomersToGroupBody({ groupId: 5, customerIds: '1, 2, 2' })).toEqual({ group_id: 5, customers: [1, 2] });
    expect(sallaCustomers.buildAddCustomersToGroupBody({ groupId: 5, customerIds: '[7, "8"]' })).toEqual({ group_id: 5, customers: [7, 8] });
    expect(sallaCustomers.buildAddCustomersToGroupBody({ groupId: 5, customerIds: 9 })).toEqual({ group_id: 5, customers: [9] });
  });

  it('drops duplicates that differ only by leading zeros', () => {
    expect(sallaCustomers.buildAddCustomersToGroupBody({ groupId: 5, customerIds: [1, '01'] })).toEqual({ group_id: 5, customers: [1] });
  });

  it('rejects non-numeric IDs and an empty list', () => {
    expect(() => sallaCustomers.buildAddCustomersToGroupBody({ groupId: 'VIP', customerIds: [1] })).toThrow('Customer group ID must be a numeric Salla ID');
    expect(() => sallaCustomers.buildAddCustomersToGroupBody({ groupId: 5, customerIds: [1, 'ali'] })).toThrow('Customer ID must be a numeric Salla ID');
    expect(() => sallaCustomers.buildAddCustomersToGroupBody({ groupId: 5, customerIds: [] })).toThrow('Pick at least one customer to add to the group.');
    expect(() => sallaCustomers.buildAddCustomersToGroupBody({ groupId: 5, customerIds: undefined })).toThrow('Pick at least one customer');
  });
});

describe('withCustomerExtras', () => {
  const customer = {
    id: 7,
    first_name: 'Ali',
    last_name: 'Saleh',
    mobile: 501234567,
    mobile_code: '+966',
    email: 'ali@example.com',
    city: 'Riyadh',
    country: 'Saudi Arabia',
    country_code: 'SA',
    gender: 'male',
    groups: [{ id: 3, name: 'VIP' }, { id: '4', name: 'Gold' }, { name: 'No ID' }],
    birthday: { date: '1990-05-01 00:00:00.000000', timezone_type: 3, timezone: 'Asia/Riyadh' },
    urls: { customer: 'https://store.example/profile', admin: 'https://s.salla.sa/customers/7' },
    created_at: { date: '2026-01-01 10:00:00.000000', timezone_type: 3, timezone: 'Asia/Riyadh' },
    updated_at: '2026-01-02 10:00:00',
  };

  it('adds flat keys to a full customer and keeps the raw ones', () => {
    const result = sallaCustomers.withCustomerExtras(customer);
    expect(result).toMatchObject({
      full_name: 'Ali Saleh',
      mobile_full: '+966501234567',
      email: 'ali@example.com',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      country_code: 'SA',
      gender: 'male',
      group_ids: [3, 4],
      group_names: 'VIP, Gold, No ID',
      birthday_date: '1990-05-01',
      customer_url: 'https://store.example/profile',
      admin_url: 'https://s.salla.sa/customers/7',
      created_at_iso: '2026-01-01T07:00:00.000Z',
      updated_at_iso: '2026-01-02T07:00:00.000Z',
      id: 7,
      groups: customer.groups,
      birthday: customer.birthday,
    });
  });

  it('adds stats keys only when the customer has stats', () => {
    expect(sallaCustomers.withCustomerExtras(customer)).not.toHaveProperty('orders_count');
    expect(sallaCustomers.withCustomerExtras(customer)).not.toHaveProperty('latest_purchase_iso');
    const withStats = sallaCustomers.withCustomerExtras({
      ...customer,
      stats: { orders_count: '3', orders_amount: { amount: 250.5, currency: 'SAR' } },
      latest_purchase: '2026-03-01 12:00:00',
    });
    expect(withStats).toMatchObject({ orders_count: 3, orders_amount: 250.5, latest_purchase_iso: '2026-03-01T09:00:00.000Z' });
    expect(sallaCustomers.withCustomerExtras({ id: 1, stats: {} })).toMatchObject({ orders_count: null, orders_amount: null });
  });

  it('reads birthday_date from a plain string and nulls missing values', () => {
    expect(sallaCustomers.withCustomerExtras({ id: 1, birthday: '1995-12-24' })['birthday_date']).toBe('1995-12-24');
    expect(sallaCustomers.withCustomerExtras({ id: 1 })).toMatchObject({
      full_name: null,
      mobile_full: null,
      email: null,
      group_ids: [],
      group_names: null,
      birthday_date: null,
      customer_url: null,
      created_at_iso: null,
    });
  });

  it('falls back for the name and builds the full mobile from loose parts', () => {
    expect(sallaCustomers.withCustomerExtras({ full_name: 'Full Name', first_name: 'A' })['full_name']).toBe('Full Name');
    expect(sallaCustomers.withCustomerExtras({ first_name: ' Ali ', last_name: ' ' })['full_name']).toBe('Ali');
    expect(sallaCustomers.withCustomerExtras({ first_name: 'Ali' })['full_name']).toBe('Ali');
    expect(sallaCustomers.withCustomerExtras({ name: 'Nick' })['full_name']).toBe('Nick');
    expect(sallaCustomers.withCustomerExtras({ mobile: '0501234567', mobile_code: 966 })['mobile_full']).toBe('+966501234567');
    expect(sallaCustomers.withCustomerExtras({ mobile: '+966 50 123 4567', mobile_code: '+966' })['mobile_full']).toBe('+966501234567');
    expect(sallaCustomers.withCustomerExtras({ mobile: '0501234567' })['mobile_full']).toBe('0501234567');
    expect(sallaCustomers.withCustomerExtras({ groups: [5, '6'] })).toMatchObject({ group_ids: [5, 6], group_names: null });
  });

  it('leaves a non-numeric group entry out of group_ids', () => {
    expect(sallaCustomers.withCustomerExtras({ groups: [{ id: 3, name: 'VIP' }, 'Gold'] })['group_ids']).toEqual([3]);
  });

  it('returns an empty object for a non-record', () => {
    expect(sallaCustomers.withCustomerExtras(undefined)).toEqual({});
    expect(sallaCustomers.withCustomerExtras([customer])).toEqual({});
  });
});

describe('customer stats fields', () => {
  it('asks for the documented detail-only fields', () => {
    expect(CUSTOMER_STATS_FIELDS).toEqual(expect.arrayContaining(['orders_count', 'orders_amount', 'latest_purchase', 'wallet_balance', 'total_points']));
  });
});

describe('buildErrorMessage on 429', () => {
  const customersHint = '500 requests per 10 minutes';

  it('mentions the customers limit on /customers and /customers/groups', () => {
    for (const path of ['/customers', '/customers/7', '/customers/groups', '/customers/groups/add_customers', 'customers/groups', '/customers?page=2']) {
      const message = sallaApi.buildErrorMessage({ status: 429, responseBody: {}, path });
      expect(message).toContain(customersHint);
      expect(message).toContain('Salla API error (429)');
    }
  });

  it('keeps the general limit on other paths', () => {
    for (const path of ['/orders', '/customersx', '/coupons', undefined]) {
      const message = sallaApi.buildErrorMessage({ status: 429, responseBody: {}, path });
      expect(message).not.toContain(customersHint);
      expect(message).toContain('120 to 720 requests per minute');
    }
  });

  it('only changes the hint for 429', () => {
    expect(sallaApi.buildErrorMessage({ status: 404, responseBody: {}, path: '/customers/7' })).not.toContain(customersHint);
  });
});
