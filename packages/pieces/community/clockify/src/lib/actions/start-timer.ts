import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from '../common/api';
import { clockifyProps } from '../common/props';
import { timeEntryOutputSchema } from '../output-schemas';

export const startTimerAction = createAction({
	auth: clockifyAuth,
	name: 'start-timer',
	outputSchema: timeEntryOutputSchema,
	classification: 'WRITE',
	displayName: 'Start Timer',
	description: 'Starts a new time entry.',
	audience: 'human',
	aiMetadata: {
		description:
			'Starts a live, currently-running timer on a Clockify workspace from the current moment, optionally tied to a project, task, tags, and billable flag. Use to begin tracking ongoing work; use Stop Timer to end it and Create Time Entry to log a finished interval. Not idempotent: each call starts a new running entry.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyProps.workspaceId({ required: true }),
		description: Property.LongText({
			displayName: 'Entry Description',
			required: false,
		}),
		projectId: clockifyProps.projectId({ required: false }),
		taskId: clockifyProps.taskId({ required: false }),
		billable: Property.Checkbox({
			displayName: 'Billable',
			required: false,
		}),
		tagIds: clockifyProps.tagIds({ required: false }),
	},
	async run(context) {
		const { workspaceId, projectId, description, billable, taskId } = context.propsValue;
		const tagIds = context.propsValue.tagIds ?? [];

		return await clockifyApi.createTimeEntry({
			auth: context.auth,
			workspaceId,
			billable,
			description,
			start: new Date().toISOString(),
			projectId,
			taskId,
			tagIds,
		});
	},
});
