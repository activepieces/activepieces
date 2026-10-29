import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListRecordEntriesOutputSchema } from '../../output-schemas';

export const attioListRecordEntriesAction = createAction({
	auth: attioAuth,
	name: 'attio_list_record_entries',
	outputSchema: attioListRecordEntriesOutputSchema,
	displayName: 'List Record Entries',
	description: 'Lists the list entries a record belongs to.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists every list entry whose parent is this record, i.e. which lists the record is in, with list and entry IDs for the list-entry actions.',
		idempotent: true,
	},
	props: {
		object: attioAi.objectProp(),
		record_id: attioAi.recordIdProp(),
		limit: attioAi.limitProp({ max: 1000 }),
		offset: attioAi.offsetProp(),
	},
	async run(context) {
		const { object, record_id, limit, offset } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/objects/${object}/records/${record_id}/entries`,
			query: { limit, offset },
		});
		return { entries: response.data, count: response.data.length };
	},
});
