import { afterEach, describe, expect, test, vi } from 'vitest';
import '../src';
import { createHash } from 'crypto';
import { upsertMemberAi } from '../src/lib/actions/ai/upsert-member';
import { updateMemberProfileAi } from '../src/lib/actions/ai/update-member-profile';
import { setMemberStatusAi } from '../src/lib/actions/ai/set-member-status';
import { getMemberAi } from '../src/lib/actions/ai/get-member';
import { createCampaignDraftAi } from '../src/lib/actions/ai/create-campaign-draft';
import { getCampaignStatsAi } from '../src/lib/actions/ai/get-campaign-stats';
import { resolveAudienceAi } from '../src/lib/actions/ai/resolve-audience';
import { resolveSegmentAi } from '../src/lib/actions/ai/resolve-segment';
import { resolveMergeFieldAi } from '../src/lib/actions/ai/resolve-merge-field';
import { resolveInterestAi } from '../src/lib/actions/ai/resolve-interest';

const HASH = createHash('md5').update('ada@ap.test').digest('hex');
const MEMBER = { id: HASH, email_address: 'ada@ap.test', status: 'subscribed', list_id: 'L1', last_changed: '2026-11-17T00:00:00+00:00', merge_fields: { FNAME: 'Ada', LNAME: '' }, tags: [{ id: 1, name: 'vip' }] };

describe('ai actions take plain text ids', () => {
  test.each([upsertMemberAi, updateMemberProfileAi, setMemberStatusAi, getMemberAi, createCampaignDraftAi, resolveSegmentAi, resolveMergeFieldAi, resolveInterestAi])('%s has no dynamic dropdowns', (action) => {
    for (const prop of Object.values(action.props)) {
      expect(prop.type).not.toBe('DROPDOWN');
    }
  });
});

describe('member twins', () => {
  test('upsert_member PUTs merge fields (named props win) then adds tags', async () => {
    const seen = route({ [`PUT /lists/L1/members/${HASH}`]: { status: 200, body: MEMBER }, [`POST /lists/L1/members/${HASH}/tags`]: { status: 204 } });
    const result = await upsertMemberAi.run(ctx({ list_id: 'L1', email: 'Ada@ap.test', status_if_new: 'subscribed', first_name: 'Ada', merge_fields_json: '{"FNAME":"X","PHONE":"1"}', tags: ['vip'] }));
    expect(seen[0].body).toEqual({ email_address: 'Ada@ap.test', status_if_new: 'subscribed', merge_fields: { FNAME: 'Ada', PHONE: '1' } });
    expect(seen[1].body).toEqual({ tags: [{ name: 'vip', status: 'active' }] });
    expect(result).toEqual({ id: HASH, email: 'ada@ap.test', status: 'subscribed', list_id: 'L1', last_changed: '2026-11-17T00:00:00+00:00', tags_applied: ['vip'] });
  });

  test('upsert_member rejects bad JSON before any request', async () => {
    const seen = route({});
    await expect(upsertMemberAi.run(ctx({ list_id: 'L1', email: 'ada@ap.test', status_if_new: 'subscribed', merge_fields_json: '[1]' }))).rejects.toThrow('JSON object');
    expect(seen).toHaveLength(0);
  });

  test('update_member_profile PATCHes only given fields and refuses an empty update', async () => {
    const seen = route({ [`PATCH /lists/L1/members/${HASH}`]: { status: 200, body: MEMBER } });
    await expect(updateMemberProfileAi.run(ctx({ list_id: 'L1', email: 'ada@ap.test' }))).rejects.toThrow('Nothing to update');
    await updateMemberProfileAi.run(ctx({ list_id: 'L1', email: 'ada@ap.test', vip: 'no', language: 'fr' }));
    expect(seen[0].body).toEqual({ language: 'fr', vip: false });
  });

  test('set_member_status throws on an unknown member', async () => {
    route({});
    await expect(setMemberStatusAi.run(ctx({ list_id: 'L1', email: 'ada@ap.test', status: 'unsubscribed' }))).rejects.toThrow('HTTP 404');
  });

  test('set_member_status rejects statuses outside the allowed set', async () => {
    await expect(setMemberStatusAi.run(ctx({ list_id: 'L1', email: 'ada@ap.test', status: 'cleaned' }))).rejects.toThrow('subscribed, unsubscribed or pending');
  });

  test('get_member returns a flat record or found:false', async () => {
    route({ [`GET /lists/L1/members/${HASH}`]: { status: 200, body: MEMBER } });
    expect(await getMemberAi.run(ctx({ list_id: 'L1', email: 'ada@ap.test' }))).toMatchObject({ found: true, first_name: 'Ada', last_name: null, tags: ['vip'] });
    route({ 'GET /lists/L1': { status: 200, body: { id: 'L1' } } });
    expect(await getMemberAi.run(ctx({ list_id: 'L1', email: 'ada@ap.test' }))).toEqual({ found: false, email: 'ada@ap.test', list_id: 'L1' });
  });
});

