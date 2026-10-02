import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { habitFields } from '../../common/habit-fields';
import { ticktickCreateHabitOutputSchema } from '../../output-schemas';

export const updateHabitAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_update_habit',
	outputSchema: ticktickCreateHabitOutputSchema,
	displayName: 'Update Habit',
	description: 'Updates fields of an existing habit.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you supply on a habit identified by habitId from ticktick_list_habits; omitted fields are not sent. Empty values cannot clear a field. Sets state, so repeating it is safe.',
		idempotent: true,
	},
	props: {
		habitId: Property.ShortText({
			displayName: 'Habit ID',
			description: 'The habit ID, from the List Habits action.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The new habit name (max 1000 characters).',
			required: false,
		}),
		...habitFields.habitFieldProps(),
	},
	async run(context) {
		const { habitId, ...values } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/habit/${habitId}`,
			body: habitFields.buildHabitFields({ values }),
		});
	},
});
