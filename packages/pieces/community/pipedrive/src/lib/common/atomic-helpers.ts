import { AuthenticationType, httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { isNil, Property } from '@activepieces/pieces-framework';
import { GetField } from './types';

function readVendorMessage(body: unknown): string {
	if (typeof body === 'string') {
		return body;
	}
	if (typeof body !== 'object' || body === null) {
		return '';
	}
	const parts: string[] = [];
	if ('error' in body && typeof body.error === 'string') {
		parts.push(body.error);
	}
	if ('error_info' in body && typeof body.error_info === 'string') {
		parts.push(body.error_info);
	}
	if (parts.length === 0 && 'statusText' in body && typeof body.statusText === 'string') {
		parts.push(body.statusText);
	}
	return parts.join(' ');
}

function describeFailure({
	status,
	body,
	resourceLabel,
}: {
	status: number;
	body: unknown;
	resourceLabel: string;
}): string {
	const vendorMessage = readVendorMessage(body);
	switch (status) {
		case 400:
			return `Pipedrive rejected the request: ${vendorMessage || 'invalid parameters'}.`;
		case 401:
			return 'Pipedrive rejected the connection. Reconnect your Pipedrive account and try again.';
		case 403:
			return `Pipedrive denied access to ${resourceLabel}: the connected user lacks permission (visibility or role) or the connection lacks the required scope. ${vendorMessage}`.trim();
		case 404:
			return `${resourceLabel} was not found (it may be deleted). ${vendorMessage}`.trim();
		case 429:
			return 'Pipedrive rate limit reached; retry later.';
		default:
			return `Pipedrive returned HTTP ${status} for ${resourceLabel}. ${vendorMessage}`.trim();
	}
}

function readApiDomain(auth: PipedriveAtomicAuth): string {
	const apiDomain = auth.data['api_domain'];
	if (typeof apiDomain !== 'string' || apiDomain.length === 0) {
		throw new Error('The Pipedrive connection has no API domain. Reconnect your Pipedrive account.');
	}
	return apiDomain;
}

function toQueryString(query: PipedriveAtomicQuery | undefined): Record<string, string> {
	const qs: Record<string, string> = {};
	if (isNil(query)) {
		return qs;
	}
	for (const [key, value] of Object.entries(query)) {
		if (isNil(value)) {
			continue;
		}
		qs[key] = Array.isArray(value) ? value.map(String).join(',') : String(value);
	}
	return qs;
}

function dropNilValues(body: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
	if (isNil(body)) {
		return undefined;
	}
	const cleaned: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(body)) {
		if (!isNil(value)) {
			cleaned[key] = value;
		}
	}
	return cleaned;
}

