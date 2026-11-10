import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { createMockActionContext, createMockPollingTriggerContext } from '../../../../framework/src/lib/test';
import { HubspotAuthValue } from '../../src/lib/auth';

function memoryStore({ initial = {} }: { initial?: Record<string, unknown> } = {}) {
	const data = new Map<string, string>(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
	return {
		data,
		put: async <T>(key: string, value: T): Promise<T> => {
			data.set(key, JSON.stringify(value));
			return value;
		},
		get: async <T>(key: string): Promise<T | null> => {
			const raw = data.get(key);
			return raw === undefined ? null : JSON.parse(raw);
		},
		delete: async (key: string): Promise<void> => {
			data.delete(key);
		},
	};
}

function storedNumber({ store, key }: { store: MemoryStore; key: string }): number {
	const raw = store.data.get(key);
	const value: unknown = raw === undefined ? undefined : JSON.parse(raw);
	if (typeof value !== 'number') {
		throw new Error(`store has no number at ${key}`);
	}
	return value;
}

function pollingContext({
	store,
	propsValue,
	isRepublish,
}: {
	store: Store;
	propsValue: Record<string, unknown>;
	isRepublish?: boolean;
}) {
	return {
		...createMockPollingTriggerContext({ propsValue }),
		auth: testAuth,
		store,
		files: createMockActionContext({ propsValue: {} }).files,
		isRepublish,
	};
}

function toRecord({ value }: { value: unknown }): Record<string, unknown> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		throw new Error('expected an object');
	}
	return Object.fromEntries(Object.entries(value));
}

function field({ value, key }: { value: unknown; key: string }): unknown {
	return toRecord({ value })[key];
}

function textField({ value, key }: { value: unknown; key: string }): string {
	return String(field({ value, key }));
}

function propertiesOf({ value }: { value: unknown }): Record<string, unknown> {
	return toRecord({ value: field({ value, key: 'properties' }) });
}

function ids({ events }: { events: unknown[] }): string[] {
	return events.map((event) => textField({ value: event, key: 'id' }));
}

function jsonResponse({ body, status = 200 }: { body: unknown; status?: number }): Response {
	return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function requestUrl({ input }: { input: string | URL | Request }): URL {
	return new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url);
}

const testAuth: HubspotAuthValue = {
	type: AppConnectionType.OAUTH2,
	access_token: 'token',
	refresh_token: 'refresh',
	token_type: 'Bearer',
	client_id: 'client',
	client_secret: 'secret',
	redirect_url: 'https://example.com/redirect',
	claimed_at: 0,
	scope: 'crm.objects.contacts.read',
	token_url: 'https://api.hubapi.com/oauth/v1/token',
	props: {},
	data: {},
};

export const hubspotTestKit = {
	memoryStore,
	storedNumber,
	pollingContext,
	toRecord,
	field,
	textField,
	propertiesOf,
	ids,
	jsonResponse,
	requestUrl,
	testAuth,
};

export type MemoryStore = ReturnType<typeof memoryStore>;
