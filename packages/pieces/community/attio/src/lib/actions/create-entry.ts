import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../index';
import { attioApiCall } from '../common/client';
import {
	formatInputFields,
	listFields,
	listIdDropdown,
	listParentObjectIdDropdown,
} from '../common/props';

export const createEntryAction = createAction({
	name: 'create_entry',
	displayName: 'Create List Entry',
	description: 'Add a record to a specified list.',
	auth: attioAuth,
	props: {
		listId: listIdDropdown({
			displayName: 'List',
			required: true,
		}),
		parentObjectId: listParentObjectIdDropdown({
			displayName: 'Parent Object',
			required: true,
		}),
		parentRecordId: Property.ShortText({
			displayName: 'Parent Record ID',
			required: true,
		}),

		attributes: listFields(),
	},
	async run(context) {
		const accessToken = context.auth;
		const { listId, parentObjectId, parentRecordId } = context.propsValue;
		const inputFields = context.propsValue.attributes ?? {};

		if (!listId) {
			throw new Error('Provided list type is invalid.');
		}

		const formattedFields = await formatInputFields(accessToken, 'lists', listId, inputFields);

		// https://docs.attio.com/rest-api/endpoint-reference/entries/create-an-entry-add-record-to-list
		const response = await attioApiCall<{ data: Record<string, any> }>({
			method: HttpMethod.POST,
			accessToken,
			resourceUri: `/lists/${listId}/entries`,
			body: {
				data: {
					parent_record_id: parentRecordId,
					parent_object: parentObjectId,
					entry_values: formattedFields,
				},
			},
		});

		return response.data;
	},
});
