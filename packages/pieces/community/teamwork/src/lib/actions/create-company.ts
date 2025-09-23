import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createCompany = createAction({
	name: 'create_company',
	displayName: 'Create Company',
	description: 'Create a new company in Teamwork',
	auth: teamworkAuth,
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		website: Property.ShortText({ displayName: 'Website', required: false }),
	},
	async run({ auth, propsValue }) {
		const body = { company: { name: propsValue.name, description: propsValue.description, website: propsValue.website } };
		return await teamworkRequest(auth, { method: HttpMethod.POST, path: `/companies.json`, body });
	},
});


