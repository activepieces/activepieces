import { isNil } from '@activepieces/pieces-framework';
import { apiKeyOf, beehiivClient, isNotFound, isRecord, pathFor } from './client';

async function enable({
	auth,
	publicationId,
	webhookUrl,
	eventTypes,
	description,
	store,
	storeKey,
}: {
	auth: unknown;
	publicationId: string;
	webhookUrl: string;
	eventTypes: string[];
	description: string;
	store: WebhookStore;
	storeKey: string;
}): Promise<void> {
	const apiKey = apiKeyOf(auth);
	const response = await beehiivClient.request({
		apiKey,
		method: 'POST',
		path: `${pathFor(['publications', publicationId])}/webhooks`,
		operation: 'create webhook',
		body: { url: webhookUrl, event_types: eventTypes, description },
	});
	const data = isRecord(response.body) && isRecord(response.body['data']) ? response.body['data'] : undefined;
	const webhookId = data !== undefined && typeof data['id'] === 'string' ? data['id'] : undefined;
	if (webhookId === undefined) {
		throw new Error('beehiiv did not return a webhook ID; the trigger was not enabled.');
	}
	try {
		await store.put(storeKey, webhookId);
	} catch (error) {
		await removeWebhook({ apiKey, publicationId, webhookId }).catch(() => undefined);
		throw error;
	}
}

async function disable({
	auth,
	publicationId,
	store,
	storeKey,
}: {
	auth: unknown;
	publicationId: string;
	store: WebhookStore;
	storeKey: string;
}): Promise<void> {
	const webhookId = await store.get<string>(storeKey);
	if (isNil(webhookId) || webhookId === '') {
		return;
	}
	await removeWebhook({ apiKey: apiKeyOf(auth), publicationId, webhookId });
	await store.delete(storeKey);
}

async function removeWebhook({ apiKey, publicationId, webhookId }: { apiKey: string; publicationId: string; webhookId: string }): Promise<void> {
	try {
		await beehiivClient.request({
			apiKey,
			method: 'DELETE',
			path: pathFor(['publications', publicationId, 'webhooks', webhookId]),
			operation: 'delete webhook',
		});
	} catch (error) {
		if (!isNotFound(error)) {
			throw error;
		}
	}
}

async function eventsFrom({
	body,
	headers,
	store,
	storeKey,
}: {
	body: unknown;
	headers: Record<string, string> | undefined;
	store: WebhookStore;
	storeKey: string;
}): Promise<Record<string, unknown>[]> {
	const payload = typeof body === 'string' ? parsePayload(body) : body;
	if (!isRecord(payload) || !isRecord(payload['data'])) {
		return [];
	}
	const eventId = typeof payload['uid'] === 'string' && payload['uid'] !== '' ? payload['uid'] : headerValue({ headers, name: 'svix-id' });
	if (eventId === undefined) {
		return [payload['data']];
	}
	const dedupeKey = `${storeKey}-seen-events`;
	const seen = (await store.get<string[]>(dedupeKey)) ?? [];
	if (seen.includes(eventId)) {
		return [];
	}
	await store.put(dedupeKey, [...seen, eventId].slice(-MAX_SEEN_EVENTS));
	return [payload['data']];
}

function parsePayload(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return undefined;
	}
}

function headerValue({ headers, name }: { headers: Record<string, string> | undefined; name: string }): string | undefined {
	if (headers === undefined) {
		return undefined;
	}
	const match = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
	return match !== undefined && match[1] !== '' ? match[1] : undefined;
}

const MAX_SEEN_EVENTS = 200;

export const beehiivWebhook = {
	enable,
	disable,
	eventsFrom,
};

export type WebhookStore = {
	put: <T>(key: string, value: T) => Promise<T>;
	get: <T>(key: string) => Promise<T | null>;
	delete: (key: string) => Promise<void>;
};
