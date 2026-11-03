import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioListObjectsOutputSchema } from '../../output-schemas';

export const attioListObjectsAction = createAction({
	auth: attioAuth,
	name: 'attio_list_objects',
	outputSchema: attioListObjectsOutputSchema,
	displayName: 'List Objects',
	description: 'Lists all objects in the workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists every object (people, companies, deals, users, workspaces and custom objects) with its ID and slug. Use it to find the object slug other actions need.',
		idempotent: true,
	},
	props: {

	},
	async run(context) {
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/objects`,
		});
		return { objects: response.data, count: response.data.length };
	},
});
