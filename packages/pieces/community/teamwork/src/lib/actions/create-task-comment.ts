import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const createTaskComment = createAction({
	name: 'create_task_comment',
	displayName: 'Create Task Comment',
	description: 'Leave a comment in a task.',
	auth: teamworkAuth,
	props: {
		taskId: Property.Dropdown({
			displayName: 'Task',
			description: 'The task to add a comment to.',
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
					path: '/tasks.json',
				});
				const options = res.data['todo-items'].map((task: { id: string; content: string }) => ({
					label: task.content,
					value: task.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		body: Property.LongText({
			displayName: 'Comment',
			description: 'The content of the comment.',
			required: true,
		}),
		attachment: Property.File({
			displayName: 'Attachment',
			description: 'A file to attach to the comment.',
			required: false,
		}),
		notify: Property.StaticDropdown({
			displayName: 'Notify',
			description: 'Who to notify about this comment.',
			required: false,
			options: {
				options: [
					{ label: 'Nobody', value: '' },
					{ label: 'Followers', value: 'true' },
					{ label: 'All Project Users', value: 'all' },
				],
			},
		}),
		isprivate: Property.Checkbox({
			displayName: 'Private',
			description: 'Set to true to make the comment private.',
			required: false,
		}),
	},

	async run({ auth, propsValue }) {
		let pendingFileRef: string | undefined = undefined;
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
			pendingFileRef = ref;
		}

		const body = {
			comment: {
				body: propsValue.body,
				notify: propsValue.notify,
				isprivate: propsValue.isprivate,
				pendingFileAttachments: pendingFileRef,
			},
		};

		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/tasks/${propsValue.taskId}/comments.json`,
			body,
		});
	},
});


