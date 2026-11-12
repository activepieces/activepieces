import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMockActionContext } from '../../../framework/src/lib/test';
import { klaviyoTransport } from '../src/lib/common/client';
import { createProfile } from '../src/lib/actions/create-profile';
import { updateProfile } from '../src/lib/actions/update-profile';
import { createOrUpdateProfile } from '../src/lib/actions/create-or-update-profile';
import { addProfileToList } from '../src/lib/actions/add-profile-to-list';
import { removeProfileFromList } from '../src/lib/actions/remove-profile-from-list';
import { subscribeProfile } from '../src/lib/actions/subscribe-profile';
import { unsubscribeProfile } from '../src/lib/actions/unsubscribe-profile';
import { findProfileByEmailPhone } from '../src/lib/actions/find-profile-by-email-phone';
import { findListByName } from '../src/lib/actions/find-list-by-name';
import { trackEvent } from '../src/lib/actions/track-event';
import { addTagToGroup } from '../src/lib/actions/add-tag-to-group';
import { deleteList } from '../src/lib/actions/delete-list';
import { findTagByName } from '../src/lib/actions/find-tag-by-name';

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

describe('klaviyo human actions', () => {
  test('create profile keeps latitude/longitude 0 and posts JSON:API', async () => {
    const seen = stub({ replies: [{ status: 201, body: { data: { type: 'profile', id: 'P1', attributes: {} } } }] });
    await createProfile.run(context({ propsValue: { email: 'a@b.com', latitude: 0, longitude: 0 } }));
    expect(seen[0].method).toBe('POST');
    expect(seen[0].url.pathname).toBe('/api/profiles');
    expect(seen[0].body).toEqual({ data: { type: 'profile', attributes: { email: 'a@b.com', location: { latitude: 0, longitude: 0 } } } });
  });

  test('create profile 409 names the existing profile ID', async () => {
    stub({ replies: [{ status: 409, body: { errors: [{ code: 'duplicate_profile', detail: 'A profile already exists with one of these identifiers.', meta: { duplicate_profile_id: '01DUP' } }] } }] });
    await expect(createProfile.run(context({ propsValue: { email: 'a@b.com' } }))).rejects.toThrow('profile ID 01DUP');
  });

  test('update profile PATCHes the encoded id', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: { type: 'profile', id: 'P/1', attributes: {} } } }] });
    await updateProfile.run(context({ propsValue: { profile_id: 'P/1', first_name: 'Ana' } }));
    expect(seen[0].method).toBe('PATCH');
    expect(seen[0].url.pathname).toBe('/api/profiles/P%2F1');
    expect(seen[0].body).toEqual({ data: { type: 'profile', id: 'P/1', attributes: { first_name: 'Ana' } } });
  });

  test('upsert: 201 gives created true, 200 gives created false', async () => {
    const seen = stub({ replies: [{ status: 201, body: { data: { type: 'profile', id: 'P1' } } }, { status: 200, body: { data: { type: 'profile', id: 'P1' } } }] });
    const first = await createOrUpdateProfile.run(context({ propsValue: { email: 'a@b.com', include_subscriptions: 'yes' } }));
    const second = await createOrUpdateProfile.run(context({ propsValue: { email: 'a@b.com' } }));
    expect(seen[0].url.pathname).toBe('/api/profile-import');
    expect(seen[0].url.searchParams.get('additional-fields[profile]')).toBe('subscriptions');
    expect(seen[0].body).toEqual({ data: { type: 'profile', attributes: { email: 'a@b.com' } } });
    expect(first).toMatchObject({ created: true });
    expect(second).toMatchObject({ created: false });
  });

  test('upsert requires an identifier', async () => {
    stub({ replies: [{ status: 200, body: {} }] });
    await expect(createOrUpdateProfile.run(context({ propsValue: { first_name: 'Ana' } }))).rejects.toThrow('at least one of Profile ID');
  });

  test('add profile to list posts relationships and refuses more than 1000', async () => {
    const seen = stub({ replies: [{ status: 204 }] });
    const result = await addProfileToList.run(context({ propsValue: { list_id: 'L1', profile_id: ['P1', 'P2'] } }));
    expect(seen[0].url.pathname).toBe('/api/lists/L1/relationships/profiles');
    expect(seen[0].body).toEqual({ data: [{ type: 'profile', id: 'P1' }, { type: 'profile', id: 'P2' }] });
    expect(result).toMatchObject({ success: true, profiles_added: 2 });
    const many = Array.from({ length: 1001 }, (_, index) => `P${index}`);
    await expect(addProfileToList.run(context({ propsValue: { list_id: 'L1', profile_id: many } }))).rejects.toThrow('1000');
  });

  test('remove profile from list sends DELETE', async () => {
    const seen = stub({ replies: [{ status: 204 }] });
    await removeProfileFromList.run(context({ propsValue: { list_id: 'L1', profile_ids: '["P1"]' } }));
    expect(seen[0].method).toBe('DELETE');
  });

  test('subscribe looks profiles up in one batch, sends email/phone, optional list, job_id null', async () => {
    const seen = stub({
      replies: [
        { status: 200, body: { data: [{ type: 'profile', id: 'P1', attributes: { email: 'a@b.com', phone_number: '+15005550006' } }] } },
        { status: 202 },
      ],
    });
    const result = await subscribeProfile.run(context({ propsValue: { profile_ids: ['P1'], subscribe_email: true, subscribe_sms: false } }));
    expect(seen[0].url.searchParams.get('filter')).toBe('any(id,["P1"])');
    expect(seen[1].url.pathname).toBe('/api/profile-subscription-bulk-create-jobs');
    expect(seen[1].body).toEqual({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: { profiles: { data: [{ type: 'profile', id: 'P1', attributes: { email: 'a@b.com', subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } } } }] } },
      },
    });
    expect(result).toMatchObject({ job_id: null, list_id: null });
  });

  test('subscribe with historical import requires a consent date', async () => {
    stub({ replies: [{ status: 200, body: { data: [] } }] });
    await expect(subscribeProfile.run(context({ propsValue: { profile_ids: ['P1'], subscribe_email: true, historical_import: true } }))).rejects.toThrow('Consent Date is required');
  });

  test('unsubscribe uses one batched profile GET', async () => {
    const seen = stub({
      replies: [
        { status: 200, body: { data: [1, 2, 3].map((n) => ({ type: 'profile', id: `P${n}`, attributes: { email: `p${n}@b.com` } })) } },
        { status: 202 },
      ],
    });
    await unsubscribeProfile.run(context({ propsValue: { list_id: 'L1', profile_ids: ['P1', 'P2', 'P3'], unsubscribe_email: true } }));
    expect(seen).toHaveLength(2);
    expect(seen[1].body).toMatchObject({ data: { relationships: { list: { data: { type: 'list', id: 'L1' } } } } });
  });

  test('find profile normalises the phone number', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [] } }] });
    await findProfileByEmailPhone.run(context({ propsValue: { search_query: '+1 (500) 555-0006' } }));
    expect(seen[0].url.searchParams.get('filter')).toBe('equals(phone_number,"+15005550006")');
  });

  test('find list by name escapes the value', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [], links: { next: null } } }] });
    await findListByName.run(context({ propsValue: { search_query: 'a"b' } }));
    expect(seen[0].url.searchParams.get('filter')).toBe('equals(name,"a\\"b")');
  });

  test('track event requires an identifier and a strict ISO time, maps backfill yes', async () => {
    const seen = stub({ replies: [{ status: 202 }] });
    await expect(trackEvent.run(context({ propsValue: { metric_name: 'Placed Order' } }))).rejects.toThrow('at least one of Email');
    await expect(trackEvent.run(context({ propsValue: { metric_name: 'X', email: 'a@b.com', time: '2026-01-01' } }))).rejects.toThrow('ISO 8601');
    const result = await trackEvent.run(context({ propsValue: { metric_name: 'X', email: 'a@b.com', time: '2026-01-01T10:00:00Z', backfill: 'yes', value: 0, unique_id: 'u1' } }));
    expect(seen).toHaveLength(1);
    expect(seen[0].body).toEqual({
      data: {
        type: 'event',
        attributes: {
          properties: {},
          metric: { data: { type: 'metric', attributes: { name: 'X' } } },
          profile: { data: { type: 'profile', attributes: { email: 'a@b.com' } } },
          time: '2026-01-01T10:00:00Z',
          value: 0,
          unique_id: 'u1',
          backfill: true,
        },
      },
    });
    expect(result).toEqual({ accepted: true, metric_name: 'X', unique_id: 'u1' });
  });

  test('add tag to segments posts to the segments relationship', async () => {
    const seen = stub({ replies: [{ status: 204 }] });
    await addTagToGroup.run(context({ propsValue: { tag_id: 'T1', target_type: 'segment', target_ids: ['S1'] } }));
    expect(seen[0].url.pathname).toBe('/api/tags/T1/relationships/segments');
    expect(seen[0].body).toEqual({ data: [{ type: 'segment', id: 'S1' }] });
  });

  test('delete list sends DELETE to the encoded list path', async () => {
    const seen = stub({ replies: [{ status: 204 }] });
    expect(await deleteList.run(context({ propsValue: { list_id: 'L1' } }))).toEqual({ deleted: true, list_id: 'L1' });
    expect(seen[0].method).toBe('DELETE');
    expect(seen[0].url.pathname).toBe('/api/lists/L1');
  });

  test('qa: subscribe historical import puts consented_at inside each marketing block and flags the job', async () => {
    const seen = stub({
      replies: [
        { status: 200, body: { data: [{ type: 'profile', id: 'P1', attributes: { email: 'a@b.com', phone_number: '+15005550006' } }] } },
        { status: 202 },
      ],
    });
    await subscribeProfile.run(context({ propsValue: { list_id: 'L1', profile_ids: ['P1'], subscribe_email: true, subscribe_sms: true, historical_import: true, consented_at: '2024-01-15T10:00:00Z' } }));
    const marketing = { consent: 'SUBSCRIBED', consented_at: '2024-01-15T10:00:00Z' };
    expect(seen[1].body).toEqual({
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: { data: [{ type: 'profile', id: 'P1', attributes: { email: 'a@b.com', phone_number: '+15005550006', subscriptions: { email: { marketing }, sms: { marketing } } } }] },
          historical_import: true,
        },
        relationships: { list: { data: { type: 'list', id: 'L1' } } },
      },
    });
  });

  test('qa: subscribe fails before sending a job when a selected profile is missing', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [{ type: 'profile', id: 'P1', attributes: { email: 'a@b.com' } }] } }, { status: 202 }] });
    await expect(subscribeProfile.run(context({ propsValue: { profile_ids: ['P1', 'GONE'], subscribe_email: true } }))).rejects.toThrow('GONE');
    expect(seen).toHaveLength(1);
  });

  test('qa: unsubscribe refuses more than 100 profiles without calling Klaviyo', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [] } }] });
    const ids = Array.from({ length: 101 }, (_, index) => `P${index}`);
    await expect(unsubscribeProfile.run(context({ propsValue: { list_id: 'L1', profile_ids: ids, unsubscribe_email: true } }))).rejects.toThrow('Maximum of 100');
    expect(seen).toHaveLength(0);
  });

  test('qa: find tag by name escapes quotes and backslashes in the contains filter', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [], links: { next: null } } }] });
    await findTagByName.run(context({ propsValue: { search_query: 'a"b\\c' } }));
    expect(seen[0].url.searchParams.get('filter')).toBe('contains(name,"a\\"b\\\\c")');
  });
});

const AUTH: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = { type: AppConnectionType.SECRET_TEXT, secret_text: 'pk_test' };

type Reply = { status: number; body?: unknown };

type Seen = { url: URL; method: string; body: unknown };
