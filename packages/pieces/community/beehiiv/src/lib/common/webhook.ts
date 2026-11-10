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
	if (!isNil(webhookId) && webhookId !== '') {
		await removeWebhook({ apiKey: apiKeyOf(auth), publicationId, webhookId });
		await store.delete(storeKey);
	}
	await store.delete(`${storeKey}-seen-events`);
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
	const slotKeys = DEDUPE_SEEDS.map((seed, index) => `${storeKey}-evt-${index}-${hashSlot({ value: eventId, seed })}`);
	const stored = await Promise.all(slotKeys.map((key) => store.get<string>(key)));
	if (stored.includes(eventId)) {
		return [];
	}
	await Promise.all(slotKeys.map((key) => store.put(key, eventId)));
	return [payload['data']];
}

function hashSlot({ value, seed }: { value: string; seed: number }): number {
	let hash = seed;
	for (let index = 0; index < value.length; index++) {
		hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
	}
	hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
	hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
	return ((hash ^ (hash >>> 16)) >>> 0) % DEDUPE_SLOTS;
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

const DEDUPE_SLOTS = 4096;
const DEDUPE_SEEDS = [2166136261, 3735928559];

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
