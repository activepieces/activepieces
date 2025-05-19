import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuityschedulingAuth } from '../../index';
import { isNil } from '@activepieces/shared';
import { BASE_URL } from '../../index';

export const createclientAction = createAction({
	auth: acuityschedulingAuth,
	name: 'createClient',
	displayName: 'Create Client',
	description: 'Creates a Client.',
	props: {
		first_name: Property.ShortText({
			displayName: 'First Name',
			required: true,
		}),
		last_name: Property.ShortText({
			displayName: 'Last Name',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone Number',
			required: false,
			description: 'Fill in at least one field: phone or email',
		}),
		email: Property.ShortText({
			displayName: 'Email',
			required: false,
			description: 'Fill in at least one field: phone or email',
		}),
		gender: Property.ShortText({
			displayName: 'Gender',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const {
			first_name,
			last_name,
			phone,
			email,
			gender,
			
		} = propsValue;
		if (isNil(phone) && isNil(email)) {
			throw Error(
				'To create a Client you must fill phone no. or email.',
			);
		}
		const response = await httpClient.sendRequest<{ status: string; data: Record<string, any> }>({
			method: HttpMethod.POST,
			url: `${BASE_URL}/Client/createCleint`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
			body: {
				first_name,
				last_name,
				phone,
				email,
				gender,
			},
		});

		return response.body;
	},
});