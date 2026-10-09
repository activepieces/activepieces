import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createOrUpdateSubscriberAction } from '../src/lib/actions/ai/create-or-update-subscriber.action';
import { batchUpsertSubscribersAction } from '../src/lib/actions/batch-upsert-subscribers.action';
import { deleteSubscriberAction } from '../src/lib/actions/delete-subscriber.action';
import { findSubscriberAction } from '../src/lib/actions/find-subscriber.action';
import { listSubscriberCampaignsAction } from '../src/lib/actions/list-subscriber-campaigns.action';
import { listSubscribersAction } from '../src/lib/actions/list-subscribers.action';
import { removeFromCampaignAction } from '../src/lib/actions/remove-from-campaign.action';
import { unsubscribeSubscriberAction } from '../src/lib/actions/unsubscribe-subscriber.action';
import { run, stubFetch } from './helpers';

const A = '4617837';
const SUB = { id: 'z1tog', email: 'odai+aptest-1@activepieces.com', status: 'active', tags: ['Customer'] };
const NOT_FOUND = { status: 404, body: { errors: [{ code: 'not_found_error', message: 'The resource you requested was not found' }] } };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('find_subscriber', () => {
  test('GETs the encoded email and returns found + subscriber', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [SUB] } }));
    await expect(run(findSubscriberAction)({ accountId: A, subscriber: SUB.email })).resolves.toEqual({ found: true, subscriber: SUB });
    expect(seen[0].method).toBe('GET');
    expect(seen[0].url).toBe(`https://api.getdrip.com/v2/${A}/subscribers/odai%2Baptest-1%40activepieces.com`);
  });
  test('404 is found=false; other errors fail', async () => {
    stubFetch(() => NOT_FOUND);
    await expect(run(findSubscriberAction)({ accountId: A, subscriber: 'x@y.co' })).resolves.toEqual({ found: false, subscriber: null });
    vi.unstubAllGlobals();
    stubFetch(() => ({ status: 500, body: { errors: [{ code: 'x', message: 'boom' }] } }));
    await expect(run(findSubscriberAction)({ accountId: A, subscriber: 'x@y.co' })).rejects.toThrow('boom');
  });
  test('resolves the single account when Account ID is empty', async () => {
    const seen = stubFetch((request) => (request.path === '/accounts' ? { body: { accounts: [{ id: A, name: 'a' }] } } : { body: { subscribers: [SUB] } }));
    await run(findSubscriberAction)({ subscriber: SUB.id });
    expect(seen.map((r) => r.path)).toEqual(['/accounts', `/${A}/subscribers/z1tog`]);
  });
});

describe('list_subscribers', () => {
  test('sends filters and paging and reports hasMore from total_pages', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [SUB], meta: { page: 2, total_pages: 3, total_count: 5 } } }));
    const result = await run(listSubscribersAction)({
      accountId: A,
      status: 'all',
      tags: ['VIP', 'Customer'],
      subscribedAfter: '2026-01-01T00:00:00.000Z',
      page: 2,
      perPage: 2,
    });
    expect(Object.fromEntries(seen[0].query)).toEqual({ status: 'all', tags: 'VIP,Customer', subscribed_after: '2026-01-01T00:00:00Z', page: '2', per_page: '2' });
    expect(result).toEqual({ items: [SUB], page: 2, totalPages: 3, totalCount: 5, hasMore: true });
  });
  test('rejects tags with commas, bad dates and perPage over 1000 before any request', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(run(listSubscribersAction)({ accountId: A, tags: ['a,b'] })).rejects.toThrow('commas');
    await expect(run(listSubscribersAction)({ accountId: A, subscribedBefore: 'soon' })).rejects.toThrow('ISO-8601');
    await expect(run(listSubscribersAction)({ accountId: A, perPage: 5000 })).rejects.toThrow('between 1 and 1000');
    expect(seen).toHaveLength(0);
  });
});

describe('create_or_update_subscriber', () => {
  test('sends only the fields given and returns the subscriber', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [SUB] } }));
    const result = await run(createOrUpdateSubscriberAction)({
      accountId: A,
      subscriber: SUB.email,
      firstName: 'Odai',
      lastName: '',
      newEmail: 'odai+aptest-2@activepieces.com',
      lifetimeValue: 2500,
      customFields: { plan: 'pro' },
      tags: ['a'],
      removeTags: ['b'],
    });
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe(`/${A}/subscribers`);
    expect(seen[0].body).toEqual({
      subscribers: [
        {
          email: SUB.email,
          first_name: 'Odai',
          new_email: 'odai+aptest-2@activepieces.com',
          lifetime_value: 2500,
          custom_fields: { plan: 'pro' },
          tags: ['a'],
          remove_tags: ['b'],
        },
      ],
    });
    expect(result).toEqual(SUB);
  });
  test('an ID updates by id; a non-integer lifetime value is refused', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [SUB] } }));
    await run(createOrUpdateSubscriberAction)({ accountId: A, subscriber: 'z1tog', city: 'Amman' });
    expect(seen[0].body).toEqual({ subscribers: [{ id: 'z1tog', city: 'Amman' }] });
    await expect(run(createOrUpdateSubscriberAction)({ accountId: A, subscriber: 'z1tog', lifetimeValue: 1.5 })).rejects.toThrow('whole number');
  });
});

