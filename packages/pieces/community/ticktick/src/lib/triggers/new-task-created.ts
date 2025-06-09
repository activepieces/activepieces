import { HttpMethod } from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../index';
import { tickTickApiCall } from '../common/client';
import { TICKTICK_TASK_STATUS_INCOMPLETE } from '../common/constants';
import { projectId } from '../common/props';

const TRIGGER_KEY = 'ticktick_new_task_trigger';

export const newTaskCreatedTrigger = createTrigger({
	auth: ticktickAuth,
	name: 'new_task_created',
	displayName: 'New Task Created',
	description: 'Triggers when a new task is created in a selected project.',
	props: {
		projectId: projectId({
			displayName: 'Project',
			description: 'The project to monitor for new tasks.',
			required: true,
		}),
	},
	type: TriggerStrategy.POLLING,
	sampleData: {
		id: '6247ee29630c800f064fd145',
		projectId: '6226ff9877acee87727f6bca',
		title: 'Sample New Task Title',
		content: 'This is a sample task content.',
		status: TICKTICK_TASK_STATUS_INCOMPLETE, // Corrected usage
	},
	async onEnable(context) {
		const { store, auth, propsValue } = context;

		const response = await tickTickApiCall<{ tasks: { id: string; title: string }[] }>({
			accessToken: auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${propsValue.projectId}/data`,
		});

		const taskIds = response.tasks.map((task) => task.id);

		await store.put(TRIGGER_KEY, JSON.stringify(taskIds));
	},
	async onDisable(context) {
		await context.store.delete(TRIGGER_KEY);
	},
	async test(context) {
		const { auth, propsValue } = context;

		const response = await tickTickApiCall<{ tasks: { id: string; title: string }[] }>({
			accessToken: auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${propsValue.projectId}/data`,
		});

		return response.tasks.slice(0, 5);
	},
	async run(context) {
		const { store, auth, propsValue } = context;

		const existingIds = (await store.get<string>(TRIGGER_KEY)) ?? '[]';
		const parsedExistingIds = JSON.parse(existingIds) as string[];

		const { tasks: currentTasks } = await tickTickApiCall<{
			tasks: { id: string; title: string }[];
		}>({
			accessToken: auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${propsValue.projectId}/data`,
		});

		if (currentTasks.length === 0) {
			await store.put(TRIGGER_KEY, '[]');
			return [];
		}

		const newTasks = currentTasks.filter((task) => !parsedExistingIds.includes(task.id));
		const allCurrentIds = currentTasks.map((task) => task.id);

		await store.put(TRIGGER_KEY, JSON.stringify(allCurrentIds));

		if (newTasks.length === 0) {
			return [];
		}

		return newTasks;
	},
});