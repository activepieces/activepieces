import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { attioPaginatedApiCall } from '../common/client';
import { formatInputFields, listFields, listIdDropdown } from '../common/props';

export const findListEntryAction = createAction({
	name: 'find_list_entry',
	displayName: 'Find List Entry',
	description:
		'Search for entries in a specific list in Attio using filters and return matching results.',
	auth: attioAuth,
	props: {
		listId: listIdDropdown({
			displayName: 'List',
			required: true,
		}),
		attributes: listFields(true),
	},
	async run(context) {
		const accessToken = context.auth;
		const { listId } = context.propsValue;
		const inputFields = context.propsValue.attributes ?? {};

		if (!listId) {
			throw new Error('Provided list type is invalid.');
		}

		const formattedFields = await formatInputFields(accessToken, 'lists', listId, inputFields);

		// https://docs.attio.com/rest-api/endpoint-reference/entries/create-an-entry-add-record-to-list
		const response = await attioPaginatedApiCall({
			method: HttpMethod.POST,
			accessToken,
			resourceUri: `/lists/${listId}/entries/query`,
			body: {
				filter: formattedFields,
			},
		});

		return {
			found: response.length > 0,
			result: response,
		};
	},
});
