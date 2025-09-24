import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findNotebookOrComment = createAction({
	name: 'find_notebook_or_comment',
	displayName: 'Find Notebook / Notebook Comment',
	description: 'Locate notebooks or note comments by search parameters.',
	auth: teamworkAuth,
	props: {
		searchFor: Property.StaticDropdown({
			displayName: 'Search For',
			description: 'The type of item to search for.',
			required: true,
			options: {
				options: [
					{ label: 'Notebook', value: 'notebooks' },
					{ label: 'Notebook Comment', value: 'notebookComments' },
				],
			},
		}),
		searchTerm: Property.ShortText({
			displayName: 'Search Term',
			description: 'The keyword to search for.',
			required: true,
		}),
		projectId: Property.Dropdown({
			displayName: 'Project',
			description: 'Limit the search to a specific project.',
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
	},
	async run({ auth, propsValue }) {
		const res = await teamworkRequest(auth, {
			method: HttpMethod.GET,
			path: '/search.json',
			query: {
				searchFor: propsValue.searchFor,
				searchTerm: propsValue.searchTerm,
				projectId: propsValue.projectId,
			},
		});
		return res.data;
	},
});


