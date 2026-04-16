import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const createWorkerTimeBlock = createAction({
	auth: workdayAuth,
	name: 'create_worker_time_block',
	displayName: 'Create Worker Time Block',
	description: 'Creates a new worker time block in Workday.',
	props: {
		workerId: Property.ShortText({
			displayName: 'Worker ID',
			description: 'The ID of the worker.',
			required: true,
		}),
		date: Property.ShortText({
			displayName: 'Date',
			description: 'Date of the time block (YYYY-MM-DD).',
			required: true,
		}),
		hours: Property.Number({
			displayName: 'Hours',
			description: 'Number of hours worked.',
			required: true,
		}),
		timeTypeId: Property.ShortText({
			displayName: 'Time Type ID',
			description: 'Time type reference ID.',
			required: false,
		}),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'Optional comment.',
			required: false,
		}),
	},
	async run(ctx) {
		const { workerId, date, hours, timeTypeId, comment } = ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		let timeEntryCodeXml = '';
		if (timeTypeId) {
			timeEntryCodeXml = `
          <bsvc:Time_Entry_Code_Reference>
            <bsvc:ID bsvc:type="WID">${escapeXml(timeTypeId)}</bsvc:ID>
          </bsvc:Time_Entry_Code_Reference>`;
		}

		let commentXml = '';
		if (comment) {
			commentXml = `
          <bsvc:Comment>${escapeXml(comment)}</bsvc:Comment>`;
		}

		const operationXml = `
    <bsvc:Import_Reported_Time_Blocks_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Reported_Time_Block_Data>
        <bsvc:Worker_Reference>
          <bsvc:ID bsvc:type="WID">${escapeXml(workerId)}</bsvc:ID>
        </bsvc:Worker_Reference>
        <bsvc:Date>${escapeXml(date)}</bsvc:Date>
        <bsvc:Quantity>${hours}</bsvc:Quantity>${timeEntryCodeXml}${commentXml}
      </bsvc:Reported_Time_Block_Data>
    </bsvc:Import_Reported_Time_Blocks_Request>`;

		return workdaySoapRequest(
			ctx.auth as OAuth2PropertyValue,
			'Time_Tracking',
			operationXml,
		);
	},
});
