import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { attendanceReportOutputSchema } from '../../output-schemas';

export const generateAttendanceReportAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_generate_attendance_report',
	outputSchema: attendanceReportOutputSchema,
	displayName: 'Generate Attendance Report',
	description: 'Daily first-in, last-out and break times per user.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Returns per-user, per-day attendance in a period: first start, last end, tracked time, breaks and overtime. Needs a Clockify plan with attendance (Standard or higher). Clockify counts whole days: From is moved to the start of its day and To to the end of its day (UTC). Returns one page.',
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
			kind: 'attendance',
			report: {
				dateRangeStart: `${propsValue.dateRangeStart.slice(0, 10)}T00:00:00.000Z`,
				dateRangeEnd: `${propsValue.dateRangeEnd.slice(0, 10)}T23:59:59.999Z`,
				exportType: 'JSON',
				projects: clockifyUtils.entityFilter({ ids: propsValue.projectIds }),
				users: clockifyUtils.entityFilter({ ids: propsValue.userIds }),
				clients: clockifyUtils.entityFilter({ ids: propsValue.clientIds }),
				tags: clockifyUtils.entityFilter({ ids: propsValue.tagIds }),
				billable: clockifyUtils.toOptionalBoolean({ value: propsValue.billable }),
				attendanceFilter: { page: propsValue.page ?? 1, pageSize: propsValue.pageSize ?? 50 },
			},
		});
	},
});
