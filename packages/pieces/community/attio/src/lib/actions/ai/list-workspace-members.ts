import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioListWorkspaceMembersOutputSchema } from '../../output-schemas';

export const attioListWorkspaceMembersAction = createAction({
	auth: attioAuth,
	name: 'attio_list_workspace_members',
	outputSchema: attioListWorkspaceMembersOutputSchema,
	displayName: 'List Workspace Members',
	description: 'Lists the members of the workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists workspace members with ID, name, email and access level. Use it to resolve a person to the member ID or email that tasks, comments and actor attributes need.',
		idempotent: true,
	},
	props: {

	},
	async run(context) {
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/workspace_members`,
		});
		return { members: response.data, count: response.data.length };
	},
});
