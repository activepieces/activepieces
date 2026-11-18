import { afterEach, describe, expect, test, vi } from 'vitest';
import { addBotToLiveMeetingAction } from '../src/lib/actions/ai/add-bot-to-live-meeting';

afterEach(() => vi.unstubAllGlobals());

describe('add_bot_to_live_meeting', () => {
  test('omits unset optional variables so server defaults such as duration=60 apply', async () => {
    const seen = stubFetch({ body: { data: { addToLiveMeeting: { success: true } } } });
    await expect(addBotToLiveMeetingAction.run(fakeContext({ props: { meeting_link: 'https://meet.google.com/abc-defg-hij' } }))).resolves.toEqual({
      success: true,
      meeting_link: 'https://meet.google.com/abc-defg-hij',
    });
    expect(seen[0].variables).toEqual({ meetingLink: 'https://meet.google.com/abc-defg-hij' });
    expect(seen[0].query).toContain('AddToLiveMeeting($meetingLink: String!)');
    expect(seen[0].query).not.toContain('duration');
    expect(seen[0].query).not.toContain('null');
  });

  test('sends the optional variables that are set', async () => {
    const seen = stubFetch({ body: { data: { addToLiveMeeting: { success: true } } } });
    await addBotToLiveMeetingAction.run(fakeContext({ props: { meeting_link: 'https://meet.google.com/x', title: 'Standup', duration: 30, language: 'es' } }));
    expect(seen[0].variables).toEqual({ meetingLink: 'https://meet.google.com/x', title: 'Standup', duration: 30, language: 'es' });
    expect(seen[0].query).toContain('duration: $duration');
    expect(seen[0].query).not.toContain('meeting_password');
  });

  test('validates input before any request and fails on success:false', async () => {
    const seen = stubFetch({ body: { data: { addToLiveMeeting: { success: false } } } });
    await expect(addBotToLiveMeetingAction.run(fakeContext({ props: { meeting_link: 'http://meet.google.com/x' } }))).rejects.toThrow('https://');
    await expect(addBotToLiveMeetingAction.run(fakeContext({ props: { meeting_link: 'https://meet.google.com/x', duration: 5 } }))).rejects.toThrow('between 15 and 120');
    expect(seen).toHaveLength(0);
    await expect(addBotToLiveMeetingAction.run(fakeContext({ props: { meeting_link: 'https://meet.google.com/x' } }))).rejects.toThrow('did not accept');
  });
});

function fakeContext({ props }: { props: Record<string, unknown> }): Parameters<typeof addBotToLiveMeetingAction.run>[0] {
  return Object.assign(Object.create(null), { auth: { type: 'SECRET_TEXT', secret_text: 'key' }, propsValue: props });
}

function stubFetch({ body }: { body: unknown }): SeenGraphql[] {
  const seen: SeenGraphql[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const parsed: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
      const query = parsed !== null && typeof parsed === 'object' ? Reflect.get(parsed, 'query') : '';
      const variables: unknown = parsed !== null && typeof parsed === 'object' ? Reflect.get(parsed, 'variables') : {};
      seen.push({ query: String(query), variables });
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
  return seen;
}

type SeenGraphql = { query: string; variables: unknown };
