import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { timeEntryOutputSchema } from '../../output-schemas';

export const startTimerAiAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_start_timer',
	outputSchema: timeEntryOutputSchema,
	displayName: 'Start Timer',
	description: 'Starts a running timer for yourself.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts a running timer for the connected user from now, optionally on a project, task and tags. Clockify allows one running timer per user, so any timer already running is stopped first. End it with Stop Timer. Not idempotent.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		description: clockifyAiProps.entryDescription({ required: false }),
		projectId: clockifyAiProps.projectId({
			required: false,
			description: 'Optional project ID. Use List Projects to find it.',
		}),
		taskId: clockifyAiProps.taskId({
			required: false,
			description: 'Optional task ID in that project. Use List Tasks to find it.',
		}),
		tagIds: clockifyAiProps.tagIds({ required: false }),
		billable: Property.Checkbox({
			displayName: 'Billable',
			description: 'Default false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.createTimeEntry({
			auth,
			workspaceId: propsValue.workspaceId,
			start: new Date().toISOString(),
			description: propsValue.description,
			projectId: propsValue.projectId,
			taskId: propsValue.taskId,
			tagIds: propsValue.tagIds?.map(String) ?? [],
			billable: propsValue.billable,
		});
	},
});
