import { HttpMethod } from '@activepieces/pieces-common';
import { smartSuiteClient, SmartSuiteCredentials, SmartSuiteQueryValue } from './client';

const PAGE_SIZE = 100;
const MAX_LIST_PAGES = 50;
const MAX_RECORD_PAGE_SIZE = 1000;

async function smartSuiteApiCall<T>({
	apiKey,
	accountId,
	method,
	resourceUri,
	query,
	body,
	operation,
}: SmartSuiteApiCallParams): Promise<T> {
	return smartSuiteClient.request<T>({
		credentials: { apiKey, accountId },
		method,
		path: resourceUri,
		query,
		body,
		operation: operation ?? `${method} ${resourceUri.split('?')[0]}`,
	});
}

async function smartSuitePaginatedApiCall<T>(params: SmartSuiteApiCallParams): Promise<T[]> {
	const collected: T[] = [];
	for (let page = 0; page < MAX_LIST_PAGES; page++) {
		const response = await smartSuiteApiCall<unknown>({
			...params,
			query: { ...(params.query ?? {}), limit: PAGE_SIZE, offset: page * PAGE_SIZE },
		});
		const { items, hasNext } = readListPage<T>(response);
		collected.push(...items);
		if (!hasNext || items.length === 0) {
			return collected;
		}
	}
	throw new Error(`SmartSuite returned more than ${MAX_LIST_PAGES * PAGE_SIZE} items for ${params.operation ?? 'this list'}, so the list would be incomplete. Narrow it down (for example per record or per solution) or use Custom API Call with limit and offset.`);
}

function readListPage<T>(response: unknown): { items: T[]; hasNext: boolean } {
	if (Array.isArray(response)) {
		return { items: response, hasNext: false };
	}
	if (isPlainObject(response)) {
		const results = response['results'] ?? response['items'];
		const items: T[] = Array.isArray(results) ? results : [];
		const next = response['next'];
		return { items, hasNext: typeof next === 'string' && next.length > 0 };
	}
	return { items: [], hasNext: false };
}

async function getTable({ credentials, tableId }: { credentials: SmartSuiteCredentials; tableId: unknown }): Promise<SmartSuiteTable> {
	return smartSuiteClient.request<SmartSuiteTable>({
		credentials,
		method: HttpMethod.GET,
		path: `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table ID' })}/`,
		operation: 'get table',
	});
}

async function listRecordsPage({
	credentials,
	tableId,
	filter,
	sort,
	limit,
	offset,
}: {
	credentials: SmartSuiteCredentials;
	tableId: unknown;
	filter?: unknown;
	sort?: unknown;
	limit: number;
	offset: number;
}): Promise<RecordPage> {
	const body: Record<string, unknown> = {};
	if (filter !== undefined) {
		body['filter'] = filter;
	}
	if (sort !== undefined) {
		body['sort'] = sort;
	}
	const response = await smartSuiteClient.request<{ items?: SmartSuiteRecord[]; total?: number }>({
		credentials,
		method: HttpMethod.POST,
		path: `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table ID' })}/records/list/`,
		query: { limit, offset },
		body,
		operation: 'list records',
	});
	const items = response.items ?? [];
	const total = typeof response.total === 'number' ? response.total : undefined;
	const hasMore = total !== undefined ? offset + items.length < total : items.length === limit;
	return { items, total: total ?? null, offset, limit, hasMore: hasMore && items.length > 0 };
}

async function collectRecords({
	credentials,
	tableId,
	filter,
	sort,
	maxRecords,
}: {
	credentials: SmartSuiteCredentials;
	tableId: unknown;
	filter?: unknown;
	sort?: unknown;
	maxRecords: number;
}): Promise<{ items: SmartSuiteRecord[]; hasMore: boolean; total: number | null }> {
	const collected: SmartSuiteRecord[] = [];
	let offset = 0;
	let total: number | null = null;
	while (collected.length < maxRecords) {
		const limit = Math.min(MAX_RECORD_PAGE_SIZE, maxRecords - collected.length);
		const page = await listRecordsPage({ credentials, tableId, filter, sort, limit, offset });
		collected.push(...page.items);
		total = page.total;
		if (!page.hasMore) {
			return { items: collected, hasMore: false, total };
		}
		offset += page.items.length;
	}
	return { items: collected, hasMore: true, total };
}

async function listDeletedRecords({ credentials, solutionId }: { credentials: SmartSuiteCredentials; solutionId: string }): Promise<Record<string, unknown>[]> {
	const response = await smartSuiteClient.request<unknown>({
		credentials,
		method: HttpMethod.POST,
		path: '/deleted-records/',
		query: { preview: true },
		body: { solution_id: solutionId },
		operation: 'list deleted records',
	});
	return readListPage<Record<string, unknown>>(response).items;
}

async function trashRecords({ credentials, tableId, recordIds }: { credentials: SmartSuiteCredentials; tableId: unknown; recordIds: string[] }): Promise<string[]> {
	const deleted = await smartSuiteClient.request<SmartSuiteRecord[]>({
		credentials,
		method: HttpMethod.PATCH,
		path: `/applications/${smartSuiteClient.pathSegment({ value: tableId, label: 'Table' })}/records/bulk_delete/`,
		body: { items: recordIds },
		operation: 'bulk delete records',
	});
	return Array.isArray(deleted) ? deleted.map((record) => record['id']).filter((id): id is string => typeof id === 'string') : [];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export const smartSuiteApi = {
	getTable,
	listRecordsPage,
	collectRecords,
	readListPage,
	listDeletedRecords,
	trashRecords,
	isPlainObject,
	MAX_RECORD_PAGE_SIZE,
};

export { smartSuiteApiCall, smartSuitePaginatedApiCall };

export type SmartSuiteApiCallParams = {
	apiKey: string;
	accountId: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, SmartSuiteQueryValue>;
	body?: unknown;
	operation?: string;
};

export type TableStucture = {
	slug: string;
	label: string;
	field_type: string;
	params: {
		is_auto_generated?: boolean;
		system?: boolean;
		required?: boolean;
		primary?: boolean;
		linked_application?: string;
		choices?: { label: string; value: string }[];
	};
};

export type SmartSuiteTable = {
	id: string;
	name: string;
	slug?: string;
	solution?: string;
	status?: string;
	primary_field?: string;
	structure: TableStucture[];
};

export type SmartSuiteRecord = Record<string, unknown>;

export type RecordPage = {
	items: SmartSuiteRecord[];
	total: number | null;
	offset: number;
	limit: number;
	hasMore: boolean;
};
