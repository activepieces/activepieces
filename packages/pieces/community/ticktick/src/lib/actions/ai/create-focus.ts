import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickCreateFocusOutputSchema } from '../../output-schemas';

export const createFocusAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_create_focus',
	outputSchema: ticktickCreateFocusOutputSchema,
	displayName: 'Create Focus Record',
	description: 'Logs a focus (pomodoro or timing) record.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Logs a focus session, optionally tied to a task (taskId) with start/end time, duration in seconds and a note. Returns it with its id. Not idempotent: each call logs a new record.',
		idempotent: false,
	},
	props: {
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
		taskId: Property.ShortText({
			displayName: 'Task ID',
			required: false,
		}),
		note: Property.LongText({
			displayName: 'Note',
			description: 'Focus note (max 5000 characters).',
			required: false,
		}),
		startTime: Property.DateTime({
			displayName: 'Start Time',
			required: false,
		}),
		endTime: Property.DateTime({
			displayName: 'End Time',
			required: false,
		}),
		pauseDuration: Property.Number({
			displayName: 'Pause Duration',
			description: 'Pause duration in seconds.',
			required: false,
		}),
		duration: Property.Number({
			displayName: 'Duration',
			description: 'Focus duration in seconds.',
			required: false,
		}),
	},
	async run(context) {
		const { type, taskId, note, startTime, endTime, pauseDuration, duration } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/focus',
			body: {
				type,
				...(taskId ? { taskId } : {}),
				...(note ? { note } : {}),
				...(startTime ? { startTime: taskFields.formatDate({ value: startTime }) } : {}),
				...(endTime ? { endTime: taskFields.formatDate({ value: endTime }) } : {}),
				...(pauseDuration !== undefined ? { pauseDuration } : {}),
				...(duration !== undefined ? { duration } : {}),
			},
		});
	},
});
