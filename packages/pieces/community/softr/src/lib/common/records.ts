import { HttpMethod } from '@activepieces/pieces-common';
import { softrClient } from './client';
import { SoftrListResponse, SoftrRecord, SoftrSingleResponse, TableField } from './types';

function compactFieldValues(fields: Record<string, unknown> | undefined): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(fields ?? {}).filter(([, value]) => {
			if (value === undefined || value === null || value === '') {
				return false;
			}
			return !(Array.isArray(value) && value.length === 0);
		}),
	);
}

async function writeRecord({ apiKey, databaseId, tableId, recordId, fields, tableFields }: WriteRecordParams): Promise<SoftrRecord> {
	const knownFields = tableFields ?? (await softrClient.getTable({ apiKey, databaseId, tableId })).fields;
	const response = await softrClient.request<SoftrSingleResponse<SoftrRecord>>({
		apiKey,
		method: recordId ? HttpMethod.PATCH : HttpMethod.POST,
		path: recordId
			? softrClient.recordPath({ databaseId, tableId, recordId })
			: softrClient.recordsPath({ databaseId, tableId }),
		body: { fields: compactFieldValues(fields) },
	});
	return softrClient.withFieldNames({ record: response.data, tableFields: knownFields });
}

async function searchRecords({ apiKey, databaseId, tableId, body }: SearchRecordsParams): Promise<SoftrListResponse<SoftrRecord>> {
	return softrClient.request<SoftrListResponse<SoftrRecord>>({
		apiKey,
		method: HttpMethod.POST,
		path: `${softrClient.recordsPath({ databaseId, tableId })}/search`,
		body,
	});
}

type WriteRecordParams = {
	apiKey: string;
	databaseId: string;
	tableId: string;
	recordId?: string;
	fields: Record<string, unknown> | undefined;
	tableFields?: TableField[];
};

type SearchRecordsParams = {
	apiKey: string;
	databaseId: string;
	tableId: string;
	body: Record<string, unknown>;
};

export const softrRecords = {
	compactFieldValues,
	writeRecord,
	searchRecords,
};
