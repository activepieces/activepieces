import { afterEach, describe, expect, test, vi } from 'vitest';
import { tagOrUntagRecordAction } from '../src/lib/actions/ai/tag-or-untag-record';
import { getConversationByIdAction } from '../src/lib/actions/ai/get-conversation-by-id';
import { replyToConversationByIdAction } from '../src/lib/actions/ai/reply-to-conversation-by-id';
import { assignConversationByIdAction } from '../src/lib/actions/ai/assign-conversation-by-id';
import { sendMessageToContactAction } from '../src/lib/actions/ai/send-message-to-contact';
import { setConversationStateAction } from '../src/lib/actions/set-conversation-state';
import { listAdminsAction } from '../src/lib/actions/list-admins';
import { createTagAction } from '../src/lib/actions/create-tag';
import { listSegmentsAction } from '../src/lib/actions/ai/list-segments';
import { addNoteToContactAction } from '../src/lib/actions/ai/add-note-to-contact';
import { createConversationFromContactAction } from '../src/lib/actions/ai/create-conversation-from-contact';
import { createHelpCenterArticleAction } from '../src/lib/actions/ai/create-help-center-article';
import { ME, runAction, stubIntercom } from './helpers';

const TAG = { type: 'tag', id: '77', name: 'VIP' };
const TAGS = { type: 'list', data: [TAG] };

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Tag or Untag Record', () => {
	test('contact + existing tag name in another case: reuses the tag without renaming it', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/tags', reply: { body: TAGS } },
			{ method: 'POST', path: '/contacts/c1/tags', reply: { body: TAG } },
		]);
		const output = await runAction({ action: tagOrUntagRecordAction, props: { target: 'contact', recordId: 'c1', tagName: 'vip' } });
		expect(output).toEqual({ target: 'contact', record_id: 'c1', tag: { id: '77', name: 'VIP' }, removed: false, already_in_state: false });
		expect(seen.map((r) => `${r.method} ${r.path}`)).toEqual(['GET /tags', 'POST /contacts/c1/tags']);
		expect(seen[1].body).toEqual({ id: '77' });
	});

	test('a new tag name is created first', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/tags', reply: { body: TAGS } },
			{ method: 'POST', path: '/tags', reply: { body: { type: 'tag', id: '88', name: 'New' } } },
			{ method: 'POST', path: '/contacts/c1/tags', reply: { body: {} } },
		]);
		await runAction({ action: tagOrUntagRecordAction, props: { target: 'contact', recordId: 'c1', tagName: 'New' } });
		expect(seen.map((r) => `${r.method} ${r.path}`)).toEqual(['GET /tags', 'POST /tags', 'POST /contacts/c1/tags']);
		expect(seen[1].body).toEqual({ name: 'New' });
	});

	test('conversation and ticket tagging send the acting admin', async () => {
		for (const [target, plural] of [
			['conversation', 'conversations'],
			['ticket', 'tickets'],
		]) {
			vi.unstubAllGlobals();
			const seen = stubIntercom([
				{ method: 'GET', path: '/tags/77', reply: { body: TAG } },
				{ method: 'GET', path: '/me', reply: { body: ME } },
				{ method: 'POST', path: `/${plural}/r1/tags`, reply: { body: TAG } },
			]);
			await runAction({ action: tagOrUntagRecordAction, props: { target, recordId: 'r1', tagId: '77' } });
			expect(seen.at(-1)?.body).toEqual({ id: '77', admin_id: '991' });
		}
	});

	test('company add uses POST /tags with companies[]; remove looks up company_id and sends untag', async () => {
		const addSeen = stubIntercom([
			{ method: 'GET', path: '/tags', reply: { body: TAGS } },
			{ method: 'POST', path: '/tags', reply: { body: TAG } },
		]);
		await runAction({ action: tagOrUntagRecordAction, props: { target: 'company', recordId: 'co1', tagName: 'VIP' } });
		expect(addSeen.at(-1)?.body).toEqual({ name: 'VIP', companies: [{ id: 'co1' }] });

		vi.unstubAllGlobals();
		const removeSeen = stubIntercom([
			{ method: 'GET', path: '/tags', reply: { body: TAGS } },
			{ method: 'GET', path: '/companies/co1', reply: { body: { id: 'co1', company_id: 'acme-001' } } },
			{ method: 'POST', path: '/tags', reply: { body: TAG } },
		]);
		await runAction({ action: tagOrUntagRecordAction, props: { target: 'company', recordId: 'co1', tagId: '77', remove: true } });
		expect(removeSeen.at(-1)?.body).toEqual({ name: 'VIP', companies: [{ id: 'co1', company_id: 'acme-001', untag: true }] });
	});

	test('removing a tag that does not exist reports already_in_state without writing', async () => {
		const seen = stubIntercom([{ method: 'GET', path: '/tags', reply: { body: TAGS } }]);
		const output = await runAction({
			action: tagOrUntagRecordAction,
			props: { target: 'contact', recordId: 'c1', tagName: 'Missing', remove: true },
		});
		expect(output).toMatchObject({ removed: true, already_in_state: true });
		expect(seen).toHaveLength(1);
	});

	test('a 404 on untag counts as already removed only when the record exists', async () => {
		stubIntercom([
			{ method: 'GET', path: '/tags', reply: { body: TAGS } },
			{ method: 'DELETE', path: '/contacts/c1/tags/77', reply: { status: 404, body: { errors: [{ code: 'not_found' }] } } },
			{ method: 'GET', path: '/contacts/c1', reply: { body: { id: 'c1' } } },
		]);
		expect(
			await runAction({ action: tagOrUntagRecordAction, props: { target: 'contact', recordId: 'c1', tagId: '77', remove: true } }),
		).toMatchObject({ removed: true, already_in_state: true });

		vi.unstubAllGlobals();
		stubIntercom([
			{ method: 'GET', path: '/tags', reply: { body: TAGS } },
			{ method: 'DELETE', path: '/contacts/gone/tags/77', reply: { status: 404, body: { errors: [{ code: 'not_found' }] } } },
		]);
		await expect(
			runAction({ action: tagOrUntagRecordAction, props: { target: 'contact', recordId: 'gone', tagId: '77', remove: true } }),
		).rejects.toThrow('(404)');
	});

	test('needs exactly one of tag ID or tag name', async () => {
		stubIntercom([]);
		await expect(runAction({ action: tagOrUntagRecordAction, props: { target: 'contact', recordId: 'c1' } })).rejects.toThrow(
			'exactly one',
		);
		await expect(
			runAction({ action: tagOrUntagRecordAction, props: { target: 'contact', recordId: 'c1', tagId: '1', tagName: 'x' } }),
		).rejects.toThrow('exactly one');
	});
});

