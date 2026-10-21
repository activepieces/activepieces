import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { hydratedTimeEntriesOutputSchema } from '../../output-schemas';

export const listTimeEntriesAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_time_entries',
	outputSchema: hydratedTimeEntriesOutputSchema,
	displayName: 'List Time Entries',
	description: "Lists or searches a user's time entries.",
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists one user's time entries in a workspace, newest first, optionally filtered by date range, description, project, task, tags or running state. Defaults to the connected user. Returns one page.",
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({
			required: false,
			description: 'User ID. Empty = the connected user. Another user needs workspace admin.',
		}),
		start: Property.DateTime({
			displayName: 'From',
			description: 'Optional: only entries starting at or after this ISO 8601 datetime.',
			required: false,
		}),
		end: Property.DateTime({
			displayName: 'To',
			description: 'Optional: only entries starting before this ISO 8601 datetime.',
			required: false,
		}),
		description: Property.ShortText({
			displayName: 'Description',
			description: 'Optional: only entries whose description contains this text.',
			required: false,
		}),
		projectId: clockifyAiProps.projectId({
			required: false,
			description: 'Optional: only entries on this project.',
		}),
		taskId: clockifyAiProps.taskId({
			required: false,
			description: 'Optional: only entries on this task.',
		}),
		tagIds: clockifyAiProps.tagIds({
			required: false,
			description: 'Optional: only entries with these tags.',
		}),
		inProgress: Property.Checkbox({
			displayName: 'Running Only',
			description: 'Only the running entry. Default false.',
			required: false,
		}),
		hydrated: Property.Checkbox({
			displayName: 'Include Details',
			description: 'Return project, task and tag objects instead of only their IDs. Default false.',
			required: false,
		}),
		page: clockifyAiProps.page({ required: false }),
		pageSize: clockifyAiProps.pageSize({ required: false }),
	},
	async run({ auth, propsValue }) {
		const userId = propsValue.userId ?? (await clockifyApi.getCurrentUser({ auth })).id;
		const timeEntries = await clockifyApi.listUserTimeEntries({
			auth,
			workspaceId: propsValue.workspaceId,
			userId,
			query: clockifyUtils.toQuery({
				params: {
					start: propsValue.start,
					end: propsValue.end,
					description: propsValue.description,
					project: propsValue.projectId,
					task: propsValue.taskId,
					tags: propsValue.tagIds?.map(String).join(','),
					'in-progress': propsValue.inProgress ? true : undefined,
					hydrated: propsValue.hydrated,
					page: propsValue.page ?? 1,
					'page-size': propsValue.pageSize ?? 50,
				},
			}),
		});
		return { timeEntries, count: timeEntries.length };
	},
});
