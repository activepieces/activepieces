import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { heartBeatCreateUser } from '../src/lib/actions/create-user';
import { createMemberAction } from '../src/lib/actions/ai/create-member';
import { listUsersAction } from '../src/lib/actions/list-users';
import { getUserAction } from '../src/lib/actions/get-user';
import { findUserByEmailAction } from '../src/lib/actions/find-user-by-email';
import { updateUserAction } from '../src/lib/actions/update-user';
import { removeUserAction } from '../src/lib/actions/remove-user';
import { reactivateUserAction } from '../src/lib/actions/reactivate-user';
import { createPendingUserAction } from '../src/lib/actions/create-pending-user';
import { listUserCompletedLessonsAction } from '../src/lib/actions/list-user-completed-lessons';
import { markLessonsCompletedAction } from '../src/lib/actions/mark-lessons-completed';
import { IDS, replies, run, stubFetch } from './helpers';

const user = {
	id: IDS.user,
	email: 'odai+aptest-1@activepieces.com',
	name: 'AP-TEST One',
	role: 'User',
	isAdmin: false,
	groups: [{ id: IDS.group, name: 'AP-TEST group' }],
	linkedInData: { headline: 'x' },
	linkedInSummary: 's',
	onboardingResponses: [{ question: 'q', answer: 'a' }],
	createdAt: '2026-10-06T12:09:26.682Z',
};
const admin = { id: IDS.admin, email: 'admin@x.io', name: 'Admin Person', role: 'Administrator', isAdmin: true, groups: [] };

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('create user (human)', () => {
	test('PUTs /users, then reads the new user by the returned userID', async () => {
		const seen = stubFetch(replies([{ body: { userID: IDS.user } }, { body: user }]));
		const result = await run({ action: heartBeatCreateUser, propsValue: { name: 'AP-TEST One', email: user.email, role_id: IDS.role, group_ids: [IDS.group], bio: 'b', website: 'https://x.io' } });
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].path).toBe('/users');
		expect(seen[0].body).toEqual({ name: 'AP-TEST One', email: user.email, roleID: IDS.role, groupIDs: [IDS.group], bio: 'b', website: 'https://x.io' });
		expect(seen[1].path).toBe(`/users/${IDS.user}`);
		expect(result).toMatchObject({ userID: IDS.user, id: IDS.user, email: user.email });
	});
	test('omits groupIDs when none chosen, and falls back to find by email without userID', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }, { body: user }]));
		const result = await run({ action: heartBeatCreateUser, propsValue: { name: 'A', email: user.email, role_id: IDS.role } });
		expect(seen[0].body).not.toHaveProperty('groupIDs');
		expect(seen[1].path).toBe('/find/users');
		expect(seen[1].query.get('email')).toBe(user.email);
		expect(result).toMatchObject({ userID: IDS.user });
	});
	test('keeps the new user ID when the read-back fails, so a retry does not create again', async () => {
		stubFetch(replies([{ body: { userID: IDS.user } }, { status: 500, body: { message: 'down' } }]));
		const result = await run({ action: heartBeatCreateUser, propsValue: { name: 'A', email: user.email, role_id: IDS.role } });
		expect(result).toMatchObject({ userID: IDS.user, lookupError: expect.stringMatching(/saved in Heartbeat/) });
	});
	test('rejects a social link without scheme before any request', async () => {
		const seen = stubFetch(replies([{ body: {} }]));
		await expect(run({ action: heartBeatCreateUser, propsValue: { name: 'A', email: user.email, role_id: IDS.role, linkedin: 'linkedin.com/in/x' } })).rejects.toThrow();
		expect(seen).toHaveLength(0);
	});
	test('is human-only now', () => {
		expect(heartBeatCreateUser.audience).toBe('human');
		expect(heartBeatCreateUser.name).toBe('heartbeat_create_user');
	});
});

describe('create member (ai)', () => {
	test('validates role ID and sends the same request shape', async () => {
		const seen = stubFetch(replies([{ body: { userID: IDS.user } }, { body: user }]));
		await run({ action: createMemberAction, propsValue: { name: 'A', email: user.email, roleId: IDS.role, groupIds: [IDS.group], createIntroductionThread: false } });
		expect(seen[0].body).toEqual({ name: 'A', email: user.email, roleID: IDS.role, groupIDs: [IDS.group], createIntroductionThread: false });
		expect(createMemberAction.audience).toBe('ai');
	});
	test('refuses a non-UUID role ID', async () => {
		const seen = stubFetch(replies([{ body: {} }]));
		await expect(run({ action: createMemberAction, propsValue: { name: 'A', email: user.email, roleId: 'User' } })).rejects.toThrow(/Role ID/);
		expect(seen).toHaveLength(0);
	});
});

