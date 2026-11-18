import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { projectOutputSchema } from '../../output-schemas';

export const assignProjectUsersAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_assign_project_users',
	outputSchema: projectOutputSchema,
	displayName: 'Assign Project Users',
	description: 'Adds or removes users on a project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds the given users to a project as members, or removes them when Remove is set. Other members are untouched. Returns the updated project.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		userIds: Property.Array({
			displayName: 'User IDs',
			description: 'User IDs to add or remove. Use List Users to find them.',
			required: true,
		}),
		remove: Property.Checkbox({
			displayName: 'Remove',
			description: 'Remove these users instead of adding them. Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.assignProjectUsers({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			userIds: propsValue.userIds.map(String),
			remove: propsValue.remove ?? false,
		});
	},
});
