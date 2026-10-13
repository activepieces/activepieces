import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListNotesOutputSchema } from '../../output-schemas';

export const attioListNotesAction = createAction({
	auth: attioAuth,
	name: 'attio_list_notes',
	outputSchema: attioListNotesOutputSchema,
	displayName: 'List Notes',
	description: 'Lists notes, optionally for one record.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists notes in the workspace, or only those on one record when Parent Object and Parent Record ID are given. Returns plaintext and markdown content.',
		idempotent: true,
	},
	props: {
		parent_object: Property.ShortText({ displayName: 'Parent Object', description: 'Object slug, e.g. `people`. Use with Parent Record ID.', required: false }),
		parent_record_id: Property.ShortText({ displayName: 'Parent Record ID', required: false }),
		limit: attioAi.limitProp({ max: 50 }),
		offset: attioAi.offsetProp(),
	},
	async run(context) {
		const { parent_object, parent_record_id, limit, offset } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/notes`,
			query: { parent_object, parent_record_id, limit, offset },
		});
		return { notes: response.data, count: response.data.length };
	},
});
