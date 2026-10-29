import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { workspaceOutputSchema } from '../../output-schemas';

export const getWorkspaceAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_workspace',
	outputSchema: workspaceOutputSchema,
	displayName: 'Get Workspace',
	description: 'Gets a workspace by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one Clockify workspace by ID: name, billable and cost rates, currencies, members and workspace settings (time rounding, feature flags, plan features).',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.getWorkspace({ auth, workspaceId: propsValue.workspaceId });
	},
});
