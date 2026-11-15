import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { expenseReportOutputSchema } from '../../output-schemas';

export const generateExpenseReportAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_generate_expense_report',
	outputSchema: expenseReportOutputSchema,
	displayName: 'Generate Expense Report',
	description: 'Lists expenses in a period.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the expenses of the workspace in a period with totals, optionally filtered by project or user. Needs a Clockify plan with expenses (Pro or higher). Returns one page.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		dateRangeStart: clockifyAiProps.dateRangeStart({ required: true }),
		dateRangeEnd: clockifyAiProps.dateRangeEnd({ required: true }),
		projectIds: clockifyAiProps.idList({
			required: false,
			displayName: 'Project IDs',
			description: 'Optional: only these projects. Use List Projects.',
		}),
		userIds: clockifyAiProps.idList({
			required: false,
			displayName: 'User IDs',
			description: 'Optional: only these users. Use List Users.',
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.generateReport({
			auth,
			workspaceId: propsValue.workspaceId,
			kind: 'expenses/detailed',
			report: {
				dateRangeStart: propsValue.dateRangeStart,
				dateRangeEnd: propsValue.dateRangeEnd,
				exportType: 'JSON',
				projects: clockifyUtils.entityFilter({ ids: propsValue.projectIds }),
				users: clockifyUtils.entityFilter({ ids: propsValue.userIds }),
				page: propsValue.page ?? 1,
				pageSize: propsValue.pageSize ?? 50,
			},
		});
	},
});
