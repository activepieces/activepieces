import { getDiscount } from '../src/lib/actions/get-discount';
import { listAffiliates } from '../src/lib/actions/list-affiliates';
import { listDiscountRedemptions } from '../src/lib/actions/list-discount-redemptions';
import { listLicenseKeyInstances } from '../src/lib/actions/list-license-key-instances';
import { listSubscriptionItems } from '../src/lib/actions/list-subscription-items';
import { validateLicense } from '../src/lib/actions/validate-license';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lemonSqueezy } from '../src/index';
import { createCheckout } from '../src/lib/actions/create-checkout';
import { createCustomer } from '../src/lib/actions/create-customer';
import { createDiscount } from '../src/lib/actions/create-discount';
import { deleteDiscount } from '../src/lib/actions/delete-discount';
import { findCustomerByEmail } from '../src/lib/actions/find-customer-by-email';
import { generateOrderInvoice } from '../src/lib/actions/generate-order-invoice';
import { getLicenseKey } from '../src/lib/actions/get-license-key';
import { getOrder } from '../src/lib/actions/get-order';
import { getOrderAi } from '../src/lib/actions/get-order-ai';
import { listOrders } from '../src/lib/actions/list-orders';
import { listSubscriptionsAi } from '../src/lib/actions/list-subscriptions-ai';
import { cancelSubscription } from '../src/lib/actions/cancel-subscription';
import { pauseSubscription } from '../src/lib/actions/pause-subscription';
import { unpauseSubscription } from '../src/lib/actions/unpause-subscription';
import { resumeSubscription } from '../src/lib/actions/resume-subscription';
import { changeSubscriptionPlan } from '../src/lib/actions/change-subscription-plan';
import { updateCustomer } from '../src/lib/actions/update-customer';
import { updateLicenseKey } from '../src/lib/actions/update-license-key';
import { lemonSqueezyAuth } from '../src/lib/common/auth';
import { attributesOf, installFetch, jsonResponse, resource, runAction } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('piece metadata', () => {
  const actions = Object.values(lemonSqueezy.actions());
  const triggers = Object.values(lemonSqueezy.triggers());

  it('has 36 actions + custom API call and 16 triggers', () => {
    expect(actions).toHaveLength(37);
    expect(triggers).toHaveLength(16);
    expect(lemonSqueezy.minimumSupportedRelease).toBe('0.88.2');
  });

  it('gives every action except Custom API Call and every trigger an outputSchema', () => {
    for (const action of actions.filter((a) => a.name !== 'custom_api_call')) {
      expect(action.outputSchema, action.name).toBeDefined();
    }
    for (const trigger of triggers) expect(trigger.outputSchema, trigger.name).toBeDefined();
  });

  it('has the expected audiences', () => {
    const byAudience = (aud: string) => actions.filter((a) => Reflect.get(a, 'audience') === aud).map((a) => a.name).sort();
    expect(byAudience('ai')).toEqual(['get_order_ai', 'list_subscriptions_ai']);
    expect(byAudience('human')).toEqual(['change_subscription_plan', 'custom_api_call', 'get_order', 'list_subscriptions']);
  });
});

describe('auth.validate', () => {
  it('reports invalid only on 401/403', async () => {
    installFetch({ 'GET /users/me': () => jsonResponse({ value: { errors: [{ detail: 'Unauthenticated.' }] }, status: 401 }) });
    expect(await validate('bad')).toMatchObject({ valid: false, error: expect.stringContaining('Invalid API key') });
    installFetch({ 'GET /users/me': () => jsonResponse({ value: {}, status: 503 }) });
    expect(await validate('k')).toMatchObject({ valid: false, error: expect.stringContaining('Could not reach') });
    installFetch({ 'GET /users/me': () => jsonResponse({ value: { meta: { test_mode: true }, data: { id: '1', type: 'users' } } }) });
    expect(await validate('k')).toEqual({ valid: true });
  });
});

