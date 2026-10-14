import { Property, createAction } from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const createTimeOffRequest = createAction({
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
			description: 'Hours requested for each weekday in the range (default: 8). Weekends are skipped.',
			required: false,
			defaultValue: 8,
		}),
	},
	async run(ctx) {
		const { workerId, timeOffTypeId, startDate, endDate, comment, hoursPerDay } =
			ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		const typeIdKind = WID_PATTERN.test(timeOffTypeId) ? 'WID' : 'Time_Off_Type_ID';
		const requested = hoursPerDay ?? 8;
		const start = new Date(startDate);
		const end = new Date(endDate);
		let entriesXml = '';
		const current = new Date(start);
		while (current <= end) {
			const isWeekend = current.getUTCDay() === 0 || current.getUTCDay() === 6;
			if (!isWeekend) {
				const dateStr = current.toISOString().split('T')[0];
				entriesXml += `
          <bsvc:Enter_Time_Off_Entry_Data>
            <bsvc:Date>${dateStr}</bsvc:Date>
            <bsvc:Requested>${requested}</bsvc:Requested>
            <bsvc:Time_Off_Type_Reference>
              <bsvc:ID bsvc:type="${typeIdKind}">${escapeXml(timeOffTypeId)}</bsvc:ID>
            </bsvc:Time_Off_Type_Reference>${comment ? `\n            <bsvc:Comment>${escapeXml(comment)}</bsvc:Comment>` : ''}
          </bsvc:Enter_Time_Off_Entry_Data>`;
			}
			current.setUTCDate(current.getUTCDate() + 1);
		}
		if (entriesXml === '') {
			throw new Error('The date range has no weekdays to request time off for.');
		}

		const operationXml = `
    <bsvc:Enter_Time_Off_Request xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Business_Process_Parameters>
        <bsvc:Auto_Complete>true</bsvc:Auto_Complete>
        <bsvc:Run_Now>true</bsvc:Run_Now>
      </bsvc:Business_Process_Parameters>
      <bsvc:Enter_Time_Off_Data>
        <bsvc:Worker_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(workerId)}</bsvc:ID>
        </bsvc:Worker_Reference>${entriesXml}
      </bsvc:Enter_Time_Off_Data>
    </bsvc:Enter_Time_Off_Request>`;

		return workdaySoapRequest(
			ctx.auth,
			'Absence_Management',
			operationXml,
		);
	},
});

const WID_PATTERN = /^[0-9a-f]{32}$/i;
