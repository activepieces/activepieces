import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { attioApiCall } from '../common/client';
import { formatInputFields, listFields, listIdDropdown } from '../common/props';

export const updateEntryAction = createAction({
	name: 'update_entry',
	displayName: 'Update List Entry',
	description: 'Update the attributes of an existing entry in a list.',
	auth: attioAuth,
	props: {
		listId: listIdDropdown({
			displayName: 'List',
			required: true,
		}),
		entryId: Property.ShortText({
			displayName: 'Entry ID',
			description: 'The unique identifier of the entry to update.',
			required: true,
		}),
		attributes: listFields(true),
	},
	async run(context) {
		const accessToken = context.auth;
		const { listId, entryId } = context.propsValue;
		const inputFields = context.propsValue.attributes ?? {};

		if (!listId) {
			throw new Error('Provided list type is invalid.');
		}

		const formattedFields = await formatInputFields(accessToken, 'lists', listId, inputFields);

		// https://docs.attio.com/rest-api/endpoint-reference/entries/update-a-list-entry-append-multiselect-values
		const response = await attioApiCall<{data:Record<string,any>}>({
			method: HttpMethod.PATCH,
			accessToken,
			resourceUri: `/lists/${listId}/entries/${entryId}`,
			body: {
				data: {
					entry_values: formattedFields,
				},
			},
		});

		return response.data;
	},
});
