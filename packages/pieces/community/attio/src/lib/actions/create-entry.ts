import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
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
	audience: 'both',
	aiMetadata: { description: 'Adds an existing record to a specified Attio list as a new entry, optionally setting the list-specific entry attribute values. Requires the list, the parent record\'s object type, and the parent record ID. Not idempotent — each call creates another entry, so the same record can be added to the list multiple times.', idempotent: false },
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
		const accessToken = context.auth.secret_text;
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
