import { afterEach, describe, expect, test, vi } from 'vitest';
import { mailchimp } from '../src';
import { getMemberActivity } from '../src/lib/actions/get-member-activity';
import { createHash } from 'crypto';
import { listAudiences } from '../src/lib/actions/list-audiences';
import { listMembers } from '../src/lib/actions/list-members';
import { searchMembers } from '../src/lib/actions/search-members';
import { getMemberTags } from '../src/lib/actions/get-member-tags';
import { deleteMemberPermanently } from '../src/lib/actions/delete-member-permanently';
import { listInterestCategories } from '../src/lib/actions/list-interest-categories';
import { addMemberToSegment } from '../src/lib/actions/add-member-to-segment';
import { removeMemberFromSegment } from '../src/lib/actions/remove-member-from-segment';
import { setCampaignContent } from '../src/lib/actions/set-campaign-content';
import { sendTestEmail } from '../src/lib/actions/send-test-email';
import { scheduleCampaign } from '../src/lib/actions/schedule-campaign';
import { deleteCampaign } from '../src/lib/actions/delete-campaign';
import { listCampaigns } from '../src/lib/actions/list-campaigns';
import { addMemberToList } from '../src/lib/actions/add-member-to-list';
import mailchimpSdk from '@mailchimp/mailchimp_marketing';
import { addNoteToSubscriber } from '../src/lib/actions/add-note-to-subscriber';

const HASH = createHash('md5').update('ada@ap.test').digest('hex');

describe('list actions', () => {
  test('list_audiences pages and reports has_more', async () => {
    const seen = route({ 'GET /lists': { status: 200, body: { lists: [{ id: 'L1', name: 'News', web_id: 1, stats: { member_count: 3 } }], total_items: 5 } } });
    const result = await listAudiences.run(ctx({ count: 1, offset: 2 }));
    expect(result).toEqual({ audiences: [{ id: 'L1', name: 'News', web_id: 1, member_count: 3, unsubscribe_count: 0, date_created: null }], total_items: 5, has_more: true });
    expect(seen[0].query.get('count')).toBe('1');
    expect(seen[0].query.get('offset')).toBe('2');
  });

  test('rejects a limit over 1000 before any request', async () => {
    const seen = route({});
    await expect(listAudiences.run(ctx({ count: 5000 }))).rejects.toThrow('Limit must be between 1 and 1000');
    expect(seen).toHaveLength(0);
  });

  test('list_members sends status and ISO since filter', async () => {
    const seen = route({ 'GET /lists/L1/members': { status: 200, body: { members: [{ id: HASH, email_address: 'ada@ap.test', status: 'subscribed', list_id: 'L1', tags: [{ id: 1, name: 'vip' }] }], total_items: 1 } } });
    const result = await listMembers.run(ctx({ list_id: 'L1', status: 'subscribed', since_last_changed: '2026-11-01T00:00:00Z' }));
    expect(seen[0].query.get('status')).toBe('subscribed');
    expect(seen[0].query.get('since_last_changed')).toBe('2026-11-01T00:00:00.000Z');
    expect(result.members[0]).toMatchObject({ email_address: 'ada@ap.test', tags: [{ id: 1, name: 'vip' }] });
    expect(result.has_more).toBe(false);
  });

  test('list_campaigns drops empty filters', async () => {
    const seen = route({ 'GET /campaigns': { status: 200, body: { campaigns: [{ id: 'C1', web_id: 9, type: 'regular', status: 'save', settings: { title: 'T', subject_line: 'S' }, recipients: { list_id: 'L1' } }], total_items: 1 } } });
    const result = await listCampaigns.run(ctx({ status: 'save' }));
    expect(seen[0].query.has('type')).toBe(false);
    expect(seen[0].query.get('status')).toBe('save');
    expect(result.campaigns[0]).toMatchObject({ id: 'C1', title: 'T', subject_line: 'S', list_id: 'L1' });
  });

  test('search_members returns both match groups', async () => {
    route({ 'GET /search-members': { status: 200, body: { exact_matches: { members: [{ id: HASH, email_address: 'ada@ap.test', status: 'subscribed', list_id: 'L1' }], total_items: 1 }, full_search: { members: [], total_items: 0 } } } });
    const result = await searchMembers.run(ctx({ query: 'ada' }));
    expect(result.exact_total).toBe(1);
    expect(result.full_search).toEqual([]);
  });

  test('get_member_tags follows pagination to the end', async () => {
    const page = Array.from({ length: 1000 }, (_, index) => ({ id: index, name: `t${index}` }));
    const seen = route({ [`GET /lists/L1/members/${HASH}/tags`]: [{ status: 200, body: { tags: page, total_items: 1001 } }, { status: 200, body: { tags: [{ id: 1000, name: 'last' }], total_items: 1001 } }] });
    const result = await getMemberTags.run(ctx({ list_id: 'L1', email: 'ada@ap.test' }));
    expect(result.total_items).toBe(1001);
    expect(seen.map((s) => s.query.get('offset'))).toEqual(['0', '1000']);
  });

  test('list_interest_categories nests interests per category', async () => {
    route({
      'GET /lists/L1/interest-categories': { status: 200, body: { categories: [{ id: 'G1', title: 'Topics', type: 'checkboxes' }], total_items: 1 } },
      'GET /lists/L1/interest-categories/G1/interests': { status: 200, body: { interests: [{ id: 'I1', name: 'News', subscriber_count: '4' }], total_items: 1 } },
    });
    expect(await listInterestCategories.run(ctx({ list_id: 'L1' }))).toEqual({
      categories: [{ id: 'G1', title: 'Topics', type: 'checkboxes', interests: [{ id: 'I1', name: 'News', subscriber_count: 4 }] }],
    });
  });
});

