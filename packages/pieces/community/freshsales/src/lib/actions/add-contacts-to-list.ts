import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesProps } from '../common/props';
import { marketingListUpdateOutputSchema } from '../output-schemas';

export const addContactsToList = createAction({
  auth: freshsalesAuth,
  name: 'add_contacts_to_list',
  displayName: 'Add Contacts to Marketing List',
  description: 'Add contacts to a marketing list',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds one or more existing Freshsales contacts (numeric IDs) to a marketing list picked from the Marketing List options. Contacts already in the list stay there, so repeating the call is safe.',
    idempotent: true,
  },
  outputSchema: marketingListUpdateOutputSchema,
  props: {
    list_id: freshsalesProps.marketingList(),
    contact_ids: Property.Array({
      displayName: 'Contact IDs',
      description: 'IDs of the contacts to add',
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
      path: `/api/lists/${listId}/add_contacts`,
      body: { ids },
    });
    const message =
      freshsalesClient.isRecord(response) && typeof response['message'] === 'string'
        ? response['message']
        : null;
    return { list_id: listId, contact_ids: ids, message };
  },
});
