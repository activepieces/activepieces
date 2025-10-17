import { createAction, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findMilestone = createAction({
	name: 'find_milestone',
	displayName: 'Find Milestone',
	description: 'Find a milestone by name or due date in a project.',
	auth: teamworkAuth,
	props: {
		searchTerm: Property.ShortText({
			displayName: 'Search Term',
			description: 'The name or due date to search for.',
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
				const res = await teamworkRequest(auth as PiecePropValueSchema<typeof teamworkAuth>, {
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
				searchFor: 'milestones',
				searchTerm: propsValue.searchTerm,
				projectId: propsValue.projectId,
			},
		});
		return res.data;
	},
});