describe('existing actions', () => {
  it('get_order encodes the ID and refuses a path', async () => {
    const { calls } = installFetch({ 'GET /orders/12': () => jsonResponse({ value: { data: resource({ type: 'orders', id: '12' }) } }) });
    await runAction({ action: getOrder, props: { orderId: '12' } });
    expect(calls[0].url.pathname).toBe('/v1/orders/12');
    await expect(runAction({ action: getOrder, props: { orderId: '../webhooks' } })).rejects.toThrow(/numeric/);
  });

  it('list_orders validates paging and keeps the raw body', async () => {
    const raw = { meta: { page: { currentPage: 1, lastPage: 1 } }, data: [] };
    const { calls } = installFetch({ 'GET /orders': () => jsonResponse({ value: raw }) });
    expect(await runAction({ action: listOrders, props: { userEmail: 'a@b.co', page: 1, perPage: 5 } })).toEqual(raw);
    expect(calls[0].url.search).toBe('?filter%5Buser_email%5D=a%40b.co&page%5Bnumber%5D=1&page%5Bsize%5D=5');
    await expect(runAction({ action: listOrders, props: { page: 0 } })).rejects.toThrow(/Page/);
  });

  it('create_checkout sends the documented body', async () => {
    const { calls } = installFetch({ 'POST /checkouts': () => jsonResponse({ value: { data: resource({ type: 'checkouts', id: 'c1', attributes: { url: 'https://x' } }) }, status: 201 }) });
    await runAction({ action: createCheckout, props: {
      storeId: '1',
      variantId: '2',
      customerEmail: 'a@b.co',
      customPrice: 999,
      redirectUrl: 'https://ok.example',
      expiresAt: '2026-12-31T23:59:59Z',
      customData: { user_id: '7' },
    } });
    expect(calls[0].body).toEqual({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: { email: 'a@b.co', custom: { user_id: '7' } },
          product_options: { redirect_url: 'https://ok.example' },
          custom_price: 999,
          expires_at: '2026-12-31T23:59:59.000Z',
        },
        relationships: { store: { data: { type: 'stores', id: '1' } }, variant: { data: { type: 'variants', id: '2' } } },
      },
    });
  });

  it('create_checkout rejects bad input before any request', async () => {
    const { calls } = installFetch({});
    await expect(runAction({ action: createCheckout, props: { storeId: '1', variantId: '2', expiresAt: 'tomorrow' } })).rejects.toThrow(/ISO 8601/);
    await expect(runAction({ action: createCheckout, props: { storeId: '1', variantId: '2', customData: [1, 2] } })).rejects.toThrow(/JSON object/);
    await expect(runAction({ action: createCheckout, props: { storeId: '1', variantId: '2', customPrice: 9.5 } })).rejects.toThrow(/cents/);
    expect(calls).toHaveLength(0);
  });
});

describe('customers', () => {
  it('find_customer_by_email returns found=false without error', async () => {
    installFetch({ 'GET /customers': () => jsonResponse({ value: { meta: { page: { currentPage: 1, lastPage: 1, total: 0 } }, data: [] } }) });
    expect(await runAction({ action: findCustomerByEmail, props: { email: 'none@x.co' } })).toEqual({ found: false, customer: null, matches: [] });
  });

  it('create_customer posts to the store and flattens', async () => {
    const { calls } = installFetch({ 'POST /customers': () => jsonResponse({ value: { data: resource({ type: 'customers', id: '9', attributes: { email: 'a@b.co' } }) }, status: 201 }) });
    expect(await runAction({ action: createCustomer, props: { storeId: '3', name: 'A', email: 'a@b.co', country: 'us' } })).toEqual({ id: '9', email: 'a@b.co' });
    expect(calls[0].body).toEqual({
      data: { type: 'customers', attributes: { name: 'A', email: 'a@b.co', country: 'US' }, relationships: { store: { data: { type: 'stores', id: '3' } } } },
    });
  });

  it('update_customer sends only provided fields and refuses an empty update', async () => {
    const { calls } = installFetch({ 'PATCH /customers/9': () => jsonResponse({ value: { data: resource({ type: 'customers', id: '9', attributes: { status: 'archived' } }) } }) });
    await runAction({ action: updateCustomer, props: { customerId: '9', archive: true } });
    expect(calls[0].body).toEqual({ data: { type: 'customers', id: '9', attributes: { status: 'archived' } } });
    await expect(runAction({ action: updateCustomer, props: { customerId: '9' } })).rejects.toThrow(/Nothing to update/);
  });
});

