import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceApi } from '../../common/api';
import { confluenceGetCurrentUserOutputSchema } from '../../output-schemas';

export const getUserAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_user',
	outputSchema: confluenceGetCurrentUserOutputSchema,
	displayName: 'Get User',
	description: 'Gets a user by account ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one Confluence user by Atlassian account ID: display name, public name, email (when visible), time zone and account status. Use Find User to search by name or email.',
		idempotent: true,
	},
	props: {
		accountId: Property.ShortText({
			displayName: 'Account ID',
			description: 'Atlassian account ID, e.g. from a page authorId or Find User.',
			required: true,
		}),
	},
	async run(context) {
		return await confluenceApi.getUser({
			auth: context.auth,
			accountId: context.propsValue.accountId,
		});
	},
});
