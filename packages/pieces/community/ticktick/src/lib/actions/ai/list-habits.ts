import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickListHabitsOutputSchema } from '../../output-schemas';

export const listHabitsAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_habits',
	outputSchema: ticktickListHabitsOutputSchema,
	displayName: 'List Habits',
	description: 'Lists the habits of the connected account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists all habits with their ids, names, goals and repeat rules. Use to get the habitId for other habit actions. Read-only.',
		idempotent: true,
	},
	props: {},
	async run(context) {
		const habits = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: '/habit',
		});
		return { habits, count: habits.length };
	},
});
