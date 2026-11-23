import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../auth';
import { API_URL } from '../common';

export const createClientAction = createAction({
	auth: acuitySchedulingAuth,
	name: 'create_client',
	classification: 'WRITE',
	displayName: 'Create Client',
	description: 'Creates a new client.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a new client record in Acuity from a first and last name, with optional phone, email, and notes. Use to add a contact to the client list before or independent of booking. Not idempotent — repeating creates duplicate client records since there is no dedupe on identity.',
		idempotent: false,
	},
	propertyGroups: [
		{
			key: 'client',
			display: 'section',
			label: 'Client',
			icon: 'user',
			props: ['firstName', 'lastName', 'email', 'phone', 'notes'],
		},
	],
	props: {
		firstName: Property.ShortText({
			displayName: 'First Name',
			placeholder: 'Jane',
			width: 'half',
			required: true,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			placeholder: 'Doe',
			width: 'half',
			required: true,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			placeholder: '+15551234567',
			width: 'half',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			placeholder: 'jane@example.com',
			width: 'half',
			required: false,
		}),
		notes: Property.LongText({
			displayName: 'Notes',
			description: 'Private notes about the client.',
			required: false,
		}),
	},
	async run(context) {
		const props = context.propsValue;

		const body: Record<string, unknown> = {
			firstName: props.firstName,
			lastName: props.lastName,
		};

		if (props.phone) body['phone'] = props.phone;
		if (props.email) body['email'] = props.email;
		if (props.notes) body['notes'] = props.notes;

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${API_URL}/clients`,
			body,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		});

		return response.body;
	},
});
