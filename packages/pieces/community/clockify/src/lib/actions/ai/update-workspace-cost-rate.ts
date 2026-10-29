import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { workspaceOutputSchema } from '../../output-schemas';

export const updateWorkspaceCostRateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_workspace_cost_rate',
	outputSchema: workspaceOutputSchema,
	displayName: 'Update Workspace Cost Rate',
	description: 'Sets the default cost rate of a workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the workspace default cost (labour) rate, in cents. Needs workspace admin and a Clockify plan with cost rates (Pro or higher). Returns the updated workspace.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		amount: clockifyAiProps.rateAmount({ required: true }),
		since: clockifyAiProps.rateSince({ required: false }),
		includeApproved: clockifyAiProps.includeApproved({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.updateWorkspaceCostRate({
			auth,
			workspaceId: propsValue.workspaceId,
			amount: propsValue.amount,
			since: propsValue.since,
			includeApproved: propsValue.includeApproved,
		});
	},
});