describe('conversation twins', () => {
	test('Get Conversation (by ID) asks for plain text and flattens parts', async () => {
		const seen = stubIntercom([
			{
				method: 'GET',
				path: '/conversations/42',
				reply: {
					body: {
						id: '42',
						state: 'open',
						conversation_parts: {
							conversation_parts: [
								{ id: 'p1', part_type: 'comment', body: 'hi', created_at: 10, author: { type: 'user', id: 'u1', name: 'Ann' } },
							],
						},
					},
				},
			},
		]);
		const output = await runAction({ action: getConversationByIdAction, props: { conversationId: '42' } });
		expect(seen[0].query).toEqual({ display_as: 'plaintext' });
		expect(output).toEqual({
			id: '42',
			state: 'open',
			parts: [{ id: 'p1', part_type: 'comment', author_type: 'user', author_id: 'u1', author_name: 'Ann', body: 'hi', created_at: 10 }],
		});
	});

	test('Reply (by ID) defaults the admin to the connection owner and posts once even on 5xx', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/me', reply: { body: ME } },
			{ method: 'POST', path: '/conversations/42/reply', reply: { status: 500, body: { errors: [{ code: 'server_error' }] } } },
		]);
		await expect(
			runAction({ action: replyToConversationByIdAction, props: { conversationId: '42', body: 'Hello', attachmentUrls: ['https://x.io/a.png'] } }),
		).rejects.toThrow('(500)');
		const posts = seen.filter((r) => r.method === 'POST');
		expect(posts).toHaveLength(1);
		expect(posts[0].body).toEqual({
			message_type: 'comment',
			type: 'admin',
			admin_id: '991',
			body: 'Hello',
			attachment_urls: ['https://x.io/a.png'],
		});
	});

	test('Reply (by ID) rejects non-http attachment URLs before sending', async () => {
		const seen = stubIntercom([]);
		await expect(
			runAction({
				action: replyToConversationByIdAction,
				props: { conversationId: '42', body: 'Hello', adminId: '5', attachmentUrls: ['javascript:alert(1)'] },
			}),
		).rejects.toThrow('public http(s) link');
		expect(seen).toHaveLength(0);
	});

	test('Assign (by ID) posts an assignment part to a team', async () => {
		const seen = stubIntercom([{ method: 'POST', path: '/conversations/42/parts', reply: { body: { id: '42' } } }]);
		await runAction({
			action: assignConversationByIdAction,
			props: { conversationId: '42', assigneeType: 'team', assigneeId: '7', adminId: '5' },
		});
		expect(seen[0].body).toEqual({ message_type: 'assignment', type: 'team', admin_id: '5', assignee_id: '7' });
	});

	test('Set Conversation State: snooze needs a future time; closing message only on close', async () => {
		const seen = stubIntercom([{ method: 'POST', path: '/conversations/42/parts', reply: { body: { id: '42' } } }]);
		await expect(
			runAction({ action: setConversationStateAction, props: { conversationId: '42', state: 'snoozed', adminId: '5' } }),
		).rejects.toThrow('Snooze Until is required');
		await expect(
			runAction({
				action: setConversationStateAction,
				props: { conversationId: '42', state: 'snoozed', snoozedUntil: '2000-01-01T00:00:00Z', adminId: '5' },
			}),
		).rejects.toThrow('must be in the future');
		await expect(
			runAction({ action: setConversationStateAction, props: { conversationId: '42', state: 'open', closingMessage: 'bye', adminId: '5' } }),
		).rejects.toThrow('only be sent when closing');
		expect(seen).toHaveLength(0);
		await runAction({ action: setConversationStateAction, props: { conversationId: '42', state: 'close', closingMessage: 'bye', adminId: '5' } });
		expect(seen[0].body).toEqual({ message_type: 'close', type: 'admin', admin_id: '5', body: 'bye' });
	});
});

