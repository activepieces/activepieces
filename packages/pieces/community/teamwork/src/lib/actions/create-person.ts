import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPerson = createAction({
	name: 'create_person',
	displayName: 'Create Person',
	description: 'Create a new person (user/contact) in Teamwork',
	auth: teamworkAuth,
	props: {
		firstName: Property.ShortText({ displayName: 'First Name', required: true }),
		lastName: Property.ShortText({ displayName: 'Last Name', required: true }),
		emailAddress: Property.ShortText({ displayName: 'Email', required: true }),
		companyId: Property.ShortText({ displayName: 'Company ID', required: false }),
	},
	async run({ auth, propsValue }) {
		const body = { person: { firstName: propsValue.firstName, lastName: propsValue.lastName, emailAddress: propsValue.emailAddress, companyId: propsValue.companyId } };
		return await teamworkRequest(auth, { method: HttpMethod.POST, path: `/people.json`, body });
	},
});


