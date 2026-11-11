import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { OutputSchema } from '@activepieces/pieces-framework';
import { ccTransport } from '../src/lib/common/client';
import { constantContactAiActions } from '../src/lib/actions/ai';
import { findContactsAiAction } from '../src/lib/actions/ai/find-contacts';
import { unsubscribeContactAiAction } from '../src/lib/actions/ai/unsubscribe-contact';
import { updateContactAiAction } from '../src/lib/actions/ai/update-contact';
import { createEmailCampaignDraftAiAction } from '../src/lib/actions/ai/create-email-campaign-draft';
import { sendTestEmailAiAction } from '../src/lib/actions/ai/send-test-email';
import { listEmailCampaignsAiAction } from '../src/lib/actions/ai/list-email-campaigns';
import { listAccountEmailsAiAction } from '../src/lib/actions/ai/list-account-emails';
import { addContactsToListAiAction } from '../src/lib/actions/ai/add-contacts-to-list';
import { listContactListsAiAction } from '../src/lib/actions/ai/list-contact-lists';
import { getEmailCampaignStatsAiAction } from '../src/lib/actions/ai/get-email-campaign-stats';
import { createContactListAiAction } from '../src/lib/actions/ai/create-contact-list';
import { deleteContactAiAction } from '../src/lib/actions/ai/delete-contact';

beforeEach(() => stubTransport());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AI action metadata', () => {
  test('21 ai atomics with outputSchema, aiMetadata and no dynamic or checkbox props', () => {
    expect(constantContactAiActions).toHaveLength(21);
    expect(new Set(constantContactAiActions.map((action) => action.name)).size).toBe(21);
    for (const action of constantContactAiActions) {
      expect(action.audience).toBe('ai');
      expect(action.name.endsWith('_ai')).toBe(true);
      expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
      expect(action.aiMetadata?.description).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
      for (const prop of Object.values(action.props)) {
        expect(['CHECKBOX', 'DROPDOWN', 'DYNAMIC', 'MULTI_SELECT_DROPDOWN']).not.toContain(prop.type);
      }
    }
  });

  test('creates, deletes and sends are not idempotent', () => {
    const flags = Object.fromEntries(constantContactAiActions.map((action) => [action.name, action.aiMetadata?.idempotent]));
    expect(flags['create_contact_list_ai']).toBe(false);
    expect(flags['create_tag_ai']).toBe(false);
    expect(flags['delete_contact_ai']).toBe(false);
    expect(flags['create_email_campaign_draft_ai']).toBe(false);
    expect(flags['send_test_email_ai']).toBe(false);
    expect(deleteContactAiAction.classification).toBe('DESTRUCTIVE');
  });

  test('no action can schedule or send a campaign to lists', () => {
    const text = constantContactAiActions.map((action) => action.run.toString()).join('\n');
    expect(text).not.toContain('/schedules');
    expect(text).not.toContain('all_active_contacts');
  });
});

describe('find_contacts_ai', () => {
  test('maps filters, includes subresources and returns the cursor', async () => {
    const seen = route({
      routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [{ contact_id: CONTACT_ID }], contacts_count: 7, _links: { next: { href: '/v3/contacts?cursor=Y3Vy' } } } } },
    });
    const result = await findContactsAiAction.run(
      ctx({ propsValue: { list_ids: `${LIST_A}, ${LIST_B}`, status: 'Active,unsubscribed', created_after: '2026-01-01', include_count: 'yes', limit: '100' } }),
    );
    expect(result).toEqual({ contacts: [{ contact_id: CONTACT_ID }], contacts_count: 7, next_cursor: 'Y3Vy' });
    expect(seen[0].query.get('lists')).toBe(`${LIST_A},${LIST_B}`);
    expect(seen[0].query.get('status')).toBe('active,unsubscribed');
    expect(seen[0].query.get('created_after')).toBe('2026-01-01T00:00:00.000Z');
    expect(seen[0].query.get('include_count')).toBe('true');
    expect(seen[0].query.get('limit')).toBe('100');
    expect(seen[0].query.get('include')).toContain('taggings');
    expect(seen[0].query.has('tags')).toBe(false);
  });

  test('rejects bad input before calling the API', async () => {
    const seen = route({ routes: {} });
    await expect(findContactsAiAction.run(ctx({ propsValue: { status: 'gone' } }))).rejects.toThrow('Status "gone" is not valid');
    await expect(findContactsAiAction.run(ctx({ propsValue: { limit: 501 } }))).rejects.toThrow('Limit must be a whole number from 1 to 500');
    await expect(findContactsAiAction.run(ctx({ propsValue: { created_after: 'yesterday' } }))).rejects.toThrow('ISO 8601');
    await expect(findContactsAiAction.run(ctx({ propsValue: { list_ids: 'Newsletter' } }))).rejects.toThrow('not a Constant Contact ID');
    await expect(findContactsAiAction.run(ctx({ propsValue: { cursor: 'a b' } }))).rejects.toThrow('Cursor must be');
    expect(seen).toHaveLength(0);
  });

  test('passes the cursor back with the filters', async () => {
    const seen = route({ routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [] } } } });
    await findContactsAiAction.run(ctx({ propsValue: { email: 'a@b.co', cursor: 'Y3Vy' } }));
    expect(seen[0].query.get('cursor')).toBe('Y3Vy');
    expect(seen[0].query.get('email')).toBe('a@b.co');
  });
});

