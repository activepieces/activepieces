import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskDeleteTasksOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteTasksAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_tasks',
	outputSchema: zohoDeskDeleteTasksOutputSchema,
	displayName: 'Delete Tasks',
	description: 'Moves tasks to the recycle bin.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Moves one or more tasks to the recycle bin, where an admin can restore them.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskIds: Property.Array({
			displayName: 'Task IDs',
			description: 'Task IDs to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, taskIds } = context.propsValue;
		await zohoDeskApi.deleteTasks({
			auth: context.auth,
			orgId,
			taskIds: zohoDeskUtils.requiredStringList({ value: taskIds, propName: 'Task IDs' }),
		});
		return { success: true, taskIds };
	},
});
