import type { QueryParams } from '@activepieces/pieces-common';

import type { ClockifyEntityFilter } from './types';

function toQuery({
	params,
}: {
	params: Record<string, string | number | boolean | undefined>;
}): QueryParams {
	return Object.fromEntries(
		Object.entries(params)
			.filter(
				(entry): entry is [string, string | number | boolean] =>
					entry[1] !== undefined && entry[1] !== '',
			)
			.map(([key, value]) => [key, String(value)]),
	);
}

function toOptionalBoolean({ value }: { value: string | undefined }): boolean | undefined {
	return value === undefined ? undefined : value === 'true';
}

function nonEmptyIds({ values }: { values: unknown[] | undefined }): string[] | undefined {
	return values && values.length > 0 ? values.map(String) : undefined;
}

function entityFilter({ ids }: { ids: unknown[] | undefined }): ClockifyEntityFilter | undefined {
	return ids && ids.length > 0
		? { ids: ids.map(String), contains: 'CONTAINS', status: 'ALL' }
		: undefined;
}

export const clockifyUtils = { toQuery, toOptionalBoolean, nonEmptyIds, entityFilter };
