/// <reference types="vitest/globals" />

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

vi.mock('../src/index', () => ({ stripeAuth: { type: 'SECRET_TEXT' } }));

import { HttpMethod } from '@activepieces/pieces-common';
import { stripeSearchCustomer } from '../src/lib/actions/search-customer';

const auth = { secret_text: 'sk_test_dummy' };

const lastRequest = () => sendRequest.mock.calls.at(-1)?.[0];

function reply(body: unknown) {
  sendRequest.mockResolvedValueOnce({ body });
}

function runAction(propsValue: unknown) {
  return (stripeSearchCustomer as unknown as {
    run: (ctx: unknown) => Promise<unknown>;
  }).run({ auth, propsValue });
}

beforeEach(() => sendRequest.mockReset());

describe('search customer', () => {
  test('the search expression travels in the query string, since a GET cannot carry a body', async () => {
    reply({ object: 'search_result', data: [] });
    await runAction({ email: 'sally@rocketrides.io' });
    expect(lastRequest().queryParams).toEqual({
      query: "email:'sally@rocketrides.io'",
    });
  });

  test('no body is sent at all, the shape that made Stripe reject the search', async () => {
    reply({ object: 'search_result', data: [] });
    await runAction({ email: 'sally@rocketrides.io' });
    expect(lastRequest().body).toBeUndefined();
  });

  test('the form-urlencoded content type is gone with the body it described', async () => {
    reply({ object: 'search_result', data: [] });
    await runAction({ email: 'sally@rocketrides.io' });
    expect(lastRequest().headers['Content-Type']).toBeUndefined();
  });

  test('it reads with a GET against the customer search endpoint', async () => {
    reply({ object: 'search_result', data: [] });
    await runAction({ email: 'sally@rocketrides.io' });
    expect(lastRequest().method).toBe(HttpMethod.GET);
    expect(lastRequest().url).toBe('https://api.stripe.com/v1/customers/search');
  });

  test('the pinned Stripe-Version is kept, search needs 2020-08-27 or later', async () => {
    reply({ object: 'search_result', data: [] });
    await runAction({ email: 'sally@rocketrides.io' });
    expect(lastRequest().headers['Stripe-Version']).toBe('2026-02-25.clover');
  });

  test('it returns the search result untouched', async () => {
    const result = { object: 'search_result', data: [{ id: 'cus_1' }] };
    reply(result);
    expect(await runAction({ email: 'sally@rocketrides.io' })).toEqual(result);
  });
});
