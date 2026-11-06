import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListContactProfilesOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactProfilesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contact_profiles',
	outputSchema: zohoDeskListContactProfilesOutputSchema,
	displayName: 'List Contact Profiles',
	description: 'Lists the social and channel profiles of a contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the channel profiles (email, social, chat) linked to one contact.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
	},
	async run(context) {
		const { orgId, contactId } = context.propsValue;
		const profiles = await zohoDeskApi.listContactProfiles({
			auth: context.auth,
			orgId,
			contactId,
		});
		return { profiles, count: profiles.length };
	},
});
