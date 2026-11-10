import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountFollowersOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactFollowersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contact_followers',
	outputSchema: zohoDeskListAccountFollowersOutputSchema,
	displayName: 'List Contact Followers',
	description: 'Lists the agents following a contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the agents following one contact.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, contactId, from, limit } = context.propsValue;
		const followers = await zohoDeskApi.listContactFollowers({
			auth: context.auth,
			orgId,
			contactId,
			from,
			limit,
		});
		return { followers, count: followers.length };
	},
});
