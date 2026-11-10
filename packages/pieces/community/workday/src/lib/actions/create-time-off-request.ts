import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const createTimeOffRequestAction = createAction({
	auth: workdayAuth,
	name: 'create_time_off_request',
	classification: 'WRITE',
	displayName: 'Create Time Off Request',
	description: 'Creates a new time off request in Workday.',
	audience: 'both',
	aiMetadata: {
		description:
			'Submits and auto-completes a time-off request for a worker (by WID) of a given time-off type, entering 8 requested hours for each day in the inclusive start-to-end date range, with an optional comment. Use to book vacation, sick, or other leave on a worker’s behalf. Not idempotent: each call enters a new time-off request.',
		idempotent: false,
	},
	props: {
		workerId: Property.ShortText({
			displayName: 'Worker ID',
			description: 'The ID of the worker requesting time off.',
			required: true,
		}),
		timeOffTypeId: Property.ShortText({
			displayName: 'Time Off Type ID',
			description:
				'Time off type as a Time_Off_Type_ID (e.g. `Vacation_Hours`, `Sick_Hours`) or a WID.',
			required: true,
		}),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description: 'Start date of the time off (YYYY-MM-DD).',
			required: true,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'End date of the time off (YYYY-MM-DD).',
			required: true,
		}),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'Optional comment for the request.',
			required: false,
		}),
		hoursPerDay: Property.Number({
			displayName: 'Hours per Day',
			description:
				'Hours requested for each weekday in the range (default: 8). Weekends are skipped.',
			required: false,
			defaultValue: 8,
		}),
	},
	async run({ auth, propsValue }) {
		return await workdayApi.createTimeOffRequest({
			auth,
			workerId: propsValue.workerId,
			timeOffTypeId: propsValue.timeOffTypeId,
			startDate: propsValue.startDate,
			endDate: propsValue.endDate,
			comment: propsValue.comment,
			hoursPerDay: propsValue.hoursPerDay,
		});
	},
});
