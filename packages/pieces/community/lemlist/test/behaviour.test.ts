import { afterEach, describe, expect, it, vi } from 'vitest';
import { addCustomVariablesOnLead } from '../src/lib/actions/add-custom-variables-on-lead';
import { listCampaignsAction, getCampaignStatsAction } from '../src/lib/actions/ai/campaigns';
import { upsertContactAction } from '../src/lib/actions/ai/crm';
import { enrichLeadAction } from '../src/lib/actions/ai/enrichment';
import { sendInboxEmailAction } from '../src/lib/actions/ai/inbox';
import { getLeadByEmailAction, updateCampaignLeadAction } from '../src/lib/actions/ai/leads';
import { searchLead } from '../src/lib/actions/search-lead';
import { LemlistApiError } from '../src/lib/common/client';
import { lemlistAuth } from '../src/lib/common/constants';
import { campaignsDropdown, fetchAllCampaigns } from '../src/lib/common/props';
import { newActivity } from '../src/lib/triggers/new-activity';
import { unsubscribedRecipient } from '../src/lib/triggers/unsubscribed-recipient';
import { API_KEY, makeContext, makeStore, stubFetch } from './helpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function call({ fn, ctx }: { fn: unknown; ctx: unknown }): Promise<unknown> {
  if (typeof fn !== 'function') {
    throw new Error('not callable');
  }
  return fn(ctx);
}

describe('errors', () => {
  it('maps status + vendor message and keeps the body under responseBody, never body', async () => {
    stubFetch([{ status: 404, body: { message: 'Campaign not found' } }]);
    const error = await call({ fn: listCampaignsAction.run, ctx: makeContext({ props: {} }) }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LemlistApiError);
    expect(error).toHaveProperty('message', 'lemlist could not find the resource. Check the ID or email (HTTP 404): Campaign not found');
    expect(error).toHaveProperty('status', 404);
    expect(error).toHaveProperty('responseBody', { message: 'Campaign not found' });
    expect(error).not.toHaveProperty('body');
  });

  it('retries a 429 twice, then succeeds', async () => {
    vi.useFakeTimers();
    const calls = stubFetch([{ status: 429, body: {} }, { status: 429, body: {} }, { status: 200, body: [] }]);
    const pending = call({ fn: listCampaignsAction.run, ctx: makeContext({ props: {} }) });
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(pending).resolves.toEqual({ items: [], count: 0, offset: 0, has_more: false });
    expect(calls).toHaveLength(3);
  });

  it('gives up after two 429 retries', async () => {
    vi.useFakeTimers();
    stubFetch([{ status: 429, body: {} }, { status: 429, body: {} }, { status: 429, body: { message: 'slow down' } }]);
    const pending = call({ fn: listCampaignsAction.run, ctx: makeContext({ props: {} }) }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await pending).toHaveProperty('status', 429);
  });

  it('does not log request bodies on failure (redacted)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFetch([{ status: 400, body: { message: 'bad' } }]);
    await call({
      fn: addCustomVariablesOnLead.run,
      ctx: makeContext({ props: { leadId: 'lea_1', customVariables: { secretNote: 'private-pii' } } }),
    }).catch(() => undefined);
    expect(JSON.stringify(spy.mock.calls)).not.toContain('private-pii');
  });
});

