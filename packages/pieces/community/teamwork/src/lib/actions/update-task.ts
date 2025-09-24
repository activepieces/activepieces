import {
	createAction,
	Property,
	OAuth2PropertyValue,
	DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkRequest } from '../common/client';

// Helper to fetch all tasks, handling pagination
async function getAllTasks(auth: OAuth2PropertyValue) {
	let allTasks: any[] = [];
	let page = 1;
	let moreTasks = true;
	while (moreTasks) {
		const res = await teamworkRequest(auth, {
			method: HttpMethod.GET,
			path: '/tasks.json',
			query: {
				page: page,
				pageSize: 250,
			},
		});
		if (res.data['todo-items'] && res.data['todo-items'].length > 0) {
			allTasks = allTasks.concat(res.data['todo-items']);
			page++;
		} else {
			moreTasks = false;
		}
	}
	return allTasks;
}

export const updateTask = createAction({
	name: 'update_task',
	displayName: 'Update Task',
	description: 'Modify a task’s fields (due date, assignee, content, priority, etc.).',
	auth: teamworkAuth,
	props: {
		taskId: Property.Dropdown({
			displayName: 'Task',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const tasks = await getAllTasks(auth as OAuth2PropertyValue);
				const options = tasks.map((task: { id: string; content: string }) => ({
					label: task.content,
					value: task.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		content: Property.ShortText({
			displayName: 'Content',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			required: false,
		}),
		'responsible-party-id': Property.MultiSelectDropdown({
			displayName: 'Responsible Parties',
			required: false,
			refreshers: ['taskId'],
			options: async ({ auth, taskId }) => {
				if (!auth || !taskId) {
					return {
						disabled: true,
						placeholder: 'Please select a task.',
						options: [],
					};
				}
				const taskRes = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: `/tasks/${taskId}.json`,
				});
				const projectId = taskRes.data['todo-item']['project-id'];
				if (!projectId) return { disabled: true, placeholder: 'Could not determine project.', options: [] };

				const peopleRes = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: `/projects/${projectId}/people.json`,
				});
				const options = peopleRes.data.people.map((p: { id: string; 'first-name': string; 'last-name': string }) => ({
					label: `${p['first-name']} ${p['last-name']}`,
					value: p.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		'start-date': Property.DateTime({
			displayName: 'Start Date',
			required: false,
		}),
		'due-date': Property.DateTime({
			displayName: 'Due Date',
			required: false,
		}),
		priority: Property.StaticDropdown({
			displayName: 'Priority',
			required: false,
			options: {
				options: [
					{ label: 'None', value: '' },
					{ label: 'Low', value: 'low' },
					{ label: 'Medium', value: 'medium' },
					{ label: 'High', value: 'high' },
				],
			},
		}),
		tagIds: Property.MultiSelectDropdown({
			displayName: 'Tags',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/tags.json',
				});
				const options = res.data.tags.map((t: { id: string; name: string }) => ({
					label: t.name,
					value: t.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
	},
	async run({ auth, propsValue }) {
		const formatDate = (date: string | undefined) => {
			if (!date) return undefined;
			return new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
		};

		const body: any = { 'todo-item': {} };
		const item = body['todo-item'];

		if (propsValue.content) item.content = propsValue.content;
		if (propsValue.description) item.description = propsValue.description;
		if (propsValue['responsible-party-id']) item['responsible-party-id'] = propsValue['responsible-party-id'].join(',');
		if (propsValue['start-date']) item['start-date'] = formatDate(propsValue['start-date']);
		if (propsValue['due-date']) item['due-date'] = formatDate(propsValue['due-date']);
		if (propsValue.priority) item.priority = propsValue.priority;
		if (propsValue.tagIds) item.tagIds = propsValue.tagIds.join(',');

		return await teamworkRequest(auth, {
			method: HttpMethod.PUT,
			path: `/tasks/${propsValue.taskId}.json`,
			body,
		});
	},
});


