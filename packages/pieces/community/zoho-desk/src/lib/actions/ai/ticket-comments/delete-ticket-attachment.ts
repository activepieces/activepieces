import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteTicketAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteTicketAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_ticket_attachment',
	outputSchema: zohoDeskDeleteTicketAttachmentOutputSchema,
	displayName: 'Delete Ticket Attachment',
	description: 'Deletes a file attached to a ticket.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one file attached to a ticket (attachment ID from List Ticket Attachments).',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID (from List Ticket Attachments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, attachmentId } = context.propsValue;
		await zohoDeskApi.deleteTicketAttachment({ auth: context.auth, orgId, ticketId, attachmentId });
		return { success: true, ticketId, attachmentId };
	},
});
