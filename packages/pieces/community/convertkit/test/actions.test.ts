/// <reference types="vitest/globals" />

import { kitCreateTag } from '../src/lib/actions/ai/create-tag';
import { kitTagSubscriber } from '../src/lib/actions/ai/tag-subscriber';
import { kitRemoveTagFromSubscriber } from '../src/lib/actions/ai/remove-tag-from-subscriber';
import { kitUpdateSubscriber } from '../src/lib/actions/ai/update-subscriber';
import { kitUpdateBroadcast } from '../src/lib/actions/ai/update-broadcast';
import { kitCreateBroadcast } from '../src/lib/actions/ai/create-broadcast';
import { kitUpdateCustomField } from '../src/lib/actions/ai/update-custom-field';
import { kitListSubscribers } from '../src/lib/actions/ai/list-subscribers';
import { kitCreateWebhook } from '../src/lib/actions/ai/create-webhook';
import { SECRET, call, mockKit, run } from './helpers';

afterEach(() => vi.restoreAllMocks());

describe('Create Tag (get-or-create)', () => {
  test('returns the existing tag with created:false on a case-insensitive name match, without creating', async () => {
    const { requests } = mockKit([{ body: { tags: [{ id: 9, name: 'VIP Customers', created_at: '2026-01-01' }] } }]);
    const result = await run({ action: kitCreateTag, propsValue: { name: '  vip customers ' } });
    expect(result).toEqual({ id: 9, name: 'VIP Customers', created_at: '2026-01-01', created: false });
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe('GET');
  });

  test('creates the tag when none matches, with the secret in the query and not the body', async () => {
    const { requests } = mockKit([{ body: { tags: [] } }, { status: 201, body: { id: 10, name: 'New', created_at: '2026-01-02' } }]);
    const result = await run({ action: kitCreateTag, propsValue: { name: 'New' } });
    expect(result).toEqual({ id: 10, name: 'New', created_at: '2026-01-02', created: true });
    expect(requests[1]).toMatchObject({ method: 'POST', url: 'https://api.convertkit.com/v3/tags', body: { tag: { name: 'New' } } });
    expect(requests[1].queryParams).toEqual({ api_secret: SECRET });
  });
});

describe('Tag Subscriber', () => {
  test('sends the exact subscribe request', async () => {
    const { requests } = mockKit([{ body: { subscription: { id: 1 } } }]);
    await run({ action: kitTagSubscriber, propsValue: { tag_id: '123', email: ' a@b.co ', additional_tag_ids: ['4', 5], first_name: '' } });
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: 'https://api.convertkit.com/v3/tags/123/subscribe',
      body: { email: 'a@b.co', tags: [4, 5] },
    });
    expect(requests[0].body).not.toHaveProperty('first_name');
  });

  test('refuses a non-numeric tag ID before any request', async () => {
    const { requests } = mockKit([]);
    await expect(run({ action: kitTagSubscriber, propsValue: { tag_id: '12/../34', email: 'a@b.co' } })).rejects.toThrow('Tag ID must be a numeric Kit ID');
    expect(requests).toHaveLength(0);
  });
});

describe('Remove Tag From Subscriber', () => {
  test('uses DELETE /subscribers/:id/tags/:tag_id', async () => {
    const { requests } = mockKit([{ body: { id: 2, name: 'VIP' } }]);
    const result = await run({ action: kitRemoveTagFromSubscriber, propsValue: { subscriber_id: '1', tag_id: '2' } });
    expect(requests[0]).toMatchObject({ method: 'DELETE', url: 'https://api.convertkit.com/v3/subscribers/1/tags/2' });
    expect(result).toEqual({ removed: true, subscriber_id: '1', tag_id: 2, tag_name: 'VIP' });
  });
});

describe('Update Subscriber (partial update)', () => {
  test('an empty first name is left out so the stored name is kept', async () => {
    const { requests } = mockKit([{ body: { subscriber: { id: 1 } } }]);
    await run({ action: kitUpdateSubscriber, propsValue: { subscriber_id: '1', first_name: '', fields: { plan: 'pro' } } });
    expect(requests[0].body).toEqual({ fields: { plan: 'pro' } });
  });

  test('an update with nothing set is refused before any request', async () => {
    const { requests } = mockKit([]);
    await expect(run({ action: kitUpdateSubscriber, propsValue: { subscriber_id: '1', first_name: '', email_address: '' } })).rejects.toThrow('Provide at least one');
    expect(requests).toHaveLength(0);
  });
});

