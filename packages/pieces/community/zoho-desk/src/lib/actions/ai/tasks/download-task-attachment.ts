import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDownloadContractCommentAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDownloadTaskAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_download_task_attachment',
	outputSchema: zohoDeskDownloadContractCommentAttachmentOutputSchema,
	displayName: 'Download Task Attachment',
	description: 'Downloads a file attached to a task.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Downloads one file attached to a task and returns it as a file.',
		idempotent: true,
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
		const file = await zohoDeskApi.downloadTaskAttachment({
			auth: context.auth,
			orgId,
			taskId,
			attachmentId,
		});
		const fileName = file.fileName ?? attachmentId;
		return { fileName, file: await context.files.write({ fileName, data: file.data }) };
	},
});