describe('input validation (path safety)', () => {
  const bad = ['x/../../hooks', 'a?b=1@x.com', '../team', 'jane@x.com#frag', ''];
  it.each(bad)('rejects lead email %s before any request', async (email) => {
    const calls = stubFetch([]);
    await expect(call({ fn: getLeadByEmailAction.run, ctx: makeContext({ props: { email } }) })).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it('rejects campaign IDs without the cam_ prefix or with slashes', async () => {
    const calls = stubFetch([]);
    await expect(
      call({ fn: updateCampaignLeadAction.run, ctx: makeContext({ props: { campaign_id: 'cam_1/../x', lead: 'lea_1', lastName: 'a' } }) })
    ).rejects.toThrow('not a lemlist ID');
    await expect(
      call({ fn: updateCampaignLeadAction.run, ctx: makeContext({ props: { campaign_id: 'hoo_1', lead: 'lea_1', lastName: 'a' } }) })
    ).rejects.toThrow('cam_');
    expect(calls).toHaveLength(0);
  });

  it('update refuses an empty change set', async () => {
    const calls = stubFetch([]);
    await expect(
      call({ fn: updateCampaignLeadAction.run, ctx: makeContext({ props: { campaign_id: 'cam_1', lead: 'lea_1', lastName: '' } }) })
    ).rejects.toThrow('at least one field');
    expect(calls).toHaveLength(0);
  });

  it('variables go in the JSON body, never the URL', async () => {
    const calls = stubFetch([{ body: { ok: true } }]);
    await call({ fn: addCustomVariablesOnLead.run, ctx: makeContext({ props: { leadId: 'lea_1', customVariables: { icebreaker: 'Loved your talk' } } }) });
    expect(calls[0].url.search).toBe('');
    expect(calls[0].body).toEqual({ icebreaker: 'Loved your talk' });
  });

  it('enrich requires at least one option (credits)', async () => {
    const calls = stubFetch([]);
    await expect(call({ fn: enrichLeadAction.run, ctx: makeContext({ props: { lead_id: 'lea_1' } }) })).rejects.toThrow('at least one');
    expect(calls).toHaveLength(0);
  });

  it('send email needs a recipient and a subject for a new thread', async () => {
    const calls = stubFetch([]);
    const base = { send_user_id: 'usr_1', send_user_email: 'me@example.com', send_user_mailbox_id: 'usm_1', message: 'x' };
    await expect(call({ fn: sendInboxEmailAction.run, ctx: makeContext({ props: { ...base, subject: 's' } }) })).rejects.toThrow('recipient');
    await expect(call({ fn: sendInboxEmailAction.run, ctx: makeContext({ props: { ...base, lead_id: 'lea_1' } }) })).rejects.toThrow('Subject');
    expect(calls).toHaveLength(0);
  });

  it('stats reject reversed dates', async () => {
    stubFetch([]);
    await expect(
      call({ fn: getCampaignStatsAction.run, ctx: makeContext({ props: { campaign_id: 'cam_1', start_date: '2026-10-31', end_date: '2026-10-01' } }) })
    ).rejects.toThrow('before');
  });

  it('upsert contact needs email or LinkedIn', async () => {
    stubFetch([]);
    await expect(call({ fn: upsertContactAction.run, ctx: makeContext({ props: { firstName: 'A' } }) })).rejects.toThrow('Email or a LinkedIn');
  });
});

describe('search lead', () => {
  it('returns found=false on 404 instead of failing', async () => {
    stubFetch([{ status: 404, body: { message: 'Lead not found' } }]);
    await expect(call({ fn: searchLead.run, ctx: makeContext({ props: { email: 'a@example.com' } }) })).resolves.toEqual({
      found: false,
      message: 'No leads found for a@example.com',
      leads: [],
    });
  });
});

describe('auth validate', () => {
  it('valid on 200', async () => {
    stubFetch([{ body: { _id: 'tea_1' } }]);
    await expect(call({ fn: lemlistAuth.validate, ctx: { auth: API_KEY } })).resolves.toEqual({ valid: true });
  });
  it('invalid key only on 401/403', async () => {
    stubFetch([{ status: 401, body: {} }]);
    await expect(call({ fn: lemlistAuth.validate, ctx: { auth: API_KEY } })).resolves.toEqual({ valid: false, error: 'Invalid API key.' });
  });
  it('network/5xx is not reported as an invalid key', async () => {
    stubFetch([{ status: 503, body: 'down' }]);
    const result = await call({ fn: lemlistAuth.validate, ctx: { auth: API_KEY } });
    expect(result).toHaveProperty('valid', false);
    expect(JSON.stringify(result)).not.toContain('Invalid API key');
  });
});

describe('campaign dropdown', () => {
  it('pages until a short page and labels with status', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ _id: `cam_${i}`, name: `C${i}`, status: 'running' }));
    const calls = stubFetch([{ body: { campaigns: page1 } }, { body: { campaigns: [{ _id: 'cam_x', name: 'X', status: 'draft' }] } }]);
    const options = await call({ fn: campaignsDropdown({ refreshers: ['auth'] }).options, ctx: { auth: { secret_text: API_KEY } } });
    expect(calls.map((c) => c.url.searchParams.get('offset'))).toEqual(['0', '100']);
    expect(options).toHaveProperty('options.100', { label: 'X (draft)', value: 'cam_x' });
  });
  it('stops after 20 pages', async () => {
    let n = 0;
    stubFetch(() => ({ body: Array.from({ length: 100 }, () => ({ _id: `cam_${n++}`, name: 'c' })) }));
    const all = await fetchAllCampaigns({ apiKey: API_KEY });
    expect(all).toHaveLength(2000);
  });
  it('shows a disabled state on error', async () => {
    stubFetch([{ status: 401, body: {} }]);
    const result = await call({ fn: campaignsDropdown({ refreshers: ['auth'] }).options, ctx: { auth: { secret_text: API_KEY } } });
    expect(result).toHaveProperty('disabled', true);
  });
});

