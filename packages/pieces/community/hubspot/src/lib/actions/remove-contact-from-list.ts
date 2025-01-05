import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { staticListsDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum, HubSpotAddContactsToListResponse } from '../common/types';

export const removeContactFromListAction = createAction({
	auth: hubspotAuth,
	name: 'remove-contact-from-list',
	displayName: 'Remove Contact from List',
	description: 'Remove a contact from a specific list.',
	props: {
		listId: staticListsDropdown,
		email: Property.ShortText({
			displayName: 'Contact Email',
			required: true,
		}),
	},
	async run(context) {
		const { listId, email } = context.propsValue;

		const client = new Client({ accessToken: context.auth.access_token });

		const contact = await client.crm.contacts.searchApi.doSearch({
			limit: 1,
			filterGroups: [
				{ filters: [{ propertyName: 'email', operator: FilterOperatorEnum.Eq, value: email }] },
			],
		});
		if (contact.results.length === 0) {
			throw new Error(
				`No contact with email '${email}' was found. Unable to remove unknown contact from list.`,
			);
		}
		const apiResponse = await client.apiRequest({
			path: `/contacts/v1/lists/${listId}/remove`,
			method: HttpMethod.POST,
			body: { vids: [contact.results[0].id] },
			defaultJson: true,
		});

		const parsedResponse =(await apiResponse.json()) as HubSpotAddContactsToListResponse;
		if(parsedResponse.updated.length === 0) {
			throw new Error(
				`Contact with email '${email}' wasn't a member of list with id '${listId}'.`,
			);
		}
        return parsedResponse;
	},
});
