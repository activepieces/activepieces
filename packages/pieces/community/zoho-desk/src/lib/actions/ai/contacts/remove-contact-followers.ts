import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAddContactFollowersOutputSchema } from '../../../output-schemas';

export const zohoDeskRemoveContactFollowersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_remove_contact_followers',
	outputSchema: zohoDeskAddContactFollowersOutputSchema,
	displayName: 'Remove Contact Followers',
	description: 'Removes followers from a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Removes agents from the followers of one contact.',
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
			description: 'Agent IDs to remove.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactId, followerIds } = context.propsValue;
		await zohoDeskApi.removeContactFollowers({
			auth: context.auth,
			orgId,
			contactId,
			followerIds: zohoDeskUtils.requiredStringList({ value: followerIds, propName: 'Agent IDs' }),
		});
		return { success: true, contactId, followerIds };
	},
});
