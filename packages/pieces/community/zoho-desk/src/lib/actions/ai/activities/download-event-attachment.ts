import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDownloadContractCommentAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDownloadEventAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_download_event_attachment',
	outputSchema: zohoDeskDownloadContractCommentAttachmentOutputSchema,
	displayName: 'Download Event Attachment',
	description: 'Downloads a file attached to a event.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Downloads one file attached to a event and returns it as a file.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		eventId: Property.ShortText({
			displayName: 'Event ID',
			description: 'Event ID (from List Events or Search Events).',
			required: true,
		}),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID (from List Event Attachments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, eventId, attachmentId } = context.propsValue;
		const file = await zohoDeskApi.downloadEventAttachment({
			auth: context.auth,
			orgId,
			eventId,
			attachmentId,
		});
		const fileName = file.fileName ?? attachmentId;
		return { fileName, file: await context.files.write({ fileName, data: file.data }) };
	},
});
