import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { projectOutputSchema } from '../../output-schemas';

export const updateProjectEstimateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_project_estimate',
	outputSchema: projectOutputSchema,
	displayName: 'Update Project Estimate',
	description: 'Sets the time or budget estimate of a project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets a manual time estimate (ISO 8601 duration) and/or budget estimate (in cents) on a project, optionally resetting every week, month or year. Set Disable to turn an estimate off. Returns the updated project.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		timeEstimate: Property.ShortText({
			displayName: 'Time Estimate',
			description: 'Total time estimate as an ISO 8601 duration, for example PT120H.',
			required: false,
		}),
		budgetEstimate: Property.Number({
			displayName: 'Budget Estimate',
			description: 'Budget estimate in cents, for example 500000 for 5000.00.',
			required: false,
		}),
		resetOption: Property.StaticDropdown({
			displayName: 'Reset',
			description: 'Optional: restart the estimate every period.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Weekly', value: 'WEEKLY' },
					{ label: 'Monthly', value: 'MONTHLY' },
					{ label: 'Yearly', value: 'YEARLY' },
				],
			},
		}),
		disableTimeEstimate: Property.Checkbox({
			displayName: 'Disable Time Estimate',
			description: 'Turn the time estimate off. Default false.',
			required: false,
		}),
		disableBudgetEstimate: Property.Checkbox({
			displayName: 'Disable Budget Estimate',
			description: 'Turn the budget estimate off. Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		if (propsValue.disableTimeEstimate && propsValue.timeEstimate !== undefined) {
			throw new Error('Set either Time Estimate or Disable Time Estimate, not both.');
		}
		if (propsValue.disableBudgetEstimate && propsValue.budgetEstimate !== undefined) {
			throw new Error('Set either Budget Estimate or Disable Budget Estimate, not both.');
		}
		return await clockifyApi.updateProjectEstimate({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			estimate: {
				timeEstimate: propsValue.disableTimeEstimate
					? { active: false, type: 'MANUAL' }
					: propsValue.timeEstimate === undefined
					? undefined
					: {
							active: true,
							estimate: propsValue.timeEstimate,
							type: 'MANUAL',
							resetOption: propsValue.resetOption,
							includeNonBillable: true,
					  },
				budgetEstimate: propsValue.disableBudgetEstimate
					? { active: false, type: 'MANUAL' }
					: propsValue.budgetEstimate === undefined
					? undefined
					: {
							active: true,
							estimate: propsValue.budgetEstimate,
							type: 'MANUAL',
							resetOption: propsValue.resetOption,
					  },
			},
		});
	},
});
