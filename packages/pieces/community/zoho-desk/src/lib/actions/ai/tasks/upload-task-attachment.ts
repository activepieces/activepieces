import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUploadAccountAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskUploadTaskAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_upload_task_attachment',
	outputSchema: zohoDeskUploadAccountAttachmentOutputSchema,
	displayName: 'Upload Task Attachment',
	description: 'Attaches a file to a task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file and attaches it to one task. Not idempotent: each call adds another copy.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
		file: Property.File({ displayName: 'File', description: 'File to attach.', required: true }),
	},
	async run(context) {
		const { orgId, taskId, file } = context.propsValue;
		return await zohoDeskApi.uploadTaskAttachment({ auth: context.auth, orgId, taskId, file });
	},
});
