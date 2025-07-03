import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { TodoistCompletedListResponse, TodoistCompletedTask } from '../common/models';
import { todoistProjectIdDropdown } from '../common/props';
import { todoistAuth } from '../..';
import {
	AuthenticationType,
	DedupeStrategy,
	httpClient,
	HttpMethod,
	Polling,
	pollingHelper,
	QueryParams,
} from '@activepieces/pieces-common';

const ISO_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const polling: Polling<PiecePropValueSchema<typeof todoistAuth>, { project_id?: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const lastUpdatedTime =
			lastFetchEpochMS === 0
				? dayjs().subtract(5, 'minutes').format(ISO_FORMAT)
				: dayjs(lastFetchEpochMS).format(ISO_FORMAT);

		const tasks: TodoistCompletedTask[] = [];

		let hasMore = true;
		let offset = 0;
		const limit = 200;

		do {
			const qs: QueryParams = {
				limit: limit.toString(),
				offset: offset.toString(),
				since: lastUpdatedTime,
			};

			if (propsValue.project_id) {
				qs.project_id = propsValue.project_id;
			}

			const response = await httpClient.sendRequest<TodoistCompletedListResponse>({
				method: HttpMethod.GET,
				url: 'https://api.todoist.com/sync/v9/completed/get_all',
				queryParams: qs,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth.access_token,
				},
			});
			if (response.body.items.length > 0) {
				tasks.push(...response.body.items);
				offset += limit;
			} else {
				hasMore = false;
			}
		} while (hasMore);

		return tasks.map((task) => {
			return {
				epochMilliSeconds: dayjs(task.completed_at).valueOf(),
				data: task,
			};
		});
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
});
