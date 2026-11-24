import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../auth';
import { API_URL } from '../common';

export const updateClientAction = createAction({
	auth: acuitySchedulingAuth,
	name: 'update_client',
	classification: 'WRITE',
	displayName: 'Update Client',
	description: 'Updates an existing client.',
	audience: 'both',
	aiMetadata: {
		description:
			"Updates an existing Acuity client's details (name, email, phone, notes), identifying the client by their current first and last name (and optionally current phone to disambiguate). At least one new field must be supplied. Use to edit a known client rather than create one. Idempotent — applying the same field overwrites repeatedly yields the same client state.",
		idempotent: true,
	},
	propertyGroups: [
		{
			key: 'client',
			display: 'section',
			label: 'Client to Update',
			icon: 'user',
			props: ['currentFirstName', 'currentLastName', 'currentPhone'],
		},
		{
			key: 'changes',
			display: 'section',
			label: 'Changes',
			icon: 'sliders',
			props: [
				'changesInfo',
				'newFirstName',
				'newLastName',
				'newEmail',
				'newPhone',
				'newNotes',
			],
		},
	],
	props: {
		currentFirstName: Property.ShortText({
			displayName: 'First Name',
			width: 'half',
			required: true,
		}),
		currentLastName: Property.ShortText({
			displayName: 'Last Name',
			width: 'half',
			required: true,
		}),
		currentPhone: Property.ShortText({
			displayName: 'Phone',
			description: 'Only needed when two clients share a name.',
			required: false,
		}),
		changesInfo: Property.MarkDown({
			value: 'Empty fields keep their current value.',
			variant: MarkdownVariant.INFO,
		}),
		newFirstName: Property.ShortText({
			displayName: 'New First Name',
			width: 'half',
			required: false,
		}),
		newLastName: Property.ShortText({
			displayName: 'New Last Name',
			width: 'half',
			required: false,
		}),
		newEmail: Property.ShortText({
			displayName: 'New Email',
			placeholder: 'jane@example.com',
			width: 'half',
			required: false,
		}),
		newPhone: Property.ShortText({
			displayName: 'New Phone',
			placeholder: '+15551234567',
			width: 'half',
			required: false,
		}),
		newNotes: Property.LongText({
			displayName: 'New Notes',
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
			throw new Error('Fill in at least one field under Changes.');
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
