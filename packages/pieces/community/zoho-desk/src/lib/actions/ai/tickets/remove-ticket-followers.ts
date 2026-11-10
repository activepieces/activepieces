import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAddTicketFollowersOutputSchema } from '../../../output-schemas';

export const zohoDeskRemoveTicketFollowersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_remove_ticket_followers',
	outputSchema: zohoDeskAddTicketFollowersOutputSchema,
	displayName: 'Remove Ticket Followers',
	description: 'Removes followers from a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Removes agents from the followers of one ticket.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		followerIds: Property.Array({
			displayName: 'Agent IDs',
			description: 'Agent IDs to remove.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, followerIds } = context.propsValue;
		await zohoDeskApi.removeTicketFollowers({
			auth: context.auth,
			orgId,
			ticketId,
			followerIds: zohoDeskUtils.requiredStringList({ value: followerIds, propName: 'Agent IDs' }),
		});
		return { success: true, ticketId, followerIds };
	},
});
