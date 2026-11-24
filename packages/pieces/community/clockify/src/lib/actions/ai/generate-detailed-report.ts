import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { detailedReportOutputSchema } from '../../output-schemas';

export const generateDetailedReportAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_generate_detailed_report',
	outputSchema: detailedReportOutputSchema,
	displayName: 'Generate Detailed Report',
	description: 'Lists every time entry in a period across the workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns the time entries of the whole workspace (all users) in a period, with totals, optionally filtered by project, user, client, tag or billable. Use it for timesheets and exports; for one user List Time Entries is enough. Returns one page; ask for the next page while there are more.',
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
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.generateReport({
			auth,
			workspaceId: propsValue.workspaceId,
			kind: 'detailed',
			report: {
				dateRangeStart: propsValue.dateRangeStart,
				dateRangeEnd: propsValue.dateRangeEnd,
				exportType: 'JSON',
				projects: clockifyUtils.entityFilter({ ids: propsValue.projectIds }),
				users: clockifyUtils.entityFilter({ ids: propsValue.userIds }),
				clients: clockifyUtils.entityFilter({ ids: propsValue.clientIds }),
				tags: clockifyUtils.entityFilter({ ids: propsValue.tagIds }),
				billable: clockifyUtils.toOptionalBoolean({ value: propsValue.billable }),
				detailedFilter: {
					page: propsValue.page ?? 1,
					pageSize: propsValue.pageSize ?? 50,
					sortColumn: 'DATE',
				},
			},
		});
	},
});
