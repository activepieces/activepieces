import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { listChannelThreadsAction } from '../src/lib/actions/list-channel-threads';
import { getThreadAction } from '../src/lib/actions/get-thread';
import { createThreadAction } from '../src/lib/actions/create-thread';
import { createCommentAction } from '../src/lib/actions/create-comment';
import { sendChatMessageAction } from '../src/lib/actions/send-chat-message';
import { listChatMessagesAction } from '../src/lib/actions/list-chat-messages';
import { sendDirectMessageAction } from '../src/lib/actions/send-direct-message';
import { getOrCreateDirectChatAction } from '../src/lib/actions/get-or-create-direct-chat';
import { listDirectMessagesAction } from '../src/lib/actions/list-direct-messages';
import { listEventsAction } from '../src/lib/actions/list-events';
import { getEventAction } from '../src/lib/actions/get-event';
import { getEventAttendanceAction } from '../src/lib/actions/get-event-attendance';
import { createEventAction } from '../src/lib/actions/create-event';
import { listInvitationsAction } from '../src/lib/actions/list-invitations';
import { createInvitationLinkAction } from '../src/lib/actions/create-invitation-link';
import { addEmailsToInvitationAction } from '../src/lib/actions/add-emails-to-invitation';
import { listCoursesAction } from '../src/lib/actions/list-courses';
import { getLessonAction } from '../src/lib/actions/get-lesson';
import { listDocumentsAction } from '../src/lib/actions/list-documents';
import { getDocumentAction } from '../src/lib/actions/get-document';
import { IDS, replies, run, stubFetch } from './helpers';

const thread = { id: IDS.thread, channelID: IDS.channel, userID: IDS.admin, content: '<p>x</p>', comments: [{ id: IDS.comment, children: [] }] };
const event = { id: IDS.event, name: 'AP-TEST event', startTime: '2026-10-13T15:00:00.000Z' };

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('threads', () => {
	test('list threads pages and strips comments by default', async () => {
		const seen = stubFetch(replies([{ body: [thread, { ...thread, id: 'b' }] }]));
		const result = await run({ action: listChannelThreadsAction, propsValue: { channelId: IDS.channel, limit: 2, startingAfter: IDS.comment } });
		expect(seen[0].path).toBe(`/channels/${IDS.channel}/threads`);
		expect(seen[0].query.get('startingAfter')).toBe(IDS.comment);
		expect(result).toMatchObject({ nextCursor: 'b', hasMore: true, threads: [{ commentCount: 1 }, {}] });
		expect(result).not.toHaveProperty('threads.0.comments');
	});
	test('list threads can include comments', async () => {
		stubFetch(replies([{ body: [thread] }]));
		expect(await run({ action: listChannelThreadsAction, propsValue: { channelId: IDS.channel, includeComments: true } })).toMatchObject({ threads: [{ comments: thread.comments }], hasMore: false, nextCursor: null });
	});
	test('get thread', async () => {
		const seen = stubFetch(replies([{ body: thread }]));
		expect(await run({ action: getThreadAction, propsValue: { threadId: IDS.thread } })).toEqual(thread);
		expect(seen[0].path).toBe(`/threads/${IDS.thread}`);
	});
	test('create thread wraps plain text in paragraphs', async () => {
		const seen = stubFetch(replies([{ body: thread }]));
		await run({ action: createThreadAction, propsValue: { channelId: IDS.channel, text: 'Hello @x\nSecond <b>bold</b>', authorUserId: IDS.admin, createdAt: '2026-01-01T00:00:00Z' } });
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].path).toBe('/threads');
		expect(seen[0].body).toEqual({ text: '<p>Hello @x</p><p>Second <b>bold</b></p>', channelID: IDS.channel, userID: IDS.admin, createdAt: '2026-01-01T00:00:00.000Z' });
	});
	test('create thread keeps block HTML as is', async () => {
		const seen = stubFetch(replies([{ body: thread }]));
		await run({ action: createThreadAction, propsValue: { channelId: IDS.channel, text: '<h1>T</h1><p>x</p>' } });
		expect(seen[0].body).toEqual({ text: '<h1>T</h1><p>x</p>', channelID: IDS.channel });
	});
	test('create comment sends parentCommentID null by default', async () => {
		const seen = stubFetch(replies([{ body: { id: IDS.comment } }]));
		expect(await run({ action: createCommentAction, propsValue: { threadId: IDS.thread, text: '<p>hi</p>' } })).toEqual({ id: IDS.comment, threadId: IDS.thread, parentCommentId: null });
		expect(seen[0].body).toEqual({ text: '<p>hi</p>', threadID: IDS.thread, parentCommentID: null });
	});
	test('create reply passes the parent comment', async () => {
		const seen = stubFetch(replies([{ body: { id: 'r' } }]));
		await run({ action: createCommentAction, propsValue: { threadId: IDS.thread, text: '<p>hi</p>', parentCommentId: IDS.comment } });
		expect(seen[0].body).toMatchObject({ parentCommentID: IDS.comment });
	});
});

