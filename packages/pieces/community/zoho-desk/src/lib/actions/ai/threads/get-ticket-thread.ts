import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTicketThreadOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTicketThreadAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_ticket_thread',
	outputSchema: zohoDeskGetTicketThreadOutputSchema,
	displayName: 'Get Ticket Thread',
	description: 'Gets one thread on a ticket with its full content.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one thread on a ticket with its full content (HTML `content` and `plainText`) and its attachments; the attachment ids feed Download Thread Attachment. Long content is fetched in full, never truncated.',
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
	},
	async run(context) {
		const { orgId, ticketId, threadId } = context.propsValue;
		return await zohoDeskApi.getTicketThread({ auth: context.auth, orgId, ticketId, threadId });
	},
});
