import { HttpMethod } from '@activepieces/pieces-common';
import { API_ENDPOINTS } from './constants';
import { smartSuiteClient, SmartSuiteCredentials } from './client';

const EVENTS_PAGE_SIZE = 50;
const MAX_EVENT_PAGES = 20;
const MAX_SEEN_EVENT_IDS = 500;
const RECENT_RECORDS_LIMIT = 5;

async function createWebhook({
	credentials,
	solutionId,
	tableId,
	kind,
	webhookUrl,
}: {
	credentials: SmartSuiteCredentials;
	solutionId: string;
	tableId: string;
	kind: string;
	webhookUrl: string;
}): Promise<string> {
	const response = await smartSuiteClient.request<{ webhook?: { webhook_id?: string } }>({
		credentials,
		api: 'webhooks',
		method: HttpMethod.POST,
		path: API_ENDPOINTS.CREATE_WEBHOOK,
		body: {
			webhook: {
				filter: { applications: { application_ids: [tableId] } },
				kinds: [kind],
				locator: { account_id: credentials.accountId.trim(), solution_id: solutionId },
				notification_status: { enabled: { url: webhookUrl } },
			},
		},
		operation: 'create webhook',
	});
	const webhookId = response?.webhook?.webhook_id;
	if (typeof webhookId !== 'string' || webhookId.length === 0) {
		throw new Error('SmartSuite created the webhook but returned no webhook ID.');
	}
	return webhookId;
}

async function deleteWebhook({ credentials, webhookId }: { credentials: SmartSuiteCredentials; webhookId: string }): Promise<void> {
	try {
		await smartSuiteClient.request<unknown>({
			credentials,
			api: 'webhooks',
			method: HttpMethod.POST,
			path: API_ENDPOINTS.DELETE_WEBHOOK,
			body: { webhook_id: webhookId },
			operation: 'delete webhook',
		});
	} catch (error) {
		if (smartSuiteClient.statusOf(error) !== 404) {
			throw error;
		}
	}
}

async function enable({
	credentials,
	store,
	storeKey,
	solutionId,
	tableId,
	kind,
	webhookUrl,
}: {
	credentials: SmartSuiteCredentials;
	store: TriggerStore;
	storeKey: string;
	solutionId: string;
	tableId: string;
	kind: string;
	webhookUrl: string;
}): Promise<void> {
	const webhookId = await createWebhook({ credentials, solutionId, tableId, kind, webhookUrl });
	try {
		await store.put(storeKey, webhookId);
		await store.put(PAGE_TOKEN_KEY, '');
		await store.put(SEEN_EVENTS_KEY, []);
	} catch (error) {
		await deleteWebhook({ credentials, webhookId }).catch(() => undefined);
		throw error;
	}
}

async function disable({ credentials, store, storeKey }: { credentials: SmartSuiteCredentials; store: TriggerStore; storeKey: string }): Promise<void> {
	const webhookId = await store.get<string>(storeKey);
	if (typeof webhookId === 'string' && webhookId.length > 0) {
		await deleteWebhook({ credentials, webhookId });
	}
	await store.delete(storeKey);
	await store.delete(PAGE_TOKEN_KEY);
	await store.delete(SEEN_EVENTS_KEY);
}

async function pullNewEvents({
	credentials,
	store,
	storeKey,
	payload,
}: {
	credentials: SmartSuiteCredentials;
	store: TriggerStore;
	storeKey: string;
	payload: unknown;
}): Promise<SmartSuiteEvent[]> {
	const notifiedWebhookId = notificationWebhookId(payload);
	const ownWebhookId = await store.get<string>(storeKey);
	if (!notifiedWebhookId || (ownWebhookId && notifiedWebhookId !== ownWebhookId)) {
		return [];
	}
	const startToken = (await store.get<string>(PAGE_TOKEN_KEY)) ?? '';
	const seen = new Set((await store.get<string[]>(SEEN_EVENTS_KEY)) ?? []);
	const collected: SmartSuiteEvent[] = [];
	let pageToken = startToken;
	let lastToken = startToken;
	for (let page = 0; page < MAX_EVENT_PAGES; page++) {
		const response = await smartSuiteClient.request<{ events?: SmartSuiteEvent[]; next_page_token?: string }>({
			credentials,
			api: 'webhooks',
			method: HttpMethod.POST,
			path: API_ENDPOINTS.LIST_EVENTS,
			body: { webhook_id: notifiedWebhookId, page_size: EVENTS_PAGE_SIZE, page_token: pageToken },
			operation: 'list webhook events',
		});
		const events = response?.events ?? [];
		collected.push(...events);
		const next = response?.next_page_token ?? '';
		if (next.length > 0) {
			lastToken = next;
		}
		if (events.length === 0 || next.length === 0 || next === pageToken) {
			break;
		}
		pageToken = next;
	}
	const fresh = collected.filter((event) => {
		const key = eventKey(event);
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
	await store.put(PAGE_TOKEN_KEY, lastToken);
	await store.put(SEEN_EVENTS_KEY, Array.from(seen).slice(-MAX_SEEN_EVENT_IDS));
	return fresh;
}

function notificationWebhookId(payload: unknown): string | undefined {
	if (!isRecord(payload)) {
		return undefined;
	}
	const id = payload['webhookId'] ?? payload['webhook_id'];
	return typeof id === 'string' && id.length > 0 ? id : undefined;
}

function eventKey(event: SmartSuiteEvent): string {
	for (const key of ['event_id', 'id']) {
		const value = event[key];
		if (typeof value === 'string' && value.length > 0) {
			return value;
		}
	}
	const data = recordOf(event);
	const lastUpdated = isRecord(data['last_updated']) ? data['last_updated']['on'] : undefined;
	return `${String(data['id'] ?? '')}:${String(lastUpdated ?? '')}:${String(event['event_type'] ?? event['kind'] ?? '')}`;
}

function recordOf(event: SmartSuiteEvent): Record<string, unknown> {
	const eventData = event['record_event_data'];
	if (isRecord(eventData) && isRecord(eventData['data'])) {
		return eventData['data'];
	}
	return {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const PAGE_TOKEN_KEY = 'pageToken';
const SEEN_EVENTS_KEY = 'seenEventIds';

export const smartSuiteWebhooks = {
	enable,
	disable,
	pullNewEvents,
	recordOf,
	deleteWebhook,
	RECENT_RECORDS_LIMIT,
	MAX_EVENT_PAGES,
	MAX_SEEN_EVENT_IDS,
};

export type SmartSuiteEvent = Record<string, unknown>;

export type TriggerStore = {
	put: <T>(key: string, value: T) => Promise<T>;
	get: <T>(key: string) => Promise<T | null>;
	delete: (key: string) => Promise<void>;
};
