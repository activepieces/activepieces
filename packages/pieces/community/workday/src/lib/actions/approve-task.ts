import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const approveTaskAction = createAction({
	auth: workdayAuth,
	name: 'approve_task',
	classification: 'WRITE',
	displayName: 'Approve Task',
	description: 'Approves an inbox task in Workday.',
	audience: 'both',
	aiMetadata: {
		description:
			'Approves a pending Workday business-process inbox task, identified by its task WID, optionally attaching an approval comment. Use to advance an awaiting-approval step (e.g. a time-off or hiring request) once a decision is made. Not idempotent: it submits an approval event each call and the task can only be approved once.',
		idempotent: false,
	},
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
	async run({ auth, propsValue }) {
		return await workdayApi.approveTask({
			auth,
			taskId: propsValue.taskId,
			comment: propsValue.comment,
		});
	},
});