describe('chat', () => {
	test('send chat message handles 204 and matches the new message', async () => {
		const seen = stubFetch((request) =>
			request.method === 'PUT'
				? { status: 204, text: '' }
				: { body: { data: [{ id: 'm1', userID: IDS.admin, content: '<p>Hi</p>', createdAt: '2026-10-06T12:00:01Z' }], hasMore: false } },
		);
		const result = await run({ action: sendChatMessageAction, propsValue: { channelId: IDS.channel, text: 'Hi', fromUserId: IDS.admin } });
		expect(seen[0].path).toBe(`/chatChannel/${IDS.channel}/message`);
		expect(seen[0].body).toEqual({ text: '<p>Hi</p>', from: IDS.admin });
		expect(seen[1].query.get('limit')).toBe('10');
		expect(result).toMatchObject({ sent: true, messageId: 'm1' });
	});
	test('send chat message stays successful when the read-back fails', async () => {
		const seen = stubFetch(replies([{ status: 204, text: '' }, { status: 503, body: { message: 'unavailable' } }]));
		const result = await run({ action: sendChatMessageAction, propsValue: { channelId: IDS.channel, text: 'Hi' } });
		expect(seen.filter((request) => request.method === 'PUT')).toHaveLength(1);
		expect(result).toMatchObject({ sent: true, messageId: null, message: null, lookupError: expect.stringMatching(/unavailable/) });
	});
	test('send chat message returns null ID when no match', async () => {
		stubFetch((request) => (request.method === 'PUT' ? { status: 204, text: '' } : { body: { data: [], hasMore: false } }));
		expect(await run({ action: sendChatMessageAction, propsValue: { channelId: IDS.channel, text: 'Hi' } })).toMatchObject({ sent: true, messageId: null, message: null });
	});
	test('list chat messages uses vendor hasMore', async () => {
		stubFetch(replies([{ body: { data: [{ id: 'm1' }, { id: 'm2' }], hasMore: true } }]));
		expect(await run({ action: listChatMessagesAction, propsValue: { channelId: IDS.channel, limit: 2 } })).toEqual({ messages: [{ id: 'm1' }, { id: 'm2' }], nextCursor: 'm2', hasMore: true });
	});
});