describe('Send Message to Contact', () => {
	test('resolves a unique email, sends an email from the admin to the right contact type', async () => {
		const seen = stubIntercom([
			{ method: 'POST', path: '/contacts/search', reply: { body: { data: [{ id: 'c1', role: 'lead' }] } } },
			{ method: 'POST', path: '/messages', reply: { body: { type: 'admin_message', id: 'm1' } } },
		]);
		await runAction({
			action: sendMessageToContactAction,
			props: { email: 'lead@example.com', messageType: 'email', subject: 'Hi', body: 'Body', adminId: '5' },
		});
		expect(seen.at(-1)?.body).toEqual({
			message_type: 'email',
			subject: 'Hi',
			template: 'plain',
			body: 'Body',
			from: { type: 'admin', id: 5 },
			to: { type: 'lead', id: 'c1' },
			create_conversation_without_contact_reply: false,
		});
	});

	test('email needs a subject and exactly one contact identifier', async () => {
		const seen = stubIntercom([]);
		await expect(
			runAction({ action: sendMessageToContactAction, props: { contactId: 'c1', messageType: 'email', body: 'x' } }),
		).rejects.toThrow('Subject is required');
		await expect(
			runAction({ action: sendMessageToContactAction, props: { messageType: 'in_app', body: 'x' } }),
		).rejects.toThrow('exactly one');
		expect(seen).toHaveLength(0);
	});
});

