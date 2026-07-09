import { staticListsDropdown } from '../common/props';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../auth';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const hubSpotListsAddContactAction = createAction({
	auth: hubspotAuth,
	name: 'add_contact_to_list',
	displayName: 'Add contact To List',
	description: 'Add contact to list',
	audience: 'both',
	aiMetadata: { description: 'Adds a contact, identified by email, to a chosen HubSpot static contact list. Use to enroll a known contact into a list for segmentation or workflow targeting; the list must be static (not dynamic/active). Idempotent: a contact already on the list stays a single member.', idempotent: true },
	props: {
		listId: staticListsDropdown,
		email: Property.ShortText({
			displayName: 'Contact Email',
			required: true,
		}),
	},

	async run(context) {
		const { listId, email } = context.propsValue;

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `https://api.hubapi.com/contacts/v1/lists/${listId}/add`,
			body: {
				emails: [email],
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth.access_token,
			},
		})

		return response.body;
	},
});
