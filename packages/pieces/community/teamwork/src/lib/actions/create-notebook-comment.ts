import { createAction, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const createNotebookComment = createAction({
	name: 'create_notebook_comment',
	displayName: 'Create Notebook Comment',
	description: 'Add a comment on a notebook (collaborative document) with optional attachments.',
	auth: teamworkAuth,
	props: {
		notebookId: Property.Dropdown({
			displayName: 'Notebook',
			description: 'The notebook to add a comment to.',
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
				const res = await teamworkRequest(auth as PiecePropValueSchema<typeof teamworkAuth>, {
					method: HttpMethod.GET,
					path: '/notebooks.json',
				});
				const notebooks = res.data.projects.flatMap(
					(p: { notebooks: { id: string; name: string }[] }) => p.notebooks
				);
				const options = notebooks.map((n: { id: string; name: string }) => ({
					label: n.name,
					value: n.id,
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
					fileSize: propsValue.attachment.data.length.toString(),
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
			path: `/notebooks/${propsValue.notebookId}/comments.json`,
			body,
		});
	},
});


