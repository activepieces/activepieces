import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { summaryReportOutputSchema } from '../../output-schemas';

export const generateSummaryReportAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_generate_summary_report',
	outputSchema: summaryReportOutputSchema,
	displayName: 'Generate Summary Report',
	description: 'Totals tracked time in a period, grouped.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns total tracked time and amounts in a period, grouped by up to three levels (project, client, user, task, tag, date...), optionally filtered by project, user, client, tag or billable. Use it for "how much time did we spend on X".',
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
		clientIds: clockifyAiProps.idList({
			required: false,
			displayName: 'Client IDs',
			description: 'Optional: only these clients. Use List Clients.',
		}),
		tagIds: clockifyAiProps.idList({
			required: false,
			displayName: 'Tag IDs',
			description: 'Optional: only entries with these tags. Use List Tags.',
		}),
		billable: Property.StaticDropdown({
			displayName: 'Billable',
			description: 'Optional: only billable (Yes) or non-billable (No) time. Empty = both.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
		groups: Property.StaticMultiSelectDropdown({
			displayName: 'Group By',
			description: 'Up to three levels of grouping, in order. Default Project.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Project', value: 'PROJECT' },
					{ label: 'Client', value: 'CLIENT' },
					{ label: 'User', value: 'USER' },
					{ label: 'User Group', value: 'USER_GROUP' },
					{ label: 'Task', value: 'TASK' },
					{ label: 'Tag', value: 'TAG' },
					{ label: 'Date', value: 'DATE' },
					{ label: 'Week', value: 'WEEK' },
					{ label: 'Month', value: 'MONTH' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.generateReport({
			auth,
			workspaceId: propsValue.workspaceId,
			kind: 'summary',
			report: {
				dateRangeStart: propsValue.dateRangeStart,
				dateRangeEnd: propsValue.dateRangeEnd,
				exportType: 'JSON',
				projects: clockifyUtils.entityFilter({ ids: propsValue.projectIds }),
				users: clockifyUtils.entityFilter({ ids: propsValue.userIds }),
				clients: clockifyUtils.entityFilter({ ids: propsValue.clientIds }),
				tags: clockifyUtils.entityFilter({ ids: propsValue.tagIds }),
				billable: clockifyUtils.toOptionalBoolean({ value: propsValue.billable }),
				summaryFilter: {
					groups:
						propsValue.groups && propsValue.groups.length > 0 ? propsValue.groups : ['PROJECT'],
				},
			},
		});
	},
});
