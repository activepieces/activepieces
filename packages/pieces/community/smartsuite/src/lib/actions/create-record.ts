import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, formatRecordFields, transformRecordFields } from '../common/props';
import { smartSuiteApiCall, TableStucture } from '../common';

export const createRecord = createAction({
	name: 'create_record',
	displayName: 'Create a Record',
	description: 'Creates a new record in the specified table.',
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		fields: smartsuiteCommon.tableFields,
	},
	async run({ auth, propsValue }) {
		const { tableId, fields, solutionId } = propsValue;

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
				method: HttpMethod.POST,
				resourceUri: `/applications/${tableId}/records/`,
				body: formattedFields,
			});

			const transformedFields = transformRecordFields(tableSchema, response);

			return transformedFields;
		} catch (error: any) {
			if (error.response?.status === 422) {
				throw new Error(
					`Invalid request: ${
						error.response?.body?.message || 'Missing required fields or invalid data'
					}`,
				);
			}

			if (error.response?.status === 403) {
				throw new Error('You do not have permission to create records in this table');
			}

			if (error.response?.status === 404) {
				throw new Error(`Solution or table not found: ${solutionId}/${tableId}`);
			}

			throw new Error(`Failed to create record: ${error.message || 'Unknown error'}`);
		}
	},
});
