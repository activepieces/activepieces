import { afterEach, describe, expect, test, vi } from 'vitest';
import { createHash } from 'crypto';
import mailchimpSdk from '@mailchimp/mailchimp_marketing';
import { HttpMethod } from '@activepieces/pieces-common';
import '../src';
import { mailchimpApi, MailchimpApiError } from '../src/lib/common/client';
import { mailchimpCommon } from '../src/lib/common';
import { archiveSubscriber } from '../src/lib/actions/archive-subscriber';
import { createAudience } from '../src/lib/actions/create-audience';
import { findCustomer } from '../src/lib/actions/find-customer';
import { replicateCampaign } from '../src/lib/actions/replicate-campaign';
import { getCampaignContent } from '../src/lib/actions/get-campaign-content';
import { getAudience } from '../src/lib/actions/get-audience';
import { listTemplates } from '../src/lib/actions/list-templates';
import { listSegments } from '../src/lib/actions/list-segments';
import { listMergeFields } from '../src/lib/actions/list-merge-fields';
import { removeSubscriberFromTag } from '../src/lib/actions/remove-subscriber-from-tag';
import { unsubscribeEmail } from '../src/lib/actions/unsubscribe-email';
import { addMemberToList } from '../src/lib/actions/add-member-to-list';

const HASH = createHash('md5').update('ada@ap.test').digest('hex');

