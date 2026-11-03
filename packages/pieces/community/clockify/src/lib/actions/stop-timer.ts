import { createAction } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from '../common/api';
import { clockifyProps } from '../common/props';
import { timeEntryOutputSchema } from '../output-schemas';

export const stopTimerAction = createAction({
	auth: clockifyAuth,
	name: 'stop-timer',
	outputSchema: timeEntryOutputSchema,
	classification: 'WRITE',
	displayName: 'Stop Timer',
	description: 'Stops currently running timer on specified workspace.',
	audience: 'human',
	aiMetadata: {
		description:
			"Stops the authenticated user's currently running timer on the given workspace by setting its end time to now. Use after Start Timer to finalize tracked work. Not idempotent in effect: if no timer is running there is nothing to stop, and the stopped time depends on when it is called.",
		idempotent: false,
	},
	props: {
		workspaceId: clockifyProps.workspaceId({ required: true }),
	},
	async run(context) {
		const { workspaceId } = context.propsValue;

		const currentUser = await clockifyApi.getCurrentUser({ auth: context.auth });

		return await clockifyApi.stopUserTimer({
			auth: context.auth,
			workspaceId,
			userId: currentUser.id,
			end: new Date().toISOString(),
		});
	},
});