function triggerContext({ store, props = {}, body }: { store: ReturnType<typeof makeStore>; props?: Record<string, unknown>; body?: unknown }) {
  return {
    auth: { type: 'SECRET_TEXT', secret_text: API_KEY },
    propsValue: props,
    store,
    webhookUrl: 'https://cloud.activepieces.com/api/v1/webhooks/flow1',
    payload: { body, headers: {} },
  };
}

describe('webhook triggers', () => {
  it('onEnable registers the hook with a random secret and stores it', async () => {
    const calls = stubFetch([{ body: { _id: 'hoo_1' } }]);
    const store = makeStore();
    await call({ fn: newActivity.onEnable, ctx: triggerContext({ store }) });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url.pathname).toBe('/api/hooks');
    const sent = calls[0].body;
    expect(sent).toHaveProperty('targetUrl', 'https://cloud.activepieces.com/api/v1/webhooks/flow1');
    expect(sent).not.toHaveProperty('type');
    const stored = store.data.get('lemlist_new_activity_trigger_key');
    expect(stored).toHaveProperty('webhookId', 'hoo_1');
    expect(stored).toHaveProperty('secret', Reflect.get(Object(sent), 'secret'));
    expect(String(Reflect.get(Object(sent), 'secret'))).toHaveLength(64);
  });

  it('onEnable on 409 deletes the leftover hook with the same URL and recreates it', async () => {
    const url = 'https://cloud.activepieces.com/api/v1/webhooks/flow1';
    const calls = stubFetch([
      { status: 409, body: { error: 'A webhook with this targetUrl already exists' } },
      { body: [{ _id: 'hoo_other', targetUrl: 'https://x' }, { _id: 'hoo_old', targetUrl: url }] },
      { body: { _id: 'hoo_old' } },
      { body: { _id: 'hoo_new' } },
    ]);
    const store = makeStore();
    await call({ fn: unsubscribedRecipient.onEnable, ctx: triggerContext({ store }) });
    expect(calls.map((c) => `${c.method} ${c.url.pathname}`)).toEqual(['POST /api/hooks', 'GET /api/hooks', 'DELETE /api/hooks/hoo_old', 'POST /api/hooks']);
    expect(store.data.get('lemlist_unsubscribed_recipient_trigger_key')).toHaveProperty('webhookId', 'hoo_new');
  });

  it('onEnable on 409 with no matching URL explains the 200-webhook cap', async () => {
    stubFetch([{ status: 409, body: { error: 'Too many webhooks' } }, { body: [] }]);
    await expect(call({ fn: newActivity.onEnable, ctx: triggerContext({ store: makeStore() }) })).rejects.toThrow('200 webhooks');
  });

  it('onEnable deletes the new hook when the store write fails', async () => {
    const calls = stubFetch([{ body: { _id: 'hoo_1' } }, { body: {} }]);
    const store = makeStore();
    store.put.mockRejectedValueOnce(new Error('store down'));
    await expect(call({ fn: newActivity.onEnable, ctx: triggerContext({ store }) })).rejects.toThrow('store down');
    expect(calls[1].method).toBe('DELETE');
    expect(calls[1].url.pathname).toBe('/api/hooks/hoo_1');
  });

  it('onDisable treats 404 as already deleted and clears the store', async () => {
    stubFetch([{ status: 404, body: {} }]);
    const store = makeStore();
    store.data.set('lemlist_new_activity_trigger_key', { webhookId: 'hoo_1', secret: 's' });
    await call({ fn: newActivity.onDisable, ctx: triggerContext({ store }) });
    expect(store.data.has('lemlist_new_activity_trigger_key')).toBe(false);
  });

  it('onDisable keeps the stored ID when the delete fails for another reason', async () => {
    stubFetch([{ status: 500, body: {} }]);
    const store = makeStore();
    store.data.set('lemlist_new_activity_trigger_key', { webhookId: 'hoo_1', secret: 's' });
    await expect(call({ fn: newActivity.onDisable, ctx: triggerContext({ store }) })).rejects.toThrow();
    expect(store.data.has('lemlist_new_activity_trigger_key')).toBe(true);
  });

  const now = new Date().toISOString();
  function storeWithSecret(key: string) {
    const store = makeStore();
    store.data.set(key, { webhookId: 'hoo_1', secret: 'expected-secret' });
    return store;
  }

  it('run accepts a delivery with the right secret and strips it', async () => {
    const store = storeWithSecret('lemlist_new_activity_trigger_key');
    const out = await call({
      fn: newActivity.run,
      ctx: triggerContext({ store, body: { _id: 'act_1', type: 'emailsReplied', createdAt: now, secret: 'expected-secret' } }),
    });
    expect(out).toEqual([{ _id: 'act_1', type: 'emailsReplied', createdAt: now, _dedupe_key: 'act_1' }]);
  });

  it('run drops forged deliveries (missing or wrong secret)', async () => {
    const store = storeWithSecret('lemlist_new_activity_trigger_key');
    for (const secret of [undefined, 'nope', 'expected-secreT']) {
      const out = await call({ fn: newActivity.run, ctx: triggerContext({ store, body: { _id: 'act_1', type: 'x', createdAt: now, secret } }) });
      expect(out).toEqual([]);
    }
  });

  it('run accepts legacy hooks registered before secrets (no stored secret)', async () => {
    const store = makeStore();
    store.data.set('lemlist_new_activity_trigger_key', { webhookId: 'hoo_legacy' });
    const out = await call({ fn: newActivity.run, ctx: triggerContext({ store, body: { _id: 'act_9', type: 'x', createdAt: now } }) });
    expect(out).toEqual([{ _id: 'act_9', type: 'x', createdAt: now, _dedupe_key: 'act_9' }]);
  });

  it('run dedupes by activity _id', async () => {
    const store = storeWithSecret('lemlist_new_activity_trigger_key');
    const body = { _id: 'act_1', type: 'emailsOpened', createdAt: now, secret: 'expected-secret' };
    expect(await call({ fn: newActivity.run, ctx: triggerContext({ store, body }) })).toHaveLength(1);
    expect(await call({ fn: newActivity.run, ctx: triggerContext({ store, body }) })).toEqual([]);
  });

  it('run drops activities older than 24 h (stale replays)', async () => {
    const store = storeWithSecret('lemlist_new_activity_trigger_key');
    const old = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
    const out = await call({ fn: newActivity.run, ctx: triggerContext({ store, body: { _id: 'act_2', type: 'x', createdAt: old, secret: 'expected-secret' } }) });
    expect(out).toEqual([]);
  });

  it('run applies event type and campaign filters', async () => {
    const store = storeWithSecret('lemlist_new_activity_trigger_key');
    const props = { eventTypes: ['emailsReplied'], campaignId: 'cam_1' };
    const base = { createdAt: now, secret: 'expected-secret' };
    expect(await call({ fn: newActivity.run, ctx: triggerContext({ store, props, body: { ...base, _id: 'a1', type: 'emailsOpened', campaignId: 'cam_1' } }) })).toEqual([]);
    expect(await call({ fn: newActivity.run, ctx: triggerContext({ store, props, body: { ...base, _id: 'a2', type: 'emailsReplied', campaignId: 'cam_2' } }) })).toEqual([]);
    expect(await call({ fn: newActivity.run, ctx: triggerContext({ store, props, body: { ...base, _id: 'a3', type: 'emailsReplied', campaignId: 'cam_1' } }) })).toHaveLength(1);
  });

  it('unsubscribed recipient fires on all unsubscribe types only', async () => {
    const store = storeWithSecret('lemlist_unsubscribed_recipient_trigger_key');
    const base = { createdAt: now, secret: 'expected-secret' };
    expect(await call({ fn: unsubscribedRecipient.run, ctx: triggerContext({ store, body: { ...base, _id: 'u1', type: 'entityUnsubscribed' } }) })).toHaveLength(1);
    expect(await call({ fn: unsubscribedRecipient.run, ctx: triggerContext({ store, body: { ...base, _id: 'u2', type: 'emailsUnsubscribed' } }) })).toHaveLength(1);
    expect(await call({ fn: unsubscribedRecipient.run, ctx: triggerContext({ store, body: { ...base, _id: 'u3', type: 'emailsOpened' } }) })).toEqual([]);
  });

  it('run parses string bodies and ignores non-JSON', async () => {
    const store = makeStore();
    expect(await call({ fn: newActivity.run, ctx: triggerContext({ store, body: 'not json' }) })).toEqual([]);
    expect(await call({ fn: newActivity.run, ctx: triggerContext({ store, body: JSON.stringify({ _id: 'a', type: 't', createdAt: now }) }) })).toHaveLength(1);
  });
});

describe('buildLemlistError 403', () => {
  it('leads with lemlist reason when present', async () => {
    const { buildLemlistError } = await import('../src/lib/common/client');
    const withReason = buildLemlistError({ status: 403, responseBody: { message: 'LinkedIn account not linked' } });
    expect(withReason.message).toBe('lemlist refused the request (HTTP 403): LinkedIn account not linked');
    const generic = buildLemlistError({ status: 403, responseBody: '' });
    expect(generic.message).toContain('the plan or API key has no access to this resource (HTTP 403).');
  });
});
