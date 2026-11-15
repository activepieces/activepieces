import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof workdayAuth>,
	Record<string, never>
> = {
	strategy: DedupeStrategy.LAST_ITEM,
	items: async ({ auth }) => {
		const items = await workdayApi.listInboxTasks({ auth });
		return items.map((item) => ({
			id: JSON.stringify(item),
			data: item,
		}));
	},
};

export const newInboxTaskTrigger = createTrigger({
	auth: workdayAuth,
	name: 'new_inbox_task',
	classification: 'READ',
	displayName: 'New Inbox Task',
	description: 'Triggers when a new inbox task is assigned in Workday.',
	aiMetadata: {
		description:
			'Fires when a new business-process task awaiting the connected user’s action appears in their Workday inbox, detected by polling transactions awaiting action. Represents a pending approval/review assignment. Use to auto-handle or notify on incoming Workday tasks (pair with the Approve Task action).',
	},
	props: {},
	sampleData: {
		id: 'task-001',
		descriptor: 'Approve Time Off Request',
		assignedDate: '2026-04-01T08:00:00Z',
	},
	type: TriggerStrategy.POLLING,
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
});
