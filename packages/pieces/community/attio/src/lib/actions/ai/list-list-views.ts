import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListListViewsOutputSchema } from '../../output-schemas';

export const attioListListViewsAction = createAction({
	auth: attioAuth,
	name: 'attio_list_list_views',
	outputSchema: attioListListViewsOutputSchema,
	displayName: 'List List Views',
	description: 'Lists the saved views of a list.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists saved views for a list, with their IDs and titles.',
		idempotent: true,
	},
	props: {
		list: attioAi.listProp(),
		show_archived: Property.Checkbox({ displayName: 'Show Archived', description: 'Include archived views.', required: false }),
		limit: attioAi.limitProp({ max: 100 }),
		cursor: attioAi.cursorProp(),
	},
	async run(context) {
		const { list, show_archived, limit, cursor } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[]; pagination: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/lists/${list}/views`,
			query: { show_archived: show_archived ? 'true' : undefined, limit, cursor },
		});
		return { views: response.data, count: response.data.length, next_cursor: response.pagination?.['next_cursor'] ?? null };
	},
});
