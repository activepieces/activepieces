import { afterEach, describe, expect, test, vi } from 'vitest';
import { addBotToLiveMeetingAction } from '../src/lib/actions/ai/add-bot-to-live-meeting';
import { askFredAction } from '../src/lib/actions/ai/ask-fred';
import { createSoundbiteAction } from '../src/lib/actions/ai/create-soundbite';
import { deleteMeetingAction } from '../src/lib/actions/ai/delete-meeting';
import { listContactsAction } from '../src/lib/actions/ai/list-contacts';
import { moveMeetingsToChannelAction } from '../src/lib/actions/ai/move-meetings-to-channel';
import { shareMeetingAction } from '../src/lib/actions/ai/share-meeting';
import { updateMeetingPrivacyAction } from '../src/lib/actions/ai/update-meeting-privacy';
import { updateMeetingTitleAction } from '../src/lib/actions/ai/update-meeting-title';
import { findMeetingByIdAction } from '../src/lib/actions/find-meeting-by-id';
import { findRecentMeetingAction } from '../src/lib/actions/find-recent-meeting';
import { getUserDetailsAction } from '../src/lib/actions/get-user-details';
import { firefliesInput } from '../src/lib/common/props';

afterEach(() => vi.unstubAllGlobals());

describe('textList', () => {
  test('parses a JSON array string instead of splitting it on commas', () => {
    expect(firefliesInput.textList({ value: '["m-1","m-2"]', label: 'Meeting IDs', max: 5 })).toEqual(['m-1', 'm-2']);
  });

  test('falls back to a comma split when the string is not valid JSON', () => {
    expect(firefliesInput.textList({ value: '[m-1, m-2', label: 'Meeting IDs', max: 5 })).toEqual(['[m-1', 'm-2']);
    expect(firefliesInput.textList({ value: 'm-1, m-2', label: 'Meeting IDs', max: 5 })).toEqual(['m-1', 'm-2']);
  });
});

describe('JSON array strings from dynamic values', () => {
  test('move_meetings_to_channel sends each meeting ID from a JSON array string', async () => {
    const seen = stubFetch({ replies: [{ data: { channel: { id: 'c-1', title: 'Sales' } } }, { data: { updateMeetingChannel: [{ id: 'm-1' }, { id: 'm-2' }] } }] });
    await moveMeetingsToChannelAction.run(ctx({ meeting_ids: '["m-1","m-2"]', channel_id: 'c-1' }));
    expectPost(seen);
    expect(JSON.stringify(seen[1].variables)).toContain('["m-1","m-2"]');
  });

  test('ask_fred sends channel_ids from a JSON array string', async () => {
    const seen = stubFetch({ replies: [{ data: { createAskFredThread: { message: { id: 't-1', answer: 'ok' } } } }] });
    await askFredAction.run(ctx({ query: 'What was decided?', channel_ids: '["c-1","c-2"]' })).catch(() => undefined);
    expectPost(seen);
    expect(seen[0].variables['channelIds']).toEqual(['c-1', 'c-2']);
  });
});

describe('create_soundbite', () => {
  test('sends start/end and only the optional variables that are set', async () => {
    const seen = stubFetch({ replies: [{ data: { createBite: { id: 'b-1', status: 'pending' } } }] });
    await expect(createSoundbiteAction.run(ctx({ meeting_id: 'm-1', start_time: 5, end_time: 20 }))).resolves.toEqual({ id: 'b-1', status: 'pending' });
    expectPost(seen);
    expect(seen[0].variables).toEqual({ transcriptId: 'm-1', startTime: 5, endTime: 20 });
  });

  test('sends name, media type and summary when set', async () => {
    const seen = stubFetch({ replies: [{ data: { createBite: { id: 'b-1' } } }] });
    await createSoundbiteAction.run(ctx({ meeting_id: 'm-1', start_time: 0, end_time: 3, name: 'Clip', media_type: 'audio', summary: 'Key point' }));
    expect(seen[0].variables).toEqual({ transcriptId: 'm-1', startTime: 0, endTime: 3, name: 'Clip', mediaType: 'audio', summary: 'Key point' });
  });

  test('refuses end before start and a long summary before any request', async () => {
    const seen = stubFetch({ replies: [] });
    await expect(createSoundbiteAction.run(ctx({ meeting_id: 'm-1', start_time: 20, end_time: 20 }))).rejects.toThrow('after Start Time');
    await expect(createSoundbiteAction.run(ctx({ meeting_id: 'm-1', start_time: 0, end_time: 5, summary: 'x'.repeat(501) }))).rejects.toThrow('at most 500');
    expect(seen).toHaveLength(0);
  });
});

