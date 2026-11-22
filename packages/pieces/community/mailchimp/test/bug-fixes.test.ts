import { afterEach, describe, expect, test, vi } from 'vitest';
import { mailchimp } from '../src';
import { createHash } from 'crypto';
import { findSubscriber } from '../src/lib/actions/find-subscriber';
import { findCampaign } from '../src/lib/actions/find-campaign';
import { unsubscribeEmail } from '../src/lib/actions/unsubscribe-email';
import { removeMemberFromSegment } from '../src/lib/actions/remove-member-from-segment';

const HASH = createHash('md5').update('ada@ap.test').digest('hex');

describe('piece metadata', () => {
  test('minimumSupportedRelease is 0.88.2', () => {
    expect(mailchimp.minimumSupportedRelease).toBe('0.88.2');
  });

  test('find_subscriber list_id is optional under the same prop name', () => {
    expect(findSubscriber.props['list_id'].required).toBe(false);
  });

  test('every action and trigger has an outputSchema', () => {
    for (const action of Object.values(mailchimp.actions())) {
      if (action.name !== 'custom_api_call') {
        expect(action.outputSchema, action.name).toBeDefined();
      }
    }
    for (const trigger of Object.values(mailchimp.triggers())) {
      expect(trigger.outputSchema, trigger.name).toBeDefined();
    }
  });

  test('no two agent-visible actions share a twin job and demoted actions are human', () => {
    const actions = mailchimp.actions();
    for (const name of ['add_member_to_list', 'update_member_in_list', 'unsubscribe_email', 'find_subscriber', 'create_campaign', 'get_campaign_report']) {
      expect(actions[name].audience, name).toBe('human');
    }
    for (const name of ['upsert_member', 'update_member_profile', 'set_member_status', 'get_member', 'create_campaign_draft', 'get_campaign_stats', 'resolve_audience', 'resolve_segment', 'resolve_merge_field', 'resolve_interest']) {
      expect(actions[name].audience, name).toBe('ai');
    }
  });
});

describe('find_subscriber', () => {
  test('without a list it searches every audience', async () => {
    const seen = route({
      'GET /lists': { status: 200, body: { lists: [{ id: 'L1', name: 'One' }, { id: 'L2', name: 'Two' }], total_items: 2 } },
      [`GET /lists/L2/members/${HASH}`]: { status: 200, body: { id: HASH, email_address: 'ada@ap.test', status: 'subscribed', list_id: 'L2', merge_fields: { FNAME: 'Ada' }, timestamp_signup: '2026-01-02T03:04:05+00:00' } },
    });
    const result = await findSubscriber.run(ctx({ email: 'Ada@ap.test' }));
    expect(seen.map((s) => s.key)).toEqual(['GET /lists', `GET /lists/L1/members/${HASH}`, `GET /lists/L2/members/${HASH}`]);
    expect(result).toMatchObject({ found: true, search_scope: 'All Lists', total_matches: 1 });
    expect(result.primary_subscriber).toMatchObject({ list_name: 'Two', full_name: 'Ada', company: null, member_since: '2026-01-02T03:04:05.000Z' });
  });

  test.each([400, 403])('HTTP %i throws instead of returning success:false', async (status) => {
    route({ [`GET /lists/L1/members/${HASH}`]: { status, body: { title: 'Forbidden', detail: 'nope' } } });
    await expect(findSubscriber.run(ctx({ list_id: 'L1', email: 'ada@ap.test' }))).rejects.toThrow(`HTTP ${status}`);
  });

  test('unknown list throws, missing member returns found:false', async () => {
    route({});
    await expect(findSubscriber.run(ctx({ list_id: 'nope', email: 'ada@ap.test' }))).rejects.toThrow('HTTP 404');
    route({ 'GET /lists/L1': { status: 200, body: { id: 'L1' } } });
    await expect(findSubscriber.run(ctx({ list_id: 'L1', email: 'ada@ap.test' }))).resolves.toMatchObject({ found: false });
  });
});