describe('delete_subscriber', () => {
  test('DELETE 204 → deleted; 404 → alreadyDeleted', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    await expect(run(deleteSubscriberAction)({ accountId: A, subscriber: SUB.email })).resolves.toEqual({ subscriber: SUB.email, deleted: true, alreadyDeleted: false });
    expect(seen[0].method).toBe('DELETE');
    vi.unstubAllGlobals();
    stubFetch(() => NOT_FOUND);
    await expect(run(deleteSubscriberAction)({ accountId: A, subscriber: SUB.email })).resolves.toEqual({ subscriber: SUB.email, deleted: false, alreadyDeleted: true });
  });
  test('refuses an empty subscriber', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    await expect(run(deleteSubscriberAction)({ accountId: A, subscriber: '  ' })).rejects.toThrow('required');
    expect(seen).toHaveLength(0);
  });
});

describe('unsubscribe / remove from email series / subscriptions', () => {
  test('unsubscribe POSTs unsubscribe_all', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [{ ...SUB, status: 'unsubscribed' }] } }));
    await expect(run(unsubscribeSubscriberAction)({ accountId: A, subscriber: SUB.id })).resolves.toMatchObject({ status: 'unsubscribed' });
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe(`/${A}/subscribers/z1tog/unsubscribe_all`);
  });
  test('remove passes campaign_id only when given', async () => {
    const seen = stubFetch(() => ({ body: { subscribers: [SUB] } }));
    await run(removeFromCampaignAction)({ accountId: A, subscriber: SUB.id, campaignId: '123' });
    await run(removeFromCampaignAction)({ accountId: A, subscriber: SUB.id });
    expect(seen[0].query.get('campaign_id')).toBe('123');
    expect(seen[1].query.has('campaign_id')).toBe(false);
    await expect(run(removeFromCampaignAction)({ accountId: A, subscriber: SUB.id, campaignId: 'abc' })).rejects.toThrow('Campaign ID');
  });
  test('list subscriber campaigns pages', async () => {
    const seen = stubFetch(() => ({ body: { campaign_subscriptions: [{ id: '1', campaign_id: '9' }], meta: { total_pages: 1, total_count: 1 } } }));
    await expect(run(listSubscriberCampaignsAction)({ accountId: A, subscriber: SUB.email })).resolves.toEqual({ items: [{ id: '1', campaign_id: '9' }], page: 1, totalPages: 1, totalCount: 1, hasMore: false });
    expect(seen[0].path).toBe(`/${A}/subscribers/odai%2Baptest-1%40activepieces.com/campaign_subscriptions`);
  });
});

describe('batch_upsert_subscribers', () => {
  test('wraps the array in one batch', async () => {
    const seen = stubFetch(() => ({ status: 201, body: {} }));
    const subscribers = [{ email: 'odai+aptest-3@activepieces.com' }, { id: 'z1tog', tags: ['x'] }];
    await expect(run(batchUpsertSubscribersAction)({ accountId: A, subscribers })).resolves.toEqual({ submitted: 2, accepted: true });
    expect(seen[0].path).toBe(`/${A}/subscribers/batches`);
    expect(seen[0].body).toEqual({ batches: [{ subscribers }] });
  });
  test('validates size and identity before the request', async () => {
    const seen = stubFetch(() => ({ status: 201, body: {} }));
    await expect(run(batchUpsertSubscribersAction)({ accountId: A, subscribers: [] })).rejects.toThrow('between 1 and 1000');
    await expect(run(batchUpsertSubscribersAction)({ accountId: A, subscribers: Array.from({ length: 1001 }, (_, i) => ({ email: `${i}@x.co` })) })).rejects.toThrow('between 1 and 1000');
    await expect(run(batchUpsertSubscribersAction)({ accountId: A, subscribers: [{ email: 'a@b.co' }, { first_name: 'x' }] })).rejects.toThrow('#2');
    await expect(run(batchUpsertSubscribersAction)({ accountId: A, subscribers: '{"a":1}' })).rejects.toThrow('list');
    expect(seen).toHaveLength(0);
  });
});
