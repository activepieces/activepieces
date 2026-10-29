import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { deleteOutputSchema } from '../output-schemas';

export const deleteContact = createAction({
  auth: freshsalesAuth,
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Delete a contact by its ID',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a Freshsales contact by numeric ID. A second call for the same ID fails with a not-found error. Confirm the ID with Get Contact first.',
    idempotent: true,
  },
  outputSchema: deleteOutputSchema,
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to delete',
      placeholder: '16000123456',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({ value: context.propsValue.contact_id, field: 'Contact ID' });
    await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/api/contacts/${id}`,
    });
    return { id, deleted: true };
  },
});