function sdkError({ status, body }: { status: number; body: unknown }): Error {
  return Object.assign(new Error('Bad Request'), { status, response: { status, body } });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('client helpers', () => {
  test('listAll throws past the page cap instead of truncating', async () => {
    const page = Array.from({ length: 1000 }, (_, index) => ({ id: index }));
    route({ 'GET /lists': { status: 200, body: { lists: page, total_items: 50000 } } });
    const client = mailchimpApi.createClient({ accessToken: 'TKN' });
    await expect(client.listAll({ path: '/lists', itemsKey: 'lists', operation: 'list audiences' })).rejects.toThrow('more than 20000');
  });

  test('readPaging enforces bounds and defaults', () => {
    expect(mailchimpApi.readPaging({ count: undefined, offset: undefined, defaultCount: 100 })).toEqual({ count: 100, offset: 0 });
    expect(mailchimpApi.readPaging({ count: 1000, offset: 5, defaultCount: 100 })).toEqual({ count: 1000, offset: 5 });
    expect(() => mailchimpApi.readPaging({ count: 0, offset: 0, defaultCount: 100 })).toThrow('between 1 and 1000');
    expect(() => mailchimpApi.readPaging({ count: 1001, offset: 0, defaultCount: 100 })).toThrow('between 1 and 1000');
    expect(() => mailchimpApi.readPaging({ count: 10, offset: -1, defaultCount: 100 })).toThrow('Offset');
  });

  test('toMailchimpError keeps status and responseBody and names the vendor detail', () => {
    const error = mailchimpApi.toMailchimpError({
      error: sdkError({ status: 400, body: { title: 'Invalid Resource', detail: 'Bad email', errors: [{ field: 'email_address', message: 'invalid' }] } }),
      operation: 'create audience',
      method: HttpMethod.POST,
    });
    expect(error).toBeInstanceOf(MailchimpApiError);
    expect(error.status).toBe(400);
    expect(error.responseBody).toEqual({ title: 'Invalid Resource', detail: 'Bad email', errors: [{ field: 'email_address', message: 'invalid' }] });
    expect(error.message).toBe('Mailchimp create audience failed (HTTP 400): Invalid Resource - Bad email - email_address: invalid');
    expect('body' in error).toBe(false);
  });

  test('toMailchimpError warns that a failed write may still have applied', () => {
    const write = mailchimpApi.toMailchimpError({ error: new TypeError('fetch failed'), operation: 'send', method: HttpMethod.POST });
    expect(write.message).toContain('may still have been applied');
    const read = mailchimpApi.toMailchimpError({ error: new TypeError('fetch failed'), operation: 'get', method: HttpMethod.GET });
    expect(read.message).not.toContain('may still have been applied');
  });

  test('requestOrNotFound maps 404 to null and rethrows other errors', async () => {
    route({ 'GET /lists/L2': { status: 500, body: { title: 'Server' } } });
    const client = mailchimpApi.createClient({ accessToken: 'TKN' });
    await expect(client.requestOrNotFound({ method: HttpMethod.GET, path: '/lists/L1', operation: 'get' })).resolves.toBeNull();
    await expect(client.requestOrNotFound({ method: HttpMethod.GET, path: '/lists/L2', operation: 'get' })).rejects.toMatchObject({ status: 500 });
  });
});

describe('archive_subscriber', () => {
  test('405 already archived converges to success', async () => {
    vi.spyOn(mailchimpSdk.lists, 'deleteListMember').mockRejectedValue(sdkError({ status: 405, body: { title: 'Method Not Allowed' } }));
    route({});
    const result = await archiveSubscriber.run(ctx({ list_id: 'L1', subscriber_hash: 'Ada@ap.test' }));
    expect(result).toMatchObject({ success: true, already_archived: true, subscriber_hash: HASH, list_id: 'L1' });
    expect(JSON.stringify(archiveSubscriber.outputSchema)).toContain('already_archived');
  });

  test('other errors show the Mailchimp detail', async () => {
    vi.spyOn(mailchimpSdk.lists, 'deleteListMember').mockRejectedValue(sdkError({ status: 403, body: { title: 'Forbidden', detail: 'No access' } }));
    route({});
    await expect(archiveSubscriber.run(ctx({ list_id: 'L1', subscriber_hash: HASH }))).rejects.toMatchObject({ status: 403, message: expect.stringContaining('No access') });
  });
});

describe('create_audience', () => {
  test('email_type_option defaults to true and is sent when unset', async () => {
    expect(createAudience.props['email_type_option'].defaultValue).toBe(true);
    const spy = vi.spyOn(mailchimpSdk.lists, 'createList').mockResolvedValue({ id: 'L9', name: 'News' });
    route({});
    await createAudience.run(ctx({ name: 'News', company: 'AP', address1: 'a', city: 'c', country: 'US', permission_reminder: 'p', from_name: 'f', from_email: 'f@ap.test', subject: 's', language: 'en' }));
    expect(spy.mock.calls[0][0]).toMatchObject({ name: 'News', email_type_option: true, contact: { company: 'AP', country: 'US' } });
  });

  test('errors show the Mailchimp detail', async () => {
    vi.spyOn(mailchimpSdk.lists, 'createList').mockRejectedValue(sdkError({ status: 403, body: { title: 'Forbidden', detail: 'Free plan allows one audience' } }));
    route({});
    await expect(createAudience.run(ctx({ name: 'News' }))).rejects.toMatchObject({ status: 403, message: expect.stringContaining('Free plan allows one audience') });
  });
});

describe('find_customer', () => {
  test('errors show the Mailchimp detail', async () => {
    vi.spyOn(mailchimpSdk.ecommerce, 'getAllStoreCustomers').mockRejectedValue(sdkError({ status: 404, body: { title: 'Resource Not Found', detail: 'Store not found' } }));
    route({});
    await expect(findCustomer.run(ctx({ store_id: 'S1', email_address: 'ada@ap.test' }))).rejects.toMatchObject({ status: 404, message: expect.stringContaining('Store not found') });
  });
});

describe('campaign and audience reads', () => {
  test('replicate_campaign posts the replicate action and returns the new campaign', async () => {
    const seen = route({ 'POST /campaigns/C1/actions/replicate': { status: 200, body: { id: 'C2', web_id: 3, type: 'regular', status: 'save', settings: { title: 'Copy' } } } });
    expect(await replicateCampaign.run(ctx({ campaign_id: 'C1' }))).toMatchObject({ id: 'C2', status: 'save', title: 'Copy' });
    expect(seen[0].key).toBe('POST /campaigns/C1/actions/replicate');
  });

  test('get_campaign_content returns html and plain text', async () => {
    route({ 'GET /campaigns/C1/content': { status: 200, body: { html: '<p>x</p>', plain_text: 'x', archive_html: 'ignored' } } });
    expect(await getCampaignContent.run(ctx({ campaign_id: 'C1' }))).toEqual({ campaign_id: 'C1', html: '<p>x</p>', plain_text: 'x' });
  });

  test('get_audience flattens stats and defaults', async () => {
    route({ 'GET /lists/L1': { status: 200, body: { id: 'L1', name: 'News', web_id: 1, campaign_defaults: { from_email: 'f@ap.test' }, stats: { member_count: 4, open_rate: 0.5 } } } });
    expect(await getAudience.run(ctx({ list_id: 'L1' }))).toMatchObject({ id: 'L1', from_email: 'f@ap.test', member_count: 4, open_rate: 0.5, cleaned_count: 0 });
  });

  test('list_templates sends type and paging and reports has_more', async () => {
    const seen = route({ 'GET /templates': { status: 200, body: { templates: [{ id: 5, name: 'Basic', type: 'user' }], total_items: 3 } } });
    const result = await listTemplates.run(ctx({ type: 'user', count: 1, offset: 0 }));
    expect(seen[0].query.get('type')).toBe('user');
    expect(result).toMatchObject({ templates: [{ id: 5, name: 'Basic' }], has_more: true });
  });

  test('list_segments filters by type', async () => {
    const seen = route({ 'GET /lists/L1/segments': { status: 200, body: { segments: [{ id: 7, name: 'VIP', type: 'static', member_count: 2 }], total_items: 1 } } });
    const result = await listSegments.run(ctx({ list_id: 'L1', type: 'static' }));
    expect(seen[0].query.get('type')).toBe('static');
    expect(result).toEqual({ segments: [{ id: 7, name: 'VIP', type: 'static', member_count: 2, created_at: null, updated_at: null }], total_items: 1, has_more: false });
  });

  test('list_merge_fields maps choices', async () => {
    route({ 'GET /lists/L1/merge-fields': { status: 200, body: { merge_fields: [{ merge_id: 3, tag: 'PLAN', name: 'Plan', type: 'dropdown', options: { choices: ['A', 'B'] } }], total_items: 1 } } });
    expect(await listMergeFields.run(ctx({ list_id: 'L1' }))).toEqual({
      merge_fields: [{ merge_id: 3, tag: 'PLAN', name: 'Plan', type: 'dropdown', required: false, default_value: '', choices: ['A', 'B'] }],
      total_items: 1,
    });
  });
});

describe('existing actions keep their contract', () => {
  test('remove_subscriber_from_tag posts an inactive tag and keeps data and _links', async () => {
    const seen = route({ [`POST /lists/L1/members/${HASH}/tags`]: { status: 204 } });
    const result = await removeSubscriberFromTag.run(ctx({ list_id: 'L1', email: 'ada@ap.test', tag_name: 'vip' }));
    expect(seen[0].body).toEqual({ tags: [{ name: 'vip', status: 'inactive' }] });
    expect(result).toEqual({ success: true, message: 'Successfully removed subscriber ada@ap.test from tag vip', data: null, _links: [] });
  });

  test('unsubscribe_email aiMetadata matches the always-update behaviour', () => {
    expect(unsubscribeEmail.aiMetadata?.description).not.toContain('update existing');
    expect(unsubscribeEmail.props['update_existing'].description).toContain('No longer used');
  });

  test('add_member_to_list accepts merge_fields as a JSON string', async () => {
    const spy = vi.spyOn(mailchimpSdk.lists, 'setListMember').mockResolvedValue({ id: HASH, email_address: 'ada@ap.test', status: 'subscribed', list_id: 'L1' });
    route({});
    await addMemberToList.run(ctx({ list_id: 'L1', email_address: 'ada@ap.test', status_if_new: 'subscribed', merge_fields: '{"PHONE":"1"}', first_name: 'Ada' }));
    expect(spy.mock.calls[0][2]).toMatchObject({ merge_fields: { PHONE: '1', FNAME: 'Ada' } });
  });
});

describe('dropdowns', () => {
  test('segment dropdown asks for an audience first and lists segments with string ids', async () => {
    const options = mailchimpCommon.mailChimpSegmentIdDropdown.options;
    expect(await options({ auth: { access_token: 'TKN' }, list_id: '' }, ctx({}))).toMatchObject({ disabled: true, placeholder: 'Select an audience first' });
    route({ 'GET /lists/L1/segments': { status: 200, body: { segments: [{ id: 7, name: 'VIP', type: 'static' }], total_items: 1 } } });
    expect(await options({ auth: { access_token: 'TKN' }, list_id: 'L1' }, ctx({}))).toEqual({ disabled: false, options: [{ label: 'VIP (static)', value: '7' }] });
  });

  test('optional list dropdown is optional, lists audiences, and shows errors disabled', async () => {
    const dropdown = mailchimpCommon.mailChimpOptionalListIdDropdown;
    expect(dropdown.required).toBe(false);
    route({ 'GET /lists': { status: 200, body: { lists: [{ id: 'L1', name: 'News' }], total_items: 1 } } });
    expect(await dropdown.options({ auth: { access_token: 'TKN' } }, ctx({}))).toEqual({ disabled: false, options: [{ label: 'News', value: 'L1' }] });
    route({ 'GET /lists': { status: 401, body: { title: 'API Key Invalid' } } });
    expect(await dropdown.options({ auth: { access_token: 'TKN' } }, ctx({}))).toMatchObject({ disabled: true, placeholder: expect.stringContaining('HTTP 401') });
  });
});

afterEach(() => vi.unstubAllGlobals());

function ctx(propsValue: Record<string, unknown>) {
  return Object.assign(Object.create(null), {
    auth: { access_token: 'TKN', data: {}, props: {} },
    propsValue,
  });
}

function route(routes: Record<string, Reply | Reply[]>): Seen[] {
  const seen: Seen[] = [];
  const counters: Record<string, number> = {};
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.hostname === 'login.mailchimp.com') {
        return new Response(JSON.stringify({ dc: 'us1' }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      const method = (init?.method ?? 'GET').toUpperCase();
      const key = `${method} ${url.pathname.replace('/3.0', '')}`;
      seen.push({ key, query: url.searchParams, body: typeof init?.body === 'string' ? JSON.parse(init.body) : null });
      const entry = routes[key];
      const index = counters[key] ?? 0;
      counters[key] = index + 1;
      const reply = Array.isArray(entry) ? entry[Math.min(index, entry.length - 1)] : entry;
      if (reply === undefined) {
        return new Response(JSON.stringify({ title: 'Resource Not Found', status: 404 }), { status: 404, headers: { 'content-type': 'application/json' } });
      }
      if (reply.status === 204) {
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'content-type': 'application/json' } });
    })
  );
  return seen;
}

type Reply = { status: number; body?: unknown };

type Seen = { key: string; query: URLSearchParams; body: unknown };