async function call<T>({
	auth,
	method,
	resourceUri,
	resourceLabel = 'the requested Pipedrive record',
	query,
	body,
}: PipedriveAtomicCallParams): Promise<T> {
	const apiDomain = readApiDomain(auth);
	try {
		const response = await httpClient.sendRequest<T>({
			method,
			url: `${apiDomain}/api${resourceUri}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth.access_token,
			},
			queryParams: toQueryString(query),
			body: dropNilValues(body),
		});
		return response.body;
	} catch (error) {
		if (error instanceof HttpError) {
			throw new Error(
				describeFailure({
					status: error.response.status,
					body: error.response.body,
					resourceLabel,
				}),
			);
		}
		throw error;
	}
}

async function fetchCustomFieldDefinitions({
	auth,
	resourceUri,
}: {
	auth: PipedriveAtomicAuth;
	resourceUri: string;
}): Promise<GetField[]> {
	const fields: GetField[] = [];
	let start: number | undefined = 0;
	while (!isNil(start)) {
		const response: V1FieldsPage = await call<V1FieldsPage>({
			auth,
			method: HttpMethod.GET,
			resourceUri,
			resourceLabel: 'custom field definitions',
			query: { start, limit: 500 },
		});
		fields.push(...(response.data ?? []));
		const pagination = response.additional_data?.pagination;
		start = pagination?.more_items_in_collection ? pagination.next_start : undefined;
	}
	return fields;
}

function paginationProps() {
	return {
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum number of items to return in this page (1-500). Defaults to 50.',
			required: false,
			defaultValue: DEFAULT_PAGE_LIMIT,
		}),
		cursor: Property.ShortText({
			displayName: 'Cursor',
			description:
				'The next_cursor value from the previous call, to fetch the next page. Leave empty for the first page.',
			required: false,
		}),
	};
}

function clampLimit(limit: number | undefined): number {
	if (isNil(limit) || !Number.isFinite(limit)) {
		return DEFAULT_PAGE_LIMIT;
	}
	return Math.min(MAX_PAGE_LIMIT, Math.max(1, Math.floor(limit)));
}

function emptyToUndefined(value: string | undefined): string | undefined {
	if (isNil(value)) {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length === 0 ? undefined : trimmed;
}

function toRfc3339({ value, label }: { value: string | undefined; label: string }): string | undefined {
	if (isNil(value) || value.trim().length === 0) {
		return undefined;
	}
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error(`${label} must be a valid date and time.`);
	}
	return parsed.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function assertSearchTerm({
	term,
	exactMatch,
}: {
	term: string | undefined;
	exactMatch: boolean | undefined;
}): string {
	const trimmed = (term ?? '').trim();
	const minimum = exactMatch === true ? 1 : 2;
	if (trimmed.length < minimum) {
		throw new Error(
			exactMatch === true
				? 'Search Term must contain at least 1 character.'
				: 'Search Term must contain at least 2 characters (or 1 character when Exact Match is Yes).',
		);
	}
	return trimmed;
}

function toPage<T>(response: V2ListResponse<T>): AtomicPage<T> {
	const data = response.data ?? [];
	return {
		found: data.length > 0,
		data,
		next_cursor: response.additional_data?.next_cursor ?? null,
	};
}

function flattenSearchItems(
	response: V2SearchResponse,
): AtomicPage<Record<string, unknown>> {
	const items = response.data?.items ?? [];
	const data = items.map(({ result_score, item }) => ({ ...item, result_score }));
	return {
		found: data.length > 0,
		data,
		next_cursor: response.additional_data?.next_cursor ?? null,
	};
}

function sortDirectionProp() {
	return Property.StaticDropdown<string>({
		displayName: 'Sort Direction',
		description: 'Sort order. Defaults to ascending.',
		required: false,
		options: {
			disabled: false,
			options: [
				{ label: 'Ascending', value: 'asc' },
				{ label: 'Descending', value: 'desc' },
			],
		},
	});
}

function exactMatchProp() {
	return Property.StaticDropdown<boolean>({
		displayName: 'Exact Match',
		description:
			'Yes returns only exact matches of the full term. Leave empty for partial matching.',
		required: false,
		options: {
			disabled: false,
			options: [
				{ label: 'Yes', value: true },
				{ label: 'No', value: false },
			],
		},
	});
}

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 500;

export const pipedriveAtomic = {
	call,
	fetchCustomFieldDefinitions,
	paginationProps,
	clampLimit,
	emptyToUndefined,
	toRfc3339,
	assertSearchTerm,
	toPage,
	flattenSearchItems,
	sortDirectionProp,
	exactMatchProp,
};

type V1FieldsPage = {
	data: GetField[] | null;
	additional_data?: {
		pagination?: {
			more_items_in_collection?: boolean;
			next_start?: number;
		};
	};
};

export type PipedriveAtomicAuth = {
	access_token: string;
	data: Record<string, unknown>;
};

export type PipedriveAtomicQuery = Record<
	string,
	string | number | boolean | string[] | number[] | null | undefined
>;

export type PipedriveAtomicCallParams = {
	auth: PipedriveAtomicAuth;
	method: HttpMethod;
	resourceUri: string;
	resourceLabel?: string;
	query?: PipedriveAtomicQuery;
	body?: Record<string, unknown>;
};

export type V2ListResponse<T> = {
	success: boolean;
	data: T[] | null;
	additional_data?: {
		next_cursor?: string | null;
	};
};

export type V2SearchResponse = {
	success: boolean;
	data: {
		items?: Array<{ result_score: number; item: Record<string, unknown> }>;
	} | null;
	additional_data?: {
		next_cursor?: string | null;
	};
};

export type PipedriveEnvelope<T> = {
	success: boolean;
	data: T;
};

export type AtomicPage<T> = {
	found: boolean;
	data: T[];
	next_cursor: string | null;
};