describe('orders', () => {
  it('get_order_ai includes order items', async () => {
    const { calls } = installFetch({
      'GET /orders/5': () =>
        jsonResponse({ value: { data: resource({ type: 'orders', id: '5', attributes: { total: 100 } }), included: [resource({ type: 'order-items', id: '8', attributes: { product_name: 'P' } })] } }),
    });
    expect(await runAction({ action: getOrderAi, props: { orderId: '5' } })).toEqual({ id: '5', total: 100, order_items: [{ id: '8', product_name: 'P' }] });
    expect(calls[0].url.search).toBe('?include=order-items');
  });

  it('generate_order_invoice returns the download URL', async () => {
    const { calls } = installFetch({
      'POST /orders/5/generate-invoice': () => jsonResponse({ value: { meta: { urls: { download_invoice: 'https://app.lemonsqueezy.com/i.pdf' } } } }),
    });
    expect(await runAction({ action: generateOrderInvoice, props: { orderId: '5', name: 'A', address: 'St 1', city: 'C', zipCode: '1', country: 'de' } })).toEqual({
      order_id: '5',
      invoice_url: 'https://app.lemonsqueezy.com/i.pdf',
    });
    expect(calls[0].url.searchParams.get('country')).toBe('DE');
  });
});

describe('subscriptions', () => {
  it('cancel uses DELETE; resume/pause/unpause PATCH the documented attributes', async () => {
    const sub = () => jsonResponse({ value: { data: resource({ type: 'subscriptions', id: '4', attributes: { status: 'active' } }) } });
    const { calls } = installFetch({ 'DELETE /subscriptions/4': sub, 'PATCH /subscriptions/4': sub });
    await runAction({ action: cancelSubscription, props: { subscriptionId: '4' } });
    await runAction({ action: resumeSubscription, props: { subscriptionId: '4' } });
    await runAction({ action: pauseSubscription, props: { subscriptionId: '4', mode: 'free', resumesAt: '2026-12-01' } });
    await runAction({ action: unpauseSubscription, props: { subscriptionId: '4' } });
    expect(calls[0].method).toBe('DELETE');
    expect(calls.slice(1).map((c) => attributesOf(c))).toEqual([
      { cancelled: false },
      { pause: { mode: 'free', resumes_at: '2026-12-01T00:00:00.000Z' } },
      { pause: null },
    ]);
  });

  it('change plan refuses conflicting proration options', async () => {
    installFetch({});
    await expect(runAction({ action: changeSubscriptionPlan, props: { subscriptionId: '4', variantId: '2', invoiceImmediately: true, disableProrations: true } })).rejects.toThrow(/either/);
  });

  it('list_subscriptions_ai validates ID filters and returns has_more', async () => {
    const { calls } = installFetch({
      'GET /subscriptions': () => jsonResponse({ value: { meta: { page: { currentPage: 1, lastPage: 3, perPage: 10, total: 25 } }, data: [resource({ type: 'subscriptions', id: '1' })] } }),
    });
    expect(await runAction({ action: listSubscriptionsAi, props: { productId: '7', status: 'active' } })).toMatchObject({ has_more: true, total: 25, items: [{ id: '1' }] });
    expect(calls[0].url.search).toBe('?filter%5Bproduct_id%5D=7&filter%5Bstatus%5D=active');
    await expect(runAction({ action: listSubscriptionsAi, props: { storeId: 'abc' } })).rejects.toThrow(/numeric/);
  });
});

describe('discounts', () => {
  it('create_discount validates and posts', async () => {
    const { calls } = installFetch({ 'POST /discounts': () => jsonResponse({ value: { data: resource({ type: 'discounts', id: '3', attributes: { code: 'SAVE10' } }) }, status: 201 }) });
    await runAction({ action: createDiscount, props: { storeId: '1', name: 'Ten', code: 'SAVE10', amountType: 'percent', amount: 10, maxRedemptions: 5, duration: 'repeating', durationInMonths: 3 } });
    expect(attributesOf(calls[0])).toEqual({
      name: 'Ten', code: 'SAVE10', amount: 10, amount_type: 'percent', is_limited_redemptions: true, max_redemptions: 5, duration: 'repeating', duration_in_months: 3,
    });
    await expect(runAction({ action: createDiscount, props: { storeId: '1', name: 'x', code: 'bad code', amountType: 'percent', amount: 10 } })).rejects.toThrow(/Code/);
    await expect(runAction({ action: createDiscount, props: { storeId: '1', name: 'x', code: 'OK1', amountType: 'percent', amount: 150 } })).rejects.toThrow(/percent/);
    await expect(runAction({ action: createDiscount, props: { storeId: '1', name: 'x', code: 'OK1', amountType: 'fixed', amount: 5, duration: 'repeating' } })).rejects.toThrow(/Months/);
  });

  it('delete_discount treats 404 as already deleted', async () => {
    installFetch({ 'DELETE /discounts/3': () => jsonResponse({ value: null, status: 204 }), 'DELETE /discounts/4': () => jsonResponse({ value: { errors: [{ detail: 'nf' }] }, status: 404 }) });
    expect(await runAction({ action: deleteDiscount, props: { discountId: '3' } })).toEqual({ id: '3', deleted: true, already_deleted: false });
    expect(await runAction({ action: deleteDiscount, props: { discountId: '4' } })).toEqual({ id: '4', deleted: true, already_deleted: true });
  });
});

