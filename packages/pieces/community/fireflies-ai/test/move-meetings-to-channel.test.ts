import { afterEach, describe, expect, test, vi } from 'vitest';
import { moveMeetingsToChannelAction } from '../src/lib/actions/ai/move-meetings-to-channel';

afterEach(() => vi.unstubAllGlobals());

describe('move_meetings_to_channel', () => {
  test('an unknown channel fails before the move (Fireflies would attach a dangling channel ID)', async () => {
    const seen = stubFetch({
      replies: [{ data: { channel: null }, errors: [{ message: 'Channel not found', code: 'object_not_found', extensions: { code: 'object_not_found', status: 404 } }] }],
    });
    await expect(moveMeetingsToChannelAction.run(fakeContext({ props: { meeting_ids: ['m-1'], channel_id: 'nope' } }))).rejects.toThrow('Channel not found');
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain('channel(id: $channelId)');
  });

  test('a null channel without errors also fails before the move', async () => {
    const seen = stubFetch({ replies: [{ data: { channel: null } }] });
    await expect(moveMeetingsToChannelAction.run(fakeContext({ props: { meeting_ids: ['m-1'], channel_id: 'nope' } }))).rejects.toThrow('Use List Channels');
    expect(seen).toHaveLength(1);
  });

  test('a known channel is checked, then the meetings are moved', async () => {
    const seen = stubFetch({
      replies: [{ data: { channel: { id: 'c-1', title: 'Sales' } } }, { data: { updateMeetingChannel: [{ id: 'm-1', title: 'Weekly', channels: [{ id: 'c-1' }] }] } }],
    });
    await expect(moveMeetingsToChannelAction.run(fakeContext({ props: { meeting_ids: ['m-1'], channel_id: 'c-1' } }))).resolves.toEqual({
      channel_id: 'c-1',
      meetings: [{ id: 'm-1', title: 'Weekly', channels: [{ id: 'c-1' }] }],
    });
    expect(seen).toHaveLength(2);
    expect(seen[1]).toContain('updateMeetingChannel');
  });
});

function fakeContext({ props }: { props: Record<string, unknown> }): Parameters<typeof moveMeetingsToChannelAction.run>[0] {
  return Object.assign(Object.create(null), { auth: { type: 'SECRET_TEXT', secret_text: 'key' }, propsValue: props });
}

function stubFetch({ replies }: { replies: unknown[] }): string[] {
  const queries: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const parsed: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
      const query: unknown = parsed !== null && typeof parsed === 'object' ? Reflect.get(parsed, 'query') : undefined;
      queries.push(typeof query === 'string' ? query : '');
      return new Response(JSON.stringify(replies[queries.length - 1] ?? {}), { status: 200 });
    }),
  );
  return queries;
}
