import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { projectOutputSchema } from '../../output-schemas';

export const updateProjectMembershipsAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_project_memberships',
	outputSchema: projectOutputSchema,
	displayName: 'Replace Project Members',
	description: 'Replaces the whole member list of a project.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Replaces the member list of a project with exactly the given users: anyone left out loses access to the project. To add or remove a few users without touching the rest, use Assign Project Users instead.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		userIds: Property.Array({
			displayName: 'User IDs',
			description: 'The full list of user IDs that should be members. Use List Users to find them.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.replaceProjectMemberships({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			userIds: propsValue.userIds.map(String),
		});
	},
});