describe('Update Broadcast (partial update)', () => {
  test('sends only the fields that were set and never send_at implicitly', async () => {
    const { requests } = mockKit([{ body: { broadcast: { id: 5 } } }]);
    await run({ action: kitUpdateBroadcast, propsValue: { broadcast_id: '5', subject: 'New subject', public: 'false' } });
    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'https://api.convertkit.com/v3/broadcasts/5' });
    expect(requests[0].body).toEqual({ subject: 'New subject', public: false });
  });

  test('a past send time is refused before any request', async () => {
    const { requests } = mockKit([]);
    await expect(run({ action: kitUpdateBroadcast, propsValue: { broadcast_id: '5', send_at: '2000-01-01T00:00:00Z' } })).rejects.toThrow('Send At must be in the future');
    expect(requests).toHaveLength(0);
  });

  test('Create Broadcast stays a draft when send_at is empty', async () => {
    const { requests } = mockKit([{ status: 201, body: { broadcast: { id: 6 } } }]);
    await run({ action: kitCreateBroadcast, propsValue: { subject: 'Draft', content: '<p>x</p>' } });
    expect(requests[0].body).toEqual({ subject: 'Draft', content: '<p>x</p>' });
  });
});

describe('Update Custom Field', () => {
  test('a failed read-back after a successful rename is reported, not thrown', async () => {
    const { requests } = mockKit([{ status: 204 }, { error: { status: 500, body: { error: 'boom' } } }]);
    const result = await run({ action: kitUpdateCustomField, propsValue: { custom_field_id: '77', label: 'Plan' } });
    expect(requests[0]).toMatchObject({ method: 'PUT', url: 'https://api.convertkit.com/v3/custom_fields/77', body: { label: 'Plan' } });
    expect(result).toMatchObject({ id: 77, label: 'Plan', refreshed: false });
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });

  test('returns the refreshed field when the read-back works', async () => {
    mockKit([{ status: 204 }, { body: { custom_fields: [{ id: 77, key: 'plan', label: 'Plan', name: 'ck_field_77_plan' }] } }]);
    const result = await run({ action: kitUpdateCustomField, propsValue: { custom_field_id: '77', label: 'Plan' } });
    expect(result).toEqual({ id: 77, key: 'plan', label: 'Plan', name: 'ck_field_77_plan', refreshed: true });
  });
});

describe('List Subscribers', () => {
  test('passes date filters as YYYY-MM-DD and a validated page', async () => {
    const { requests } = mockKit([{ body: { subscribers: [], page: 2, total_pages: 2, total_subscribers: 51 } }]);
    const result = await run({ action: kitListSubscribers, propsValue: { from: '2026-09-01T12:00:00Z', page: 2 } });
    expect(requests[0].queryParams).toEqual({ api_secret: SECRET, page: '2', from: '2026-09-01' });
    expect(result).toEqual({ subscribers: [], page: 2, total_pages: 2, total_subscribers: 51 });
  });

  test('an invalid date is refused before any request', async () => {
    const { requests } = mockKit([]);
    await expect(run({ action: kitListSubscribers, propsValue: { from: 'last week' } })).rejects.toThrow('is not a valid date');
    expect(requests).toHaveLength(0);
  });
});

describe('Create Webhook', () => {
  test('refuses a non-https target before any request', async () => {
    const { requests } = mockKit([]);
    await expect(run({ action: kitCreateWebhook, propsValue: { target_url: 'http://example.com/hook', event: 'subscriber.subscriber_activate' } })).rejects.toThrow('Target URL must be a public https:// URL');
    expect(requests).toHaveLength(0);
  });

  test('refuses an event whose required parameter is missing', async () => {
    const { requests } = mockKit([]);
    await expect(run({ action: kitCreateWebhook, propsValue: { target_url: 'https://example.com/hook', event: 'subscriber.tag_add' } })).rejects.toThrow('requires');
    expect(requests).toHaveLength(0);
  });
});

describe('connection validation', () => {
  test('a 401 from Kit is reported as a rejected API Secret', async () => {
    const { convertkitAuth } = await import('../src/lib/auth');
    const { requests } = mockKit([{ error: { status: 401, body: { error: 'Authorization Failed' } } }]);
    const result = await call({ target: convertkitAuth, method: 'validate', context: { auth: SECRET } });
    expect(requests[0]).toMatchObject({ method: 'GET', url: 'https://api.convertkit.com/v3/account', queryParams: { api_secret: SECRET } });
    expect(result).toEqual({ valid: false, error: expect.stringContaining('Kit rejected this API Secret') });
  });

  test('validates the secret exactly as actions will send it', async () => {
    const { convertkitAuth } = await import('../src/lib/auth');
    const { requests } = mockKit([{ body: { name: 'Odai', primary_email_address: 'a@b.co' } }]);
    await call({ target: convertkitAuth, method: 'validate', context: { auth: ` ${SECRET} ` } });
    expect(requests[0]).toMatchObject({ queryParams: { api_secret: ` ${SECRET} ` } });
  });

  test('a working secret is valid', async () => {
    const { convertkitAuth } = await import('../src/lib/auth');
    mockKit([{ body: { name: 'Odai', primary_email_address: 'a@b.co' } }]);
    expect(await call({ target: convertkitAuth, method: 'validate', context: { auth: SECRET } })).toEqual({ valid: true });
  });
});