describe('contact writes', () => {
  test('update_contact_ai never changes the email permission', async () => {
    const seen = route({
      routes: {
        [`GET /v3/contacts/${CONTACT_ID}`]: { status: 200, body: { contact_id: CONTACT_ID, email_address: { address: 'a@b.co', permission_to_send: 'unsubscribed' }, list_memberships: [LIST_A] } },
        [`PUT /v3/contacts/${CONTACT_ID}`]: { status: 200, body: {} },
      },
    });
    await updateContactAiAction.run(ctx({ propsValue: { contact_id_or_email: CONTACT_ID, company_name: 'New Co', custom_fields: `{"${FIELD_A}": 5}` } }));
    const put = seen.find((call) => call.key.startsWith('PUT'));
    expect(put?.body).toEqual({
      email_address: { address: 'a@b.co', permission_to_send: 'unsubscribed' },
      company_name: 'New Co',
      update_source: 'Account',
      custom_fields: [{ custom_field_id: FIELD_A, value: '5' }],
    });
  });

  test('unsubscribe_contact_ai skips the PUT when already unsubscribed', async () => {
    const current = { contact_id: CONTACT_ID, email_address: { address: 'a@b.co', permission_to_send: 'unsubscribed' } };
    const seen = route({ routes: { [`GET /v3/contacts/${CONTACT_ID}`]: { status: 200, body: current } } });
    expect(await unsubscribeContactAiAction.run(ctx({ propsValue: { contact_id_or_email: CONTACT_ID } }))).toEqual(current);
    expect(seen.every((call) => call.key.startsWith('GET'))).toBe(true);
  });

  test('unsubscribe_contact_ai sets unsubscribed with the reason', async () => {
    const seen = route({
      routes: {
        [`GET /v3/contacts/${CONTACT_ID}`]: { status: 200, body: { contact_id: CONTACT_ID, email_address: { address: 'a@b.co', permission_to_send: 'explicit' } } },
        [`PUT /v3/contacts/${CONTACT_ID}`]: { status: 200, body: {} },
      },
    });
    await unsubscribeContactAiAction.run(ctx({ propsValue: { contact_id_or_email: CONTACT_ID, reason: 'Asked by phone' } }));
    const put = seen.find((call) => call.key.startsWith('PUT'));
    expect(put?.body).toEqual({ email_address: { address: 'a@b.co', permission_to_send: 'unsubscribed', opt_out_reason: 'Asked by phone' }, update_source: 'Account' });
  });

  test('add_contacts_to_list_ai caps email lookups and sends contact ids only', async () => {
    const seen = route({ routes: { 'POST /v3/activities/add_list_memberships': { status: 201, body: { activity_id: 'x', state: 'completed', activity_errors: [] } } } });
    await addContactsToListAiAction.run(ctx({ propsValue: { contacts: `${CONTACT_ID}`, list_ids: LIST_A } }));
    expect(seen[0].body).toEqual({ source: { contact_ids: [CONTACT_ID] }, list_ids: [LIST_A] });
    const emails = Array.from({ length: 21 }, (_, index) => `p${index}@example.com`).join(',');
    await expect(addContactsToListAiAction.run(ctx({ propsValue: { contacts: emails, list_ids: LIST_A } }))).rejects.toThrow('at most 20 entries may be email addresses');
  });

  test('create_contact_list_ai sends favorite false by default and surfaces a 409', async () => {
    const seen = route({ routes: { 'POST /v3/contact_lists': { status: 409, body: [{ error_key: 'contact_lists.conflict', error_message: 'The list name already exists' }] } } });
    await expect(createContactListAiAction.run(ctx({ propsValue: { name: 'AP Test A' } }))).rejects.toThrow(/HTTP 409.*duplicate name.*already exists/);
    expect(seen[0].body).toEqual({ name: 'AP Test A', favorite: false });
  });
});

