import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListThreadsOutputSchema } from '../../output-schemas';

export const attioListThreadsAction = createAction({
	auth: attioAuth,
	name: 'attio_list_threads',
	outputSchema: attioListThreadsOutputSchema,
	displayName: 'List Threads',
	description: 'Lists comment threads on a record or list entry.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists comment threads on a record (Object with Record ID) or a list entry (List with Entry ID). Each thread includes up to 80 replies; use Get Thread for more.',
		idempotent: true,
	},
	props: {
		object: Property.ShortText({ displayName: 'Object', description: 'Object slug, with Record ID.', required: false }),
		record_id: Property.ShortText({ displayName: 'Record ID', required: false }),
		list: Property.ShortText({ displayName: 'List', description: 'List slug or ID, with Entry ID.', required: false }),
		entry_id: Property.ShortText({ displayName: 'Entry ID', required: false }),
		limit: attioAi.limitProp({ max: 50 }),
		offset: attioAi.offsetProp(),
	},
	async run(context) {
		const { object, record_id, list, entry_id, limit, offset } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/threads`,
			query: { object, record_id, list, entry_id, limit, offset },
		});
		return { threads: response.data, count: response.data.length };
	},
});
