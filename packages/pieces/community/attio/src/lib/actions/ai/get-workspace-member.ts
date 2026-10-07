import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioGetWorkspaceMemberOutputSchema } from '../../output-schemas';

export const attioGetWorkspaceMemberAction = createAction({
	auth: attioAuth,
	name: 'attio_get_workspace_member',
	outputSchema: attioGetWorkspaceMemberOutputSchema,
	displayName: 'Get Workspace Member',
	description: 'Gets a workspace member by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one workspace member by ID.',
		idempotent: true,
	},
	props: {
		workspace_member_id: Property.ShortText({ displayName: 'Workspace Member ID', description: 'From List Workspace Members.', required: true }),
	},
	async run(context) {
		const { workspace_member_id } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/workspace_members/${workspace_member_id}`,
		});
		return response.data;
	},
});