describe('campaign atomics', () => {
  test('a 403 on campaigns asks to reconnect for campaign_data', async () => {
    route({ routes: { 'GET /v3/emails': { status: 403, body: { error_key: 'unauthorized', error_message: 'Insufficient scope' } } } });
    await expect(listEmailCampaignsAiAction.run(ctx({ propsValue: {} }))).rejects.toThrow('grant campaign_data');
  });

  test('a 403 on sender addresses asks to reconnect for account_read', async () => {
    route({ routes: { 'GET /v3/account/emails': { status: 403, body: { error_key: 'unauthorized', error_message: 'Insufficient scope' } } } });
    await expect(listAccountEmailsAiAction.run(ctx({ propsValue: {} }))).rejects.toThrow('grant account_read');
  });

  test('draft creation requires the tracking image and never schedules', async () => {
    const seen = route({ routes: { 'POST /v3/emails': { status: 200, body: { campaign_id: 'c', campaign_activities: [] } } } });
    const base = { name: 'Nov test', subject: 'Hi', from_name: 'Odai', from_email: 'sender@example.com', reply_to_email: 'sender@example.com' };
    await expect(createEmailCampaignDraftAiAction.run(ctx({ propsValue: { ...base, html_content: '<html><body>Hi</body></html>' } }))).rejects.toThrow('[[trackingImage]]');
    await createEmailCampaignDraftAiAction.run(ctx({ propsValue: { ...base, html_content: '<html><body>[[trackingImage]]Hi</body></html>' } }));
    expect(seen.map((call) => call.key)).toEqual(['POST /v3/emails']);
    expect(seen[0].body).toEqual({
      name: 'Nov test',
      email_campaign_activities: [
        { format_type: 5, from_name: 'Odai', from_email: 'sender@example.com', reply_to_email: 'sender@example.com', subject: 'Hi', html_content: '<html><body>[[trackingImage]]Hi</body></html>' },
      ],
    });
  });

  test('send_test_email_ai allows at most 5 recipients and returns them after a 204', async () => {
    const activityId = 'a4d1e5a0-1234-11ea-a1cb-fa163e56c9b0';
    route({ routes: { [`POST /v3/emails/activities/${activityId}/tests`]: { status: 204 } } });
    await expect(sendTestEmailAiAction.run(ctx({ propsValue: { campaign_activity_id: activityId, email_addresses: 'a@x.io,b@x.io,c@x.io,d@x.io,e@x.io,f@x.io' } }))).rejects.toThrow('between 1 and 5');
    expect(await sendTestEmailAiAction.run(ctx({ propsValue: { campaign_activity_id: activityId, email_addresses: 'a@x.io' } }))).toEqual({ campaign_activity_id: activityId, sent_to: ['a@x.io'] });
  });

  test('stats join up to 10 ids into the path', async () => {
    const seen = route({ routes: { [`GET /v3/reports/stats/email_campaigns/${LIST_A},${LIST_B}`]: { status: 200, body: { results: [], errors: [] } } } });
    expect(await getEmailCampaignStatsAiAction.run(ctx({ propsValue: { campaign_ids: `${LIST_A},${LIST_B}` } }))).toEqual({ results: [], errors: [] });
    expect(seen).toHaveLength(1);
  });

  test('list_contact_lists_ai asks for membership counts', async () => {
    const seen = route({ routes: { 'GET /v3/contact_lists': { status: 200, body: { lists: [] } } } });
    expect(await listContactListsAiAction.run(ctx({ propsValue: { name: 'AP Test A' } }))).toEqual({ lists: [], next_cursor: null });
    expect(seen[0].query.get('include_membership_count')).toBe('all');
    expect(seen[0].query.get('name')).toBe('AP Test A');
  });
});



function stubTransport(): void {
  vi.spyOn(ccTransport, 'getDispatcher').mockResolvedValue(undefined);
  vi.spyOn(ccTransport, 'sleep').mockResolvedValue(undefined);
}