describe('direct messages', () => {
	test('send without sender returns no chat info', async () => {
		const seen = stubFetch(replies([{ status: 204, text: '' }]));
		expect(await run({ action: sendDirectMessageAction, propsValue: { toUserId: IDS.user, text: 'Hi' } })).toEqual({ to: IDS.user, from: null, sent: true, chatId: null, chatUrl: null, messageId: null, lookupError: null });
		expect(seen[0].body).toEqual({ text: '<p>Hi</p>', to: IDS.user });
		expect(seen).toHaveLength(1);
	});
	test('send with sender looks up chat and message', async () => {
		const seen = stubFetch(replies([
			{ status: 204, text: '' },
			{ body: { chatID: IDS.chat, url: 'https://app.heartbeat.chat/x/c/1' } },
			{ body: [{ id: IDS.message, userID: IDS.admin, content: '<p>Hi</p>', createdAt: '2026-10-06T12:00:02Z' }] },
		]));
		const result = await run({ action: sendDirectMessageAction, propsValue: { toUserId: IDS.user, text: 'Hi', fromUserId: IDS.admin } });
		expect(seen[1].body).toEqual({ userID1: IDS.admin, userID2: IDS.user });
		expect(seen[2].path).toBe(`/directMessages/${IDS.chat}`);
		expect(result).toEqual({ to: IDS.user, from: IDS.admin, sent: true, chatId: IDS.chat, chatUrl: 'https://app.heartbeat.chat/x/c/1', messageId: IDS.message, lookupError: null });
	});
	test('send with sender stays successful when the chat lookup fails', async () => {
		stubFetch(replies([{ status: 204, text: '' }, { status: 500, body: { message: 'down' } }]));
		const result = await run({ action: sendDirectMessageAction, propsValue: { toUserId: IDS.user, text: 'Hi', fromUserId: IDS.admin } });
		expect(result).toMatchObject({ sent: true, chatId: null, messageId: null, lookupError: expect.stringMatching(/Do not re-run/) });
	});
	test('send refuses same sender and recipient', async () => {
		stubFetch(replies([{ body: {} }]));
		await expect(run({ action: sendDirectMessageAction, propsValue: { toUserId: IDS.user, text: 'Hi', fromUserId: IDS.user } })).rejects.toThrow(/different/);
	});
	test('get direct chat PUTs /directChats', async () => {
		const seen = stubFetch(replies([{ body: { chatID: IDS.chat, url: 'u' } }]));
		expect(await run({ action: getOrCreateDirectChatAction, propsValue: { userId1: IDS.admin, userId2: IDS.user } })).toEqual({ chatID: IDS.chat, url: 'u' });
		expect(seen[0].method).toBe('PUT');
	});
	test('list direct messages', async () => {
		stubFetch(replies([{ body: [{ id: IDS.message }] }]));
		expect(await run({ action: listDirectMessagesAction, propsValue: { chatId: IDS.chat } })).toEqual({ chatId: IDS.chat, messages: [{ id: IDS.message }], count: 1 });
	});
});

describe('events', () => {
	test('list events filters by time window and limit', async () => {
		const seen = stubFetch(replies([{ body: [event, { ...event, id: 'old', startTime: '2026-01-01T00:00:00Z' }, { ...event, id: 'late', startTime: '2026-12-01T00:00:00Z' }] }]));
		const result = await run({ action: listEventsAction, propsValue: { groupId: IDS.group, startsAfter: '2026-10-01T00:00:00Z', startsBefore: '2026-11-01T00:00:00Z' } });
		expect(seen[0].query.get('groupID')).toBe(IDS.group);
		expect(result).toEqual({ events: [event], count: 1, totalMatching: 1, truncated: false });
	});
	test('list events rejects an inverted window', async () => {
		stubFetch(replies([{ body: [] }]));
		await expect(run({ action: listEventsAction, propsValue: { startsAfter: '2026-11-01T00:00:00Z', startsBefore: '2026-10-01T00:00:00Z' } })).rejects.toThrow(/earlier/);
	});
	test('get event with occurrences', async () => {
		const seen = stubFetch(replies([{ body: event }, { body: [{ startTime: 'a', endTime: 'b' }] }]));
		expect(await run({ action: getEventAction, propsValue: { eventId: IDS.event, includeInstances: true } })).toEqual({ ...event, instances: [{ startTime: 'a', endTime: 'b' }] });
		expect(seen[1].path).toBe(`/events/${IDS.event}/instances`);
	});
	test('attendance normalises a single attendee object to a list', async () => {
		stubFetch(replies([{ body: [{ startTime: 'a', endTime: 'b', attendees: { id: IDS.user, name: 'A', isUser: true } }] }]));
		expect(await run({ action: getEventAttendanceAction, propsValue: { eventId: IDS.event } })).toEqual({ eventId: IDS.event, happened: true, instances: [{ startTime: 'a', endTime: 'b', attendees: [{ id: IDS.user, name: 'A', isUser: true }] }] });
	});
	test('attendance maps 422 not-happened to happened=false', async () => {
		stubFetch(replies([{ status: 422, body: { error: true, message: 'Event has not happened yet' } }]));
		expect(await run({ action: getEventAttendanceAction, propsValue: { eventId: IDS.event } })).toEqual({ eventId: IDS.event, happened: false, instances: [] });
	});
	test('create event sends description "" and re-reads the event', async () => {
		const seen = stubFetch(replies([{ body: { success: true, event: { id: IDS.event, location: { type: 'CUSTOM', locationStr: 'Room' } } } }, { body: event }]));
		const result = await run({ action: createEventAction, propsValue: { name: 'E', startTime: '2026-10-13T15:00:00Z', durationMinutes: 30, location: 'CUSTOM', customLocation: 'Room', invitedEmails: ['a@x.io'] } });
		expect(seen[0].method).toBe('PUT');
		expect(seen[0].body).toEqual({ name: 'E', description: '', startTime: '2026-10-13T15:00:00.000Z', duration: 30, location: 'Room', invitedUsers: ['a@x.io'] });
		expect(result).toEqual({ ...event, location: { type: 'CUSTOM', locationStr: 'Room' }, lookupError: null });
	});
	test('create event keeps the new ID when the read-back fails', async () => {
		stubFetch(replies([{ body: { success: true, event: { id: IDS.event, location: { type: 'HEARTBEAT' } } } }, { status: 500, body: { message: 'down' } }]));
		const result = await run({ action: createEventAction, propsValue: { name: 'E', startTime: '2026-10-13T15:00:00Z', durationMinutes: 30, location: 'HEARTBEAT' } });
		expect(result).toMatchObject({ id: IDS.event, location: { type: 'HEARTBEAT' }, lookupError: expect.stringMatching(/saved in Heartbeat/) });
	});
	test('create event validates duration and custom location', async () => {
		stubFetch(replies([{ body: {} }]));
		await expect(run({ action: createEventAction, propsValue: { name: 'E', startTime: '2026-10-13T15:00:00Z', durationMinutes: 0, location: 'HEARTBEAT' } })).rejects.toThrow(/Duration/);
		await expect(run({ action: createEventAction, propsValue: { name: 'E', startTime: '2026-10-13T15:00:00Z', durationMinutes: 30, location: 'CUSTOM' } })).rejects.toThrow(/Custom Location/);
	});
});