describe('List Admins', () => {
	test('returns admins plus the connected admin ID', async () => {
		stubIntercom([
			{ method: 'GET', path: '/admins', reply: { body: { admins: [{ id: '991', name: 'Pat', email: 'pat@acme.com', team_ids: [1] }] } } },
			{ method: 'GET', path: '/me', reply: { body: ME } },
		]);
		expect(await runAction({ action: listAdminsAction, props: {} })).toEqual({
			items: [
				{ id: '991', name: 'Pat', email: 'pat@acme.com', job_title: null, away_mode_enabled: false, has_inbox_seat: false, team_ids: [1] },
			],
			current_admin_id: '991',
		});
	});
});

describe('Create Tag', () => {
	test('returns an existing tag in another letter case without renaming it', async () => {
		const seen = stubIntercom([{ method: 'GET', path: '/tags', reply: { body: TAGS } }]);
		expect(await runAction({ action: createTagAction, props: { name: 'vip' } })).toEqual(TAG);
		expect(seen.every((r) => r.method === 'GET')).toBe(true);
	});
});

describe('PR1 agent twins', () => {
	test('List Segments sends include_count only when asked and maps segments', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/segments', reply: { body: { type: 'segment.list', segments: [{ type: 'segment', id: '5f0a', name: 'Active', person_type: 'user', count: 3, created_at: 1, updated_at: 2 }] } } },
		]);
		const output = await runAction({ action: listSegmentsAction, props: { includeCount: true } });
		expect(seen[0].query).toEqual({ include_count: 'true' });
		expect(output).toEqual({ items: [{ id: '5f0a', name: 'Active', person_type: 'user', count: 3, created_at: 1, updated_at: 2 }] });
		vi.unstubAllGlobals();
		const plain = stubIntercom([{ method: 'GET', path: '/segments', reply: { body: { segments: [] } } }]);
		await runAction({ action: listSegmentsAction, props: {} });
		expect(plain[0].query).toEqual({});
	});

	test('Add Note to Contact posts to the contact with the connection admin by default', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/me', reply: { body: ME } },
			{ method: 'POST', path: '/contacts/c1/notes', reply: { body: { type: 'note', id: 'n1' } } },
		]);
		await runAction({ action: addNoteToContactAction, props: { contactId: ' c1 ', body: 'Hello' } });
		expect(seen.at(-1)?.body).toEqual({ body: 'Hello', admin_id: '991' });
	});

	test('Create Conversation from Contact sends the contact role as author type', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/contacts/c1', reply: { body: { id: 'c1', role: 'lead' } } },
			{ method: 'POST', path: '/conversations', reply: { body: { type: 'user_message', id: 'm1', conversation_id: '9' } } },
		]);
		await runAction({ action: createConversationFromContactAction, props: { contactId: 'c1', body: 'Need help' } });
		expect(seen[1].body).toEqual({ from: { type: 'lead', id: 'c1' }, body: 'Need help' });
	});

	test('Create Help Center Article defaults to draft with integer IDs and rejects non-numeric IDs', async () => {
		const seen = stubIntercom([{ method: 'POST', path: '/articles', reply: { body: { id: '1', state: 'draft' } } }]);
		await runAction({ action: createHelpCenterArticleAction, props: { title: 'T', authorId: '42', collectionId: '7' } });
		expect(seen[0].body).toEqual({ title: 'T', author_id: 42, state: 'draft', parent_id: 7, parent_type: 'collection' });
		await expect(runAction({ action: createHelpCenterArticleAction, props: { title: 'T', authorId: 'abc' } })).rejects.toThrow('Author Admin ID must be a numeric Intercom ID');
	});
});
