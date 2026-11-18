import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { SoftrAuth } from '../common/auth';
import { softrClient } from '../common/client';
import { databaseIdDropdown, recordIdField, tableIdDropdown } from '../common/props';
import { SoftrRecord, SoftrSingleResponse } from '../common/types';
import { softrOutputSchemas } from '../output-schemas';

export const getDatabaseRecord = createAction({
	auth: SoftrAuth,
	name: 'getDatabaseRecord',
	classification: 'READ',
	displayName: 'Get Database Record',
	description: 'Retrieves a single record by its ID.',
	audience: 'both',
	aiMetadata: {
		description:
			'Gets one record from a Softr table by its record ID, with values keyed by column name. To look records up by value, use Find Records. Read-only.',
		idempotent: true,
	},
	props: {
		databaseId: databaseIdDropdown,
		tableId: tableIdDropdown,
		recordId: recordIdField,
	},
	outputSchema: softrOutputSchemas.record,
	async run({ auth, propsValue }) {
		const { databaseId, tableId } = propsValue;
		const recordId = propsValue.recordId.trim();
		if (recordId.length === 0) {
			throw new Error('Record ID is required.');
		}
		const apiKey = auth.secret_text;
		const table = await softrClient.getTable({ apiKey, databaseId, tableId });
		const response = await softrClient.request<SoftrSingleResponse<SoftrRecord>>({
			apiKey,
			method: HttpMethod.GET,
			path: softrClient.recordPath({ databaseId, tableId, recordId }),
		});
		return softrClient.withFieldNames({ record: response.data, tableFields: table.fields });
	},
});
