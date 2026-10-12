import { salesforceUtils } from './utils';

function parseRecordList({ value, fieldName, max }: { value: unknown; fieldName: string; max: number }): Record<string, unknown>[] {
	const list = salesforceUtils.parseJsonArray({ value, fieldName }) ?? [];
	if (list.length === 0) {
		throw new Error(`${fieldName} must contain at least one record.`);
	}
	if (list.length > max) {
		throw new Error(`${fieldName} can contain at most ${max} records per call.`);
	}
	return list.map((item, index) => {
		if (!salesforceUtils.isRecord(item)) {
			throw new Error(`${fieldName}[${index}] must be a JSON object.`);
		}
		return item;
	});
}

function parseIdList({ value, fieldName, max }: { value: unknown; fieldName: string; max: number }): string[] {
	const ids = salesforceUtils.toStringArray(value).map((id) => salesforceUtils.assertId({ value: id, fieldName }));
	if (ids.length === 0) {
		throw new Error(`${fieldName} must contain at least one id.`);
	}
	if (ids.length > max) {
		throw new Error(`${fieldName} can contain at most ${max} ids per call.`);
	}
	return ids;
}

function formatCompositeResults(results: CompositeResult[]) {
	const rows = results.map((result, index) => ({
		index,
		id: result.id ?? null,
		success: result.success,
		...(result.created === undefined ? {} : { created: result.created }),
		errors: (result.errors ?? []).map((error) => `${error.statusCode}: ${error.message}`).join('; '),
	}));
	return {
		results: rows,
		success_count: rows.filter((row) => row.success).length,
		failure_count: rows.filter((row) => !row.success).length,
	};
}

export const recordsUtils = {
	parseRecordList,
	parseIdList,
	formatCompositeResults,
	MAX_COMPOSITE_RECORDS: 200,
};

export type CompositeResult = {
	id?: string | null;
	success: boolean;
	created?: boolean;
	errors?: { statusCode: string; message: string; fields?: string[] }[];
};