function route({ routes }: { routes: Record<string, Reply | Reply[]> }): Seen[] {
  const seen: Seen[] = [];
  const counters = new Map<string, number>();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      const key = `${init?.method ?? 'GET'} ${url.pathname}`;
      const headers = new Headers(init?.headers);
      seen.push({
        key,
        url,
        query: url.searchParams,
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : null,
        authorization: headers.get('authorization'),
        redirect: init?.redirect,
      });
      const entry = routes[key];
      const index = counters.get(key) ?? 0;
      counters.set(key, index + 1);
      const reply = Array.isArray(entry) ? entry[Math.min(index, entry.length - 1)] : entry;
      if (reply === undefined) {
        return new Response(JSON.stringify([{ error_key: 'test.unexpected', error_message: `unexpected ${key}` }]), { status: 599 });
      }
      if (reply.status === 204) {
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify(reply.body), { status: reply.status });
    }),
  );
  return seen;
}

function ctx({ propsValue, store }: { propsValue: Record<string, unknown>; store?: unknown }) {
  return Object.assign(Object.create(null), {
    auth: { type: 'OAUTH2', access_token: 'test-token' },
    propsValue,
    store,
  });
}


const CONTACT_ID = '1618ae62-4752-11e9-9c8a-fa163e6b01c1';
const LIST_A = '07936f78-662a-11eb-af0a-fa163e56c9b0';
const LIST_B = '17936f78-662a-11eb-af0a-fa163e56c9b0';
const FIELD_A = '2618ae62-4752-11e9-9c8a-fa163e6b01c1';

type Reply = { status: number; body?: unknown };

type Seen = {
  key: string;
  url: URL;
  query: URLSearchParams;
  body: unknown;
  authorization: string | null;
  redirect: RequestRedirect | undefined;
};

describe('campaign outputSchemas scored both ways against live captures (round 3)', () => {
  const allowedDead: Record<string, string[]> = {
    list_account_emails_ai: ['emails.pending_roles'],
    get_email_campaign_ai: ['campaign_activities.document_id'],
    get_email_campaign_ai_draft: ['campaign_activities.document_id'],
  };

  test.each(Object.keys(LIVE_R3))('%s', (capture) => {
    const { action: name, output } = LIVE_R3[capture];
    const action = constantContactAiActions.find((candidate) => candidate.name === name);
    expect(action).toBeDefined();
    const result = scoreSchema({ fields: action?.outputSchema?.fields ?? [], value: output, path: '' });
    expect(result.unmodelled).toEqual([]);
    expect(result.dead.filter((field) => !(allowedDead[capture] ?? []).includes(field))).toEqual([]);
  });
});

function scoreSchema({ fields, value, path }: { fields: OutputSchema['fields']; value: unknown; path: string }): { dead: string[]; unmodelled: string[] } {
  if (Array.isArray(value)) {
    const results = value.map((item) => scoreSchema({ fields, value: item, path }));
    return { dead: results.flatMap((r) => r.dead), unmodelled: results.flatMap((r) => r.unmodelled) };
  }
  if (typeof value !== 'object' || value === null) {
    return { dead: [], unmodelled: [] };
  }
  const record = Object.fromEntries(Object.entries(value));
  const known = new Set(fields.map((field) => field.value ?? field.key));
  const nested = fields.map((field) => {
    const key = field.value ?? field.key;
    const here = path === '' ? key : `${path}.${key}`;
    if (!(key in record)) {
      return { dead: [here], unmodelled: [] };
    }
    const inner = field.children ?? field.listItems;
    return inner ? scoreSchema({ fields: inner, value: record[key], path: here }) : { dead: [], unmodelled: [] };
  });
  return {
    dead: nested.flatMap((r) => r.dead),
    unmodelled: [...Object.keys(record).filter((key) => !known.has(key)).map((key) => (path === '' ? key : `${path}.${key}`)), ...nested.flatMap((r) => r.unmodelled)],
  };
}

