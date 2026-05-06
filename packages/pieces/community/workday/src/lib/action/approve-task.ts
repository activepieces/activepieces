import {
	OAuth2PropertyValue,
	Property,
	createAction,
} from '@activepieces/pieces-framework';
import { workdayAuth } from '../auth';
import { workdaySoapRequest } from '../common';

export const approveTask = createAction({
	auth: workdayAuth,
	name: 'approve_task',
	displayName: 'Approve Task',
	description: 'Approves an inbox task in Workday.',
	props: {
		taskId: Property.ShortText({
			displayName: 'Task ID',
			description: 'The ID of the inbox task to approve.',
			required: true,
		}),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'Optional comment for the approval.',
			required: false,
		}),
	},
	async run(ctx) {
		const { taskId, comment } = ctx.propsValue;

		const escapeXml = (s: string) =>
			s
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;');

		let commentXml = '';
		if (comment) {
			commentXml = `
      <bsvc:Business_Process_Comment_Data>
        <bsvc:Comment>${escapeXml(comment)}</bsvc:Comment>
      </bsvc:Business_Process_Comment_Data>`;
		}

		const operationXml = `
    <bsvc:Approve_Business_Process_Request bsvc:version="v46.0" xmlns:bsvc="urn:com.workday/bsvc">
      <bsvc:Event_Reference>
        <bsvc:ID bsvc:type="WID">${escapeXml(taskId)}</bsvc:ID>
      </bsvc:Event_Reference>${commentXml}
    </bsvc:Approve_Business_Process_Request>`;

		return workdaySoapRequest(
			ctx.auth as OAuth2PropertyValue,
			'Integrations',
			operationXml,
		);
	},
});
