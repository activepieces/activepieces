import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { Property, Store, TestOrRunHookContext, TriggerHookContext, TriggerStrategy } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeApi } from './client';
import { taskadeDropdowns } from './props';

function verifySignature({ secret, headers, rawBody }: { secret: string; headers: Record<string, string | string[] | undefined>; rawBody: unknown }): boolean {
	const body = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : Buffer.isBuffer(rawBody) ? rawBody : undefined;
	if (body === undefined || secret.length === 0) {
		return false;
	}
	const header = Object.entries(headers).find(([name]) => name.toLowerCase() === SIGNATURE_HEADER)?.[1];
	const given = Array.isArray(header) ? header[0] : header;
	if (typeof given !== 'string' || given.length === 0) {
		return false;
	}
	const expected = Buffer.from(sign({ secret, body }), 'utf8');
	const received = Buffer.from(given.trim(), 'utf8');
	return expected.length === received.length && timingSafeEqual(expected, received);
}

function sign({ secret, body }: { secret: string; body: Buffer | string }): string {
	return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

async function registerWebhook({ token, targetUrl, event, spaceIds }: { token: string; targetUrl: string; event: TaskadeWebhookEvent; spaceIds: string[] }): Promise<{ id: string; secret: string }> {
	const create = () =>
		taskadeApi.request<{ ok: boolean; webhook?: { id?: string }; secret?: string }>({
			token,
			method: HttpMethod.POST,
			version: 'v2',
			path: '/webhooks',
			operation: 'register webhook',
			body: { targetUrl, events: [event], spaceIds },
		});
	const response = await create().catch(async (error: unknown) => {
		const status = taskadeApi.statusOf(error);
		if (status === 402) {
			throw new Error('Taskade webhooks need a Pro plan or above (HTTP 402). Upgrade the Taskade account, or use a scheduled flow with List Tasks instead.');
		}
		if (status !== 409) {
			throw error;
		}
		await deleteWebhook({ token, id: targetUrl });
		return create();
	});
	const id = response.webhook?.id;
	const secret = response.secret;
	if (typeof id !== 'string' || id.length === 0 || typeof secret !== 'string' || secret.length === 0) {
		throw new Error('Taskade registered the webhook but did not return its ID and signing secret. Disable and enable the flow again.');
	}
	return { id, secret };
}

async function deleteWebhook({ token, id }: { token: string; id: string }): Promise<void> {
	try {
		await taskadeApi.request({
			token,
			method: HttpMethod.DELETE,
			version: 'v2',
			path: `/webhooks/${encodeURIComponent(id)}`,
			operation: 'delete webhook',
		});
	} catch (error) {
		if (!taskadeApi.isNotFound(error)) {
			throw error;
		}
	}
}

async function saveRegistration({ store, token, registration }: { store: Store; token: string; registration: WebhookRegistration }): Promise<void> {
	try {
		await store.put<WebhookRegistration>(STORE_KEY, registration);
	} catch (error) {
		await deleteWebhook({ token, id: registration.id }).catch(() => undefined);
		throw error;
	}
}

function toSpaceIds(value: unknown): string[] {
	const list = Array.isArray(value) ? value : [];
	return [...new Set(list.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0).map((entry) => entry.trim()))];
}

const webhookTriggerProps = {
	workspaceIds: Property.MultiSelectDropdown({
		auth: taskadeAuth,
		displayName: 'Workspaces',
		description: 'Only fire for events in these workspaces. Leave empty for all workspaces.',
		required: false,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return { disabled: true, options: [], placeholder: 'Please connect account first.' };
			}
			try {
				const response = await taskadeDropdowns.listWorkspaces(auth.secret_text);
				return { disabled: false, options: response.items.map((workspace) => ({ label: workspace.name, value: workspace.id })) };
			} catch (error) {
				return { disabled: true, options: [], placeholder: taskadeDropdowns.dropdownErrorMessage(error) };
			}
		},
	}),
};

function webhookTriggerHooks(event: TaskadeWebhookEvent) {
	return {
		async onEnable(context: WebhookHookContext): Promise<void> {
			const token = context.auth.secret_text;
			const registration = await registerWebhook({
				token,
				targetUrl: context.webhookUrl,
				event,
				spaceIds: toSpaceIds(context.propsValue.workspaceIds),
			});
			await saveRegistration({ store: context.store, token, registration });
		},
		async onDisable(context: WebhookHookContext): Promise<void> {
			const registration = await context.store.get<WebhookRegistration>(STORE_KEY);
			if (registration?.id) {
				await deleteWebhook({ token: context.auth.secret_text, id: registration.id });
			}
			await context.store.delete(STORE_KEY);
		},
		async run(context: WebhookRunContext): Promise<unknown[]> {
			const registration = await context.store.get<WebhookRegistration>(STORE_KEY);
			if (!registration?.secret) {
				return [];
			}
			const valid = verifySignature({ secret: registration.secret, headers: context.payload.headers ?? {}, rawBody: context.payload.rawBody });
			if (!valid) {
				return [];
			}
			return [context.payload.body];
		},
	};
}

const SIGNATURE_HEADER = 'x-taskade-signature';
const STORE_KEY = 'taskade_webhook';

export const taskadeWebhook = {
	verifySignature,
	sign,
	registerWebhook,
	deleteWebhook,
	webhookTriggerProps,
	webhookTriggerHooks,
	STORE_KEY,
};

type WebhookRegistration = { id: string; secret: string };

export type TaskadeWebhookEvent = 'task.due' | 'task.assigned' | 'comment.created' | 'project.created' | 'project.assigned' | 'project.joined';

type WebhookHookContext = TriggerHookContext<typeof taskadeAuth, typeof webhookTriggerProps, TriggerStrategy.WEBHOOK>;

type WebhookRunContext = TestOrRunHookContext<typeof taskadeAuth, typeof webhookTriggerProps, TriggerStrategy.WEBHOOK>;
