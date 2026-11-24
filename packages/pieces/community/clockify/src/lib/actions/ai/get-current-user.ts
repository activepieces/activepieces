import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyApi } from '../../common/api';
import { currentUserOutputSchema } from '../../output-schemas';

export const getCurrentUserAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_current_user',
	outputSchema: currentUserOutputSchema,
	displayName: 'Get Current User',
	description: 'Gets the user the connection belongs to.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the connected Clockify user: ID, name, email, active and default workspace IDs and settings. Use it to get your own user ID for actions that take one.',
		idempotent: true,
	},
	props: {
		includeMemberships: Property.Checkbox({
			displayName: 'Include Memberships',
			description:
				'Also return the user memberships (workspaces and projects the user belongs to). Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.getCurrentUser({
			auth,
			query: propsValue.includeMemberships ? { 'include-memberships': 'true' } : {},
		});
	},
});
