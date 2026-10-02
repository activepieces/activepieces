import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickGetUserPreferencesOutputSchema } from '../../output-schemas';

export const getUserPreferencesAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_get_user_preferences',
	outputSchema: ticktickGetUserPreferencesOutputSchema,
	displayName: 'Get User Preferences',
	description: 'Retrieves the preferences of the connected account.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the current user\'s preferences, including their IANA time zone. Use it to interpret or set task dates in the user\'s time zone. Read-only, despite using POST.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/preference',
		});
	},
});