describe('list members', () => {
	test('filters client-side, strips profile details and reports totals', async () => {
		stubFetch(replies([{ body: [user, admin] }]));
		const result = await run({ action: listUsersAction, propsValue: { search: 'ap-test', limit: 10 } });
		expect(result).toEqual({ users: [expect.not.objectContaining({ linkedInData: expect.anything() })], count: 1, totalMatching: 1, truncated: false });
	});
	test('group, role, admin filters and truncation', async () => {
		stubFetch(replies([{ body: [user, admin, { ...user, id: 'x2', email: 'b@x.io' }] }]));
		expect(await run({ action: listUsersAction, propsValue: { groupId: IDS.group, limit: 1 } })).toMatchObject({ count: 1, totalMatching: 2, truncated: true });
		expect(await run({ action: listUsersAction, propsValue: { role: 'administrator' } })).toMatchObject({ count: 1 });
		expect(await run({ action: listUsersAction, propsValue: { adminsOnly: true } })).toMatchObject({ users: [expect.objectContaining({ id: IDS.admin })] });
	});
	test('keeps profile details when asked', async () => {
		stubFetch(replies([{ body: [user] }]));
		const result = await run({ action: listUsersAction, propsValue: { includeProfileDetails: true } });
		expect(result).toMatchObject({ users: [expect.objectContaining({ linkedInData: { headline: 'x' } })] });
	});
});

describe('get / find member', () => {
	test('get reads /users/{id}', async () => {
		const seen = stubFetch(replies([{ body: user }]));
		await run({ action: getUserAction, propsValue: { userId: IDS.user } });
		expect(seen[0].path).toBe(`/users/${IDS.user}`);
	});
	test('find returns found=true with the object body', async () => {
		stubFetch(replies([{ body: user }]));
		expect(await run({ action: findUserByEmailAction, propsValue: { email: user.email } })).toEqual({ found: true, user });
	});
	test('find maps the documented 404 to found=false', async () => {
		stubFetch(replies([{ status: 404, body: { error: true, message: 'Could not find user' } }]));
		expect(await run({ action: findUserByEmailAction, propsValue: { email: 'nobody@x.io' } })).toEqual({ found: false, user: null });
	});
	test('find rethrows other errors', async () => {
		stubFetch(replies([{ status: 401, body: { message: 'no' } }]));
		await expect(run({ action: findUserByEmailAction, propsValue: { email: 'nobody@x.io' } })).rejects.toThrow(/401/);
	});
});

describe('update member', () => {
	test('POSTs only changed fields plus clears, then re-reads', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }, { body: user }]));
		const result = await run({ action: updateUserAction, propsValue: { email: user.email, bio: 'New bio', fieldsToClear: ['status', 'twitter'] } });
		expect(seen[0].method).toBe('POST');
		expect(seen[0].path).toBe('/users');
		expect(seen[0].body).toEqual({ email: user.email, bio: 'New bio', status: '', twitter: '' });
		expect(result).toMatchObject({ updated: true, updatedFields: ['bio', 'status', 'twitter'], user });
	});
	test('refuses a no-op', async () => {
		const seen = stubFetch(replies([{ body: {} }]));
		await expect(run({ action: updateUserAction, propsValue: { email: user.email } })).rejects.toThrow(/Nothing to update/);
		expect(seen).toHaveLength(0);
	});
	test('refuses set and clear of the same field', async () => {
		stubFetch(replies([{ body: {} }]));
		await expect(run({ action: updateUserAction, propsValue: { email: user.email, bio: 'x', fieldsToClear: ['bio'] } })).rejects.toThrow(/both set and cleared/);
	});
});

describe('remove / reactivate member', () => {
	test('remove sends DELETE /users with the email body', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }]));
		expect(await run({ action: removeUserAction, propsValue: { email: user.email } })).toEqual({ email: user.email, removed: true });
		expect(seen[0].method).toBe('DELETE');
		expect(seen[0].body).toEqual({ email: user.email });
	});
	test('remove surfaces 404 for an unknown email', async () => {
		stubFetch(replies([{ status: 404, body: { message: 'Could not find user' } }]));
		await expect(run({ action: removeUserAction, propsValue: { email: 'nobody@x.io' } })).rejects.toThrow(/Could not find user/);
	});
	test('reactivate POSTs /users/reactivate', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }]));
		expect(await run({ action: reactivateUserAction, propsValue: { email: user.email } })).toEqual({ email: user.email, reactivated: true, alreadyActive: false });
		expect(seen[0].path).toBe('/users/reactivate');
		expect(seen[0].method).toBe('POST');
	});
	test('reactivate treats "already active" as success', async () => {
		stubFetch(replies([{ status: 400, body: { code: 'VALIDATION_ERROR', message: 'This user is already active' } }]));
		expect(await run({ action: reactivateUserAction, propsValue: { email: user.email } })).toEqual({ email: user.email, reactivated: true, alreadyActive: true });
	});
	test('reactivate rethrows other 400s', async () => {
		stubFetch(replies([{ status: 400, body: { message: 'Invalid input' } }]));
		await expect(run({ action: reactivateUserAction, propsValue: { email: user.email } })).rejects.toThrow(/Invalid input/);
	});
});

