import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod} from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartsuiteCommon } from '../common/props';
import { smartSuiteApiCall } from '../common';

export const deleteRecord = createAction({
	name: 'delete_record',
	displayName: 'Delete a Record',
	description: 'Deletes a record from the specified table',
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordId,
	},
	async run({ auth, propsValue }) {
		const { tableId, recordId } = propsValue;

		try {
			const response = await smartSuiteApiCall<Record<string, any>>({
				apiKey: auth.apiKey,
				accountId: auth.accountId,
				method: HttpMethod.DELETE,
				resourceUri: `/applications/${tableId}/records/${recordId}/`,
			});

			return response;
		} catch (error: any) {
			if (error.response?.status === 404) {
				throw new Error(`Record with ID ${recordId} not found in table ${tableId}`);
			}

			if (error.response?.status === 403) {
				throw new Error('You do not have permission to delete this record');
			}

			throw new Error(`Failed to delete record: ${error.message || 'Unknown error'}`);
		}
	},
});
