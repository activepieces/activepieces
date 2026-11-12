import { AppConnectionType, PropertyType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockActionContext } from '../../../framework/src/lib/test';
import { klaviyo } from '../src/index';
import { klaviyoTransport } from '../src/lib/common/client';
import { klaviyoAiActions } from '../src/lib/actions/ai';
import { getProfileAi } from '../src/lib/actions/ai/get-profile';
import { listProfilesAi } from '../src/lib/actions/ai/list-profiles';
import { subscribeProfileAi } from '../src/lib/actions/ai/subscribe-profile';
import { unsubscribeProfileAi } from '../src/lib/actions/ai/unsubscribe-profile';
import { getListAi } from '../src/lib/actions/ai/get-list';
import { listListMembersAi } from '../src/lib/actions/ai/list-list-members';
import { listEventsAi } from '../src/lib/actions/ai/list-events';
import { listSegmentsAi } from '../src/lib/actions/ai/list-segments';
import { klaviyoOutputSchemas } from '../src/lib/common/output-schemas';

function stub({ replies }: { replies: Reply[] }): Seen[] {
  const seen: Seen[] = [];
  vi.spyOn(klaviyoTransport, 'getDispatcher').mockResolvedValue({});
  vi.stubGlobal('fetch', async (input: string | URL, init: RequestInit) => {
    seen.push({ url: new URL(String(input)), method: String(init.method), body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined });
    const reply = replies[Math.min(seen.length - 1, replies.length - 1)];
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), { status: reply.status });
  });
  return seen;
}

