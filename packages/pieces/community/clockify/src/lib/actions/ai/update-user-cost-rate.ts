import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { workspaceOutputSchema } from '../../output-schemas';

export const updateUserCostRateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_user_cost_rate',
	outputSchema: workspaceOutputSchema,
	displayName: 'Update User Cost Rate',
	description: "Sets a user's cost rate in a workspace.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sets a member's cost (labour) rate in a workspace, in cents. Needs workspace admin and a Clockify plan with cost rates (Pro or higher). Returns the updated workspace.",
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({ required: true }),
		amount: clockifyAiProps.rateAmount({ required: true }),
		since: clockifyAiProps.rateSince({ required: false }),
		includeApproved: clockifyAiProps.includeApproved({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.updateUserCostRate({
			auth,
			workspaceId: propsValue.workspaceId,
			userId: propsValue.userId,
			amount: propsValue.amount,
			since: propsValue.since,
			includeApproved: propsValue.includeApproved,
		});
	},
});
