import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { projectOutputSchema } from '../../output-schemas';

export const updateProjectUserBillableRateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_project_user_billable_rate',
	outputSchema: projectOutputSchema,
	displayName: 'Update Project User Billable Rate',
	description: 'Sets a member billable rate on one project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the billable rate, in cents, of one member on one project, overriding their workspace rate there. Needs workspace admin. Returns the updated project.',
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
		return await clockifyApi.updateProjectUserBillableRate({
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
