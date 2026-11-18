import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { projectOutputSchema } from '../../output-schemas';

export const updateProjectUserCostRateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_project_user_cost_rate',
	outputSchema: projectOutputSchema,
	displayName: 'Update Project User Cost Rate',
	description: 'Sets a member cost rate on one project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the cost rate, in cents, of one member on one project, overriding their workspace rate there. Needs workspace admin and a Clockify plan with cost rates (Pro or higher). Returns the updated project.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		userId: clockifyAiProps.userId({ required: true }),
		amount: clockifyAiProps.rateAmount({ required: true }),
		since: clockifyAiProps.rateSince({ required: false }),
		includeApproved: clockifyAiProps.includeApproved({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.updateProjectUserCostRate({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			userId: propsValue.userId,
			amount: propsValue.amount,
			since: propsValue.since,
			includeApproved: propsValue.includeApproved,
		});
	},
});
