import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL } from '../common';

export const updateClientAction = createAction({
	auth: acuitySchedulingAuth,
	name: 'update_client',
	displayName: 'Update Client',
	description: 'Updates an existing client.',
	props: {
		currentFirstName: Property.ShortText({
			displayName: 'Current First Name (Identifier)',
			description: 'The current first name of the client to update.',
			required: true,
		}),
		currentLastName: Property.ShortText({
			displayName: 'Current Last Name (Identifier)',
			description: 'The current last name of the client to update.',
			required: true,
		}),
		currentPhone: Property.ShortText({
			displayName: 'Current Phone (Identifier, Optional)',
			description:
				'The current phone number of the client to update. Helps identify the client if names are not unique.',
			required: false,
		}),
		newFirstName: Property.ShortText({
			displayName: 'New First Name',
			description: "Client's new first name. Leave blank to keep current.",
			required: false,
		}),
		newLastName: Property.ShortText({
			displayName: 'New Last Name',
			description: "Client's new last name. Leave blank to keep current.",
			required: false,
		}),
		newEmail: Property.ShortText({
			displayName: 'New Email',
			description: "Client's new email address. Leave blank to keep current.",
			required: false,
		}),
		newPhone: Property.ShortText({
			displayName: 'New Phone',
			description: "Client's new phone number. Leave blank to keep current.",
			required: false,
		}),
		newNotes: Property.LongText({
			displayName: 'New Notes',
			description: 'New notes about the client. Leave blank to keep current.',
			required: false,
		}),
	},
	async run(context) {
		const props = context.propsValue;

		const queryParams: Record<string, string> = {
			firstName: props.currentFirstName,
			lastName: props.currentLastName,
		};
		if (props.currentPhone) {
			queryParams['phone'] = props.currentPhone;
		}

		const body: Record<string, unknown> = {};
		if (props.newFirstName) body['firstName'] = props.newFirstName;
		if (props.newLastName) body['lastName'] = props.newLastName;
		if (props.newEmail) body['email'] = props.newEmail;
		if (props.newPhone) body['phone'] = props.newPhone;
		if (props.newNotes) body['notes'] = props.newNotes;

		if (Object.keys(body).length === 0) {
			throw new Error(
				'At least one field to update (New First Name, New Last Name, etc.) must be provided.',
			);
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.PUT,
			url: `${API_URL}/clients`,
			queryParams,
			body,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		});

		return response.body;
	},
});
