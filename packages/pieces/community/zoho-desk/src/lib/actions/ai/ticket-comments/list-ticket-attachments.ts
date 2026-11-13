import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketAttachmentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketAttachmentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_attachments',
	outputSchema: zohoDeskListTicketAttachmentsOutputSchema,
	displayName: 'List Ticket Attachments',
	description: 'Lists the files attached to a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the files attached directly to one ticket, with name, size and download link (`href`).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		isPublic: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Public Only',
			description: 'Yes returns only public attachments, No only private ones.',
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, ticketId, isPublic, from, limit } = context.propsValue;
		const attachments = await zohoDeskApi.listTicketAttachments({
			auth: context.auth,
			orgId,
			ticketId,
			isPublic,
			from,
			limit,
		});
		return { attachments, count: attachments.length };
	},
});