function context({ propsValue }: { propsValue: Record<string, unknown> }) {
  return { ...createMockActionContext({ propsValue }), auth: AUTH };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('klaviyo AI metadata', () => {
  const actions = Object.values(klaviyo.actions());
  const displayNames = new Set(actions.map((action) => action.displayName));

  test('demoted actions are human and their twins exist', () => {
    const byName = klaviyo.actions();
    for (const name of ['createProfile', 'updateProfile', 'subscribeProfile', 'unsubscribeProfile']) {
      expect(byName[name].audience).toBe('human');
    }
    expect(byName['create_or_update_profile'].audience).toBe('both');
    expect(byName['subscribe_profile_ai'].displayName).toBe('Subscribe Profile to Marketing');
    expect(byName['unsubscribe_profile_ai'].displayName).toBe('Unsubscribe Profile from Marketing');
  });

  test('every ai action has metadata, a class, an output schema and no Checkbox/Dropdown/dynamic props', () => {
    for (const action of klaviyoAiActions) {
      expect(action.audience).toBe('ai');
      expect(action.aiMetadata?.description).toBeTruthy();
      expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
      expect(action.classification).toBeTruthy();
      expect(action.outputSchema).toBeDefined();
      for (const prop of Object.values(action.props)) {
        expect([PropertyType.CHECKBOX, PropertyType.DROPDOWN, PropertyType.MULTI_SELECT_DROPDOWN, PropertyType.DYNAMIC]).not.toContain(prop.type);
      }
    }
  });

  test('classification and idempotent flags', () => {
    const byName = klaviyo.actions();
    expect(byName['unsubscribe_profile_ai'].classification).toBe('DESTRUCTIVE');
    expect(byName['delete_list'].classification).toBe('DESTRUCTIVE');
    expect(byName['delete_list'].aiMetadata?.idempotent).toBe(false);
    expect(byName['track_event'].aiMetadata?.idempotent).toBe(false);
    expect(byName['list_events_ai'].classification).toBe('SEARCH');
    expect(byName['get_profile_ai'].classification).toBe('READ');
  });

  test('qa: minimumSupportedRelease is at least the 0.88.2 floor for ai atomics and Custom API Call', () => {
    expect(klaviyo.minimumSupportedRelease).toBe('0.88.2');
  });

  test('every non-custom action has an outputSchema', () => {
    for (const action of actions) {
      if (action.name !== 'custom_api_call') {
        expect(action.outputSchema, action.name).toBeDefined();
      }
    }
  });

  test('every sibling named in agent prose exists as a displayName', () => {
    const referenced = ['Find Profile by Email/Phone', 'List Profiles', 'List Lists', 'Find List by Name', 'List Segments', 'List Metrics', 'List Events', 'Get List', 'List List Members', 'List Segment Members', 'Find Tag by Name', 'Add Profile to List', 'Subscribe Profile to Marketing', 'Create or Update Profile', 'Add Tag to List or Segment'];
    for (const name of referenced) {
      expect(displayNames.has(name), name).toBe(true);
    }
    const prose = actions.map((action) => `${action.description} ${action.aiMetadata?.description ?? ''}`).join(' ');
    for (const name of referenced) {
      expect(prose.includes(name), name).toBe(true);
    }
  });
});

describe('klaviyo AI actions', () => {
  test('get profile with memberships returns flat profile and ids', async () => {
    const seen = stub({
      replies: [
        { status: 200, body: { data: { type: 'profile', id: 'P1', attributes: { email: 'a@b.com', location: { city: 'X' } } } } },
        { status: 200, body: { data: [{ type: 'list', id: 'L1' }], links: { next: null } } },
        { status: 200, body: { data: [{ type: 'segment', id: 'S1' }], links: { next: null } } },
      ],
    });
    const result = await getProfileAi.run(context({ propsValue: { profile_id: 'P1', include_memberships: 'yes' } }));
    expect(seen[1].url.pathname).toBe('/api/profiles/P1/relationships/lists');
    expect(result).toMatchObject({ id: 'P1', email: 'a@b.com', location: { city: 'X' }, list_ids: ['L1'], segment_ids: ['S1'] });
  });

  test('list profiles combines filters and returns the cursor shape', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [{ type: 'profile', id: 'P1', attributes: {} }], links: { next: 'https://a.klaviyo.com/api/profiles?page%5Bcursor%5D=n2' } } }] });
    const result = await listProfilesAi.run(context({ propsValue: { email: 'a@b.com', created_after: '2026-01-01T00:00:00Z', page_size: 50, cursor: 'c1' } }));
    expect(seen[0].url.searchParams.get('filter')).toBe('equals(email,"a@b.com"),greater-than(created,2026-01-01T00:00:00Z)');
    expect(seen[0].url.searchParams.get('page[size]')).toBe('50');
    expect(seen[0].url.searchParams.get('page[cursor]')).toBe('c1');
    expect(result).toMatchObject({ next_cursor: 'n2', has_more: true });
  });

  test('list profiles rejects a page size above the vendor maximum', async () => {
    stub({ replies: [{ status: 200, body: { data: [] } }] });
    await expect(listProfilesAi.run(context({ propsValue: { page_size: 500 } }))).rejects.toThrow('between 1 and 100');
  });

  test('subscribe twin sends email directly, list optional, consented_at only with historical import', async () => {
    const seen = stub({ replies: [{ status: 202 }] });
    const result = await subscribeProfileAi.run(context({ propsValue: { email: 'a@b.com', channel: 'email' } }));
    expect(seen[0].body).toEqual({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: { profiles: { data: [{ type: 'profile', attributes: { email: 'a@b.com', subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } } } }] } },
      },
    });
    expect(result).toEqual({ accepted: true, email: 'a@b.com', phone_number: null, channels: ['email'], list_id: null });
    await expect(subscribeProfileAi.run(context({ propsValue: { email: 'a@b.com', channel: 'email', historical_import: 'yes' } }))).rejects.toThrow('Consented At is required');
    await expect(subscribeProfileAi.run(context({ propsValue: { email: 'a@b.com', channel: 'email', consented_at: '2025-01-01T00:00:00Z' } }))).rejects.toThrow('only be sent with Historical Import');
    await expect(subscribeProfileAi.run(context({ propsValue: { email: 'a@b.com', channel: 'sms' } }))).rejects.toThrow('Phone Number is required');
    expect(await subscribeProfileAi.run(context({ propsValue: { email: 'a@b.com', phone_number: '+15005550006', channel: 'sms' } }))).toMatchObject({ email: null, phone_number: '+15005550006' });
  });

  test('unsubscribe twin "all" covers every channel the identifiers allow', async () => {
    const seen = stub({ replies: [{ status: 202 }] });
    await unsubscribeProfileAi.run(context({ propsValue: { email: 'a@b.com', phone_number: '+15005550006', channel: 'all', list_id: 'L1' } }));
    expect(await unsubscribeProfileAi.run(context({ propsValue: { email: 'a@b.com', phone_number: '+15005550006', channel: 'email' } }))).toMatchObject({ email: 'a@b.com', phone_number: null });
    expect(seen[0].body).toMatchObject({
      data: {
        attributes: {
          profiles: {
            data: [
              {
                attributes: {
                  email: 'a@b.com',
                  phone_number: '+15005550006',
                  subscriptions: { email: { marketing: { consent: 'UNSUBSCRIBED' } }, sms: { marketing: { consent: 'UNSUBSCRIBED' }, transactional: { consent: 'UNSUBSCRIBED' } } },
                },
              },
            ],
          },
        },
        relationships: { list: { data: { type: 'list', id: 'L1' } } },
      },
    });
  });

  test('list profiles rejects sort combinations Klaviyo refuses, before any request', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [] } }] });
    await expect(listProfilesAi.run(context({ propsValue: { created_after: '2026-01-01T00:00:00Z', sort: '-created' } }))).rejects.toThrow('With Created After');
    await expect(listProfilesAi.run(context({ propsValue: { updated_after: '2026-01-01T00:00:00Z', sort: '-created' } }))).rejects.toThrow('With Updated After');
    await expect(listProfilesAi.run(context({ propsValue: { created_after: '2026-01-01T00:00:00Z', updated_after: '2026-01-01T00:00:00Z', sort: 'created' } }))).rejects.toThrow('Leave Sort empty');
    expect(seen).toHaveLength(0);
    await listProfilesAi.run(context({ propsValue: { created_after: '2026-01-01T00:00:00Z', sort: 'created' } }));
    await listProfilesAi.run(context({ propsValue: { sort: '-created' } }));
    expect(seen.map((request) => request.url.searchParams.get('sort'))).toEqual(['created', '-created']);
  });

  test('list segments drops the segment definition', async () => {
    stub({ replies: [{ status: 200, body: { data: [{ type: 'segment', id: 'S1', attributes: { name: 'A', is_active: true, definition: { condition_groups: [] } } }] } }] });
    const result = await listSegmentsAi.run(context({ propsValue: {} }));
    expect(result.items[0]).toEqual({ id: 'S1', name: 'A', is_active: true });
  });

  test('profile page schema has no subscriptions field', () => {
    const items = klaviyoOutputSchemas.aiProfilePage.fields.find((field) => field.key === 'items');
    expect(items?.listItems?.map((field) => field.key)).not.toContain('subscriptions');
  });

  test('get list asks for profile_count', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: { type: 'list', id: 'L1', attributes: { name: 'A', profile_count: 3 } } } }] });
    expect(await getListAi.run(context({ propsValue: { list_id: 'L1' } }))).toEqual({ id: 'L1', name: 'A', profile_count: 3 });
    expect(seen[0].url.searchParams.get('additional-fields[list]')).toBe('profile_count');
  });

  test('list members includes joined_group_at', async () => {
    stub({ replies: [{ status: 200, body: { data: [{ type: 'profile', id: 'P1', attributes: { joined_group_at: '2026-01-01T00:00:00+00:00' } }] } }] });
    const result = await listListMembersAi.run(context({ propsValue: { list_id: 'L1' } }));
    expect(result.items[0]).toMatchObject({ id: 'P1', joined_group_at: '2026-01-01T00:00:00+00:00' });
  });

  test('list events maps relationships to string ids', async () => {
    const seen = stub({
      replies: [{ status: 200, body: { data: [{ type: 'event', id: 'E1', attributes: { datetime: '2026-01-01T00:00:00+00:00', timestamp: 1767225600, uuid: 'u', event_properties: { a: 1 } }, relationships: { metric: { data: { type: 'metric', id: 'M1' } }, profile: { data: { type: 'profile', id: 'P1' } } } }] } }],
    });
    const result = await listEventsAi.run(context({ propsValue: { metric_id: 'M1', since: '2026-01-01T00:00:00Z', sort: '-datetime' } }));
    expect(seen[0].url.searchParams.get('filter')).toBe('equals(metric_id,"M1"),greater-or-equal(datetime,2026-01-01T00:00:00Z)');
    expect(result.items[0]).toEqual({ id: 'E1', uuid: 'u', datetime: '2026-01-01T00:00:00+00:00', timestamp: 1767225600, metric_id: 'M1', profile_id: 'P1', event_properties: { a: 1 } });
  });
});

const AUTH: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = { type: AppConnectionType.SECRET_TEXT, secret_text: 'pk_test' };

type Reply = { status: number; body?: unknown };

type Seen = { url: URL; method: string; body: unknown };
