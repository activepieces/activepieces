import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTicketResolutionOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateTicketResolutionAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_ticket_resolution',
	outputSchema: zohoDeskGetTicketResolutionOutputSchema,
	displayName: 'Update Ticket Resolution',
	description: 'Sets the resolution note of a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the resolution note on one ticket, optionally emailing it to the contact. Use Delete Ticket Resolution to remove it.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		content: Property.LongText({
			displayName: 'Content',
			description: 'Resolution text.',
			required: true,
		}),
		isNotifyContact: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Notify Contact',
			description: "Yes emails the resolution to the ticket's contact.",
		}),
	},
	async run(context) {
		const { orgId, ticketId, content, isNotifyContact } = context.propsValue;
		return await zohoDeskApi.updateTicketResolution({
			auth: context.auth,
			orgId,
			ticketId,
			content,
			isNotifyContact,
		});
	},
});
