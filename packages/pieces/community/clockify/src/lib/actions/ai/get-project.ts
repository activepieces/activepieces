import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { projectOutputSchema } from '../../output-schemas';

export const getProjectAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_project',
	outputSchema: projectOutputSchema,
	displayName: 'Get Project',
	description: 'Gets a project by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one Clockify project by ID: name, client, color, billable and archived state, rates, estimates and memberships.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.getProject({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
		});
	},
});
