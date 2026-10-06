import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickListCountdownsOutputSchema } from '../../output-schemas';

export const listCountdownsAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_countdowns',
	outputSchema: ticktickListCountdownsOutputSchema,
	displayName: 'List Countdowns',
	description: 'Lists the countdowns of the connected account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the account\'s countdowns (named dates counting down to or up from an event). Read-only.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const countdowns = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: '/countdown',
		});
		return { countdowns, count: countdowns.length };
	},
});
