import type { QueryParams } from '@activepieces/pieces-common';

function compact({ values }: { values: Record<string, unknown> }): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(values).filter(([, value]) => value !== undefined && value !== null),
	);
}

function toQuery({
	values,
}: {
	values: Record<string, string | number | boolean | undefined | null>;
}): QueryParams {
	return Object.fromEntries(
		Object.entries(values)
			.filter(([, value]) => value !== undefined && value !== null)
			.map(([key, value]) => [key, String(value)]),
	);
}

function pageQuery({
	pageNumber,
	pageSize,
}: {
	pageNumber?: number;
	pageSize?: number;
}): QueryParams {
	return toQuery({
		values: { 'page[number]': pageNumber, 'page[size]': pageSize },
	});
}

function filterQuery({
	filters,
}: {
	filters: Record<string, string | number | boolean | undefined | null>;
}): QueryParams {
	return toQuery({
		values: Object.fromEntries(
			Object.entries(filters).map(([key, value]) => [`filter[${key}]`, value]),
		),
	});
}

export const telnyxUtils = { compact, toQuery, pageQuery, filterQuery };
