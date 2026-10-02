import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { habitFields } from '../../common/habit-fields';
import { ticktickCreateHabitOutputSchema } from '../../output-schemas';

export const createHabitAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_create_habit',
	outputSchema: ticktickCreateHabitOutputSchema,
	displayName: 'Create Habit',
	description: 'Creates a new habit.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a habit and returns it with its id. Check ticktick_list_habits first to avoid duplicates. Not idempotent, and the API has no delete-habit endpoint.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The habit name (max 1000 characters).',
			required: true,
		}),
		...habitFields.habitFieldProps(),
	},
	async run(context) {
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/habit',
			body: habitFields.buildHabitFields({ values: context.propsValue }),
		});
	},
});
