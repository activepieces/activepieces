import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDownloadContractCommentAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDownloadThreadAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_download_thread_attachment',
	outputSchema: zohoDeskDownloadContractCommentAttachmentOutputSchema,
	displayName: 'Download Thread Attachment',
	description: 'Downloads a file attached to a ticket thread.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads one file attached to a ticket thread and returns it as a file. Thread and attachment IDs come from Get Ticket Thread (`attachments[].id`).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		threadId: Property.ShortText({
			displayName: 'Thread ID',
			description: 'Thread ID (from List Ticket Threads or Get Latest Ticket Thread).',
			required: true,
		}),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID from Get Ticket Thread (`attachments[].id`).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, threadId, attachmentId } = context.propsValue;
		const file = await zohoDeskApi.downloadThreadAttachment({
			auth: context.auth,
			orgId,
			ticketId,
			threadId,
			attachmentId,
		});
		const fileName = file.fileName ?? attachmentId;
		return { fileName, file: await context.files.write({ fileName, data: file.data }) };
	},
});
