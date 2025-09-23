import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findNotebookOrComment = createAction({
	name: 'find_notebook_or_comment',
	displayName: 'Find Notebook or Comment',
	description: 'Search notebooks or their comments by text',
	auth: teamworkAuth,
	props: {
		projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
		query: Property.ShortText({ displayName: 'Query', required: true }),
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: true,
			options: {
				options: [
					{ label: 'Notebooks', value: 'notebooks' },
					{ label: 'Comments', value: 'comments' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		if (propsValue.type === 'notebooks') {
			return await teamworkRequest(auth, { method: HttpMethod.GET, path: `/projects/${propsValue.projectId}/notebooks.json`, query: { searchTerm: propsValue.query } as any });
		}
		return await teamworkRequest(auth, { method: HttpMethod.GET, path: `/notebooks/${propsValue.projectId}/comments.json`, query: { searchTerm: propsValue.query } as any });
	},
});


