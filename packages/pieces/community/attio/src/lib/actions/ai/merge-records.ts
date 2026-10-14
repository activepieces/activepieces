import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioMergeRecordsOutputSchema } from '../../output-schemas';

export const attioMergeRecordsAction = createAction({
	auth: attioAuth,
	name: 'attio_merge_records',
	outputSchema: attioMergeRecordsOutputSchema,
	displayName: 'Merge Records',
	description: 'Merges two records of the same object into one.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Merges the secondary record into the primary one; where both have a value the primary wins, and the secondary record is removed. This cannot be undone. Both IDs must belong to the same object.',
		idempotent: false,
	},
	props: {
		object: attioAi.objectProp(),
		primary_record_id: attioAi.recordIdProp({ description: 'ID of the record to keep.' }),
		secondary_record_id: attioAi.recordIdProp({ description: 'ID of the record merged into the primary and then removed.' }),
	},
	async run(context) {
		const { object, primary_record_id, secondary_record_id } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/objects/${object}/records/merge`,
			body: { data: { primary_record_id, secondary_record_id } },
		});
		return response.data;
	},
});
