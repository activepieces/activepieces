import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListObjectViewsOutputSchema } from '../../output-schemas';

export const attioListObjectViewsAction = createAction({
	auth: attioAuth,
	name: 'attio_list_object_views',
	outputSchema: attioListObjectViewsOutputSchema,
	displayName: 'List Object Views',
	description: 'Lists the saved views of an object.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists saved views for an object. A view ID can be used as `filter_view_id` context when browsing records in the Attio UI.',
		idempotent: true,
	},
	props: {
		object: attioAi.objectProp(),
		show_archived: Property.Checkbox({ displayName: 'Show Archived', description: 'Include archived views.', required: false }),
		limit: attioAi.limitProp({ max: 100 }),
		cursor: attioAi.cursorProp(),
	},
	async run(context) {
		const { object, show_archived, limit, cursor } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/objects/${object}/views`,
			query: { show_archived: show_archived ? 'true' : undefined, limit, cursor },
		});
		return { views: response.data, count: response.data.length, next_cursor: response.pagination?.['next_cursor'] ?? null };
	},
});
