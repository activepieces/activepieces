import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAddTicketFollowersOutputSchema } from '../../../output-schemas';

export const zohoDeskAddTicketFollowersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_add_ticket_followers',
	outputSchema: zohoDeskAddTicketFollowersOutputSchema,
	displayName: 'Add Ticket Followers',
	description: 'Adds agents as followers of a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds agents (from List Agents) as followers of one ticket so they get its updates.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		followerIds: Property.Array({
			displayName: 'Agent IDs',
			description: 'Agent IDs to add as followers.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, followerIds } = context.propsValue;
		await zohoDeskApi.addTicketFollowers({
			auth: context.auth,
			orgId,
			ticketId,
			followerIds: zohoDeskUtils.requiredStringList({ value: followerIds, propName: 'Agent IDs' }),
		});
		return { success: true, ticketId, followerIds };
	},
});