describe('license keys', () => {
  it('get_license_key by key resolves the ID then reads it with auth', async () => {
    const { calls } = installFetch({
      'POST /licenses/validate': () => jsonResponse({ value: { valid: true, license_key: { id: 11 } } }),
      'GET /license-keys/11': () => jsonResponse({ value: { data: resource({ type: 'license-keys', id: '11', attributes: { key: 'ABC' } }) } }),
    });
    expect(await runAction({ action: getLicenseKey, props: { licenseKey: 'ABC' } })).toEqual({ found: true, license_key: { id: '11', key: 'ABC' } });
    expect(calls[0].body).toBe('license_key=ABC');
    expect(calls[0].headers['authorization']).toBeUndefined();
  });

  it('get_license_key looks the key up when the ID field arrives blank', async () => {
    const { calls } = installFetch({
      'POST /licenses/validate': () => jsonResponse({ value: { valid: true, license_key: { id: 11 } } }),
      'GET /license-keys/11': () => jsonResponse({ value: { data: resource({ type: 'license-keys', id: '11' }) } }),
    });
    expect(await runAction({ action: getLicenseKey, props: { licenseKeyId: '  ', licenseKey: 'ABC' } })).toEqual({ found: true, license_key: { id: '11' } });
    expect(calls).toHaveLength(2);
  });

  it('get_license_key returns found=false for an unknown key and needs exactly one input', async () => {
    installFetch({ 'POST /licenses/validate': () => jsonResponse({ value: { valid: false, error: 'license_key not found.', license_key: null }, status: 404 }) });
    expect(await runAction({ action: getLicenseKey, props: { licenseKey: 'NOPE' } })).toEqual({ found: false, license_key: null });
    await expect(runAction({ action: getLicenseKey, props: {} })).rejects.toThrow(/exactly one/);
    await expect(runAction({ action: getLicenseKey, props: { licenseKey: 'A', licenseKeyId: '1' } })).rejects.toThrow(/exactly one/);
  });

  it('update_license_key has three states per field', async () => {
    const { calls } = installFetch({ 'PATCH /license-keys/11': () => jsonResponse({ value: { data: resource({ type: 'license-keys', id: '11' }) } }) });
    await runAction({ action: updateLicenseKey, props: { licenseKeyId: '11', unlimitedActivations: true, neverExpires: true, disabled: 'disable' } });
    await runAction({ action: updateLicenseKey, props: { licenseKeyId: '11', activationLimit: 3, expiresAt: '2027-01-31T00:00:00Z' } });
    expect(calls.map((c) => attributesOf(c))).toEqual([
      { activation_limit: null, expires_at: null, disabled: true },
      { activation_limit: 3, expires_at: '2027-01-31T00:00:00.000Z' },
    ]);
    await expect(runAction({ action: updateLicenseKey, props: { licenseKeyId: '11' } })).rejects.toThrow(/Nothing/);
    await expect(runAction({ action: updateLicenseKey, props: { licenseKeyId: '11', activationLimit: 2, unlimitedActivations: true } })).rejects.toThrow(/either/);
  });
});

