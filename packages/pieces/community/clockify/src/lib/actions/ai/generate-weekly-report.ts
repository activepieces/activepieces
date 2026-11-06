import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { weeklyReportOutputSchema } from '../../output-schemas';

export const generateWeeklyReportAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_generate_weekly_report',
	outputSchema: weeklyReportOutputSchema,
	displayName: 'Generate Weekly Report',
	description: 'Tracked time per day of the week, by project or user.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns tracked time per day for a period, as a grid by project or by user, with daily totals. Use it for weekly timesheet overviews.',
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
		group: Property.StaticDropdown({
			displayName: 'Group By',
			description: 'Rows of the weekly grid. Default Project.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Project', value: 'PROJECT' },
					{ label: 'User', value: 'USER' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.generateReport({
			auth,
			workspaceId: propsValue.workspaceId,
			kind: 'weekly',
			report: {
				dateRangeStart: propsValue.dateRangeStart,
				dateRangeEnd: propsValue.dateRangeEnd,
				exportType: 'JSON',
				projects: clockifyUtils.entityFilter({ ids: propsValue.projectIds }),
				users: clockifyUtils.entityFilter({ ids: propsValue.userIds }),
				clients: clockifyUtils.entityFilter({ ids: propsValue.clientIds }),
				tags: clockifyUtils.entityFilter({ ids: propsValue.tagIds }),
				billable: clockifyUtils.toOptionalBoolean({ value: propsValue.billable }),
				weeklyFilter: {
					group: propsValue.group ?? 'PROJECT',
					subgroup: 'TIME',
				},
			},
		});
	},
});