const LIVE_R3: Record<string, { action: string; output: unknown }> = {
  "list_account_emails_ai": {
    "action": "list_account_emails_ai",
    "output": {
      "emails": [
        {
          "email_id": 1,
          "email_address": "sender@example.com",
          "roles": [
            "BILLING",
            "CONTACT",
            "DEFAULT_FROM",
            "REPLY_TO"
          ],
          "confirm_status": "CONFIRMED",
          "confirm_source": "NTTF-signin-email",
          "confirm_time": "2026-11-11T08:20:28.893+0000",
          "confirm_source_type": "SITE_OWNER"
        }
      ]
    }
  },
  "list_email_campaigns_ai": {
    "action": "list_email_campaigns_ai",
    "output": {
      "campaigns": [
        {
          "campaign_id": "2fdce903-9e64-406f-9231-3183b557006a",
          "created_at": "2026-11-11T08:21:15.000Z",
          "current_status": "Done",
          "name": "Window display newsletter 2026/11/11, 11:21:15 AM",
          "type": "NEWSLETTER",
          "type_code": 10,
          "updated_at": "2026-11-11T08:21:45.000Z"
        }
      ],
      "next_cursor": null
    }
  },
  "get_email_campaign_ai": {
    "action": "get_email_campaign_ai",
    "output": {
      "campaign_activities": [
        {
          "campaign_activity_id": "30e449ed-fa28-4dc7-93c6-b630f995559a",
          "role": "permalink"
        },
        {
          "campaign_activity_id": "3318232d-b108-414b-85c2-c4d29eba47a0",
          "role": "primary_email"
        }
      ],
      "campaign_id": "2fdce903-9e64-406f-9231-3183b557006a",
      "created_at": "2026-11-11T08:21:15.000Z",
      "current_status": "DONE",
      "name": "Window display newsletter 2026/11/11, 11:21:15 AM",
      "type": "NEWSLETTER",
      "type_code": 10,
      "updated_at": "2026-11-11T08:21:45.000Z"
    }
  },
  "get_email_campaign_ai_draft": {
    "action": "get_email_campaign_ai",
    "output": {
      "campaign_activities": [
        {
          "campaign_activity_id": "3b7fa99e-5a64-4229-8c0f-9975ef39db8f",
          "role": "primary_email"
        },
        {
          "campaign_activity_id": "75fe75ec-2f26-455c-81cb-3a3325d1edf0",
          "role": "permalink"
        }
      ],
      "campaign_id": "fa506de0-29d3-4531-85d5-1d98ade9da4c",
      "created_at": "2026-11-11T11:48:40.000Z",
      "current_status": "DRAFT",
      "name": "AP Test Draft",
      "type": "CUSTOM_CODE_EMAIL",
      "type_code": 26,
      "updated_at": "2026-11-11T11:48:40.000Z"
    }
  },
  "get_email_campaign_stats_ai": {
    "action": "get_email_campaign_stats_ai",
    "output": {
      "results": [
        {
          "campaign_id": "2fdce903-9e64-406f-9231-3183b557006a",
          "stats": {
            "em_bounces": 0,
            "em_clicks": 0,
            "em_clicks_all": 0,
            "em_clicks_all_computer": 0,
            "em_clicks_all_mobile": 0,
            "em_clicks_all_tablet": 0,
            "em_clicks_all_other": 0,
            "em_clicks_all_none": 0,
            "em_forwards": 0,
            "em_not_opened": 1,
            "em_opens": 0,
            "em_opens_all": 0,
            "em_opens_all_computer": 0,
            "em_opens_all_mobile": 0,
            "em_opens_all_tablet": 0,
            "em_opens_all_other": 0,
            "em_opens_all_none": 0,
            "em_optouts": 0,
            "em_sends": 1
          },
          "percents": {
            "bounce": 0,
            "click": 0,
            "desktop_click": 0,
            "desktop_open": 0,
            "did_not_open": 100,
            "mobile_click": 0,
            "mobile_open": 0,
            "open": 0,
            "unsubscribe": 0
          },
          "last_refresh_time": "2026-11-11T11:48:38.844Z"
        }
      ],
      "errors": []
    }
  },
  "create_email_campaign_draft_ai": {
    "action": "create_email_campaign_draft_ai",
    "output": {
      "campaign_activities": [
        {
          "campaign_activity_id": "3b7fa99e-5a64-4229-8c0f-9975ef39db8f",
          "role": "primary_email",
          "document_id": "4ac0df84-b20c-4e7d-b5e9-3b55ef6ca16f"
        },
        {
          "campaign_activity_id": "75fe75ec-2f26-455c-81cb-3a3325d1edf0",
          "role": "permalink",
          "document_id": "4ac0df84-b20c-4e7d-b5e9-3b55ef6ca16f"
        }
      ],
      "campaign_id": "fa506de0-29d3-4531-85d5-1d98ade9da4c",
      "created_at": "2026-11-11T11:48:40.830Z",
      "current_status": "Draft",
      "name": "AP Test Draft",
      "type": "CUSTOM_CODE_EMAIL",
      "type_code": 26,
      "updated_at": "2026-11-11T11:48:40.830Z"
    }
  },
  "send_test_email_ai": {
    "action": "send_test_email_ai",
    "output": {
      "campaign_activity_id": "3b7fa99e-5a64-4229-8c0f-9975ef39db8f",
      "sent_to": [
        "sender@example.com"
      ]
    }
  }
};
