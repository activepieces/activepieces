import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAddContactFollowersOutputSchema } from '../../../output-schemas';

export const zohoDeskAddContactFollowersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_add_contact_followers',
	outputSchema: zohoDeskAddContactFollowersOutputSchema,
	displayName: 'Add Contact Followers',
	description: 'Adds agents as followers of a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds agents (from List Agents) as followers of one contact so they get its updates.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		followerIds: Property.Array({
			displayName: 'Agent IDs',
			description: 'Agent IDs to add as followers.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactId, followerIds } = context.propsValue;
		await zohoDeskApi.addContactFollowers({
			auth: context.auth,
			orgId,
			contactId,
			followerIds: zohoDeskUtils.requiredStringList({ value: followerIds, propName: 'Agent IDs' }),
		});
		return { success: true, contactId, followerIds };
	},
});
