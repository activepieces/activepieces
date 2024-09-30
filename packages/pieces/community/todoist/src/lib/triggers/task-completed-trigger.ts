import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/shared';
import dayjs from 'dayjs';
import { todoistSyncClient } from '../common/client/sync-client';
import { TodoistCompletedTask } from '../common/models';
import { todoistProjectIdDropdown } from '../common/props';
import { todoistAuth } from '../..';

type TriggerData = {
	lastChecked: string;
};

const TRIGGER_DATA_STORE_KEY = 'todoist_task_completed_trigger_data';
const ISO_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const fiveMinutesAgo = () => dayjs().subtract(5, 'minutes').format(ISO_FORMAT);
const now = () => dayjs().format(ISO_FORMAT);

export const todoistTaskCompletedTrigger = createTrigger({
	auth: todoistAuth,
	name: 'task_completed',
	displayName: 'Task Completed',
	description: 'Triggers when a new task is completed',
	type: TriggerStrategy.POLLING,

	sampleData: {
		content: 'Buy Milk',
		meta_data: null,
		user_id: '2671355',
		task_id: '2995104339',
		note_count: 0,
		project_id: '2203306141',
		section_id: '7025',
		completed_at: '2015-02-17T15:40:41.000000Z',
		id: '1899066186',
	},

	props: {
		project_id: todoistProjectIdDropdown(
			'Leave it blank if you want to get completed tasks from all your projects.',
		),
	},

	async onEnable({ store }): Promise<void> {
		await store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
			lastChecked: now(),
		});
	},

	async onDisable({ store }): Promise<void> {
		await store.put(TRIGGER_DATA_STORE_KEY, null);
	},

	async run({ auth, propsValue, store }): Promise<TodoistCompletedTask[]> {
		const token = auth.access_token;
		const { project_id } = propsValue;

		assertNotNullOrUndefined(token, 'token');

		const triggerData = await store.get<TriggerData>(TRIGGER_DATA_STORE_KEY);
		const since = triggerData?.lastChecked ?? fiveMinutesAgo();
		const until = now();

		const response = await todoistSyncClient.completed.list({
			token,
			since,
			until,
			project_id,
		});

		await store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
			// It returns data newer than the since parameter, and not equal.
			lastChecked: until,
		});

		return response.items;
	},
});
