import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, formatRecordFields, transformRecordFields } from '../common/props';
import { smartSuiteApiCall, TableStucture } from '../common';

export const updateRecord = createAction({
	name: 'update_record',
	displayName: 'Update a Record',
	description: 'Updates an existing record in the specified table',
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordId,
		fields: smartsuiteCommon.tableFields,
	},
	async run({ auth, propsValue }) {
		const { tableId, recordId, fields } = propsValue;

		const tableResponse = await smartSuiteApiCall<{
			structure: TableStucture[];
		}>({
			apiKey: auth.apiKey,
			accountId: auth.accountId,
			method: HttpMethod.GET,
			resourceUri: `/applications/${tableId}`,
		});
		const tableSchema = tableResponse.structure;

		const formattedFields = formatRecordFields(tableSchema, fields);

		try {
			const response = await smartSuiteApiCall<Record<string, any>>({
				apiKey: auth.apiKey,
				accountId: auth.accountId,
				method: HttpMethod.PATCH,
				resourceUri: `/applications/${tableId}/records/${recordId}/`,
				body: formattedFields,
			});

			const transformedFields = transformRecordFields(tableSchema, response);

			return transformedFields;
		} catch (error: any) {
			if (error.response?.status === 422) {
				throw new Error(
					`Invalid request: ${error.response?.body?.message || 'Invalid data format'}`,
				);
			}

			if (error.response?.status === 403) {
				throw new Error('You do not have permission to update this record');
			}

			if (error.response?.status === 404) {
				throw new Error(`Record with ID ${recordId} not found in table ${tableId}`);
			}

			throw new Error(`Failed to update record: ${error.message || 'Unknown error'}`);
		}
	},
});
