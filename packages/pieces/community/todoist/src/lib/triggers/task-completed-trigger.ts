import {
	AppConnectionValueForAuthProperty,
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { todoistProjectIdDropdown } from '../common/props';
import { todoistAuth } from '../..';
import {
	DedupeStrategy,
	Polling,
	pollingHelper,
} from '@activepieces/pieces-common';
import { todoistRestClient } from '../common/client/rest-client';
import { TodoistCompletedTask } from '../common/models';

const ISO_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const polling: Polling<AppConnectionValueForAuthProperty<typeof todoistAuth>, { project_id?: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const since =
			lastFetchEpochMS === 0
				? dayjs().subtract(5, 'minutes').format(ISO_FORMAT)
				: dayjs(lastFetchEpochMS).format(ISO_FORMAT);
		const until = dayjs().format(ISO_FORMAT);

		const tasks = await todoistRestClient.tasks.listCompleted({
			token: auth.access_token,
			since,
			until,
			project_id: propsValue.project_id,
		});

		return tasks.map((task: TodoistCompletedTask) => ({
			epochMilliSeconds: dayjs(task.completed_at).valueOf(),
			data: task,
		}));
	},
};

export const todoistTaskCompletedTrigger = createTrigger({
	auth: todoistAuth,
	name: 'task_completed',
	displayName: 'Task Completed',
	description: 'Triggers when a new task is completed',
	type: TriggerStrategy.POLLING,

	props: {
		project_id: todoistProjectIdDropdown(
			'Leave it blank if you want to get completed tasks from all your projects.',
		),
	},

	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},

	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
	sampleData: {
		id: '1899066186',
		user_id: '2671355',
		project_id: '2203306141',
		section_id: '7025',
		parent_id: null,
		added_by_uid: '2671355',
		assigned_by_uid: null,
		responsible_uid: null,
		completed_by_uid: '2671355',
		labels: [],
		checked: true,
		is_deleted: false,
		content: 'Buy Milk',
		description: '',
		priority: 1,
		note_count: 0,
		due: null,
		added_at: '2015-02-17T15:35:00.000000Z',
		completed_at: '2015-02-17T15:40:41.000000Z',
		updated_at: '2015-02-17T15:40:41.000000Z',
	},
});
