import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkRequest } from '../common/client';

export const createTaskList = createAction({
	name: 'create_task_list',
	displayName: 'Create Task List',
	description: 'Add a new task list under a project.',
	auth: teamworkAuth,
	props: {
		projectId: Property.Dropdown({
			displayName: 'Project',
			description: 'The project to create the task list in.',
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
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/projects.json',
				});
				const options = res.data.projects.map((p: { id: string; name: string }) => ({
					label: p.name,
					value: p.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The name of the task list.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'A description for the task list.',
			required: false,
		}),
		private: Property.Checkbox({
			displayName: 'Private',
			description: 'Set to true to make the task list private.',
			required: false,
		}),
		priority: Property.StaticDropdown({
			displayName: 'Default Task Priority',
			description: 'The default priority for new tasks in this list.',
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
		tags: Property.MultiSelectDropdown({
			displayName: 'Default Task Tags',
			description: 'Default tags for new tasks in this list.',
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
		const body = {
			'todo-list': {
				name: propsValue.name,
				description: propsValue.description,
				private: propsValue.private,
				'new-task-defaults': {
					priority: propsValue.priority,
					tags: propsValue.tags?.map((tagId) => ({ id: tagId })),
				},
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/projects/${propsValue.projectId}/tasklists.json`,
			body,
		});
	},
});


