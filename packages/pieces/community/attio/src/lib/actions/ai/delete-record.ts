import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioDeleteRecordOutputSchema } from '../../output-schemas';

export const attioDeleteRecordAction = createAction({
	auth: attioAuth,
	name: 'attio_delete_record',
	outputSchema: attioDeleteRecordOutputSchema,
	displayName: 'Delete Record',
	description: 'Permanently deletes a record.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a record by object and record ID. This cannot be undone.',
		idempotent: false,
	},
	props: {
		object: attioAi.objectProp(),
		record_id: attioAi.recordIdProp(),
	},
	async run(context) {
		const { object, record_id } = context.propsValue;
		await attioApiCall({
			accessToken: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/objects/${object}/records/${record_id}`,
		});
		return { success: true, record_id };
	},
});