describe('update_meeting_title', () => {
  test('refuses a title under 5 characters before any request', async () => {
    const seen = stubFetch({ replies: [] });
    await expect(updateMeetingTitleAction.run(ctx({ meeting_id: 'm-1', title: 'abcd' }))).rejects.toThrow('at least 5');
    expect(seen).toHaveLength(0);
  });

  test('sends the id and title', async () => {
    const seen = stubFetch({ replies: [{ data: { updateMeetingTitle: { title: 'Weekly sync' } } }] });
    await expect(updateMeetingTitleAction.run(ctx({ meeting_id: 'm-1', title: 'Weekly sync' }))).resolves.toEqual({ id: 'm-1', title: 'Weekly sync' });
    expectPost(seen);
    expect(seen[0].variables).toEqual({ id: 'm-1', title: 'Weekly sync' });
  });
});

describe('update_meeting_privacy', () => {
  test('sends the privacy in the mutation and returns the result', async () => {
    const seen = stubFetch({ replies: [{ data: { updateMeetingPrivacy: { id: 'm-1', title: 'Weekly', privacy: 'teammates' } } }] });
    await expect(updateMeetingPrivacyAction.run(ctx({ meeting_id: 'm-1', privacy: 'teammates' }))).resolves.toEqual({ id: 'm-1', title: 'Weekly', privacy: 'teammates' });
    expectPost(seen);
    expect(seen[0].query).toContain('teammates');
    expect(seen[0].variables).toEqual({ id: 'm-1' });
  });

  test('refuses an unknown privacy value before any request', async () => {
    const seen = stubFetch({ replies: [] });
    await expect(updateMeetingPrivacyAction.run(ctx({ meeting_id: 'm-1', privacy: 'everyone' }))).rejects.toThrow();
    expect(seen).toHaveLength(0);
  });
});

describe('delete_meeting', () => {
  test('sends the transcript id and returns what was deleted', async () => {
    const seen = stubFetch({ replies: [{ data: { deleteTranscript: { id: 'm-1', title: 'Weekly' } } }] });
    await expect(deleteMeetingAction.run(ctx({ meeting_id: 'm-1' }))).resolves.toEqual({ id: 'm-1', title: 'Weekly' });
    expectPost(seen);
    expect(seen[0].query).toContain('deleteTranscript');
    expect(seen[0].variables).toEqual({ transcriptId: 'm-1' });
  });

  test('fails when Fireflies returns nothing', async () => {
    stubFetch({ replies: [{ data: { deleteTranscript: null } }] });
    await expect(deleteMeetingAction.run(ctx({ meeting_id: 'm-1' }))).rejects.toThrow('not confirmed as deleted');
  });
});

describe('list_contacts', () => {
  const contacts = Array.from({ length: 5 }, (_, i) => ({ email: `c${i}@example.com` }));

  test('slices by offset and limit and returns next_offset', async () => {
    const seen = stubFetch({ replies: [{ data: { contacts } }] });
    await expect(listContactsAction.run(ctx({ limit: 2, offset: 1 }))).resolves.toEqual({
      contacts: contacts.slice(1, 3),
      total: 5,
      offset: 1,
      returned: 2,
      next_offset: 3,
      has_more: true,
    });
    expectPost(seen);
  });

  test('the last page has no next_offset', async () => {
    stubFetch({ replies: [{ data: { contacts } }] });
    const result = await listContactsAction.run(ctx({ limit: 10, offset: 3 }));
    expect(result).toMatchObject({ returned: 2, next_offset: null, has_more: false });
  });
});

