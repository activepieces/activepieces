import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickListFocusesOutputSchema } from '../../output-schemas';

export const listFocusesAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_focuses',
	outputSchema: ticktickListFocusesOutputSchema,
	displayName: 'List Focus Records',
	description: 'Lists focus (pomodoro or timing) records within a time range.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists focus records of one type (pomodoro or timing) between from and to. Ranges longer than 30 days are clamped to the 30 days before "to". Use to get the focusId for ticktick_get_focus or ticktick_delete_focus. Read-only.',
		idempotent: true,
	},
	props: {
		from: Property.DateTime({
			displayName: 'From',
			required: true,
		}),
		to: Property.DateTime({
			displayName: 'To',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: true,
			options: {
				options: [
					{ label: 'Pomodoro', value: 0 },
					{ label: 'Timing', value: 1 },
				],
			},
		}),
	},
	async run(context) {
		const { from, to, type } = context.propsValue;
		const focuses = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: '/focus',
			query: {
				from: taskFields.formatDate({ value: from }),
				to: taskFields.formatDate({ value: to }),
				type,
			},
		});
		return { focuses, count: focuses.length };
	},
});