describe('write actions', () => {
  test('delete_member_permanently posts to delete-permanent', async () => {
    const seen = route({ [`POST /lists/L1/members/${HASH}/actions/delete-permanent`]: { status: 204 } });
    expect(await deleteMemberPermanently.run(ctx({ list_id: 'L1', email: 'Ada@ap.test' }))).toEqual({ success: true, list_id: 'L1', email: 'Ada@ap.test' });
    expect(seen).toHaveLength(1);
  });

  test('segment member add and remove hit the documented endpoints', async () => {
    const seen = route({
      'POST /lists/L1/segments/7/members': { status: 200, body: { id: HASH, email_address: 'ada@ap.test', status: 'subscribed', list_id: 'L1' } },
      [`DELETE /lists/L1/segments/7/members/${HASH}`]: { status: 204 },
    });
    expect(await addMemberToSegment.run(ctx({ list_id: 'L1', segment_id: '7', email: 'ada@ap.test' }))).toMatchObject({ segment_id: '7', status: 'subscribed' });
    expect(seen[0].body).toEqual({ email_address: 'ada@ap.test' });
    expect(await removeMemberFromSegment.run(ctx({ list_id: 'L1', segment_id: '7', email: 'ada@ap.test' }))).toMatchObject({ success: true });
  });

  test('remove_member_from_segment surfaces a 404 with the vendor detail', async () => {
    route({});
    await expect(removeMemberFromSegment.run(ctx({ list_id: 'L1', segment_id: '7', email: 'ada@ap.test' }))).rejects.toMatchObject({
      status: 404,
      message: expect.stringContaining('Resource Not Found'),
    });
  });

  test('set_campaign_content needs exactly one source', async () => {
    const seen = route({ 'PUT /campaigns/C1/content': { status: 200, body: { html: '<p>x</p>', plain_text: 'x' } } });
    await expect(setCampaignContent.run(ctx({ campaign_id: 'C1' }))).rejects.toThrow('exactly one content source');
    await expect(setCampaignContent.run(ctx({ campaign_id: 'C1', html: '<p>x</p>', template_id: '3' }))).rejects.toThrow('exactly one content source');
    await setCampaignContent.run(ctx({ campaign_id: 'C1', template_id: '3' }));
    expect(seen[0].body).toEqual({ template: { id: 3 } });
  });

  test('send_test_email sends the recipients and format', async () => {
    const seen = route({ 'POST /campaigns/C1/actions/test': { status: 204 } });
    await sendTestEmail.run(ctx({ campaign_id: 'C1', test_emails: ['me@ap.test', 'me@ap.test'], send_type: 'html' }));
    expect(seen[0].body).toEqual({ test_emails: ['me@ap.test'], send_type: 'html' });
  });

  test('schedule_campaign rejects times off the quarter hour', async () => {
    const seen = route({});
    await expect(scheduleCampaign.run(ctx({ campaign_id: 'C1', schedule_time: '2099-01-01T10:07:00Z' }))).rejects.toThrow('quarter hour');
    expect(seen).toHaveLength(0);
  });

  test('schedule_campaign surfaces the paid-plan error', async () => {
    route({ 'POST /campaigns/C1/actions/schedule': { status: 403, body: { title: 'Forbidden', detail: 'Scheduling requires a paid plan.' } } });
    await expect(scheduleCampaign.run(ctx({ campaign_id: 'C1', schedule_time: '2099-01-01T10:15:00Z' }))).rejects.toThrow('Scheduling requires a paid plan.');
  });

  test('delete_campaign issues DELETE', async () => {
    const seen = route({ 'DELETE /campaigns/C1': { status: 204 } });
    expect(await deleteCampaign.run(ctx({ campaign_id: 'C1' }))).toEqual({ success: true, campaign_id: 'C1' });
    expect(seen[0].key).toBe('DELETE /campaigns/C1');
  });

  test('add_note_to_subscriber posts the note through httpClient', async () => {
    const seen = route({ [`POST /lists/L1/members/${HASH}/notes`]: { status: 200, body: { id: 5, note: 'hi', created_at: '2026-11-17T00:00:00+00:00' } } });
    expect(await addNoteToSubscriber.run(ctx({ list_id: 'L1', email: 'ada@ap.test', note: 'hi' }))).toMatchObject({ note_id: 5, note_content: 'hi' });
    expect(seen[0].body).toEqual({ note: 'hi' });
  });

  test('add_member_to_list fails the step when tagging fails after the upsert', async () => {
    vi.spyOn(mailchimpSdk.lists, 'setListMember').mockResolvedValue({ id: HASH, email_address: 'ada@ap.test', status: 'subscribed', list_id: 'L1' });
    route({ [`POST /lists/L1/members/${HASH}/tags`]: { status: 400, body: { title: 'Invalid Resource', detail: 'bad tag' } } });
    await expect(addMemberToList.run(ctx({ list_id: 'L1', email_address: 'ada@ap.test', status_if_new: 'subscribed', tags: ['x'] }))).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('the subscriber itself was saved'),
    });
    vi.restoreAllMocks();
  });

  test('add_member_to_list returns the tags read back after tagging', async () => {
    vi.spyOn(mailchimpSdk.lists, 'setListMember').mockResolvedValue({ id: HASH, email_address: 'ada@ap.test', status: 'subscribed', list_id: 'L1', tags: [], tags_count: 0 });
    const seen = route({
      [`POST /lists/L1/members/${HASH}/tags`]: { status: 204 },
      [`GET /lists/L1/members/${HASH}`]: { status: 200, body: { tags: [{ id: 3, name: 'x' }], tags_count: 1 } },
    });
    const result = await addMemberToList.run(ctx({ list_id: 'L1', email_address: 'ada@ap.test', status_if_new: 'subscribed', tags: ['x'] }));
    expect(result).toMatchObject({ tags: [{ id: 3, name: 'x' }], tags_count: 1, tags_applied: ['x'] });
    expect(seen.map((s) => s.key)).toEqual([`POST /lists/L1/members/${HASH}/tags`, `GET /lists/L1/members/${HASH}`]);
    vi.restoreAllMocks();
  });

  test('get_member_activity falls back to the event count when total_items is 0', async () => {
    route({ [`GET /lists/L1/members/${HASH}/activity-feed`]: { status: 200, body: { activity: [{ activity_type: 'open' }], total_items: 0 } } });
    expect(await getMemberActivity.run(ctx({ list_id: 'L1', email: 'ada@ap.test' }))).toMatchObject({ total_items: 1 });
  });

  test('custom API call resolves a relative path against the account data center', async () => {
    const seen = route({ 'GET /lists': { status: 200, body: { lists: [] } } });
    const action = mailchimp.actions()['custom_api_call'];
    expect(action.audience).toBe('human');
    await action.run(ctx({ url: { url: '/lists' }, method: 'GET', headers: {}, queryParams: {}, body_type: 'none', body: {}, failsafe: false }));
    expect(seen[0].key).toBe('GET /lists');
    await expect(action.run(ctx({ url: { url: 'https://evil.example/lists' }, method: 'GET' }))).rejects.toThrow('Use a path');
  });

  test('add_member_to_list exposes the new optional tags and merge_fields props', () => {
    expect(addMemberToList.props['tags'].required).toBe(false);
    expect(addMemberToList.props['merge_fields'].required).toBe(false);
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
