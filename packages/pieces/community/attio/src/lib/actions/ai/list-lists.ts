import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioListListsOutputSchema } from '../../output-schemas';

export const attioListListsAction = createAction({
	auth: attioAuth,
	name: 'attio_list_lists',
	outputSchema: attioListListsOutputSchema,
	displayName: 'List Lists',
	description: 'Lists all lists in the workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists every list in the workspace with its ID, slug and parent object. Use it to resolve a list name to the slug or ID the list-entry actions need.',
		idempotent: true,
	},
	props: {

	},
	async run(context) {
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/lists',
		});
		return { lists: response.data, count: response.data.length };
	},
});
