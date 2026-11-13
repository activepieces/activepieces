import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { timeEntryOutputSchema } from '../../output-schemas';

export const updateTimeEntryAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_time_entry',
	outputSchema: timeEntryOutputSchema,
	displayName: 'Update Time Entry',
	description: 'Updates a time entry.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a time entry start, end, description, project, task, tags or billable flag. Only the fields you set change: the action reads the entry and sends the rest back, because Clockify clears any field left out. Locked (approved) entries cannot be changed.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		timeEntryId: clockifyAiProps.timeEntryId({ required: true }),
		start: Property.DateTime({
			displayName: 'Start',
			description: 'New ISO 8601 start. Empty = unchanged.',
			required: false,
		}),
		end: Property.DateTime({
			displayName: 'End',
			description: 'New ISO 8601 end. Empty = unchanged.',
			required: false,
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
		const current = await clockifyApi.getTimeEntry({
			auth,
			workspaceId: propsValue.workspaceId,
			timeEntryId: propsValue.timeEntryId,
			query: {},
		});
		return await clockifyApi.updateTimeEntry({
			auth,
			workspaceId: propsValue.workspaceId,
			timeEntryId: propsValue.timeEntryId,
			entry: {
				start: propsValue.start ?? current.timeInterval?.start ?? '',
				end: propsValue.end ?? current.timeInterval?.end,
				description: propsValue.description ?? current.description,
				projectId: propsValue.projectId ?? current.projectId,
				taskId: propsValue.taskId ?? current.taskId,
				tagIds: clockifyUtils.nonEmptyIds({ values: propsValue.tagIds }) ?? current.tagIds,
				billable:
					clockifyUtils.toOptionalBoolean({ value: propsValue.billable }) ?? current.billable,
				type: current.type,
				customFields: current.customFieldValues?.map((field) => ({
					customFieldId: field.customFieldId,
					value: field.value,
				})),
			},
		});
	},
});
