import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { timeEntryOutputSchema } from '../../output-schemas';

export const createTimeEntryAiAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_create_time_entry',
	outputSchema: timeEntryOutputSchema,
	displayName: 'Create Time Entry',
	description: 'Logs a finished time entry for yourself.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Logs a finished time entry for the connected user from Start to End, optionally on a project, task and tags. To log time for another user use Create User Time Entry; to start a running timer use Start Timer. Not idempotent: each call adds an entry.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		start: Property.DateTime({
			displayName: 'Start',
			description: 'ISO 8601 start datetime, for example 2026-10-21T09:00:00Z.',
			required: true,
		}),
		end: Property.DateTime({
			displayName: 'End',
			description: 'ISO 8601 end datetime, after Start.',
			required: true,
		}),
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
			start: propsValue.start,
			end: propsValue.end,
			description: propsValue.description,
			projectId: propsValue.projectId,
			taskId: propsValue.taskId,
			tagIds: propsValue.tagIds?.map(String) ?? [],
			billable: propsValue.billable,
		});
	},
});
