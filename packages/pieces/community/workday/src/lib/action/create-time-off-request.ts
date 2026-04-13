import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const createTimeOffRequest = createAction({
	auth: workdayAuth,
	name: 'create_time_off_request',
	displayName: 'Create Time Off Request',
	description: 'Creates a new time off request in Workday.',
	props: {
		workerId: Property.ShortText({
			displayName: 'Worker ID',
			description: 'The ID of the worker requesting time off.',
			required: true,
		}),
		timeOffTypeId: Property.ShortText({
			displayName: 'Time Off Type ID',
			description: 'The time off type reference ID (e.g., vacation, sick).',
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
	},
	async run(ctx) {
		const { workerId, timeOffTypeId, startDate, endDate, comment } =
			ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		// Build entry for each day between start and end
		const start = new Date(startDate);
		const end = new Date(endDate);
		let entriesXml = '';
		const current = new Date(start);
		while (current <= end) {
			const dateStr = current.toISOString().split('T')[0];
			entriesXml += `
          <bsvc:Enter_Time_Off_Entry_Data>
            <bsvc:Date>${dateStr}</bsvc:Date>
            <bsvc:Requested>8</bsvc:Requested>
            <bsvc:Time_Off_Type_Reference>
              <bsvc:ID bsvc:type="WID">${escapeXml(timeOffTypeId)}</bsvc:ID>
            </bsvc:Time_Off_Type_Reference>${comment ? `\n            <bsvc:Comment>${escapeXml(comment)}</bsvc:Comment>` : ''}
          </bsvc:Enter_Time_Off_Entry_Data>`;
			current.setDate(current.getDate() + 1);
		}

		const operationXml = `
    <bsvc:Enter_Time_Off_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
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
			ctx.auth as OAuth2PropertyValue,
			'Absence_Management',
			operationXml,
		);
	},
});
