import {
	createAction,
	Property,
	OAuth2PropertyValue,
	DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { teamworkRequest } from '../common/client';

export const createTask = createAction({
	name: 'create_task',
	displayName: 'Create Task',
	description: 'Add a new task under a project with description, due date, assignee, tags, etc.',
	auth: teamworkAuth,
	props: {
		projectId: Property.Dropdown({
			displayName: 'Project',
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
		tasklistId: Property.Dropdown({
			displayName: 'Task List',
			required: true,
			refreshers: ['projectId'],
			options: async ({ auth, projectId }) => {
				if (!auth || !projectId) {
					return {
						disabled: true,
						placeholder: 'Please select a project.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: `/projects/${projectId}/tasklists.json`,
				});
				const options = res.data.tasklists.map((tl: { id: string; name: string }) => ({
					label: tl.name,
					value: tl.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		content: Property.ShortText({
			displayName: 'Content',
			required: true,
		}),
		'responsible-party-id': Property.MultiSelectDropdown({
			displayName: 'Responsible Parties',
			required: false,
			refreshers: ['projectId'],
			options: async ({ auth, projectId }) => {
				if (!auth || !projectId) {
					return {
						disabled: true,
						placeholder: 'Please select a project.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: `/projects/${projectId}/people.json`,
				});
				const options = res.data.people.map((p: { id: string; 'first-name': string; 'last-name': string }) => ({
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
		description: Property.LongText({
			displayName: 'Description',
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
		attachment: Property.File({
			displayName: 'Attachment',
			required: false,
		}),
		customFields: Property.DynamicProperties({
			displayName: 'Custom Fields',
			required: false,
			refreshers: [],
			props: async ({ auth }) => {
				if (!auth) return {};
				const fields: DynamicPropsValue = {};
				const res = await teamworkRequest(auth as OAuth2PropertyValue, {
					method: HttpMethod.GET,
					path: '/projects/api/v3/customfields.json',
					query: {
						entities: 'tasks',
					},
				});
				if (res.data?.customfields) {
					for (const field of res.data.customfields) {
						fields[field.id] = Property.ShortText({
							displayName: field.name,
							required: field.required,
						});
					}
				}
				return fields;
			},
		}),
	},
	async run({ auth, propsValue }) {
		let pendingFileAttachments: string | undefined = undefined;
		if (propsValue.attachment) {
			const presignedUrlRes = await teamworkRequest(auth, {
				method: HttpMethod.GET,
				path: '/projects/api/v1/pendingfiles/presignedurl.json',
				query: {
					fileName: propsValue.attachment.filename,
					fileSize: propsValue.attachment.data.length,
				},
			});
			const { ref, url } = presignedUrlRes.data;
			await httpClient.sendRequest({
				method: HttpMethod.PUT,
				url: url,
				body: propsValue.attachment.data,
				headers: {
					'X-Amz-Acl': 'public-read',
					'Content-Length': String(propsValue.attachment.data.length),
				},
			});
			pendingFileAttachments = ref;
		}

		const formatDate = (date: string | undefined) => {
			if (!date) return undefined;
			return new Date(date).toISOString().slice(0, 10).replace(/-/g, '');
		};

		const customFields = Object.entries(propsValue.customFields ?? {}).map(
			([customFieldId, value]) => ({ customFieldId: parseInt(customFieldId), value })
		);

		const body = {
			'todo-item': {
				content: propsValue.content,
				tasklistId: propsValue.tasklistId,
				'responsible-party-id': propsValue['responsible-party-id']?.join(','),
				'start-date': formatDate(propsValue['start-date']),
				'due-date': formatDate(propsValue['due-date']),
				description: propsValue.description,
				priority: propsValue.priority,
				tagIds: propsValue.tagIds?.join(','),
				pendingFileAttachments: pendingFileAttachments,
				customFields: customFields.length > 0 ? customFields : undefined,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/projects/${propsValue.projectId}/tasks.json`,
			body,
		});
	},
});