describe('webhook handshake', () => {
  test('every trigger answers the Mailchimp URL check and registers the marked URL', async () => {
    for (const trigger of Object.values(mailchimp.triggers())) {
      expect(trigger.handshakeConfiguration, trigger.name).toEqual({ strategy: 'QUERY_PRESENT', paramName: 'mc_handshake' });
      await expect(trigger.onHandshake(hookCtx({ propsValue: {}, extra: { payload: { method: 'GET', body: {}, headers: {}, queryParams: { mc_handshake: '1' } } } }))).resolves.toEqual({ status: 200, body: {} });
      await expect(trigger.onHandshake(hookCtx({ propsValue: {}, extra: { payload: { method: 'POST', body: { type: 'subscribe' }, headers: {}, queryParams: { mc_handshake: '1' } } } }))).rejects.toThrow('not a URL check');
    }
  });

  test('onEnable appends the marker to a webhook URL that already has a query', async () => {
    const seen = route({ 'POST /lists/L1/webhooks': { status: 200, body: { id: 'W1' } } });
    const trigger = mailchimp.triggers()['subscribe'];
    const store = { put: vi.fn(), get: vi.fn() };
    await trigger.onEnable(hookCtx({ propsValue: { list_id: 'L1' }, extra: { webhookUrl: 'https://ap.test/api/v1/webhooks/F1?a=b', store } }));
    expect(seen[0].body).toMatchObject({ url: 'https://ap.test/api/v1/webhooks/F1?a=b&mc_handshake=1' });
  });
});

describe('find_campaign', () => {
  test('sends the query as a plain query parameter', async () => {
    const seen = route({ 'GET /search-campaigns': { status: 200, body: { results: [{ campaign: { id: 'C1' } }], total_items: 1 } } });
    const result = await findCampaign.run(ctx({ query: 'Welcome', fields: 'results.campaign.id' }));
    expect(seen[0].query.get('query')).toBe('Welcome');
    expect(seen[0].query.get('fields')).toBe('results.campaign.id');
    expect(result).toMatchObject({ total_items: 1, results: [{ campaign: { id: 'C1' } }] });
  });
});

describe('new campaign trigger', () => {
  test('reads the real webhook fields for campaign id and delivery status', async () => {
    const trigger = mailchimp.triggers()['new_campaign'];
    const body = { type: 'campaign', fired_at: '2026-11-17 10:00:00', data: { id: 'C9', subject: 'Hi', status: 'sent', reason: '', list_id: 'L1' } };
    const [event] = await trigger.run(hookCtx({ propsValue: {}, extra: { payload: { body, headers: {}, queryParams: {} } } }));
    expect(event).toMatchObject({ campaign_summary: { campaign_id: 'C9', campaign_subject: 'Hi', campaign_status: 'sent', delivery_status: 'Delivered' } });
  });
});

describe('remove_member_from_segment', () => {
  test('maps the "does not belong" 400 to a clear message', async () => {
    route({ [`DELETE /lists/L1/segments/7/members/${HASH}`]: { status: 400, body: { title: 'Invalid Resource', detail: 'Member does not belong to the static segment' } } });
    await expect(removeMemberFromSegment.run(ctx({ list_id: 'L1', segment_id: '7', email: 'ada@ap.test' }))).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('not in segment 7'),
    });
  });
});

describe('unsubscribe_email', () => {
  test('throws when the batch reports per-member errors', async () => {
    route({
      'POST /lists/L1': { status: 200, body: { new_members: [], updated_members: [], errors: [{ email_address: 'bad', error: 'invalid address', error_code: 'ERROR_GENERIC' }], error_count: 1 } },
    });
    await expect(unsubscribeEmail.run(ctx({ list_id: 'L1', email_address: 'bad', update_existing: true }))).rejects.toThrow('invalid address');
  });

  test('succeeds and sends the batch body when there are no errors', async () => {
    const seen = route({
      'POST /lists/L1': { status: 200, body: { new_members: [], updated_members: [{ id: HASH, email_address: 'ada@ap.test', status: 'unsubscribed' }], errors: [], total_updated: 1, error_count: 0 } },
    });
    const result = await unsubscribeEmail.run(ctx({ list_id: 'L1', email_address: 'ada@ap.test', update_existing: false, skip_merge_validation: true }));
    expect(result).toMatchObject({ success: true, total_updated: 1 });
    expect(seen[0].body).toEqual({ members: [{ email_address: 'ada@ap.test', status: 'unsubscribed' }], update_existing: true });
    expect(seen[0].query.get('skip_merge_validation')).toBe('true');
  });
});

afterEach(() => vi.unstubAllGlobals());

function ctx(propsValue: Record<string, unknown>) {
  return hookCtx({ propsValue, extra: {} });
}

function hookCtx({ propsValue, extra }: { propsValue: Record<string, unknown>; extra: Record<string, unknown> }) {
  return Object.assign(Object.create(null), {
    auth: { access_token: 'TKN', data: {}, props: {} },
    propsValue,
    ...extra,
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
