import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteTaskAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteTaskAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_task_attachment',
	outputSchema: zohoDeskDeleteTaskAttachmentOutputSchema,
	displayName: 'Delete Task Attachment',
	description: 'Deletes a file attached to a task.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes one file attached to a task.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID (from List Task Attachments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, taskId, attachmentId } = context.propsValue;
		await zohoDeskApi.deleteTaskAttachment({ auth: context.auth, orgId, taskId, attachmentId });
		return { success: true, taskId, attachmentId };
	},
});
