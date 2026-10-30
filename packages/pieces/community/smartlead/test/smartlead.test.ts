import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { smartlead } from '../src';
import { smartleadAuth } from '../src/lib/auth';
import { SMARTLEAD_WEBHOOK_EVENTS } from '../src/lib/common/operations';

const auth = { secret_text: 'key_123' };

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function failure({ status, body }: { status: number; body: unknown }) {
  return Object.assign(new Error('http'), { response: { status, body, headers: {} } });
}

function mockSeq(...bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const b of bodies) {
    if (b instanceof Error) spy.mockRejectedValueOnce(b);
    else spy.mockResolvedValueOnce(ok(b));
  }
  return spy;
}

function run({ name, propsValue = {} }: { name: string; propsValue?: Record<string, unknown> }) {
  const found = smartlead.actions()[name];
  if (!found) throw new Error(`missing ${name}`);
  return Reflect.apply(found.run, undefined, [{ auth, propsValue }]);
}

function call({ spy, index = 0 }: { spy: ReturnType<typeof mockSeq>; index?: number }) {
  return spy.mock.calls[index][0];
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('metadata', () => {
  it('has 6 human + custom api call, 14 ai, nothing both', () => {
    const actions = Object.values(smartlead.actions());
    expect(actions.length).toBe(21);
    expect(actions.filter((a) => a.audience === 'human').length).toBe(7);
    expect(actions.filter((a) => a.audience === 'ai').length).toBe(14);
    expect(actions.filter((a) => a.audience === 'both').length).toBe(0);
    expect(Object.keys(smartlead.triggers())).toEqual(['new_campaign_event']);
  });
  it('ai actions have aiMetadata, classification, outputSchema and no dropdowns', () => {
    for (const a of Object.values(smartlead.actions())) {
      if (a.name !== 'custom_api_call') expect(a.outputSchema, a.name).toBeDefined();
      if (a.audience !== 'ai') continue;
      expect(a.aiMetadata?.description, a.name).toBeTruthy();
      expect(typeof a.aiMetadata?.idempotent, a.name).toBe('boolean');
      expect(a.classification, a.name).toBeTruthy();
      for (const p of Object.values(a.props)) {
        expect(['DROPDOWN', 'STATIC_DROPDOWN', 'MULTI_SELECT_DROPDOWN', 'DYNAMIC']).not.toContain(Reflect.get(p, 'type'));
      }
    }
  });
});

describe('auth', () => {
  it('returns invalid on 401 and on other failures without throwing', async () => {
    mockSeq(failure({ status: 401, body: {} }), failure({ status: 500, body: {} }));
    const validate = smartleadAuth.validate;
    if (!validate) throw new Error('no validate');
    const a = await Reflect.apply(validate, undefined, [{ auth: 'bad' }]);
    const b = await Reflect.apply(validate, undefined, [{ auth: 'bad' }]);
    expect(a.valid).toBe(false);
    expect(b.valid).toBe(false);
  });
});

describe('client errors', () => {
  it('maps 404 to a clean message without the api key and keeps responseBody', async () => {
    mockSeq(failure({ status: 404, body: { message: 'Campaign not found' } }));
    const err = await run({ name: 'ai_get_campaign', propsValue: { campaign_id: 5 } }).catch((e: unknown) => e);
    expect(String(Reflect.get(err, 'message'))).toContain('could not find');
    expect(String(Reflect.get(err, 'message'))).not.toContain('key_123');
    expect(Reflect.get(err, 'responseBody')).toEqual({ message: 'Campaign not found' });
    expect(Reflect.get(err, 'body')).toBeUndefined();
  });
});

describe('campaigns', () => {
  it('create campaign: human and ai share the same request', async () => {
    const spy = mockSeq({ ok: true, id: 1, name: 'X', created_at: '2026-01-01' }, { ok: true, id: 2, name: 'Y', created_at: null });
    const human = await run({ name: 'create_campaign', propsValue: { name: ' X ' } });
    await run({ name: 'ai_create_campaign', propsValue: { name: 'Y', client_id: 7 } });
    expect(human).toEqual({ ok: true, id: 1, name: 'X', created_at: '2026-01-01' });
    expect(call({ spy }).url).toContain('/campaigns/create');
    expect(call({ spy }).method).toBe(HttpMethod.POST);
    expect(call({ spy }).body).toEqual({ name: 'X' });
    expect(call({ spy }).queryParams).toEqual({ api_key: 'key_123' });
    expect(call({ spy, index: 1 }).body).toEqual({ name: 'Y', client_id: 7 });
  });

  it('list campaigns maps summary fields', async () => {
    mockSeq([{ id: 1, name: 'A', status: 'ACTIVE', created_at: 'c', updated_at: 'u', client_id: null, extra: 1 }]);
    const out = await run({ name: 'ai_list_campaigns' });
    expect(out).toEqual({ campaigns: [{ id: 1, name: 'A', status: 'ACTIVE', created_at: 'c', updated_at: 'u', client_id: null }] });
  });

  it('update status validates and posts', async () => {
    const spy = mockSeq({ ok: true });
    const out = await run({ name: 'ai_update_campaign_status', propsValue: { campaign_id: 3, status: 'paused' } });
    expect(out).toEqual({ ok: true, campaign_id: 3, status: 'PAUSED' });
    expect(call({ spy }).url).toContain('/campaigns/3/status');
    expect(call({ spy }).body).toEqual({ status: 'PAUSED' });
    await expect(run({ name: 'ai_update_campaign_status', propsValue: { campaign_id: 3, status: 'go' } })).rejects.toThrow('Status must be one of');
  });

  it('empty 200 body for a missing campaign throws not found', async () => {
    mockSeq(null, '', {});
    await expect(run({ name: 'ai_get_campaign', propsValue: { campaign_id: 4247768 } })).rejects.toThrow('Campaign 4247768 not found.');
    await expect(run({ name: 'ai_get_campaign_statistics', propsValue: { campaign_id: 4247768 } })).rejects.toThrow('Campaign 4247768 not found.');
    await expect(run({ name: 'get_campaign_statistics', propsValue: { campaign_id: 4247768 } })).rejects.toThrow('Campaign 4247768 not found.');
  });

  it('human status actions share the ai request path', async () => {
    const spy = mockSeq({ ok: true }, { ok: true });
    expect(await run({ name: 'update_campaign_status', propsValue: { campaign_id: 3, status: 'START' } })).toEqual({ ok: true, campaign_id: 3, status: 'START' });
    expect(call({ spy }).url).toContain('/campaigns/3/status');
    expect(call({ spy }).body).toEqual({ status: 'START' });
    expect(await run({ name: 'update_lead_status_in_campaign', propsValue: { campaign_id: 3, lead_id: 8, action: 'resume' } })).toEqual({ ok: true, campaign_id: 3, lead_id: 8, action: 'resume' });
    expect(call({ spy, index: 1 }).url).toContain('/campaigns/3/leads/8/resume');
    expect(smartlead.actions()['update_campaign_status'].aiMetadata?.idempotent).toBe(true);
  });

  it('delete campaign sends DELETE', async () => {
    const spy = mockSeq({ ok: true });
    expect(await run({ name: 'ai_delete_campaign', propsValue: { campaign_id: 9 } })).toEqual({ ok: true, campaign_id: 9 });
    expect(call({ spy }).method).toBe(HttpMethod.DELETE);
    expect(call({ spy }).url).toContain('/campaigns/9');
  });

  it('rejects a non-positive campaign id before any request', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(run({ name: 'ai_get_campaign_statistics', propsValue: { campaign_id: 0 } })).rejects.toThrow('positive whole number');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('update campaign settings', () => {
  it('untouched tri-state values are not sent; at least one setting required', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      run({ name: 'update_campaign_settings', propsValue: { campaign_id: 1, track_open: null, stop_lead_settings: null, unsubscribe_text: '' } })
    ).rejects.toThrow('At least one setting');
    expect(spy).not.toHaveBeenCalled();
  });

  it('merges tracking into the existing track_settings array', async () => {
    const spy = mockSeq({ id: 1, track_settings: ['DONT_TRACK_LINK_CLICK', 'DONT_TRACK_REPLY_TO_AN_EMAIL'] }, { ok: true });
    await run({ name: 'update_campaign_settings', propsValue: { campaign_id: 1, track_open: false, track_click: true } });
    expect(call({ spy }).method).toBe(HttpMethod.GET);
    expect(call({ spy, index: 1 }).url).toContain('/campaigns/1/settings');
    const body = call({ spy, index: 1 }).body;
    expect(Reflect.get(body, 'track_settings')).toEqual(['DONT_TRACK_REPLY_TO_AN_EMAIL', 'DONT_TRACK_EMAIL_OPEN']);
  });

  it('sends only the provided fields, maps legacy stop values, validates percentage', async () => {
    const spy = mockSeq({ ok: true });
    await run({ name: 'update_campaign_settings', propsValue: { campaign_id: 1, stop_lead_settings: 'OPENED_EMAIL', send_as_plain_text: false } });
    expect(call({ spy }).body).toEqual({ stop_lead_settings: 'OPEN_AN_EMAIL', send_as_plain_text: false });
    await expect(run({ name: 'ai_update_campaign_settings', propsValue: { campaign_id: 1, follow_up_percentage: 150 } })).rejects.toThrow('between 0 and 100');
  });
});

describe('mapped tri-state settings', () => {
  it('mapped "false" disables tracking', async () => {
    const spy = mockSeq({ id: 1, track_settings: [] }, { ok: true });
    await run({ name: 'update_campaign_settings', propsValue: { campaign_id: 1, track_open: 'false', track_click: ' FALSE ' } });
    expect(Reflect.get(call({ spy, index: 1 }).body, 'track_settings')).toEqual(['DONT_TRACK_EMAIL_OPEN', 'DONT_TRACK_LINK_CLICK']);
  });
  it('mapped "true" strings become booleans in the request', async () => {
    const spy = mockSeq({ ok: true });
    await run({ name: 'update_campaign_settings', propsValue: { campaign_id: 1, enable_ai_esp_matching: 'true', send_as_plain_text: 'True' } });
    expect(call({ spy }).body).toEqual({ enable_ai_esp_matching: true, send_as_plain_text: true });
  });
  it('empty mapped values leave the field out; invalid values throw', async () => {
    const spy = mockSeq({ ok: true });
    await run({ name: 'update_campaign_settings', propsValue: { campaign_id: 1, track_open: '', enable_ai_esp_matching: '  ', send_as_plain_text: 'false' } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(call({ spy }).body).toEqual({ send_as_plain_text: false });
    await expect(run({ name: 'update_campaign_settings', propsValue: { campaign_id: 1, track_click: 'yes' } })).rejects.toThrow('Track Clicks must be true, false');
  });
});

describe('settings fixes', () => {
  it('throws instead of clearing tracking when GET has no track_settings', async () => {
    const spy = mockSeq({ id: 1 });
    await expect(run({ name: 'update_campaign_settings', propsValue: { campaign_id: 1, track_open: true } })).rejects.toThrow('tracking was not changed');
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('normalises the live GET track_settings names before applying on/off', async () => {
    const spy = mockSeq({ id: 1, track_settings: ['DONT_EMAIL_OPEN', 'DONT_LINK_CLICK', 'DONT_TRACK_EMAIL_OPEN', 'DONT_REPLY_TO_AN_EMAIL', 'DONT_TRACK_REPLY_TO_AN_EMAIL'] }, { ok: true });
    await run({ name: 'ai_update_campaign_settings', propsValue: { campaign_id: 1, track_opens: 'on' } });
    expect(Reflect.get(call({ spy, index: 1 }).body, 'track_settings')).toEqual(['DONT_TRACK_LINK_CLICK', 'DONT_TRACK_REPLY_TO_AN_EMAIL']);
  });
  it('stop options list only the current values; legacy ones are only mapped in run()', () => {
    const prop = Reflect.get(smartlead.actions()['update_campaign_settings'].props, 'stop_lead_settings');
    const values = prop.options.options.map((o: { value: string }) => o.value);
    expect(values).toEqual(['REPLY_TO_AN_EMAIL', 'OPEN_AN_EMAIL', 'CLICK_ON_A_LINK']);
  });
  it('classifies by worst reachable path', () => {
    const actions = smartlead.actions();
    for (const name of ['update_campaign_status', 'ai_update_campaign_status', 'update_lead_status_in_campaign', 'ai_update_lead_status_in_campaign']) {
      expect(Reflect.get(actions[name], 'classification')).toBe('DESTRUCTIVE');
    }
    for (const name of ['ai_list_campaigns', 'ai_list_campaign_leads', 'ai_list_email_accounts']) {
      expect(Reflect.get(actions[name], 'classification')).toBe('SEARCH');
    }
  });
  it('ai settings booleans are tri-state', async () => {
    const spy = mockSeq({ ok: true });
    await run({ name: 'ai_update_campaign_settings', propsValue: { campaign_id: 1, send_as_plain_text: 'off', follow_up_percentage: 10 } });
    expect(call({ spy }).body).toEqual({ send_as_plain_text: false, follow_up_percentage: 10 });
    await expect(run({ name: 'ai_update_campaign_settings', propsValue: { campaign_id: 1, track_opens: 'maybe' } })).rejects.toThrow('"on", "off"');
  });
});

describe('leads', () => {
  it('add leads: invalid JSON and null entries give clean errors', async () => {
    await expect(run({ name: 'add_leads_to_campaign', propsValue: { campaign_id: 1, lead_list: '[{' } })).rejects.toThrow('not valid JSON');
    await expect(run({ name: 'add_leads_to_campaign', propsValue: { campaign_id: 1, lead_list: [null] } })).rejects.toThrow('index 0 must be an object');
    await expect(run({ name: 'add_leads_to_campaign', propsValue: { campaign_id: 1, lead_list: [{ first_name: 'a' }] } })).rejects.toThrow('missing a required "email"');
  });

  it('ai add leads strips empty fields and sends only true flags', async () => {
    const spy = mockSeq({ ok: true, upload_count: 1, total_leads: 1 });
    const out = await run({
      name: 'ai_add_leads_to_campaign',
      propsValue: { campaign_id: 4, leads: [{ email: ' a@b.co ', first_name: '', last_name: 'L' }], ignore_global_block_list: true, ignore_unsubscribe_list: false },
    });
    expect(call({ spy }).url).toContain('/campaigns/4/leads');
    expect(call({ spy }).body).toEqual({ lead_list: [{ email: 'a@b.co', last_name: 'L' }], settings: { ignore_global_block_list: true } });
    expect(Reflect.get(out, 'upload_count')).toBe(1);
  });

  it('list campaign leads passes pagination and rejects limit > 100', async () => {
    const spy = mockSeq({ total_leads: '2', data: [{ lead: { id: 1 } }] });
    const out = await run({ name: 'ai_list_campaign_leads', propsValue: { campaign_id: 2, offset: 10, limit: 5 } });
    expect(call({ spy }).queryParams).toEqual({ api_key: 'key_123', offset: '10', limit: '5' });
    expect(out).toEqual({ total_leads: '2', offset: 10, limit: 5, leads: [{ lead: { id: 1 } }] });
    await expect(run({ name: 'ai_list_campaign_leads', propsValue: { campaign_id: 2, limit: 500 } })).rejects.toThrow('between 1 and 100');
  });

  it('find lead by email: found and not found', async () => {
    mockSeq({ id: 77, email: 'a@b.co' }, {});
    expect(await run({ name: 'ai_find_lead_by_email', propsValue: { email: 'a@b.co' } })).toEqual({ found: true, lead: { id: 77, email: 'a@b.co' } });
    expect(await run({ name: 'ai_find_lead_by_email', propsValue: { email: 'x@b.co' } })).toEqual({ found: false, lead: null });
  });

  it('update lead status uses the action path', async () => {
    const spy = mockSeq({ ok: true });
    await run({ name: 'ai_update_lead_status_in_campaign', propsValue: { campaign_id: 1, lead_id: 2, action: 'Unsubscribe' } });
    expect(call({ spy }).url).toContain('/campaigns/1/leads/2/unsubscribe');
    await expect(run({ name: 'ai_update_lead_status_in_campaign', propsValue: { campaign_id: 1, lead_id: 2, action: 'archive' } })).rejects.toThrow('Action must be one of');
  });

  it('delete lead and message history', async () => {
    const spy = mockSeq({ ok: true }, { history: [{ type: 'SENT' }] });
    await run({ name: 'ai_delete_lead_from_campaign', propsValue: { campaign_id: 1, lead_id: 2 } });
    expect(call({ spy }).method).toBe(HttpMethod.DELETE);
    const out = await run({ name: 'ai_get_lead_message_history', propsValue: { campaign_id: 1, lead_id: 2 } });
    expect(call({ spy, index: 1 }).url).toContain('/campaigns/1/leads/2/message-history');
    expect(Reflect.get(out, 'history')).toEqual([{ type: 'SENT' }]);
  });

  it('list email accounts maps fields', async () => {
    mockSeq([{ id: 1, from_email: 'a@b.co', smtp_password: 'secret' }]);
    const out = await run({ name: 'ai_list_email_accounts' });
    const accounts = Reflect.get(out, 'email_accounts');
    expect(accounts[0].from_email).toBe('a@b.co');
    expect(accounts[0].smtp_password).toBeUndefined();
  });
});

describe('trigger', () => {
  it('registers and deletes the campaign webhook', async () => {
    const trigger = smartlead.triggers()['new_campaign_event'];
    const store = new Map<string, unknown>();
    const ctx = {
      auth,
      webhookUrl: 'https://hook.example/x',
      propsValue: { campaign_id: 5, event_types: [SMARTLEAD_WEBHOOK_EVENTS[3].value] },
      store: {
        put: async (k: string, v: unknown) => { store.set(k, v); return v; },
        get: async (k: string) => store.get(k) ?? null,
        delete: async (k: string) => { store.delete(k); },
      },
    };
    const spy = mockSeq({ id: 42 }, { ok: true });
    await Reflect.apply(trigger.onEnable, undefined, [ctx]);
    expect(call({ spy }).url).toContain('/campaigns/5/webhooks');
    expect(Reflect.get(call({ spy }).body, 'event_types')).toEqual(['EMAIL_REPLY']);
    await Reflect.apply(trigger.onDisable, undefined, [ctx]);
    expect(call({ spy, index: 1 }).method).toBe(HttpMethod.DELETE);
    expect(call({ spy, index: 1 }).body).toEqual({ id: 42 });
    expect(store.size).toBe(0);
  });
  it('onDisable ignores a 404 but rethrows other errors', async () => {
    const trigger = smartlead.triggers()['new_campaign_event'];
    const store = new Map<string, unknown>([['smartlead_campaign_webhook', { webhookId: 1, campaignId: 5 }]]);
    const ctx = {
      auth,
      store: {
        get: async (k: string) => store.get(k) ?? null,
        delete: async (k: string) => { store.delete(k); },
      },
    };
    mockSeq(failure({ status: 404, body: {} }));
    await Reflect.apply(trigger.onDisable, undefined, [ctx]);
    expect(store.size).toBe(0);
    store.set('smartlead_campaign_webhook', { webhookId: 1, campaignId: 5 });
    mockSeq(failure({ status: 500, body: {} }));
    await expect(Reflect.apply(trigger.onDisable, undefined, [ctx])).rejects.toThrow('status 500');
  });
});
