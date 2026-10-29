/// <reference types="vitest/globals" />

vi.mock('../src/index', () => ({ stripeAuth: { type: 'SECRET_TEXT' } }));

import { stripeCommon } from '../src/lib/common';

describe('toFormBody', () => {
  test('a nested address is expanded into bracket keys', () => {
    expect(
      stripeCommon.toFormBody({
        name: 'Jane Doe',
        address: { line1: '123 Main St', city: 'Springfield' },
      })
    ).toEqual({
      name: 'Jane Doe',
      'address[line1]': '123 Main St',
      'address[city]': 'Springfield',
    });
  });

  test('objects nested more than one level deep keep every bracket', () => {
    expect(
      stripeCommon.toFormBody({
        shipping: { address: { country: 'US' } },
      })
    ).toEqual({ 'shipping[address][country]': 'US' });
  });

  test('undefined, null and empty strings are dropped at every level', () => {
    expect(
      stripeCommon.toFormBody({
        description: undefined,
        phone: null,
        email: '',
        name: 'Jane Doe',
        address: { line1: '', city: undefined, state: null, country: 'US' },
      })
    ).toEqual({ name: 'Jane Doe', 'address[country]': 'US' });
  });

  test('an empty object adds nothing', () => {
    expect(stripeCommon.toFormBody({ metadata: {}, currency: 'usd' })).toEqual(
      { currency: 'usd' }
    );
  });

  test('an object whose values are all empty adds nothing', () => {
    expect(
      stripeCommon.toFormBody({ address: { line1: '', city: undefined } })
    ).toEqual({});
  });

  test('arrays are expanded into indexed keys', () => {
    expect(
      stripeCommon.toFormBody({
        expand: ['customer', 'invoice'],
        items: [{ price: 'price_1', quantity: 2 }],
      })
    ).toEqual({
      'expand[0]': 'customer',
      'expand[1]': 'invoice',
      'items[0][price]': 'price_1',
      'items[0][quantity]': '2',
    });
  });

  test('numbers and booleans become strings, including zero and false', () => {
    expect(
      stripeCommon.toFormBody({
        amount: 1050,
        trial_period_days: 0,
        active: true,
        cancel_at_period_end: false,
      })
    ).toEqual({
      amount: '1050',
      trial_period_days: '0',
      active: 'true',
      cancel_at_period_end: 'false',
    });
  });

  test('metadata keys keep their own names inside the brackets', () => {
    expect(
      stripeCommon.toFormBody({ metadata: { order_id: '42', source: 'flow' } })
    ).toEqual({ 'metadata[order_id]': '42', 'metadata[source]': 'flow' });
  });

  test('the input is not mutated and a new object is returned', () => {
    const input = {
      name: 'Jane Doe',
      description: undefined,
      address: { line1: '123 Main St', city: '' },
      expand: ['customer'],
    };
    const snapshot = structuredClone(input);
    const result = stripeCommon.toFormBody(input);
    expect(input).toEqual(snapshot);
    expect('description' in input).toBe(true);
    expect(result).not.toBe(input);
  });

  test('an empty input gives an empty body', () => {
    expect(stripeCommon.toFormBody({})).toEqual({});
  });
});
