import { createAction, Property } from '@activepieces/pieces-framework';
import { clockifyAuth } from '../auth';
import { clockifyApi } from '../common/api';
import { clockifyProps } from '../common/props';
import { timeEntryOutputSchema } from '../output-schemas';

export const createTimeEntryAction = createAction({
	auth: clockifyAuth,
	name: 'create-time-entry',
	outputSchema: timeEntryOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Time Entry',
	description: 'Creates a new time entry.',
	audience: 'human',
	aiMetadata: {
		description:
			'Logs a completed time entry on a Clockify workspace for an explicit start and end datetime, optionally tied to a project, task, tags, and billable flag. Use to record past or fixed-duration work rather than to start a live timer (use Start Timer for that). Not idempotent: each call adds a new entry.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyProps.workspaceId({ required: true }),
		start: Property.DateTime({
			displayName: 'Start Datetime',
			required: true,
		}),
		end: Property.DateTime({
			displayName: 'End Datetime',
			required: true,
		}),
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
		const { workspaceId, projectId, start, end, description, billable, taskId } =
			context.propsValue;
		const tagIds = context.propsValue.tagIds ?? [];

		return await clockifyApi.createTimeEntry({
			auth: context.auth,
			workspaceId,
			billable,
			description,
			start,
			end,
			projectId,
			taskId,
			tagIds,
		});
	},
});
