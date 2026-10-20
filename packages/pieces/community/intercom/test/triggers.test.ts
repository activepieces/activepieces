import crypto from 'node:crypto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { intercom } from '../src/index';
import { leadConvertedToUserTrigger } from '../src/lib/triggers/lead-converted-to-user';
import { conversationAssigned } from '../src/lib/triggers/conversation-assigned';
import { replyFromUser } from '../src/lib/triggers/reply-from-user';
import { newTicketTrigger } from '../src/lib/triggers/new-ticket';
import { updatedTicketTrigger } from '../src/lib/triggers/updated-ticket';
import { callWith, customAuth, ME, stubIntercom } from './helpers';

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Lead Converted To User (P1-3)', () => {
	test('listens to contact.lead.signed_up and keeps contact.merged', async () => {
		stubIntercom([{ method: 'GET', path: '/me', reply: { body: ME } }]);
		const createListeners = vi.fn();
		await callWith({ fn: leadConvertedToUserTrigger.onEnable, ctx: { auth: customAuth(), app: { createListeners } } });
		expect(createListeners).toHaveBeenCalledWith({
			events: ['contact.lead.signed_up', 'contact.merged'],
			identifierValue: 'app1',
		});
	});
});

describe('envelope triggers', () => {
	test('test() wraps recent conversations in the webhook envelope shape run() returns', async () => {
		stubIntercom([
			{ method: 'GET', path: '/conversations', reply: { body: { conversations: [{ id: '1' }, { id: '2' }] } } },
			{ method: 'GET', path: /^\/conversations\/\d+$/, reply: (request) => ({ body: { type: 'conversation', id: request.path.split('/')[2] } }) },
		]);
		const samples: unknown = await callWith({ fn: conversationAssigned.test, ctx: { auth: customAuth() } });
		if (!Array.isArray(samples)) {
			throw new Error('expected an array of samples');
		}
		expect(samples).toHaveLength(2);
		expect(samples[0]).toMatchObject({
			type: 'notification_event',
			topic: 'conversation.admin.assigned',
			data: { type: 'notification_event_data', item: { type: 'conversation', id: '1' } },
		});
		const live = { topic: 'conversation.user.replied', data: { item: { id: '5' } } };
		expect(await callWith({ fn: replyFromUser.run, ctx: { payload: { body: live } } })).toEqual([live]);
	});

	test('every trigger has sampleData and READ classification', () => {
		for (const trigger of Object.values(intercom.triggers())) {
			expect(trigger.sampleData, trigger.name).toBeDefined();
			expect(trigger.classification, trigger.name).toBe('READ');
		}
	});
});

describe('webhook signature verify', () => {
	const rawBody = JSON.stringify({ topic: 'contact.user.created', app_id: 'app1', id: 'n1' });
	const sign = (secret: string) => `sha1=${crypto.createHmac('sha1', secret).update(rawBody).digest('hex')}`;
	const verify = ({ headers, webhookSecret }: { headers: Record<string, unknown>; webhookSecret: unknown }) => {
		const verifyHook = intercom.events?.verify;
		if (verifyHook === undefined) {
			throw new Error('verify is not defined');
		}
		return callWith({
			fn: verifyHook,
			ctx: {
				payload: { headers, body: JSON.parse(rawBody), rawBody, method: 'POST', queryParams: {} },
				webhookSecret,
				appWebhookUrl: '',
			},
		});
	};

	test('accepts the right signature with a single secret or a per-app map', () => {
		expect(verify({ headers: { 'x-hub-signature': sign('s3cret') }, webhookSecret: 's3cret' })).toBe(true);
		expect(verify({ headers: { 'x-hub-signature': sign('per-app') }, webhookSecret: { app1: 'per-app' } })).toBe(true);
	});

	test('rejects a wrong, missing, array or differently sized signature, and unknown apps', () => {
		expect(verify({ headers: { 'x-hub-signature': sign('other') }, webhookSecret: 's3cret' })).toBe(false);
		expect(verify({ headers: {}, webhookSecret: 's3cret' })).toBe(false);
		expect(verify({ headers: { 'x-hub-signature': [sign('s3cret')] }, webhookSecret: 's3cret' })).toBe(false);
		expect(verify({ headers: { 'x-hub-signature': 'sha1=abc' }, webhookSecret: 's3cret' })).toBe(false);
		expect(verify({ headers: { 'x-hub-signature': sign('per-app') }, webhookSecret: { other: 'per-app' } })).toBe(false);
		expect(verify({ headers: { 'x-hub-signature': sign('per-app') }, webhookSecret: { toString: 'per-app' } })).toBe(false);
	});
});

describe('action metadata', () => {
	test('every action has audience, classification and aiMetadata; counts match the plan', () => {
		const actions = Object.values(intercom.actions()).filter((action) => action.name !== 'custom_api_call');
		const counts: Record<string, number> = {};
		for (const action of actions) {
			expect(action.audience, action.name).toBeDefined();
			expect(action.classification, action.name).toBeDefined();
			expect(action.aiMetadata?.description, action.name).toBeTruthy();
			expect(typeof action.aiMetadata?.idempotent, action.name).toBe('boolean');
			expect(action.outputSchema, action.name).toBeDefined();
			counts[action.audience ?? 'none'] = (counts[action.audience ?? 'none'] ?? 0) + 1;
		}
		expect(counts).toEqual({ ai: 31, both: 9, human: 16 });
	});
});

describe('ticket triggers', () => {
	test.each([
		['new ticket', newTicketTrigger],
		['updated ticket', updatedTicketTrigger],
	])('%s test() returns tickets in the webhook ticket_state shape', async (_name, trigger) => {
		stubIntercom([
			{
				method: 'POST',
				path: '/tickets/search',
				reply: {
					body: {
						type: 'ticket.list',
						tickets: [
							{
								type: 'ticket',
								id: '7',
								ticket_state: 'in_progress',
								ticket_state_internal_label: 'In progress',
								ticket_state_external_label: 'Being worked on',
							},
						],
						total_count: 1,
						pages: { type: 'pages', page: 1, per_page: 5, total_pages: 1 },
					},
				},
			},
		]);
		const samples: unknown = await callWith({ fn: trigger.test, ctx: { auth: customAuth() } });
		if (!Array.isArray(samples)) {
			throw new Error('expected an array of samples');
		}
		expect(samples[0]).toEqual({
			type: 'ticket',
			id: '7',
			ticket_state: {
				type: 'ticket_state',
				category: 'in_progress',
				internal_label: 'In progress',
				external_label: 'Being worked on',
			},
		});
	});
});
