import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCompany = createAction({
	name: 'find_company',
	displayName: 'Find Company',
	description: 'Search for a company by name or domain.',
	auth: teamworkAuth,
	props: {
		searchTerm: Property.ShortText({
			displayName: 'Search Term',
			required: true,
		}),
		projectId: Property.Dropdown({
			displayName: 'Project',
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
				searchFor: 'companies',
				searchTerm: propsValue.searchTerm,
				projectId: propsValue.projectId,
			},
		});
		return res.data;
	},
});
