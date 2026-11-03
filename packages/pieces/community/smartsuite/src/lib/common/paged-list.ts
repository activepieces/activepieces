import { HttpMethod } from '@activepieces/pieces-common';
import { smartSuiteClient, SmartSuiteCredentials } from './client';
import { smartSuiteInputs } from './inputs';

const MAX_PAGE_SIZE = 1000;
const DEFAULT_PAGE_SIZE = 100;

async function fetch({
	credentials,
	path,
	limit,
	offset,
	operation,
}: {
	credentials: SmartSuiteCredentials;
	path: string;
	limit: unknown;
	offset: unknown;
	operation: string;
}): Promise<PagedList> {
	const pageSize = smartSuiteInputs.integerInRange({ value: limit, label: 'Limit', min: 1, max: MAX_PAGE_SIZE, fallback: DEFAULT_PAGE_SIZE });
	const start = smartSuiteInputs.integerInRange({ value: offset, label: 'Offset', min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 });
	const response = await smartSuiteClient.request<{ items?: Record<string, unknown>[]; total?: number }>({
		credentials,
		method: HttpMethod.POST,
		path,
		query: { limit: pageSize, offset: start },
		body: {},
		operation,
	});
	const items = response.items ?? [];
	const total = typeof response.total === 'number' ? response.total : null;
	const hasMore = items.length > 0 && (total !== null ? start + items.length < total : items.length === pageSize);
	return { items, total, offset: start, limit: pageSize, hasMore };
}

export const pagedList = { fetch };

export type PagedList = {
	items: Record<string, unknown>[];
	total: number | null;
	offset: number;
	limit: number;
	hasMore: boolean;
};
