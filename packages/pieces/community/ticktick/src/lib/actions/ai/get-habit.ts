import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCreateHabitOutputSchema } from '../../output-schemas';

export const getHabitAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_get_habit',
	outputSchema: ticktickCreateHabitOutputSchema,
	displayName: 'Get Habit',
	description: 'Retrieves a habit by its ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Fetches one habit in full by habitId from ticktick_list_habits. Read-only.',
		idempotent: true,
	},
	props: {
		habitId: Property.ShortText({
			displayName: 'Habit ID',
			description: 'The habit ID, from the List Habits action.',
			required: true,
		}),
	},
	async run(context) {
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/habit/${context.propsValue.habitId}`,
		});
	},
});
