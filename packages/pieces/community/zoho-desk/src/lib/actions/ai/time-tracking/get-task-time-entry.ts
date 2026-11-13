import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskAddTaskTimeEntryOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTaskTimeEntryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_task_time_entry',
	outputSchema: zohoDeskAddTaskTimeEntryOutputSchema,
	displayName: 'Get Task Time Entry',
	description: 'Gets one time entry on a task.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one time entry on a task with its duration, owner, billing and cost.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
		timeEntryId: Property.ShortText({
			displayName: 'Time Entry ID',
			description: 'Time entry ID (from the matching List Time Entries action).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, taskId, timeEntryId } = context.propsValue;
		return await zohoDeskApi.getTaskTimeEntry({ auth: context.auth, orgId, taskId, timeEntryId });
	},
});
