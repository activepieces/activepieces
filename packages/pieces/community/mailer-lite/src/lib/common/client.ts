import {
	AuthenticationType,
	HttpError,
	HttpMethod,
	QueryParams,
	httpClient,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://connect.mailerlite.com/api';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describeFieldErrors(errors: unknown): string {
	if (!isRecord(errors)) {
		return '';
	}
	return Object.entries(errors)
		.map(([field, messages]) => {
			const text = Array.isArray(messages) ? messages.map(String).join(', ') : String(messages);
			return `${field}: ${text}`;
		})
		.join('; ');
}

function toReadableError({ error, resource }: { error: HttpError; resource: string }): Error {
	const status = error.response.status;
	const body = error.response.body;
	const vendorMessage = isRecord(body) && typeof body['message'] === 'string' ? body['message'] : '';
	switch (status) {
		case 401:
			return new Error('MailerLite rejected the API token (invalid or revoked). Reconnect with a valid token.');
		case 404:
			return new Error(`MailerLite could not find ${resource}. Check the ID.`);
		case 410:
			return new Error(`MailerLite reports ${resource} was already deleted.`);
		case 422: {
			const fieldErrors = isRecord(body) ? describeFieldErrors(body['errors']) : '';
			return new Error(
				`MailerLite validation failed: ${vendorMessage}${fieldErrors ? ` (${fieldErrors})` : ''}`,
			);
		}
		case 429:
			return new Error(
				'MailerLite rate limit reached (120 requests/minute, 5/minute for imports). Wait and retry.',
			);
		case 400:
			return new Error(`MailerLite rejected the request: ${vendorMessage}`);
		default:
			return new Error(`MailerLite request failed with status ${status}: ${vendorMessage || JSON.stringify(body)}`);
	}
}

async function request<T>({
	apiKey,
	method,
	path,
	resource,
	queryParams,
	body,
}: RequestParams): Promise<T> {
	const query: QueryParams = {};
	Object.entries(queryParams ?? {}).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			query[key] = String(value);
		}
	});
	try {
		const response = await httpClient.sendRequest<T>({
			method,
			url: `${BASE_URL}${path}`,
			authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
			headers: { Accept: 'application/json' },
			queryParams: query,
			body,
		});
		return response.body;
	} catch (error) {
		if (error instanceof HttpError) {
			throw toReadableError({ error, resource: resource ?? `the resource at ${path}` });
		}
		throw error;
	}
}

function readableSdkError({ error, resource }: { error: unknown; resource: string }): unknown {
	if (!isRecord(error) || !isRecord(error['response']) || typeof error['response']['status'] !== 'number') {
		return error;
	}
	const status = error['response']['status'];
	if (status === 404) {
		return new Error(`MailerLite could not find ${resource}; it may not exist or was already deleted.`);
	}
	return toReadableError({
		error: new HttpError(undefined, { status, responseBody: error['response']['data'] }),
		resource,
	});
}

function unwrapData(body: unknown): Record<string, unknown> {
	if (isRecord(body) && isRecord(body['data'])) {
		return body['data'];
	}
	return isRecord(body) ? body : {};
}

function withoutSecret(item: unknown): unknown {
	if (!isRecord(item)) {
		return item;
	}
	return Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'secret'));
}

function resolveLimit({ value, fallback, max }: { value: number | undefined; fallback: number; max: number }): number {
	const resolved = Math.trunc(Number(value ?? fallback));
	if (!Number.isFinite(resolved) || resolved < 1 || resolved > max) {
		throw new Error(`Limit must be between 1 and ${max}.`);
	}
	return resolved;
}

function resolvePage(value: number | undefined): number | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}
	const resolved = Math.trunc(Number(value));
	if (!Number.isFinite(resolved) || resolved < 1) {
		throw new Error('Page must be 1 or greater.');
	}
	return resolved;
}

function requireId({ value, label }: { value: string | undefined; label: string }): string {
	const trimmed = (value ?? '').trim();
	if (!trimmed) {
		throw new Error(`${label} is required.`);
	}
	return encodeURIComponent(trimmed);
}

const WEBHOOK_EVENTS = [
	'subscriber.created',
	'subscriber.updated',
	'subscriber.unsubscribed',
	'subscriber.added_to_group',
	'subscriber.removed_from_group',
	'subscriber.bounced',
	'subscriber.automation_triggered',
	'subscriber.automation_completed',
	'subscriber.spam_reported',
	'subscriber.deleted',
	'subscriber.active',
	'campaign.sent',
	'campaign.click',
	'campaign.open',
];

function webhookEventOptions(): { label: string; value: string }[] {
	return WEBHOOK_EVENTS.map((event) => ({ label: event, value: event }));
}

function booleanOptions(): { label: string; value: string }[] {
	return [
		{ label: 'Yes', value: 'true' },
		{ label: 'No', value: 'false' },
	];
}

type RequestParams = {
	apiKey: string;
	method: HttpMethod;
	path: string;
	resource?: string;
	queryParams?: Record<string, string | number | boolean | undefined | null>;
	body?: unknown;
};

export const mailerLiteApi = {
	request,
	unwrapData,
	readableSdkError,
	withoutSecret,
	isRecord,
	resolveLimit,
	resolvePage,
	requireId,
	webhookEventOptions,
	booleanOptions,
};
