import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { deleteOutputSchema } from '../output-schemas';

export const forgetContact = createAction({
  auth: freshsalesAuth,
  name: 'forget_contact',
  displayName: 'Forget Contact (GDPR)',
  description: 'Permanently erase a contact and all its data',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'IRREVERSIBLE GDPR erase: hard-deletes a Freshsales contact by numeric ID together with all its associated data (notes, activities, emails); it cannot be restored. Use only when the person asked to be forgotten; for a normal removal use Delete Contact instead. A second call for the same ID fails with a not-found error.',
    idempotent: true,
  },
  outputSchema: deleteOutputSchema,
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to erase for good',
      placeholder: '16000123456',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({
      value: context.propsValue.contact_id,
      field: 'Contact ID',
    });
    await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/api/contacts/${id}/forget`,
    });
    return { id, deleted: true };
  },
});