describe('gap actions', () => {
  const page = { meta: { page: { currentPage: 1, lastPage: 1, perPage: 10, total: 1 } } };

  it('get_discount reads one discount by numeric ID', async () => {
    const { calls } = installFetch({ 'GET /discounts/3': () => jsonResponse({ value: { data: resource({ type: 'discounts', id: '3', attributes: { code: 'SAVE10' } }) } }) });
    expect(await runAction({ action: getDiscount, props: { discountId: '3' } })).toEqual({ id: '3', code: 'SAVE10' });
    expect(calls[0].method).toBe('GET');
    await expect(runAction({ action: getDiscount, props: { discountId: 'SAVE10' } })).rejects.toThrow(/numeric/);
  });

  it('list_license_key_instances filters by license key', async () => {
    const { calls } = installFetch({
      'GET /license-key-instances': () => jsonResponse({ value: { ...page, data: [resource({ type: 'license-key-instances', id: '9', attributes: { name: 'laptop' } })] } }),
    });
    expect(await runAction({ action: listLicenseKeyInstances, props: { licenseKeyId: '11' } })).toMatchObject({ items: [{ id: '9', name: 'laptop' }], total: 1 });
    expect(calls[0].url.searchParams.get('filter[license_key_id]')).toBe('11');
  });

  it('list_affiliates filters by store and email', async () => {
    const { calls } = installFetch({ 'GET /affiliates': () => jsonResponse({ value: { ...page, data: [] } }) });
    await runAction({ action: listAffiliates, props: { storeId: '5', userEmail: ' a@b.co ', perPage: 20 } });
    expect(calls[0].url.searchParams.get('filter[store_id]')).toBe('5');
    expect(calls[0].url.searchParams.get('filter[user_email]')).toBe('a@b.co');
    expect(calls[0].url.searchParams.get('page[size]')).toBe('20');
  });

  it('list_discount_redemptions filters by discount and order', async () => {
    const { calls } = installFetch({ 'GET /discount-redemptions': () => jsonResponse({ value: { ...page, data: [] } }) });
    await runAction({ action: listDiscountRedemptions, props: { discountId: '3', orderId: '7' } });
    expect(calls[0].url.searchParams.get('filter[discount_id]')).toBe('3');
    expect(calls[0].url.searchParams.get('filter[order_id]')).toBe('7');
    await expect(runAction({ action: listDiscountRedemptions, props: { orderId: '#7' } })).rejects.toThrow(/numeric/);
  });

  it('list_subscription_items filters by subscription', async () => {
    const { calls } = installFetch({
      'GET /subscription-items': () => jsonResponse({ value: { ...page, data: [resource({ type: 'subscription-items', id: '4', attributes: { quantity: 2 } })] } }),
    });
    expect(await runAction({ action: listSubscriptionItems, props: { subscriptionId: '2601139' } })).toMatchObject({ items: [{ id: '4', quantity: 2 }] });
    expect(calls[0].url.searchParams.get('filter[subscription_id]')).toBe('2601139');
  });

  it('validate_license posts the key form-encoded without auth and never returns the key', async () => {
    const { calls } = installFetch({
      'POST /licenses/validate': () =>
        jsonResponse({
          value: {
            valid: true,
            error: null,
            license_key: { id: 11, status: 'inactive', key: 'SECRET-KEY', activation_limit: 3, activation_usage: 0, expires_at: null, created_at: '2026-10-12T00:00:00Z', test_mode: true },
            instance: null,
            meta: { store_id: 5, product_name: 'P', customer_email: 'a@b.co' },
          },
        }),
    });
    const result = await runAction({ action: validateLicense, props: { licenseKey: ' SECRET-KEY ', instanceId: 'inst-1' } });
    expect(result).toMatchObject({ valid: true, error: null, license_key: { id: 11, activation_limit: 3 }, instance: null, meta: { store_id: 5 } });
    expect(JSON.stringify(result)).not.toContain('SECRET-KEY');
    expect(calls[0].body).toBe('license_key=SECRET-KEY&instance_id=inst-1');
    expect(calls[0].headers['authorization']).toBeUndefined();
    expect(calls).toHaveLength(1);
  });

  it('validate_license reports an unknown key as invalid, not as a failure', async () => {
    installFetch({ 'POST /licenses/validate': () => jsonResponse({ value: { valid: false, error: 'license_key not found.', license_key: null }, status: 404 }) });
    expect(await runAction({ action: validateLicense, props: { licenseKey: 'NOPE' } })).toEqual({
      valid: false,
      error: 'license_key not found.',
      license_key: null,
      instance: null,
      meta: null,
    });
  });

  it('validate_license fails on a server error', async () => {
    installFetch({ 'POST /licenses/validate': () => jsonResponse({ value: {}, status: 500 }) });
    await expect(runAction({ action: validateLicense, props: { licenseKey: 'K' } })).rejects.toThrow(/500/);
  });
});

function validate(auth: string) {
  return lemonSqueezyAuth.validate?.({ auth, server: { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', mintOidcToken: async () => '' } });
}
