import { createAction, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCompany = createAction({
	name: 'find_company',
	displayName: 'Find Company',
	description: 'Search for a company by name or domain.',
	audience: 'both',
	aiMetadata: { description: 'Searches Teamwork companies by name or domain, optionally scoped to a single project. Use to look up a company and obtain its ID before associating projects or people with it. Requires a search term. Idempotent — a read-only search with no side effects.', idempotent: true },
	auth: teamworkAuth,
	props: {
		searchTerm: Property.ShortText({
			displayName: 'Search Term',
			description: 'The name or domain to search for.',
			required: true,
		}),
		projectId: Property.Dropdown({
auth: teamworkAuth,
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
				const res = await teamworkRequest(auth, {
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
				searchFor: 'companies',
				searchTerm: propsValue.searchTerm,
				projectId: propsValue.projectId,
			},
		});
		return res.data;
	},
});
