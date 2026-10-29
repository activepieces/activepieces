import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { workspaceOutputSchema } from '../../output-schemas';

export const updateUserStatusAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_user_status',
	outputSchema: workspaceOutputSchema,
	displayName: 'Update User Status',
	description: 'Activates or deactivates a workspace member.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Sets a workspace member to ACTIVE or INACTIVE. Inactive users keep their data but cannot track time in the workspace. Needs workspace admin. Returns the updated workspace.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({ required: true }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Active', value: 'ACTIVE' },
					{ label: 'Inactive', value: 'INACTIVE' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.updateUserStatus({
			auth,
			workspaceId: propsValue.workspaceId,
			userId: propsValue.userId,
			status: propsValue.status,
		});
	},
});
