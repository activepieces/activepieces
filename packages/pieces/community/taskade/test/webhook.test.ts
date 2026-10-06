import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { taskadeWebhook } from '../src/lib/common/webhook';
import { commentCreatedTrigger } from '../src/lib/triggers/comment-created';
import { projectAssignedTrigger } from '../src/lib/triggers/project-assigned';
import { projectCreatedTrigger } from '../src/lib/triggers/project-created';
import { projectJoinedTrigger } from '../src/lib/triggers/project-joined';
import { taskAssignedTrigger } from '../src/lib/triggers/task-assigned';
import { taskDueTrigger } from '../src/lib/triggers/task-due';
import { memoryStore, MemoryStore, runStep, stubFetch, taskadeConnection } from './helpers';

const SECRET = 'whsec-test';
const HOOK_URL = 'https://cloud.example.com/api/v1/webhooks/flow1';
const REGISTERED = { ok: true, webhook: { id: HOOK_URL, url: HOOK_URL, events: ['task.due'], spaceIds: [], createdAt: '2026-10-06T00:00:00Z' }, secret: SECRET };

function context({ store, propsValue = {}, payload }: { store: MemoryStore; propsValue?: Record<string, unknown>; payload?: unknown }) {
	return { auth: taskadeConnection(), propsValue, store, webhookUrl: HOOK_URL, payload };
}

function call<T>({ fn, ctx }: { fn: (ctx: never) => Promise<T>; ctx: unknown }): Promise<T> {
	return runStep(Reflect.apply(fn, taskDueTrigger, [ctx]));
}

