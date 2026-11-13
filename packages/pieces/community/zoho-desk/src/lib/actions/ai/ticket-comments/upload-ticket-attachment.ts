import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUploadTicketAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskUploadTicketAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_upload_ticket_attachment',
	outputSchema: zohoDeskUploadTicketAttachmentOutputSchema,
	displayName: 'Upload Ticket Attachment',
	description: 'Attaches a file to a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file and attaches it to one ticket, private unless Is Public is Yes. Not idempotent: each call adds another copy.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		file: Property.File({ displayName: 'File', description: 'File to attach.', required: true }),
		isPublic: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Public',
			description: 'Yes shows the file to the contact in the help center.',
		}),
	},
	async run(context) {
		const { orgId, ticketId, file, isPublic } = context.propsValue;
		return await zohoDeskApi.uploadTicketAttachment({
			auth: context.auth,
			orgId,
			ticketId,
			file,
			isPublic,
		});
	},
});