describe('campaign twins', () => {
  test('create_campaign_draft targets a segment', async () => {
    const seen = route({ 'POST /campaigns': { status: 200, body: { id: 'C1', web_id: 2, type: 'regular', status: 'save', settings: { title: 'Hi', subject_line: 'Hi' }, recipients: { list_id: 'L1' } } } });
    const result = await createCampaignDraftAi.run(ctx({ list_id: 'L1', subject: 'Hi', from_name: 'Me', reply_to: 'me@ap.test', segment_id: '7' }));
    expect(seen[0].body).toEqual({ type: 'regular', recipients: { list_id: 'L1', segment_opts: { saved_segment_id: 7 } }, settings: { subject_line: 'Hi', title: 'Hi', from_name: 'Me', reply_to: 'me@ap.test' } });
    expect(result).toMatchObject({ id: 'C1', status: 'save', segment_id: '7' });
  });

  test('get_campaign_stats flattens the report and excludes the share block', async () => {
    const seen = route({ 'GET /reports/C1': { status: 200, body: { id: 'C1', emails_sent: 10, unsubscribed: 1, opens: { opens_total: 6, unique_opens: 4, open_rate: 0.4 }, clicks: { clicks_total: 2, unique_clicks: 1, click_rate: 0.1 }, bounces: { hard_bounces: 1, soft_bounces: 2 } } } });
    expect(await getCampaignStatsAi.run(ctx({ campaign_id: 'C1' }))).toMatchObject({ emails_sent: 10, opens: 6, unique_opens: 4, clicks: 2, bounces: 3, unsubscribes: 1 });
    expect(seen[0].query.get('exclude_fields')).toContain('share_report');
  });
});

describe('resolve helpers', () => {
  test('resolve_audience prefers exact matches and flags ambiguity', async () => {
    route({ 'GET /lists': { status: 200, body: { lists: [{ id: 'L1', name: 'Newsletter EU' }, { id: 'L2', name: 'newsletter' }], total_items: 2 } } });
    expect(await resolveAudienceAi.run(ctx({ name: 'Newsletter' }))).toMatchObject({ found: true, id: 'L2', ambiguous: false });
    route({ 'GET /lists': { status: 200, body: { lists: [{ id: 'L1', name: 'News A' }, { id: 'L2', name: 'News B' }], total_items: 2 } } });
    expect(await resolveAudienceAi.run(ctx({ name: 'news' }))).toMatchObject({ found: true, id: 'L1', ambiguous: true, candidates: 'News B (L2)' });
  });

  test('resolve_segment returns found:false when nothing matches', async () => {
    route({ 'GET /lists/L1/segments': { status: 200, body: { segments: [{ id: 7, name: 'VIP', type: 'static' }], total_items: 1 } } });
    expect(await resolveSegmentAi.run(ctx({ list_id: 'L1', name: 'nobody' }))).toMatchObject({ found: false, id: null });
    expect(await resolveSegmentAi.run(ctx({ list_id: 'L1', name: 'vip' }))).toMatchObject({ found: true, id: '7' });
  });

  test('resolve_merge_field matches label or tag', async () => {
    route({ 'GET /lists/L1/merge-fields': { status: 200, body: { merge_fields: [{ merge_id: 4, tag: 'PHONE', name: 'Phone Number', type: 'phone' }], total_items: 1 } } });
    expect(await resolveMergeFieldAi.run(ctx({ list_id: 'L1', name: 'phone number' }))).toMatchObject({ found: true, tag: 'PHONE' });
    expect(await resolveMergeFieldAi.run(ctx({ list_id: 'L1', name: 'PHONE' }))).toMatchObject({ found: true, merge_id: 4 });
  });

  test('resolve_interest narrows by category', async () => {
    route({
      'GET /lists/L1/interest-categories': { status: 200, body: { categories: [{ id: 'G1', title: 'Topics' }, { id: 'G2', title: 'Regions' }], total_items: 2 } },
      'GET /lists/L1/interest-categories/G1/interests': { status: 200, body: { interests: [{ id: 'I1', name: 'Europe' }], total_items: 1 } },
      'GET /lists/L1/interest-categories/G2/interests': { status: 200, body: { interests: [{ id: 'I2', name: 'Europe' }], total_items: 1 } },
    });
    expect(await resolveInterestAi.run(ctx({ list_id: 'L1', name: 'Europe', category_title: 'Regions' }))).toEqual({
      found: true, id: 'I2', name: 'Europe', category_id: 'G2', category_title: 'Regions', ambiguous: false, candidates: '',
    });
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
