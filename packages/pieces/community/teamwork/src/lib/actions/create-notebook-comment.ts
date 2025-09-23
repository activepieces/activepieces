import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createNotebookComment = createAction({
	name: 'create_notebook_comment',
	displayName: 'Create Notebook Comment',
	description: 'Add a comment to a notebook',
	auth: teamworkAuth,
	props: {
		notebookId: Property.ShortText({ displayName: 'Notebook ID', required: true }),
		content: Property.LongText({ displayName: 'Comment', required: true }),
	},
	async run({ auth, propsValue }) {
		const body = { comment: { body: propsValue.content } };
		return await teamworkRequest(auth, { method: HttpMethod.POST, path: `/notebooks/${propsValue.notebookId}/comments.json`, body });
	},
});


