import { afterEach, describe, expect, test, vi } from 'vitest';
import { shareMeetingAction } from '../src/lib/actions/ai/share-meeting';
import { revokeMeetingAccessAction } from '../src/lib/actions/ai/revoke-meeting-access';

afterEach(() => vi.unstubAllGlobals());

describe('share_meeting', () => {
  test('success:false fails the step with the vendor message', async () => {
    stubFetch({ body: { data: { shareMeeting: { success: false, message: 'Already shared with a@example.com', share_slug: null } } } });
    await expect(shareMeetingAction.run(fakeContext({ props: { meeting_id: 'm-1', emails: ['a@example.com'] } }))).rejects.toThrow('Already shared with a@example.com');
  });

  test('success returns the slug and the emails, and sends expiry only when set', async () => {
    const seen = stubFetch({ body: { data: { shareMeeting: { success: true, message: 'Shared', share_slug: 'abc' } } } });
    await expect(shareMeetingAction.run(fakeContext({ props: { meeting_id: 'm-1', emails: ['a@example.com'] } }))).resolves.toEqual({
      success: true,
      message: 'Shared',
      share_slug: 'abc',
      meeting_id: 'm-1',
      emails: ['a@example.com'],
    });
    expect(seen[0]).toEqual({ meetingId: 'm-1', emails: ['a@example.com'] });
  });

  test('refuses an empty or invalid email list before any request', async () => {
    const seen = stubFetch({ body: {} });
    await expect(shareMeetingAction.run(fakeContext({ props: { meeting_id: 'm-1', emails: [] } }))).rejects.toThrow('at least one email');
    await expect(shareMeetingAction.run(fakeContext({ props: { meeting_id: 'm-1', emails: ['nope'] } }))).rejects.toThrow('invalid email');
    expect(seen).toHaveLength(0);
  });
});

describe('revoke_meeting_access', () => {
  test('success:false fails the step with the vendor message', async () => {
    stubFetch({ body: { data: { revokeSharedMeetingAccess: { success: false, message: 'No access to revoke' } } } });
    await expect(revokeMeetingAccessAction.run(fakeContext({ props: { meeting_id: 'm-1', email: 'a@example.com' } }))).rejects.toThrow('No access to revoke');
  });

  test('a repeat that returns object_not_found fails the step with the code', async () => {
    stubFetch({ body: { data: null, errors: [{ message: 'Access not found', code: 'object_not_found' }] } });
    await expect(revokeMeetingAccessAction.run(fakeContext({ props: { meeting_id: 'm-1', email: 'a@example.com' } }))).rejects.toThrow('object_not_found');
  });

  test('success returns the meeting and email', async () => {
    stubFetch({ body: { data: { revokeSharedMeetingAccess: { success: true, message: 'Revoked' } } } });
    await expect(revokeMeetingAccessAction.run(fakeContext({ props: { meeting_id: 'm-1', email: 'a@example.com' } }))).resolves.toEqual({
      success: true,
      message: 'Revoked',
      meeting_id: 'm-1',
      email: 'a@example.com',
    });
  });
});

function fakeContext({ props }: { props: Record<string, unknown> }): Parameters<typeof shareMeetingAction.run>[0] & Parameters<typeof revokeMeetingAccessAction.run>[0] {
  return Object.assign(Object.create(null), { auth: { type: 'SECRET_TEXT', secret_text: 'key' }, propsValue: props });
}

function stubFetch({ body }: { body: unknown }): unknown[] {
  const variables: unknown[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const parsed: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
      variables.push(parsed !== null && typeof parsed === 'object' ? Reflect.get(parsed, 'variables') : undefined);
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
  return variables;
}
