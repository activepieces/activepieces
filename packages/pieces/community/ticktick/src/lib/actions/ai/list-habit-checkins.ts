import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickListHabitCheckinsOutputSchema } from '../../output-schemas';

export const listHabitCheckinsAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_habit_checkins',
	outputSchema: ticktickListHabitCheckinsOutputSchema,
	displayName: 'List Habit Check-Ins',
	description: 'Lists the check-ins of one or more habits within a date range.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists check-ins for the given habitIds (from ticktick_list_habits) between two YYYYMMDD stamps. Read-only.',
		idempotent: true,
	},
	props: {
		habitIds: Property.Array({
			displayName: 'Habit IDs',
			description: 'The habit IDs, from the List Habits action.',
			required: true,
		}),
		from: Property.Number({
			displayName: 'From',
			description: 'Start date as YYYYMMDD, for example 20260401.',
			required: true,
		}),
		to: Property.Number({
			displayName: 'To',
			description: 'End date as YYYYMMDD, for example 20260407.',
			required: true,
		}),
	},
	async run(context) {
		const { habitIds, from, to } = context.propsValue;
		const habitIdList = taskFields.toStringArray({ value: habitIds }) ?? [];
		if (habitIdList.length === 0) {
			throw new Error('Habit IDs must contain at least one id.');
		}
		const checkins = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: '/habit/checkins',
			query: { habitIds: habitIdList.join(','), from, to },
		});
		return { checkins, count: checkins.length };
	},
});
