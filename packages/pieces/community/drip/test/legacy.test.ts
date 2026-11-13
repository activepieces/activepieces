import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { dripAddSubscriberToCampaign } from '../src/lib/actions/add-subscriber-to-campaign.action';
import { dripApplyTagToSubscriber } from '../src/lib/actions/apply-tag-to-subscriber.action';
import { dripUpsertSubscriberAction } from '../src/lib/actions/upsert-subscriber.action';
import { dripAuth } from '../src/lib/auth';
import { dripCommon } from '../src/lib/common';
import { dripConnection, run, runStep, SERVER, stubFetch, TOKEN } from './helpers';

const A = '4617837';
const EMAIL = 'odai+aptest-1@activepieces.com';
const ctx = { server: SERVER, project: { id: 'p', externalId: () => undefined }, flows: {}, step: { name: 's' } };

function options({ prop, propsValue = {} }: { prop: { options: (propsValue: never, context: never) => Promise<unknown> }; propsValue?: Record<string, unknown> }) {
  return runStep(Reflect.apply(prop.options, prop, [{ auth: dripConnection(), ...propsValue }, ctx]));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('existing actions keep their request and raw response shape', () => {
  test('upsert_subscriber posts the same body and returns {status, headers, body}', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [{ id: 'z', email: EMAIL }] } }));
    const result = await run(dripUpsertSubscriberAction)({ account_id: A, subscriber: EMAIL, first_name: 'O', address: 'Line 1', tags: ['t'] });
    expect(seen[0].url).toBe(`https://api.getdrip.com/v2/${A}/subscribers`);
    expect(seen[0].auth).toBe(`Basic ${Buffer.from(TOKEN).toString('base64')}`);
    expect(seen[0].body).toEqual({ subscribers: [{ email: EMAIL, tags: ['t'], address1: 'Line 1', first_name: 'O' }] });
    expect(result).toMatchObject({ status: 200, body: { subscribers: [{ id: 'z', email: EMAIL }] } });
    expect(result).toHaveProperty('headers');
  });
  test('apply_tag_to_subscriber posts tags and returns the 201 response', async () => {
    const seen = stubFetch(() => ({ status: 201, body: {} }));
    await expect(run(dripApplyTagToSubscriber)({ account_id: A, subscriber: EMAIL, tag: 'x' })).resolves.toMatchObject({ status: 201, body: {} });
    expect(seen[0].body).toEqual({ tags: [{ email: EMAIL, tag: 'x' }] });
  });
  test('add_subscriber_to_campaign posts to the campaign and does not send double_optin', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [{ id: 'z' }] } }));
    await run(dripAddSubscriberToCampaign)({ account_id: A, campaign_id: '9', subscriber: EMAIL, custom_fields: { a: 1 } });
    expect(seen[0].path).toBe(`/${A}/campaigns/9/subscribers`);
    expect(seen[0].body).toEqual({ subscribers: [{ email: EMAIL, custom_fields: { a: 1 } }] });
  });
  test('errors carry the Drip message', async () => {
    stubFetch(() => ({ status: 422, body: { errors: [{ code: 'email_error', attribute: 'email', message: 'Email is invalid' }] } }));
    await expect(run(dripUpsertSubscriberAction)({ account_id: A, subscriber: 'bad' })).rejects.toThrow('email: Email is invalid');
  });
});

describe('dropdowns', () => {
  test('account dropdown lists accounts', async () => {
    stubFetch(() => ({ body: { accounts: [{ id: A, name: 'activepieces' }] } }));
    await expect(options({ prop: dripCommon.account_id })).resolves.toEqual({ disabled: false, options: [{ value: A, label: 'activepieces' }] });
  });
  test('account dropdown shows the Drip error instead of throwing', async () => {
    stubFetch(() => ({ status: 401, body: { errors: [{ code: 'authentication_error', message: 'bad token' }] } }));
    await expect(options({ prop: dripCommon.account_id })).resolves.toMatchObject({ disabled: true, options: [], placeholder: expect.stringContaining('invalid or was revoked') });
  });
  test('campaign dropdown follows total_pages and labels the status', async () => {
    const seen = stubFetch((_request, index) => ({ body: { campaigns: [{ id: String(index), name: `C${index}`, status: index === 0 ? 'draft' : 'active' }], meta: { total_pages: 2 } } }));
    const result = await options({ prop: dripCommon.campaign_id({ required: true }), propsValue: { account_id: A } });
    expect(seen).toHaveLength(2);
    expect(seen[0].query.get('per_page')).toBe('1000');
    expect(seen[1].query.get('page')).toBe('2');
    expect(result).toEqual({ disabled: false, options: [{ value: '0', label: 'C0 (draft)' }, { value: '1', label: 'C1 (active)' }] });
  });
  test('campaign dropdown stops after 10 pages', async () => {
    const seen = stubFetch(() => ({ body: { campaigns: [{ id: '1', name: 'C', status: 'active' }], meta: { total_pages: 50 } } }));
    const result = await options({ prop: dripCommon.campaign_id({ required: true }), propsValue: { account_id: A } });
    expect(seen).toHaveLength(10);
    expect(result).toMatchObject({ disabled: false, placeholder: expect.stringContaining('Drip has more') });
  });
  test('campaign dropdown shows no truncation note when the last page is the 10th', async () => {
    stubFetch((_request, index) => ({ body: { campaigns: [{ id: String(index), name: 'C', status: 'active' }], meta: { total_pages: 10 } } }));
    const result = await options({ prop: dripCommon.campaign_id({ required: true }), propsValue: { account_id: A } });
    expect(result).not.toHaveProperty('placeholder');
  });
  test('campaign dropdown needs an account and reports a disabled Drip account', async () => {
    await expect(options({ prop: dripCommon.campaign_id({ required: true }) })).resolves.toMatchObject({ disabled: true, placeholder: 'Please select an account first' });
    stubFetch(() => ({ status: 403, body: { errors: [{ code: 'authorization_error', message: 'Your account is disabled.' }] } }));
    await expect(options({ prop: dripCommon.campaign_id({ required: true }), propsValue: { account_id: A } })).resolves.toMatchObject({ disabled: true, placeholder: expect.stringContaining('account is disabled') });
  });
});

describe('auth.validate', () => {
  function validate() {
    return runStep(Reflect.apply(dripAuth.validate ?? (async () => undefined), dripAuth, [{ auth: TOKEN, server: SERVER }]));
  }
  test('valid with accounts', async () => {
    const seen = stubFetch(() => ({ body: { accounts: [{ id: A, name: 'a' }] } }));
    await expect(validate()).resolves.toEqual({ valid: true });
    expect(seen[0].url).toBe('https://api.getdrip.com/v2/accounts');
  });
  test('401 is an invalid token; other errors explain themselves; no accounts is invalid', async () => {
    stubFetch(() => ({ status: 401, body: { errors: [{ code: 'authentication_error', message: 'x' }] } }));
    await expect(validate()).resolves.toMatchObject({ valid: false, error: expect.stringContaining('Invalid Drip API token') });
    vi.unstubAllGlobals();
    stubFetch(() => ({ status: 500, body: { errors: [{ code: 'x', message: 'down' }] } }));
    await expect(validate()).resolves.toMatchObject({ valid: false, error: expect.stringContaining('down') });
    vi.unstubAllGlobals();
    stubFetch(() => ({ body: { accounts: [] } }));
    await expect(validate()).resolves.toMatchObject({ valid: false, error: expect.stringContaining('no accounts') });
  });
});