function delivery({ body = { id: 't1', text: 'Due' }, secret = SECRET, header = 'X-Taskade-Signature' }: { body?: unknown; secret?: string; header?: string } = {}) {
	const raw = JSON.stringify(body);
	return { body, rawBody: raw, headers: { [header]: taskadeWebhook.sign({ secret, body: raw }) } };
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('signature', () => {
	test('accepts the documented sha256= hex HMAC of the raw body, any header case', () => {
		const d = delivery({ header: 'x-taskade-signature' });
		expect(taskadeWebhook.verifySignature({ secret: SECRET, headers: d.headers, rawBody: d.rawBody })).toBe(true);
		expect(taskadeWebhook.verifySignature({ secret: SECRET, headers: d.headers, rawBody: Buffer.from(d.rawBody) })).toBe(true);
	});
	test('rejects wrong secret, tampered body, missing header, missing raw body and length mismatch', () => {
		const d = delivery();
		expect(taskadeWebhook.verifySignature({ secret: 'other', headers: d.headers, rawBody: d.rawBody })).toBe(false);
		expect(taskadeWebhook.verifySignature({ secret: SECRET, headers: d.headers, rawBody: `${d.rawBody} ` })).toBe(false);
		expect(taskadeWebhook.verifySignature({ secret: SECRET, headers: {}, rawBody: d.rawBody })).toBe(false);
		expect(taskadeWebhook.verifySignature({ secret: SECRET, headers: d.headers, rawBody: undefined })).toBe(false);
		expect(taskadeWebhook.verifySignature({ secret: SECRET, headers: { 'X-Taskade-Signature': 'sha256=abc' }, rawBody: d.rawBody })).toBe(false);
	});
	test('dedupe list is bounded', () => {
		const many = Array.from({ length: taskadeWebhook.MAX_SEEN }, (_, i) => `k${i}`);
		const next = taskadeWebhook.remember({ seen: many, key: 'new' });
		expect(next.duplicate).toBe(false);
		expect(next.seen).toHaveLength(taskadeWebhook.MAX_SEEN);
		expect(next.seen).not.toContain('k0');
		expect(taskadeWebhook.remember({ seen: next.seen, key: 'new' }).duplicate).toBe(true);
	});
});

describe('lifecycle', () => {
	test('onEnable registers the event for the chosen workspaces on v2 and stores id + secret', async () => {
		const seen = stubFetch(() => ({ body: REGISTERED }));
		const store = memoryStore();
		await call({ fn: taskDueTrigger.onEnable, ctx: context({ store, propsValue: { workspaceIds: ['W1', 'W1', ''] } }) });
		expect(seen[0].url).toBe('https://www.taskade.com/api/v2/webhooks');
		expect(seen[0].body).toEqual({ targetUrl: HOOK_URL, events: ['task.due'], spaceIds: ['W1'] });
		expect(store.read(taskadeWebhook.STORE_KEY)).toEqual({ id: HOOK_URL, secret: SECRET });
	});
	test('onEnable explains the Pro plan requirement on 402', async () => {
		stubFetch(() => ({ status: 402, body: { ok: false, code: 'PAYMENT_REQUIRED', message: 'Webhooks require a Pro plan or higher.' } }));
		await expect(call({ fn: taskDueTrigger.onEnable, ctx: context({ store: memoryStore() }) })).rejects.toThrow('Pro plan');
	});
	test('onEnable on 409 deletes the old registration for this URL and registers again', async () => {
		const seen = stubFetch((_request, index) => (index === 0 ? { status: 409, body: { ok: false } } : index === 1 ? { body: { ok: true, deleted: true } } : { body: REGISTERED }));
		await call({ fn: taskDueTrigger.onEnable, ctx: context({ store: memoryStore() }) });
		expect(seen.map((r) => r.method)).toEqual(['POST', 'DELETE', 'POST']);
		expect(seen[1].url).toBe(`https://www.taskade.com/api/v2/webhooks/${encodeURIComponent(HOOK_URL)}`);
	});
	test('onEnable deletes the webhook it created when store.put fails', async () => {
		const seen = stubFetch((request) => (request.method === 'POST' ? { body: REGISTERED } : { body: { ok: true, deleted: true } }));
		const store = memoryStore();
		store.put = async () => {
			throw new Error('store down');
		};
		await expect(call({ fn: taskDueTrigger.onEnable, ctx: context({ store }) })).rejects.toThrow('store down');
		expect(seen.map((r) => r.method)).toEqual(['POST', 'DELETE']);
	});
	test('onEnable fails when Taskade returns no secret', async () => {
		stubFetch(() => ({ body: { ok: true, webhook: { id: HOOK_URL } } }));
		await expect(call({ fn: taskDueTrigger.onEnable, ctx: context({ store: memoryStore() }) })).rejects.toThrow('signing secret');
	});
	test('onDisable deletes by encoded id and forgets state; 404 counts as deleted', async () => {
		const seen = stubFetch(() => ({ status: 404, body: { ok: false } }));
		const store = memoryStore({ [taskadeWebhook.STORE_KEY]: { id: HOOK_URL, secret: SECRET }, [taskadeWebhook.SEEN_KEY]: ['a'] });
		await call({ fn: taskDueTrigger.onDisable, ctx: context({ store }) });
		expect(seen[0].method).toBe('DELETE');
		expect(seen[0].path).toBe(`/webhooks/${encodeURIComponent(HOOK_URL)}`);
		expect(store.read(taskadeWebhook.STORE_KEY)).toBeUndefined();
		expect(store.read(taskadeWebhook.SEEN_KEY)).toBeUndefined();
	});
	test('onDisable keeps the stored id when the delete fails', async () => {
		stubFetch(() => ({ status: 500, body: { ok: false, message: 'boom' } }));
		const store = memoryStore({ [taskadeWebhook.STORE_KEY]: { id: HOOK_URL, secret: SECRET } });
		await expect(call({ fn: taskDueTrigger.onDisable, ctx: context({ store }) })).rejects.toThrow('boom');
		expect(store.read(taskadeWebhook.STORE_KEY)).toEqual({ id: HOOK_URL, secret: SECRET });
	});
});

describe('run', () => {
	function storeWithSecret() {
		return memoryStore({ [taskadeWebhook.STORE_KEY]: { id: HOOK_URL, secret: SECRET } });
	}
	test('emits a correctly signed delivery once, drops the retry', async () => {
		const store = storeWithSecret();
		const payload = delivery();
		await expect(call({ fn: taskDueTrigger.run, ctx: context({ store, payload }) })).resolves.toEqual([payload.body]);
		await expect(call({ fn: taskDueTrigger.run, ctx: context({ store, payload }) })).resolves.toEqual([]);
	});
	test('drops unsigned, badly signed and raw-body-less deliveries', async () => {
		const store = storeWithSecret();
		const good = delivery();
		await expect(call({ fn: taskDueTrigger.run, ctx: context({ store, payload: { ...good, headers: {} } }) })).resolves.toEqual([]);
		await expect(call({ fn: taskDueTrigger.run, ctx: context({ store, payload: delivery({ secret: 'wrong' }) }) })).resolves.toEqual([]);
		await expect(call({ fn: taskDueTrigger.run, ctx: context({ store, payload: { ...good, rawBody: undefined } }) })).resolves.toEqual([]);
	});
	test('without a stored registration nothing is emitted', async () => {
		await expect(call({ fn: taskDueTrigger.run, ctx: context({ store: memoryStore(), payload: delivery() }) })).resolves.toEqual([]);
	});
});

describe('trigger definitions', () => {
	test.each([
		[taskDueTrigger, 'task_due'],
		[taskAssignedTrigger, 'task_assigned'],
		[commentCreatedTrigger, 'comment_created'],
		[projectCreatedTrigger, 'project_created'],
		[projectAssignedTrigger, 'project_assigned'],
		[projectJoinedTrigger, 'project_joined'],
	])('%s has sample data and an output schema covering its keys', (trigger, name) => {
		expect(trigger.name).toBe(name);
		const keys = (trigger.outputSchema?.fields ?? []).map((field) => field.key);
		expect(Object.keys(trigger.sampleData ?? {}).sort()).toEqual([...keys].sort());
	});
	test('each trigger registers its own event', async () => {
		const pairs: Array<[typeof taskDueTrigger, string]> = [
			[taskAssignedTrigger, 'task.assigned'],
			[commentCreatedTrigger, 'comment.created'],
			[projectCreatedTrigger, 'project.created'],
			[projectAssignedTrigger, 'project.assigned'],
			[projectJoinedTrigger, 'project.joined'],
		];
		for (const [trigger, event] of pairs) {
			const seen = stubFetch(() => ({ body: REGISTERED }));
			await runStep(Reflect.apply(trigger.onEnable, trigger, [context({ store: memoryStore() })]));
			expect(seen[0].body).toMatchObject({ events: [event], spaceIds: [] });
		}
	});
});
