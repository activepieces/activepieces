import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesProps } from '../common/props';
import { marketingListUpdateOutputSchema } from '../output-schemas';

export const removeContactsFromList = createAction({
  auth: freshsalesAuth,
  name: 'remove_contacts_from_list',
  displayName: 'Remove Contacts from Marketing List',
  description: 'Remove contacts from a marketing list',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes one or more Freshsales contacts (numeric IDs) from a marketing list picked from the Marketing List options. The contacts themselves are not deleted. Repeating the call is safe.',
    idempotent: true,
  },
  outputSchema: marketingListUpdateOutputSchema,
  props: {
    list_id: freshsalesProps.marketingList(),
    contact_ids: Property.Array({
      displayName: 'Contact IDs',
      description: 'IDs of the contacts to remove',
      required: true,
    }),
  },
  async run(context) {
    const listId = freshsalesClient.requireId({
      value: context.propsValue.list_id,
      field: 'Marketing List',
    });
    const ids = context.propsValue.contact_ids.map((value) =>
      freshsalesClient.requireId({ value, field: 'Contact ID' })
    );
    if (ids.length === 0) {
      throw new Error('Provide at least one Contact ID.');
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/api/lists/${listId}/remove_contacts`,
      body: { ids },
    });
    const message =
      freshsalesClient.isRecord(response) && typeof response['message'] === 'string'
        ? response['message']
        : null;
    return { list_id: listId, contact_ids: ids, message };
  },
});