describe('invitations, courses, documents', () => {
	test('list invitations', async () => {
		stubFetch(replies([{ body: [{ id: IDS.invitation, code: 'ABC123' }] }]));
		expect(await run({ action: listInvitationsAction, propsValue: {} })).toEqual({ invitations: [{ id: IDS.invitation, code: 'ABC123' }], count: 1 });
	});
	test('create invitation link sends groupIDs [] when none', async () => {
		const seen = stubFetch(replies([{ body: { id: IDS.invitation, code: 'ABC123' } }]));
		await run({ action: createInvitationLinkAction, propsValue: { roleId: IDS.role } });
		expect(seen[0].body).toEqual({ roleID: IDS.role, groupIDs: [] });
	});
	test('add emails requires an explicit send choice', async () => {
		const seen = stubFetch(replies([{ body: { success: true } }]));
		await expect(run({ action: addEmailsToInvitationAction, propsValue: { invitationId: IDS.invitation, emails: ['a@x.io'] } })).rejects.toThrow(/yes or no/);
		expect(await run({ action: addEmailsToInvitationAction, propsValue: { invitationId: IDS.invitation, emails: ['a@x.io'], sendEmail: 'no' } })).toEqual({ invitationId: IDS.invitation, emails: ['a@x.io'], emailSent: false });
		expect(seen[0].method).toBe('POST');
		expect(seen[0].body).toEqual({ emails: ['a@x.io'], shouldSendEmail: false });
	});
	test('list courses', async () => {
		stubFetch(replies([{ body: [] }]));
		expect(await run({ action: listCoursesAction, propsValue: {} })).toEqual({ courses: [], count: 0 });
	});
	test('get lesson surfaces 404', async () => {
		stubFetch(replies([{ status: 404, body: { message: 'Could not find data' } }]));
		await expect(run({ action: getLessonAction, propsValue: { lessonId: IDS.lesson } })).rejects.toThrow(/404/);
	});
	test('list documents pages', async () => {
		const seen = stubFetch(replies([{ body: [{ id: IDS.document, name: 'Doc' }] }]));
		expect(await run({ action: listDocumentsAction, propsValue: { limit: 1 } })).toEqual({ documents: [{ id: IDS.document, name: 'Doc' }], nextCursor: IDS.document, hasMore: true });
		expect(seen[0].query.get('limit')).toBe('1');
	});
	test('get document', async () => {
		const seen = stubFetch(replies([{ body: { id: IDS.document, content: '# x' } }]));
		expect(await run({ action: getDocumentAction, propsValue: { documentId: IDS.document } })).toEqual({ id: IDS.document, content: '# x' });
		expect(seen[0].path).toBe(`/documents/${IDS.document}`);
	});
});
