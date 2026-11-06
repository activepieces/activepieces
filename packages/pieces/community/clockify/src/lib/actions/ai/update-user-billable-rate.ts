import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { workspaceOutputSchema } from '../../output-schemas';

export const updateUserBillableRateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_user_billable_rate',
	outputSchema: workspaceOutputSchema,
	displayName: 'Update User Billable Rate',
	description: "Sets a user's billable rate in a workspace.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Sets a member's billable (hourly) rate in a workspace, in cents, overriding the workspace default. Needs workspace admin. Returns the updated workspace.",
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
		return await clockifyApi.updateUserBillableRate({
			auth,
			workspaceId: propsValue.workspaceId,
			userId: propsValue.userId,
			amount: propsValue.amount,
			since: propsValue.since,
			includeApproved: propsValue.includeApproved,
		});
	},
});
