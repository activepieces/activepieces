import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetLatestTicketThreadOutputSchema } from '../../../output-schemas';

export const zohoDeskGetLatestTicketThreadAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_latest_ticket_thread',
	outputSchema: zohoDeskGetLatestTicketThreadOutputSchema,
	displayName: 'Get Latest Ticket Thread',
	description: 'Gets the most recent thread on a ticket.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets the most recent thread on one ticket, optionally only public or only incoming (customer) threads. Use it to read the customer's latest message before replying.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		needPublic: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Public Only',
			description: 'Yes returns the latest public thread only.',
		}),
		needIncomingThread: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Incoming Only',
			description: 'Yes returns the latest incoming (customer) thread only.',
		}),
	},
	async run(context) {
		const { orgId, ticketId, needPublic, needIncomingThread } = context.propsValue;
		return await zohoDeskApi.getLatestTicketThread({
			auth: context.auth,
			orgId,
			ticketId,
			needPublic,
			needIncomingThread,
		});
	},
});
