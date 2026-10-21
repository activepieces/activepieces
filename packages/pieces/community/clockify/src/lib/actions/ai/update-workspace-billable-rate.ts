import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { workspaceOutputSchema } from '../../output-schemas';

export const updateWorkspaceBillableRateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_workspace_billable_rate',
	outputSchema: workspaceOutputSchema,
	displayName: 'Update Workspace Billable Rate',
	description: 'Sets the default billable rate of a workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the workspace default billable (hourly) rate, in cents, and its currency. Users, projects and tasks without their own rate inherit it. Needs workspace admin. Returns the updated workspace.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		amount: clockifyAiProps.rateAmount({ required: true }),
		currency: Property.ShortText({
			displayName: 'Currency',
			description: 'Currency code, for example USD.',
			required: true,
		}),
		since: clockifyAiProps.rateSince({ required: false }),
		includeApproved: clockifyAiProps.includeApproved({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.updateWorkspaceBillableRate({
			auth,
			workspaceId: propsValue.workspaceId,
			amount: propsValue.amount,
			currency: propsValue.currency,
			since: propsValue.since,
			includeApproved: propsValue.includeApproved,
		});
	},
});