describe('share_meeting', () => {
  test('sends expiryDays and the expiry variable when set', async () => {
    const seen = stubFetch({ replies: [{ data: { shareMeeting: { success: true, message: 'Shared', share_slug: 'abc' } } }] });
    await shareMeetingAction.run(ctx({ meeting_id: 'm-1', emails: ['a@example.com'], expiry_days: 7 }));
    expectPost(seen);
    expect(seen[0].variables).toEqual({ meetingId: 'm-1', emails: ['a@example.com'], expiryDays: 7 });
    expect(seen[0].query).toContain('expiryDays');
  });
});

describe('add_bot_to_live_meeting', () => {
  test('success:false fails the step', async () => {
    const seen = stubFetch({ replies: [{ data: { addToLiveMeeting: { success: false } } }] });
    await expect(addBotToLiveMeetingAction.run(ctx({ meeting_link: 'https://meet.google.com/abc' }))).rejects.toThrow('success was false');
    expectPost(seen);
    expect(seen[0].variables).toEqual({ meetingLink: 'https://meet.google.com/abc' });
  });
});

describe('find-meeting-by-id', () => {
  test('a missing meeting fails the step', async () => {
    const seen = stubFetch({ replies: [{ data: { transcript: null } }] });
    await expect(findMeetingByIdAction.run(ctx({ meetingId: 'm-9' }))).rejects.toThrow('"m-9" was not found');
    expectPost(seen);
    expect(seen[0].variables).toEqual({ transcriptId: 'm-9' });
  });
});

describe('get-user-details', () => {
  test('sends the user id and returns the user', async () => {
    const seen = stubFetch({ replies: [{ data: { user: { user_id: 'u-1', name: 'Ann' } } }] });
    await expect(getUserDetailsAction.run(ctx({ userId: 'u-1' }))).resolves.toEqual({ user_id: 'u-1', name: 'Ann' });
    expectPost(seen);
    expect(seen[0].variables).toEqual({ userId: 'u-1' });
  });

  test('a missing user fails the step', async () => {
    stubFetch({ replies: [{ data: { user: null } }] });
    await expect(getUserDetailsAction.run(ctx({ userId: 'u-9' }))).rejects.toThrow('"u-9" was not found');
  });
});

describe('find_recent_meeting', () => {
  test('returns found:false without a second request when the user has no recent meeting', async () => {
    const seen = stubFetch({ replies: [{ data: { user: { user_id: 'u-1', recent_meeting: null } } }] });
    await expect(findRecentMeetingAction.run(ctx({}))).resolves.toEqual({ found: false, meeting: {} });
    expect(seen).toHaveLength(1);
    expectPost(seen);
  });

  test('fetches the recent meeting by id', async () => {
    const seen = stubFetch({ replies: [{ data: { user: { recent_meeting: 'm-1' } } }, { data: { transcript: { id: 'm-1' } } }] });
    await expect(findRecentMeetingAction.run(ctx({}))).resolves.toEqual({ found: true, meeting: { id: 'm-1' } });
    expect(seen[1].variables).toEqual({ transcriptId: 'm-1' });
  });
});

function expectPost(seen: SeenRequest[]): void {
  for (const request of seen) {
    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://api.fireflies.ai/graphql');
  }
}

function ctx(props: Record<string, unknown>) {
  return Object.assign(Object.create(null), { auth: { type: 'SECRET_TEXT', secret_text: 'key' }, propsValue: props });
}

function stubFetch({ replies }: { replies: unknown[] }): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const parsed: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
      const query: unknown = parsed !== null && typeof parsed === 'object' ? Reflect.get(parsed, 'query') : undefined;
      const variables: unknown = parsed !== null && typeof parsed === 'object' ? Reflect.get(parsed, 'variables') : undefined;
      seen.push({
        method: init?.method ?? 'GET',
        url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
        query: typeof query === 'string' ? query : '',
        variables: toRecord(variables),
      });
      return new Response(JSON.stringify(replies[seen.length - 1] ?? {}), { status: 200 });
    }),
  );
  return seen;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? Object.fromEntries(Object.entries(value)) : {};
}

type SeenRequest = { method: string; url: string; query: string; variables: Record<string, unknown> };
