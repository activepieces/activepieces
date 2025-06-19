import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon, transformRecordFields } from '../common/props';
import { smartSuiteApiCall, TableStucture } from '../common';

export const getRecord = createAction({
	name: 'get_record',
	displayName: 'Get a Record',
	description: 'Retrieves a specific record by ID',
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordId,
	},
	async run({ auth, propsValue }) {
		const { tableId, recordId } = propsValue;

		try {
			const tableResponse = await smartSuiteApiCall<{
				structure: TableStucture[];
			}>({
				apiKey: auth.apiKey,
				accountId: auth.accountId,
				method: HttpMethod.GET,
				resourceUri: `/applications/${tableId}`,
			});
			const tableSchema = tableResponse.structure;
			const response = await smartSuiteApiCall<Record<string, any>>({
				apiKey: auth.apiKey,
				accountId: auth.accountId,
				method: HttpMethod.GET,
				resourceUri: `/applications/${tableId}/records/${recordId}/`,
			});

			const transformedFields = transformRecordFields(tableSchema, response);

			return transformedFields;
		} catch (error: any) {
			if (error.response?.status === 403) {
				throw new Error('You do not have permission to access this record');
			}

			if (error.response?.status === 404) {
				throw new Error(`Record with ID ${recordId} not found in table ${tableId}`);
			}

			throw new Error(`Failed to get record: ${error.message || 'Unknown error'}`);
		}
	},
});