describe('pre-register member', () => {
	test('PUTs /pendingUser', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }]));
		expect(await run({ action: createPendingUserAction, propsValue: { email: 'a@x.io', name: 'A', roleId: IDS.role } })).toEqual({ email: 'a@x.io', success: true });
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].path).toBe('/pendingUser');
		expect(seen[0].body).toEqual({ email: 'a@x.io', name: 'A', roleID: IDS.role });
	});
});

describe('completed lessons', () => {
	test('list pages with lessonID cursor', async () => {
		const seen = stubFetch(replies([{ body: [{ lessonID: IDS.lesson, completedAt: '2026-10-01T00:00:00Z' }] }]));
		const result = await run({ action: listUserCompletedLessonsAction, propsValue: { userId: IDS.user, limit: 1 } });
		expect(seen[0].path).toBe(`/users/${IDS.user}/completed-lessons`);
		expect(seen[0].query.get('limit')).toBe('1');
		expect(result).toEqual({ items: [{ lessonID: IDS.lesson, completedAt: '2026-10-01T00:00:00Z' }], nextCursor: IDS.lesson, hasMore: true });
	});
	test('mark POSTs completedLessons and confirms by re-reading', async () => {
		const other = '22222222-2222-4333-8444-555555555555';
		const seen = stubFetch(replies([
			{ body: { success: true } },
			{ body: user },
			{ body: [{ lessonID: IDS.lesson, completedAt: '2026-10-01T10:00:00Z' }] },
		]));
		const result = await run({ action: markLessonsCompletedAction, propsValue: { email: 'a@x.io', lessonIds: [IDS.lesson, other], completedAt: '2026-10-01T10:00:00Z' } });
		expect(seen[0].method).toBe('POST');
		expect(seen[0].body).toEqual({ email: 'a@x.io', completedLessons: [{ lessonID: IDS.lesson, timestamp: '2026-10-01T10:00:00.000Z' }, { lessonID: other, timestamp: '2026-10-01T10:00:00.000Z' }] });
		expect(seen[2].path).toBe(`/users/${IDS.user}/completed-lessons`);
		expect(result).toEqual({ email: 'a@x.io', lessonIds: [IDS.lesson, other], completedAt: '2026-10-01T10:00:00.000Z', confirmed: [IDS.lesson], notConfirmed: [other], unverified: [], checkComplete: true, lookupError: null });
	});
	test('mark reports lessons beyond the fifth page as unverified, not missing', async () => {
		const page = (n: number) => Array.from({ length: 100 }, (_, i) => ({ lessonID: `00000000-0000-4000-8000-${String(n * 100 + i).padStart(12, '0')}` }));
		const seen = stubFetch(replies([{ body: {} }, { body: user }, { body: page(0) }, { body: page(1) }, { body: page(2) }, { body: page(3) }, { body: page(4) }, { body: [{ lessonID: IDS.lesson }] }]));
		const result = await run({ action: markLessonsCompletedAction, propsValue: { email: 'a@x.io', lessonIds: [IDS.lesson] } });
		expect(seen).toHaveLength(7);
		expect(result).toMatchObject({ confirmed: [], notConfirmed: [], unverified: [IDS.lesson], checkComplete: false, lookupError: null });
	});
	test('mark keeps the saved completion when the read-back fails', async () => {
		stubFetch(replies([{ body: {} }, { status: 500, body: { message: 'down' } }]));
		const result = await run({ action: markLessonsCompletedAction, propsValue: { email: 'a@x.io', lessonIds: [IDS.lesson] } });
		expect(result).toMatchObject({ confirmed: [], notConfirmed: [], unverified: [IDS.lesson], checkComplete: false });
		expect(result).toHaveProperty('lookupError', expect.stringMatching(/saved in Heartbeat.*down/));
	});
	test('mark follows completed-lesson pages until all are found', async () => {
		const full = Array.from({ length: 100 }, (_, i) => ({ lessonID: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}` }));
		const seen = stubFetch(replies([{ body: {} }, { body: user }, { body: full }, { body: [{ lessonID: IDS.lesson }] }]));
		const result = await run({ action: markLessonsCompletedAction, propsValue: { email: 'a@x.io', lessonIds: [IDS.lesson] } });
		expect(seen[3].query.get('startingAfter')).toBe(full[99].lessonID);
		expect(result).toMatchObject({ confirmed: [IDS.lesson], notConfirmed: [] });
	});
	test('mark refuses an empty lesson list', async () => {
		stubFetch(replies([{ body: {} }]));
		await expect(run({ action: markLessonsCompletedAction, propsValue: { email: 'a@x.io', lessonIds: [] } })).rejects.toThrow(/at least one/);
	});
});
