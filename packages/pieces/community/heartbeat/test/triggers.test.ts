import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { heartbeatApi } from '../src/lib/common/client';
import { heartbeatWebhooks } from '../src/lib/common/webhooks';
import { newMemberTrigger } from '../src/lib/triggers/new-member';
import { newThreadTrigger } from '../src/lib/triggers/new-thread';
import { newMentionTrigger } from '../src/lib/triggers/new-mention';
import { newEventTrigger } from '../src/lib/triggers/new-event';
import { newDirectMessageTrigger } from '../src/lib/triggers/new-direct-message';
import { IDS, memoryStore, replies, runStep, stubFetch, TOKEN, triggerContext } from './helpers';

type Hook = (context: ReturnType<typeof triggerContext>) => Promise<unknown>;

function hook({ trigger, name, context }: { trigger: unknown; name: 'onEnable' | 'onDisable' | 'run' | 'test'; context: ReturnType<typeof triggerContext> }) {
	const fn: Hook = Reflect.get(Object(trigger), name);
	return runStep(fn(context));
}

const WEBHOOK_URL = 'https://example.ngrok.dev/api/v1/webhooks/flow123';

beforeEach(() => {
	vi.useFakeTimers();
	vi.spyOn(heartbeatApi, 'sleep').mockResolvedValue(undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('webhook lifecycle', () => {
	test('enable deletes orphans on the same URL, registers and stores the ID', async () => {
		const store = memoryStore();
		const seen = stubFetch((request) => {
			if (request.method === 'GET') {
				return { body: [{ id: 'orphan-1', url: WEBHOOK_URL }, { id: 'other', url: 'https://elsewhere' }] };
			}
			if (request.method === 'PUT') {
				return { body: { id: IDS.webhook } };
			}
			return { body: { success: true } };
		});
		await hook({ trigger: newEventTrigger, name: 'onEnable', context: triggerContext({ store }) });
		expect(seen.map((r) => `${r.method} ${r.path}`)).toEqual(['GET /webhooks', 'DELETE /webhooks/orphan-1', 'PUT /webhooks']);
		expect(seen[2].body).toEqual({ action: { name: 'EVENT_CREATE' }, url: WEBHOOK_URL });
		expect(store.read(heartbeatWebhooks.WEBHOOK_STORE_KEY)).toEqual({ webhookId: IDS.webhook });
	});
	test('enable replaces a previously stored webhook', async () => {
		const store = memoryStore({ [heartbeatWebhooks.WEBHOOK_STORE_KEY]: { webhookId: 'old' } });
		const seen = stubFetch((request) => (request.method === 'GET' ? { body: [] } : request.method === 'PUT' ? { body: { id: IDS.webhook } } : { status: 404, body: {} }));
		await hook({ trigger: newMemberTrigger, name: 'onEnable', context: triggerContext({ store }) });
		expect(seen[0].method).toBe('DELETE');
		expect(seen[0].path).toBe('/webhooks/old');
		expect(seen[2].body).toEqual({ action: { name: 'USER_JOIN' }, url: WEBHOOK_URL });
	});
	test('enable deletes the new webhook if storing its ID fails', async () => {
		const store = memoryStore();
		store.put = async () => {
			throw new Error('store down');
		};
		const seen = stubFetch((request) => (request.method === 'GET' ? { body: [] } : request.method === 'PUT' ? { body: { id: IDS.webhook } } : { body: {} }));
		await expect(hook({ trigger: newEventTrigger, name: 'onEnable', context: triggerContext({ store }) })).rejects.toThrow('store down');
		expect(seen[seen.length - 1].method).toBe('DELETE');
		expect(seen[seen.length - 1].path).toBe(`/webhooks/${IDS.webhook}`);
	});
	test('disable forgets the ID after a 2xx or 404, keeps it on other errors', async () => {
		const store = memoryStore({ [heartbeatWebhooks.WEBHOOK_STORE_KEY]: { webhookId: IDS.webhook } });
		stubFetch(replies([{ status: 404, body: {} }]));
		await hook({ trigger: newEventTrigger, name: 'onDisable', context: triggerContext({ store }) });
		expect(store.read(heartbeatWebhooks.WEBHOOK_STORE_KEY)).toBeUndefined();
		vi.unstubAllGlobals();
		const kept = memoryStore({ [heartbeatWebhooks.WEBHOOK_STORE_KEY]: { webhookId: IDS.webhook } });
		stubFetch(replies([{ status: 500, body: { message: 'down' } }]));
		await expect(hook({ trigger: newEventTrigger, name: 'onDisable', context: triggerContext({ store: kept }) })).rejects.toThrow();
		expect(kept.read(heartbeatWebhooks.WEBHOOK_STORE_KEY)).toEqual({ webhookId: IDS.webhook });
	});
	test('dedupe ring is bounded', async () => {
		const store = memoryStore();
		for (let i = 0; i < heartbeatWebhooks.MAX_SEEN_KEYS + 10; i++) {
			await heartbeatWebhooks.isFirstDelivery({ store, key: `k${i}` });
		}
		const seenKeys = store.read(heartbeatWebhooks.SEEN_STORE_KEY);
		expect(Array.isArray(seenKeys) && seenKeys.length).toBe(heartbeatWebhooks.MAX_SEEN_KEYS);
		expect(store.read(heartbeatWebhooks.claimKeyOf('k0'))).toBeUndefined();
		expect(store.read(heartbeatWebhooks.claimKeyOf(`k${heartbeatWebhooks.MAX_SEEN_KEYS + 9}`))).toBeDefined();
		expect(await heartbeatWebhooks.isFirstDelivery({ store, key: 'k0' })).toBe(true);
		expect(await heartbeatWebhooks.isFirstDelivery({ store, key: 'k0' })).toBe(false);
	});
	test('claim keys stay short and are one entry per delivery', () => {
		const key = heartbeatWebhooks.claimKeyOf(`THREAD_CREATE:${IDS.thread}:${IDS.channel}`);
		expect(key.length).toBeLessThanOrEqual(48);
		expect(key).not.toBe(heartbeatWebhooks.claimKeyOf(`THREAD_CREATE:${IDS.thread}:${IDS.category}`));
	});
	test('two overlapping deliveries of one event emit once', async () => {
		const store = memoryStore();
		const [first, second] = await Promise.all([
			heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:a' }),
			heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:a' }),
		]);
		expect([first, second].filter(Boolean)).toHaveLength(1);
	});
	test('a store failure after claiming releases the claim so the retry emits', async () => {
		const store = memoryStore();
		const put = store.put;
		store.put = async (key, value) => {
			if (key === heartbeatWebhooks.SEEN_STORE_KEY) {
				throw new Error('store down');
			}
			return put(key, value);
		};
		await expect(heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:a' })).rejects.toThrow('store down');
		expect(store.read(heartbeatWebhooks.claimKeyOf('MENTION:a'))).toBeUndefined();
		store.put = put;
		expect(await heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:a' })).toBe(true);
	});
	test('an unfinished claim that could not be released expires, a finished one never does', async () => {
		vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
		const store = memoryStore();
		const put = store.put;
		store.put = async (key, value) => {
			if (key === heartbeatWebhooks.SEEN_STORE_KEY) {
				throw new Error('store down');
			}
			return put(key, value);
		};
		store.delete = async () => {
			throw new Error('store down');
		};
		await expect(heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:a' })).rejects.toThrow('store down');
		store.put = put;
		expect(await heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:a' })).toBe(false);
		vi.setSystemTime(Date.now() + heartbeatWebhooks.ABANDONED_CLAIM_MS + 1);
		expect(await heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:a' })).toBe(true);
		vi.setSystemTime(Date.now() + heartbeatWebhooks.ABANDONED_CLAIM_MS * 10);
		expect(await heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:a' })).toBe(false);
	});
	test('overlapping deliveries of different events both emit and keep each other', async () => {
		const store = memoryStore();
		const results = await Promise.all([
			heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:a' }),
			heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:b' }),
		]);
		expect(results).toEqual([true, true]);
		expect(await heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:a' })).toBe(false);
		expect(await heartbeatWebhooks.isFirstDelivery({ store, key: 'MENTION:b' })).toBe(false);
	});
});

describe('trigger filters', () => {
	test('new thread sends the channel filter', async () => {
		const seen = stubFetch((request) => (request.method === 'GET' ? { body: [] } : { body: { id: IDS.webhook } }));
		await hook({ trigger: newThreadTrigger, name: 'onEnable', context: triggerContext({ propsValue: { channelId: IDS.channel, includeMovedThreads: true } }) });
		expect(seen[1].body).toEqual({ action: { name: 'THREAD_CREATE', filter: { channelID: IDS.channel, triggerOnMove: true } }, url: WEBHOOK_URL });
	});
	test('new thread refuses moved threads without a channel', async () => {
		stubFetch(replies([{ body: [] }]));
		await expect(hook({ trigger: newThreadTrigger, name: 'onEnable', context: triggerContext({ propsValue: { includeMovedThreads: true } }) })).rejects.toThrow(/Channel ID/);
	});
	test('new mention builds userSelection and requires at least one target', async () => {
		const seen = stubFetch((request) => (request.method === 'GET' ? { body: [] } : { body: { id: IDS.webhook } }));
		await hook({ trigger: newMentionTrigger, name: 'onEnable', context: triggerContext({ propsValue: { userIds: [IDS.user], groupIds: [IDS.group], channelIds: [IDS.channel] } }) });
		expect(seen[1].body).toEqual({
			action: { name: 'MENTION', filter: { userSelection: [{ id: IDS.user, type: 'USER' }, { id: IDS.group, type: 'GROUP' }], channelIDs: [IDS.channel] } },
			url: WEBHOOK_URL,
		});
		await expect(hook({ trigger: newMentionTrigger, name: 'onEnable', context: triggerContext({ propsValue: {} }) })).rejects.toThrow(/at least one/);
	});
	test('new direct message requires the admin filter', async () => {
		const seen = stubFetch((request) => (request.method === 'GET' ? { body: [] } : { body: { id: IDS.webhook } }));
		await hook({ trigger: newDirectMessageTrigger, name: 'onEnable', context: triggerContext({ propsValue: { adminUserId: IDS.admin } }) });
		expect(seen[1].body).toEqual({ action: { name: 'DIRECT_MESSAGE', filter: { userID: IDS.admin } }, url: WEBHOOK_URL });
	});
});

describe('trigger runs re-fetch and dedupe', () => {
	test('new member emits the re-read user once', async () => {
		const store = memoryStore();
		const seen = stubFetch(replies([{ body: { id: IDS.user, email: 'a@x.io' } }]));
		const context = triggerContext({ store, body: { id: IDS.user, name: 'A', email: 'forged@x.io' } });
		expect(await hook({ trigger: newMemberTrigger, name: 'run', context })).toEqual([{ id: IDS.user, email: 'a@x.io' }]);
		expect(seen[0].path).toBe(`/users/${IDS.user}`);
		expect(seen[0].auth).toBe(`Bearer ${TOKEN}`);
		expect(await hook({ trigger: newMemberTrigger, name: 'run', context })).toEqual([]);
	});
	test('forged or non-UUID IDs emit nothing without calling the API', async () => {
		const seen = stubFetch(replies([{ body: {} }]));
		expect(await hook({ trigger: newEventTrigger, name: 'run', context: triggerContext({ body: { id: '../users' } }) })).toEqual([]);
		expect(await hook({ trigger: newMemberTrigger, name: 'run', context: triggerContext({ body: 'not json' }) })).toEqual([]);
		expect(seen).toHaveLength(0);
	});
	test('a 404 on re-fetch emits nothing; other errors throw', async () => {
		stubFetch(replies([{ status: 404, body: { message: 'Could not find event' } }]));
		expect(await hook({ trigger: newEventTrigger, name: 'run', context: triggerContext({ body: { id: IDS.event } }) })).toEqual([]);
		vi.unstubAllGlobals();
		stubFetch(replies([{ status: 500, body: { message: 'down' } }]));
		await expect(hook({ trigger: newEventTrigger, name: 'run', context: triggerContext({ body: { id: IDS.event } }) })).rejects.toThrow(/down/);
	});
	test('new event accepts a JSON string body', async () => {
		stubFetch(replies([{ body: { id: IDS.event } }]));
		expect(await hook({ trigger: newEventTrigger, name: 'run', context: triggerContext({ body: JSON.stringify({ id: IDS.event }) }) })).toEqual([{ id: IDS.event }]);
	});
	test('new thread dedupes per thread and channel', async () => {
		const store = memoryStore();
		stubFetch(replies([{ body: { id: IDS.thread, channelID: IDS.channel } }]));
		const context = triggerContext({ store, body: { id: IDS.thread, channelID: IDS.channel } });
		expect(await hook({ trigger: newThreadTrigger, name: 'run', context })).toHaveLength(1);
		expect(await hook({ trigger: newThreadTrigger, name: 'run', context })).toHaveLength(0);
	});
	const mentionOf = ({ id, kind = 'user' }: { id: string; kind?: string }) => `<p>Hi <span class="reference" data-denotation-char="@" data-id="mention.${kind}.${id}" data-value="X">@X</span></p>`;
	test('new mention picks the nested comment and reads mentions from its stored content', async () => {
		const reply = { id: IDS.comment, userID: IDS.user, content: mentionOf({ id: IDS.user }) };
		stubFetch(replies([{ body: { id: IDS.thread, channelID: IDS.channel, userID: IDS.admin, url: 'u', comments: [{ id: 'c0', children: [reply] }] } }]));
		const events = await hook({ trigger: newMentionTrigger, name: 'run', context: triggerContext({ propsValue: { userIds: [IDS.user] }, body: { mentionedUsers: [{ id: IDS.admin, type: 'USER' }], userID: IDS.user, source: { type: 'COMMENT', channelID: IDS.channel, threadID: IDS.thread, commentID: IDS.comment } } }) });
		expect(events).toHaveLength(1);
		const event = Array.isArray(events) ? events[0] : undefined;
		expect(event).toMatchObject({ sourceType: 'COMMENT', commentId: IDS.comment, authorUserId: IDS.user, content: reply.content, thread: { id: IDS.thread } });
		expect(event).toHaveProperty('mentionedUsers', [{ id: IDS.user, type: 'USER' }]);
		expect(event).not.toHaveProperty('thread.comments');
	});
	test('new mention ignores supplied member IDs that the stored content does not mention', async () => {
		stubFetch(replies([{ body: { id: IDS.thread, channelID: IDS.channel, content: '<p>no mentions here</p>', comments: [] } }]));
		const context = triggerContext({ propsValue: { userIds: [IDS.user] }, body: { mentionedUsers: [{ id: IDS.user, type: 'USER' }], source: { threadID: IDS.thread } } });
		expect(await hook({ trigger: newMentionTrigger, name: 'run', context })).toEqual([]);
	});
	test('new mention ignores mentions of members or groups that were not chosen', async () => {
		stubFetch(replies([{ body: { id: IDS.thread, channelID: IDS.channel, content: mentionOf({ id: IDS.admin }) + mentionOf({ id: IDS.role, kind: 'group' }), comments: [] } }]));
		const context = triggerContext({ propsValue: { userIds: [IDS.user], groupIds: [IDS.group] }, body: { source: { threadID: IDS.thread } } });
		expect(await hook({ trigger: newMentionTrigger, name: 'run', context })).toEqual([]);
	});
	test('new mention matches a chosen group and honours the channel filter', async () => {
		const thread = { id: IDS.thread, channelID: IDS.channel, content: mentionOf({ id: IDS.group, kind: 'group' }), comments: [] };
		stubFetch(replies([{ body: thread }]));
		const events = await hook({ trigger: newMentionTrigger, name: 'run', context: triggerContext({ propsValue: { groupIds: [IDS.group], channelIds: [IDS.channel] }, body: { source: { threadID: IDS.thread } } }) });
		expect(events).toMatchObject([{ sourceType: 'THREAD', mentionedUsers: [{ id: IDS.group, type: 'GROUP' }] }]);
		const otherChannel = triggerContext({ propsValue: { groupIds: [IDS.group], channelIds: [IDS.category] }, body: { source: { threadID: IDS.thread } } });
		expect(await hook({ trigger: newMentionTrigger, name: 'run', context: otherChannel })).toEqual([]);
	});
	test('new mention ignores a comment ID that is not in the thread', async () => {
		stubFetch(replies([{ body: { id: IDS.thread, comments: [] } }]));
		expect(await hook({ trigger: newMentionTrigger, name: 'run', context: triggerContext({ propsValue: { userIds: [IDS.user] }, body: { source: { threadID: IDS.thread, commentID: IDS.comment } } }) })).toEqual([]);
	});
	test('new direct message takes sender from the stored message and receiver from the chosen admin', async () => {
		const seen = stubFetch(replies([{ body: [{ id: 'x', userID: IDS.admin }, { id: IDS.message, userID: IDS.user, content: '<p>hi</p>', createdAt: 't' }] }]));
		const result = await hook({ trigger: newDirectMessageTrigger, name: 'run', context: triggerContext({ propsValue: { adminUserId: IDS.admin }, body: { senderUserID: IDS.group, receiverUserID: IDS.role, chatID: IDS.chat, chatMessageID: IDS.message } }) });
		expect(seen.map((r) => r.path)).toEqual([`/directMessages/${IDS.chat}`]);
		expect(result).toEqual([{ chatId: IDS.chat, messageId: IDS.message, senderUserId: IDS.user, receiverUserId: IDS.admin, content: '<p>hi</p>', createdAt: 't', images: [], files: [] }]);
	});
	test('new direct message confirms the chat ID with Heartbeat when the admin has not written in it yet', async () => {
		const seen = stubFetch((request) => (request.method === 'PUT' ? { body: { chatID: IDS.chat } } : { body: [{ id: IDS.message, userID: IDS.user }] }));
		const context = triggerContext({ propsValue: { adminUserId: IDS.admin }, body: { chatID: IDS.chat, chatMessageID: IDS.message } });
		expect(await hook({ trigger: newDirectMessageTrigger, name: 'run', context })).toMatchObject([{ senderUserId: IDS.user, receiverUserId: IDS.admin }]);
		expect(seen[1]).toMatchObject({ method: 'PUT', path: '/directChats', body: { userID1: IDS.admin, userID2: IDS.user } });
	});
	test('new direct message ignores a sender-only chat that belongs to another admin', async () => {
		stubFetch((request) => (request.method === 'PUT' ? { body: { chatID: IDS.thread } } : { body: [{ id: IDS.message, userID: IDS.user }] }));
		const context = triggerContext({ propsValue: { adminUserId: IDS.admin }, body: { chatID: IDS.chat, chatMessageID: IDS.message } });
		expect(await hook({ trigger: newDirectMessageTrigger, name: 'run', context })).toEqual([]);
	});
	test('new direct message ignores chats where someone other than the admin and sender wrote', async () => {
		const seen = stubFetch(replies([{ body: [{ id: 'x', userID: IDS.group }, { id: IDS.message, userID: IDS.user }] }]));
		const context = triggerContext({ propsValue: { adminUserId: IDS.admin }, body: { chatID: IDS.chat, chatMessageID: IDS.message } });
		expect(await hook({ trigger: newDirectMessageTrigger, name: 'run', context })).toEqual([]);
		expect(seen.map((request) => request.method)).toEqual(['GET']);
	});
	test('new direct message ignores messages the admin sent', async () => {
		stubFetch(replies([{ body: [{ id: IDS.message, userID: IDS.admin }] }]));
		const context = triggerContext({ propsValue: { adminUserId: IDS.admin }, body: { chatID: IDS.chat, chatMessageID: IDS.message } });
		expect(await hook({ trigger: newDirectMessageTrigger, name: 'run', context })).toEqual([]);
	});
	test('new direct message drops unknown message IDs', async () => {
		stubFetch(replies([{ body: [{ id: 'x' }] }]));
		expect(await hook({ trigger: newDirectMessageTrigger, name: 'run', context: triggerContext({ propsValue: { adminUserId: IDS.admin }, body: { chatID: IDS.chat, chatMessageID: IDS.message } }) })).toEqual([]);
	});
});

describe('trigger test()', () => {
	test('new member returns newest members first', async () => {
		stubFetch(replies([{ body: [{ id: 'a', createdAt: '2026-01-01' }, { id: 'b', createdAt: '2026-02-01' }] }]));
		expect(await hook({ trigger: newMemberTrigger, name: 'test', context: triggerContext({}) })).toEqual([{ id: 'b', createdAt: '2026-02-01' }, { id: 'a', createdAt: '2026-01-01' }]);
	});
	test('new event returns newest events first', async () => {
		stubFetch(replies([{ body: [{ id: 'a', createdAt: '2026-01-01' }, { id: 'b', createdAt: '2026-02-01' }] }]));
		expect(await hook({ trigger: newEventTrigger, name: 'test', context: triggerContext({}) })).toMatchObject([{ id: 'b' }, { id: 'a' }]);
	});
	test('new thread walks posts channels until it finds threads', async () => {
		const seen = stubFetch((request) => {
			if (request.path === '/channels') {
				return { body: [{ id: 'c1', type: 'POSTS' }, { id: 'c2', type: 'CHAT' }, { id: 'c3', type: 'POSTS' }] };
			}
			return request.path === '/channels/c1/threads' ? { body: [] } : { body: [{ id: IDS.thread }] };
		});
		expect(await hook({ trigger: newThreadTrigger, name: 'test', context: triggerContext({}) })).toEqual([{ id: IDS.thread }]);
		expect(seen.map((r) => r.path)).toEqual(['/channels', '/channels/c1/threads', '/channels/c3/threads']);
	});
});
