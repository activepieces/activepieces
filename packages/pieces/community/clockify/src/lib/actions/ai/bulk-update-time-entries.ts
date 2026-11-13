import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { changedTimeEntriesOutputSchema } from '../../output-schemas';

export const bulkUpdateTimeEntriesAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_bulk_update_time_entries',
	outputSchema: changedTimeEntriesOutputSchema,
	displayName: 'Bulk Update Time Entries',
	description: "Applies the same change to several of a user's time entries.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Applies the same project, task, tags, description or billable change to several time entries of one user in one call. Each entry keeps its own times and every field you leave empty: the action reads the entries and sends them back with only your changes. Defaults to the connected user.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		userId: clockifyAiProps.userId({
			required: false,
			description: 'User ID. Empty = the connected user. Another user needs workspace admin.',
		}),
		timeEntryIds: clockifyAiProps.timeEntryIds({
			required: true,
			description:
				'IDs of the entries to change, all belonging to the user. Use List Time Entries to find them.',
		}),
		description: clockifyAiProps.entryDescription({ required: false }),
		projectId: clockifyAiProps.projectId({
			required: false,
			description: 'New project ID. Empty = unchanged.',
		}),
		taskId: clockifyAiProps.taskId({
			required: false,
			description: 'New task ID. Empty = unchanged.',
		}),
		tagIds: clockifyAiProps.tagIds({
			required: false,
			description: 'Replaces the tags. Empty = unchanged.',
		}),
		billable: Property.StaticDropdown({
			displayName: 'Billable',
			description: 'Billable (Yes) or not (No). Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const userId = propsValue.userId ?? (await clockifyApi.getCurrentUser({ auth })).id;
		const current = await clockifyApi.getTimeEntriesByIds({
			auth,
			workspaceId: propsValue.workspaceId,
			timeEntryIds: propsValue.timeEntryIds.map(String),
		});
		const billable = clockifyUtils.toOptionalBoolean({
			value: propsValue.billable,
		});
		const timeEntries = await clockifyApi.bulkUpdateTimeEntries({
			auth,
			workspaceId: propsValue.workspaceId,
			userId,
			entries: current.flatMap((entry) => {
				const start = entry.timeInterval?.start;
				if (!start) {
					return [];
				}
				return [
					{
						id: entry.id,
						start,
						end: entry.timeInterval?.end,
						description: propsValue.description ?? entry.description,
						projectId: propsValue.projectId ?? entry.projectId,
						taskId: propsValue.taskId ?? entry.taskId,
						tagIds: clockifyUtils.nonEmptyIds({ values: propsValue.tagIds }) ?? entry.tagIds,
						billable: billable ?? entry.billable,
						type: entry.type,
						customFields: entry.customFieldValues?.map((field) => ({
							customFieldId: field.customFieldId,
							value: field.value,
						})),
					},
				];
			}),
		});
		return { timeEntries, count: timeEntries.length };
	},
});
