import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickCheckinHabitOutputSchema } from '../../output-schemas';

export const checkinHabitAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_checkin_habit',
	outputSchema: ticktickCheckinHabitOutputSchema,
	displayName: 'Check In Habit',
	description: 'Creates or updates the check-in of a habit for one date.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Records a check-in for a habit (habitId from ticktick_list_habits) on one date given as a YYYYMMDD stamp, with an optional value and goal (both default to 1). Creates the check-in or overwrites the one for that date, so repeating it is safe.',
		idempotent: true,
	},
	props: {
		habitId: Property.ShortText({
			displayName: 'Habit ID',
			description: 'The habit ID, from the List Habits action.',
			required: true,
		}),
		stamp: Property.Number({
			displayName: 'Date',
			description: 'The check-in date as YYYYMMDD, for example 20260407.',
			required: true,
		}),
		time: Property.DateTime({
			displayName: 'Check-in Time',
			required: false,
		}),
		value: Property.Number({
			displayName: 'Value',
			description: 'Check-in value. Defaults to 1.',
			required: false,
		}),
		goal: Property.Number({
			displayName: 'Goal',
			description: 'Check-in goal. Defaults to 1.',
			required: false,
		}),
	},
	async run(context) {
		const { habitId, stamp, time, value, goal } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/habit/${habitId}/checkin`,
			body: {
				stamp,
				...(time ? { time: taskFields.formatDate({ value: time }) } : {}),
				...(value !== undefined ? { value } : {}),
				...(goal !== undefined ? { goal } : {}),
			},
		});
	},
});
