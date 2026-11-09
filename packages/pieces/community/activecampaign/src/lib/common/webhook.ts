import { createHash } from 'crypto';
import { Store } from '@activepieces/pieces-framework';
import { ActiveCampaignApiError, ActiveCampaignClient, ClientAuth } from './client';
import { DEDUPE_MAX_ENTRIES, DEDUPE_WINDOW_MS, WEBHOOK_SOURCES } from './constants';
import { CreateWebhookResponse, acData } from './types';

async function enable({ auth, store, storeKey, webhookUrl, hookName, events }: EnableParams): Promise<void> {
	const client = new ActiveCampaignClient(auth);
	const res = await client.subscribeWebhook({ name: hookName, url: webhookUrl, events, sources: WEBHOOK_SOURCES });
	try {
		await store.put<CreateWebhookResponse>(storeKey, res);
	} catch (storeError) {
		const storeMessage = storeError instanceof Error ? storeError.message : String(storeError);
		try {
			await client.unsubscribeWebhook(res.webhook.id);
		} catch (cleanupError) {
			const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
			throw new Error(
				`Saving the ActiveCampaign webhook failed (${storeMessage}) and removing webhook ${res.webhook.id} also failed (${cleanupMessage}). Delete it under Settings > Developer > Webhooks before publishing again.`,
			);
		}
		throw storeError;
	}
}

async function disable({ auth, store, storeKey }: DisableParams): Promise<void> {
	const webhook = await store.get<CreateWebhookResponse>(storeKey);
	const id = acData.textAt({ value: acData.recordAt({ value: webhook, key: 'webhook' }), key: 'id' });
	if (id === undefined) {
		return;
	}
	try {
		await new ActiveCampaignClient(auth).unsubscribeWebhook(id);
	} catch (error) {
		if (!(error instanceof ActiveCampaignApiError && error.status === 404)) {
			throw error;
		}
	}
	await store.delete(storeKey);
}

function parseBody(body: unknown): unknown {
	if (typeof body !== 'string') {
		return body;
	}
	try {
		const parsed: unknown = JSON.parse(body);
		return acData.isRecord(parsed) ? parsed : body;
	} catch {
		return body;
	}
}

function canonical(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => canonical(item));
	}
	if (acData.isRecord(value)) {
		return Object.keys(value)
			.sort()
			.map((key) => [key, canonical(value[key])]);
	}
	return value;
}

function dedupeKey(body: unknown): string | undefined {
	if (!acData.isRecord(body)) {
		return undefined;
	}
	const type = acData.textAt({ value: body, key: 'type' });
	const dateTime = acData.textAt({ value: body, key: 'date_time' });
	if (type === undefined || dateTime === undefined) {
		return undefined;
	}
	return createHash('sha256').update(JSON.stringify(canonical(body))).digest('hex').slice(0, 32);
}

async function run({ store, storeKey, body, now = Date.now() }: RunParams): Promise<unknown[]> {
	const payload = parseBody(body);
	const key = dedupeKey(payload);
	if (key === undefined) {
		return [payload];
	}
	const dedupeStoreKey = `${storeKey}_recent_deliveries`;
	const stored = await store.get<DedupeEntry[]>(dedupeStoreKey);
	const recent = (Array.isArray(stored) ? stored : []).filter((entry) => now - entry.at < DEDUPE_WINDOW_MS);
	if (recent.some((entry) => entry.key === key)) {
		return [];
	}
	await store.put<DedupeEntry[]>(dedupeStoreKey, [...recent, { key, at: now }].slice(-DEDUPE_MAX_ENTRIES));
	return [payload];
}

export const activeCampaignWebhook = { enable, disable, run, dedupeKey };

export type EnableParams = {
	auth: ClientAuth;
	store: Store;
	storeKey: string;
	webhookUrl: string;
	hookName: string;
	events: string[];
};

export type DisableParams = {
	auth: ClientAuth;
	store: Store;
	storeKey: string;
};

export type RunParams = {
	store: Store;
	storeKey: string;
	body: unknown;
	now?: number;
};

export type DedupeEntry = {
	key: string;
	at: number;
};
