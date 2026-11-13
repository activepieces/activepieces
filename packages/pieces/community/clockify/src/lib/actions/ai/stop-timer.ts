import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { timeEntryOutputSchema } from '../../output-schemas';

export const stopTimerAiAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_stop_timer',
	outputSchema: timeEntryOutputSchema,
	displayName: 'Stop Timer',
	description: "Stops a user's running timer.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stops the running timer of a user (default: the connected user) at End, or now. Fails if no timer is running. Stopping another user needs workspace admin. Returns the stopped entry.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({
			required: false,
			description: 'User ID. Empty = the connected user. Another user needs workspace admin.',
		}),
		end: Property.DateTime({
			displayName: 'End',
			description: 'ISO 8601 stop time. Empty = now.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const userId = propsValue.userId ?? (await clockifyApi.getCurrentUser({ auth })).id;
		return await clockifyApi.stopUserTimer({
			auth,
			workspaceId: propsValue.workspaceId,
			userId,
			end: propsValue.end ?? new Date().toISOString(),
		});
	},
});
