import { createTrigger, DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';

const props = {
	projectId: Property.ShortText({ displayName: 'Project ID (optional)', required: false }),
};

const polling: Polling<string, typeof props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const query: Record<string, string> = { 'pageSize': '50', 'sort': 'createdOn:desc' };
		if (propsValue.projectId) {
			query['projectId'] = propsValue.projectId as string;
		}
		const res = await teamworkRequest(auth, { method: HttpMethod.GET, path: `/tasks.json`, query });
		const tasks = (res?.data?.['todo-items'] ?? []) as any[];
		return tasks
			.map((t) => ({
				epochMilliSeconds: t['created-on'] ? Number(t['created-on']) * 1000 : Date.now(),
				data: t,
			}))
			.filter((i) => !lastFetchEpochMS || i.epochMilliSeconds > lastFetchEpochMS);
	},
};

export const newTask = createTrigger({
	name: 'new_task',
	displayName: 'New Task',
	description: 'Fires when a new task is created',
	auth: teamworkAuth,
	props,
	triggers: [],
	type: TriggerStrategy.POLLING,
	onEnable: async () => {},
	onDisable: async () => {},
	polling: pollingHelper.createPolling({
		polling,
		pollInterval: 15,
		pollTimeout: 10,
	}),
});


