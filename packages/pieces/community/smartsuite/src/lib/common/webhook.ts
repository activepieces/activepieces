import { randomUUID } from 'node:crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { API_ENDPOINTS } from './constants';
import { smartSuiteClient, SmartSuiteCredentials } from './client';

const EVENTS_PAGE_SIZE = 50;
const MAX_EVENT_PAGES = 20;
const MAX_SEEN_EVENT_IDS = 500;
const RECENT_RECORDS_LIMIT = 5;
const EVENTS_REQUEST_TIMEOUT_MS = 10_000;
const CLAIM_TTL_MS = 45_000;
const CLAIM_WAIT_MS = 60_000;
const CLAIM_POLL_MS = 200;
const CLAIM_SETTLE_MS = 50;

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
	await store.delete(CLAIM_KEY);
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
	const owner = await claimPull({ store });
	try {
		return await readEvents({ credentials, store, webhookId: notifiedWebhookId, owner });
	} finally {
		await releasePull({ store, owner });
	}
}

async function readEvents({
	credentials,
	store,
	webhookId,
	owner,
}: {
	credentials: SmartSuiteCredentials;
	store: TriggerStore;
	webhookId: string;
	owner: string;
}): Promise<SmartSuiteEvent[]> {
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
			body: { webhook_id: webhookId, page_size: EVENTS_PAGE_SIZE, page_token: pageToken },
			operation: 'list webhook events',
			timeoutMs: EVENTS_REQUEST_TIMEOUT_MS,
		});
		await renewPull({ store, owner });
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
	await renewPull({ store, owner });
	await store.put(PAGE_TOKEN_KEY, lastToken);
	await store.put(SEEN_EVENTS_KEY, Array.from(seen).slice(-MAX_SEEN_EVENT_IDS));
	return fresh;
}

async function claimPull({ store }: { store: TriggerStore }): Promise<string> {
	const owner = randomUUID();
	const deadline = Date.now() + CLAIM_WAIT_MS;
	for (;;) {
		const current = await store.get<unknown>(CLAIM_KEY);
		if (!isPullClaim(current) || Date.now() - current.at > CLAIM_TTL_MS) {
			await store.put<PullClaim>(CLAIM_KEY, { owner, at: Date.now() });
			await pause(CLAIM_SETTLE_MS);
			const settled = await store.get<unknown>(CLAIM_KEY);
			if (isPullClaim(settled) && settled.owner === owner) {
				return owner;
			}
		}
		if (Date.now() >= deadline) {
			throw new Error('Another run is still reading SmartSuite webhook events for this trigger, so this notification was not processed. Its events stay queued in SmartSuite and are read by the next notification.');
		}
		await pause(CLAIM_POLL_MS);
	}
}

async function renewPull({ store, owner }: { store: TriggerStore; owner: string }): Promise<void> {
	const current = await store.get<unknown>(CLAIM_KEY);
	if (!isPullClaim(current) || current.owner !== owner) {
		throw new Error('This run stalled and another run took over reading SmartSuite webhook events, so this run stopped without emitting; the other run delivers the events.');
	}
	await store.put<PullClaim>(CLAIM_KEY, { owner, at: Date.now() });
}

async function releasePull({ store, owner }: { store: TriggerStore; owner: string }): Promise<void> {
	const current = await store.get<unknown>(CLAIM_KEY);
	if (isPullClaim(current) && current.owner === owner) {
		await store.delete(CLAIM_KEY);
	}
}

function isPullClaim(value: unknown): value is PullClaim {
	return isRecord(value) && typeof value['owner'] === 'string' && typeof value['at'] === 'number';
}

function pause(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
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
const CLAIM_KEY = 'pullClaim';

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

type PullClaim = { owner: string; at: number };

export type TriggerStore = {
	put: <T>(key: string, value: T) => Promise<T>;
	get: <T>(key: string) => Promise<T | null>;
	delete: (key: string) => Promise<void>;
};
